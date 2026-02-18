"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Users, BookOpen, TableProperties, ArrowRight, CheckCircle2, AlertTriangle, Clock, Download, ChevronDown, ChevronUp } from "lucide-react";

interface ReadinessData {
  facultyCount: number;
  subjectCount: number;
  assignmentCount: number;
  slotCount: number;
  lockedCount: number;
  latestSlotDate: string | null;
}

// Group slots by day for a breakdown
interface DayBreakdown {
  day: number;
  total: number;
  labs: number;
  locked: number;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PERIOD_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
];

const ROW_COLORS = [
  "#E8D5F5", "#D5F5E3", "#F5E6D5", "#F5D5E8",
  "#F5F0D5", "#D5E8F5", "#E8F5D5", "#F5D5D5", "#D5F5F0",
];

interface MatrixTeacher {
  id: string;
  name: string;
  subjectCodes: string[];
}

interface MatrixSubject {
  code: string;
  title: string;
}

export default function WorkspacePage() {
  const [data, setData] = useState<ReadinessData>({
    facultyCount: 0, subjectCount: 0, assignmentCount: 0,
    slotCount: 0, lockedCount: 0, latestSlotDate: null,
  });
  const [dayBreakdown, setDayBreakdown] = useState<DayBreakdown[]>([]);
  const [matrixTeachers, setMatrixTeachers] = useState<MatrixTeacher[]>([]);
  const [matrixSubjects, setMatrixSubjects] = useState<MatrixSubject[]>([]);
  const [matrixOpen, setMatrixOpen] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [scheduleGrid, setScheduleGrid] = useState<Record<string, string>>({}); // key: "period-day" -> subject code
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [
        { count: fc },
        { count: sc },
        { count: ac },
        { count: slc },
        { count: lc },
        { data: latestSlot },
        { data: allSlots },
        { data: teacherRows },
        { data: subjectRows },
      ] = await Promise.all([
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("teacher_subject_assignments").select("*", { count: "exact", head: true }),
        supabase.from("timetable_slots").select("*", { count: "exact", head: true }),
        supabase.from("timetable_slots").select("*", { count: "exact", head: true }).eq("is_locked", true),
        supabase.from("timetable_slots").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("timetable_slots").select("day_of_week, is_lab, is_locked"),
        supabase.from("teachers").select(`id, name, assignments:teacher_subject_assignments(subject:subjects(code, title))`).eq("department_id", "MIT-ISE").order("name"),
        supabase.from("subjects").select("code, title").eq("department_id", "MIT-ISE").order("code"),
      ]);

      setData({
        facultyCount: fc ?? 0,
        subjectCount: sc ?? 0,
        assignmentCount: ac ?? 0,
        slotCount: slc ?? 0,
        lockedCount: lc ?? 0,
        latestSlotDate: latestSlot?.[0]?.created_at ?? null,
      });

      // Build day breakdown
      if (allSlots && allSlots.length > 0) {
        const map: Record<number, { total: number; labs: number; locked: number }> = {};
        for (const s of allSlots) {
          if (!map[s.day_of_week]) map[s.day_of_week] = { total: 0, labs: 0, locked: 0 };
          map[s.day_of_week].total++;
          if (s.is_lab) map[s.day_of_week].labs++;
          if (s.is_locked) map[s.day_of_week].locked++;
        }
        setDayBreakdown(
          Object.entries(map)
            .map(([d, v]) => ({ day: Number(d), ...v }))
            .sort((a, b) => a.day - b.day)
        );
      }

      // Build matrix data
      if (teacherRows) {
        setMatrixTeachers(teacherRows.map((t: any) => ({
          id: t.id,
          name: t.name,
          subjectCodes: (t.assignments || []).map((a: any) => a.subject?.code).filter(Boolean),
        })));
      }
      if (subjectRows) {
        setMatrixSubjects(subjectRows.map((s: any) => ({ code: s.code, title: s.title })));
      }

      setLoading(false);
    }
    load();
  }, []);

  // Load schedule when teacher is selected
  useEffect(() => {
    if (!selectedTeacherId) { setScheduleGrid({}); return; }
    async function loadSchedule() {
      setScheduleLoading(true);
      const { data: slots } = await supabase
        .from("timetable_slots")
        .select("day_of_week, start_time, subjects(code)")
        .eq("teacher_id", selectedTeacherId);

      const grid: Record<string, string> = {};
      if (slots) {
        for (const s of slots as any[]) {
          const [h, m] = (s.start_time as string).split(":").map(Number);
          const periodIdx = Math.floor((h * 60 + m - 9 * 60) / 60);
          if (periodIdx >= 0 && periodIdx < PERIOD_TIMES.length) {
            const key = `${periodIdx}-${s.day_of_week}`;
            grid[key] = s.subjects?.code ?? "—";
          }
        }
      }
      setScheduleGrid(grid);
      setScheduleLoading(false);
    }
    loadSchedule();
  }, [selectedTeacherId]);

  const formatDate = (s: string | null) => {
    if (!s) return "Never";
    return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Readiness checks
  const checks = [
    { label: "Faculty loaded", ok: data.facultyCount > 0, value: `${data.facultyCount} teachers`, href: "/faculty" },
    { label: "Subjects configured", ok: data.subjectCount > 0, value: `${data.subjectCount} subjects`, href: "/subjects" },
    { label: "Assignments linked", ok: data.assignmentCount > 0, value: `${data.assignmentCount} links`, href: "/faculty" },
  ];
  const allReady = checks.every(c => c.ok);

  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2D3436', margin: '0 0 4px' }}>
          Schedule Workspace
        </h1>
        <p style={{ fontSize: 13, color: '#8B7D6B', margin: 0 }}>
          Preparation hub — verify data readiness, review schedule status, and manage generation runs.
        </p>
      </div>

      {/* ── Readiness Checklist ── */}
      <div style={{
        background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4,
        padding: '18px 22px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: 0 }}>
            Data Readiness
          </p>
          {allReady ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#27AE60', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} /> Ready to Generate
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#E67E22', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} /> Setup Incomplete
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {checks.map(c => (
            <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: c.ok ? '#F0F8F0' : '#FFF8F0',
                  border: `1px solid ${c.ok ? '#C8E6C9' : '#FFE0B2'}`,
                  borderRadius: 4, padding: '12px 14px',
                  transition: 'transform 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {c.ok
                    ? <CheckCircle2 size={14} color="#27AE60" />
                    : <AlertTriangle size={14} color="#E67E22" />
                  }
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2D3436' }}>{c.label}</span>
                </div>
                <span style={{ fontSize: 12, color: '#8B7D6B', fontFamily: "'Courier New', monospace" }}>
                  {loading ? '…' : c.value}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Schedule Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4, padding: '18px 20px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 8px' }}>
            Scheduled Slots
          </p>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#2D3436', margin: 0, fontFamily: "'Courier New', monospace" }}>
            {loading ? '…' : data.slotCount}
          </p>
        </div>
        <div style={{ background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4, padding: '18px 20px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 8px' }}>
            Locked / Manual
          </p>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#C0392B', margin: 0, fontFamily: "'Courier New', monospace" }}>
            {loading ? '…' : data.lockedCount}
          </p>
        </div>
        <div style={{ background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4, padding: '18px 20px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 8px' }}>
            Last Generated
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', margin: 0, fontFamily: "'Courier New', monospace" }}>
            {loading ? '…' : formatDate(data.latestSlotDate)}
          </p>
        </div>
      </div>

      {/* ── Day-wise Breakdown ── */}
      {dayBreakdown.length > 0 && (
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4,
          padding: '18px 22px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 14px' }}>
            Slots by Day
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dayBreakdown.length}, 1fr)`, gap: 10 }}>
            {dayBreakdown.map(d => {
              const maxSlots = Math.max(...dayBreakdown.map(x => x.total), 1);
              const barHeight = Math.round((d.total / maxSlots) * 60);
              return (
                <div key={d.day} style={{ textAlign: 'center' }}>
                  {/* Bar */}
                  <div style={{
                    margin: '0 auto', width: 28,
                    height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  }}>
                    <div style={{
                      height: barHeight,
                      background: '#2D3436',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                    }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#2D3436', margin: '6px 0 2px', fontFamily: "'Courier New', monospace" }}>
                    {d.total}
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#8B7D6B', margin: 0 }}>
                    {DAY_SHORT[d.day] ?? `Day ${d.day}`}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                    {d.labs > 0 && (
                      <span style={{ fontSize: 9, color: '#2C6E8A', background: '#E8F4F8', padding: '1px 5px', borderRadius: 2 }}>
                        {d.labs}L
                      </span>
                    )}
                    {d.locked > 0 && (
                      <span style={{ fontSize: 9, color: '#C0392B', background: '#FFF0EF', padding: '1px 5px', borderRadius: 2 }}>
                        {d.locked}🔒
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Teaching Schedule (per teacher) ── */}
      {!loading && matrixTeachers.length > 0 && (
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4,
          padding: '18px 22px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: 0 }}>
              Teaching Schedule
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* CSV Download */}
              {selectedTeacherId && Object.keys(scheduleGrid).length > 0 && (
                <button
                  onClick={() => {
                    const teacher = matrixTeachers.find(t => t.id === selectedTeacherId);
                    const header = ['Time', ...DAY_SHORT];
                    const rows = PERIOD_TIMES.map((time, pIdx) => [
                      time,
                      ...Array.from({ length: 6 }, (_, dIdx) => scheduleGrid[`${pIdx}-${dIdx}`] || ''),
                    ]);
                    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `schedule_${teacher?.name.replace(/\s+/g, '_') ?? 'teacher'}_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', fontSize: 10, fontWeight: 700,
                    background: '#F0EBE0', border: '1px solid #E2D9C5', borderRadius: 3,
                    color: '#2D3436', cursor: 'pointer',
                  }}
                >
                  <Download size={11} /> CSV
                </button>
              )}
              {/* Teacher Selector */}
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontFamily: "'Georgia', serif",
                  border: '1px solid #C8C0A8', borderRadius: 3,
                  background: '#FFFDF5', color: '#2D3436', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select a teacher…</option>
                {matrixTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedTeacherId && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#B0A898', fontSize: 13 }}>
              Choose a teacher above to view their weekly schedule.
            </div>
          )}

          {scheduleLoading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8B7D6B', fontSize: 12 }}>
              Loading schedule…
            </div>
          )}

          {selectedTeacherId && !scheduleLoading && (
            <div>
              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2D3436', margin: '0 0 2px', letterSpacing: -0.5 }}>
                  TEACHING SCHEDULE
                </h2>
                <p style={{ fontSize: 11, color: '#8B7D6B', margin: 0 }}>
                  {matrixTeachers.find(t => t.id === selectedTeacherId)?.name}
                </p>
              </div>

              {/* Grid */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '1.5px solid #C8C0A8', borderRadius: 4 }}>
                  <thead>
                    <tr>
                      <th style={{
                        background: '#F5F0E0', border: '1px solid #C8C0A8',
                        padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#2D3436',
                        minWidth: 80,
                      }}>Time</th>
                      {DAY_SHORT.map((d, i) => (
                        <th key={d} style={{
                          background: ROW_COLORS[i % ROW_COLORS.length] + '60',
                          border: '1px solid #C8C0A8',
                          padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#2D3436',
                          textAlign: 'center', minWidth: 80,
                        }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIOD_TIMES.map((time, pIdx) => (
                      <tr key={pIdx}>
                        <td style={{
                          background: ROW_COLORS[pIdx % ROW_COLORS.length] + '50',
                          border: '1px solid #E2D9C5',
                          padding: '7px 10px', fontSize: 11, fontWeight: 600, color: '#2D3436',
                          whiteSpace: 'nowrap',
                        }}>{time}</td>
                        {Array.from({ length: 6 }, (_, dIdx) => {
                          const code = scheduleGrid[`${pIdx}-${dIdx}`];
                          return (
                            <td key={dIdx} style={{
                              border: '1px solid #E2D9C5',
                              padding: '7px 8px', textAlign: 'center',
                              background: code ? '#F8F3E8' : '#FFFFFF',
                              fontWeight: code ? 700 : 400,
                              color: code ? '#2D3436' : '#E2D9C5',
                              fontSize: code ? 11 : 10,
                              fontFamily: code ? "'Courier New', monospace" : 'inherit',
                            }}>
                              {code || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {Object.keys(scheduleGrid).length === 0 && (
                <p style={{ textAlign: 'center', color: '#B0A898', fontSize: 12, marginTop: 12 }}>
                  No scheduled slots for this teacher yet.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Teacher × Subject Matrix ── */}
      {!loading && matrixTeachers.length > 0 && matrixSubjects.length > 0 && (
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 4,
          marginBottom: 20, overflow: 'hidden',
        }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', cursor: 'pointer', userSelect: 'none',
            }}
            onClick={() => setMatrixOpen(o => !o)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: 0 }}>
                Teacher × Subject Matrix
              </p>
              <span style={{ fontSize: 11, color: '#B0A898' }}>
                {matrixTeachers.length} teachers · {matrixSubjects.length} subjects
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Generate CSV
                  const header = ['Teacher', ...matrixSubjects.map(s => s.code)];
                  const rows = matrixTeachers.map(t => [
                    t.name,
                    ...matrixSubjects.map(s => t.subjectCodes.includes(s.code) ? 'YES' : ''),
                  ]);
                  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `teacher_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', fontSize: 10, fontWeight: 700,
                  background: '#F0EBE0', border: '1px solid #E2D9C5', borderRadius: 3,
                  color: '#2D3436', cursor: 'pointer',
                }}
              >
                <Download size={11} /> CSV
              </button>
              {matrixOpen ? <ChevronUp size={14} color="#8B7D6B" /> : <ChevronDown size={14} color="#8B7D6B" />}
            </div>
          </div>

          {matrixOpen && (
            <div style={{ overflowX: 'auto', padding: '0 0 16px' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{
                      position: 'sticky', left: 0, zIndex: 2,
                      background: '#F0EBE0', border: '1px solid #C8C0A8',
                      padding: '8px 12px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: '#2D3436',
                      minWidth: 140,
                    }}>Teacher</th>
                    {matrixSubjects.map(s => (
                      <th key={s.code} style={{
                        background: '#F0EBE0', border: '1px solid #C8C0A8',
                        padding: '6px 4px', textAlign: 'center',
                        fontWeight: 700, color: '#2D3436',
                        fontSize: 9, minWidth: 36,
                        whiteSpace: 'nowrap',
                      }}
                        title={s.title}
                      >
                        <div style={{
                          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                          fontFamily: "'Courier New', monospace", letterSpacing: 0.3,
                          maxHeight: 70, overflow: 'hidden',
                        }}>
                          {s.code}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixTeachers.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FFFDF5' }}>
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 1,
                        background: i % 2 === 0 ? '#FFFFFF' : '#FFFDF5',
                        border: '1px solid #E2D9C5', padding: '6px 12px',
                        fontWeight: 600, color: '#2D3436', fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}>{t.name}</td>
                      {matrixSubjects.map(s => {
                        const assigned = t.subjectCodes.includes(s.code);
                        return (
                          <td key={s.code} style={{
                            border: '1px solid #E2D9C5', padding: '4px',
                            textAlign: 'center',
                            background: assigned ? '#E8F5E9' : 'transparent',
                          }}>
                            {assigned && (
                              <span style={{
                                fontSize: 13, fontWeight: 700, color: '#27AE60',
                              }}>✓</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 12px' }}>
          Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { title: "Open Timetable Editor", desc: "View and edit the generated timetable grid.", href: "/timetable", icon: "📅" },
            { title: "Manage Faculty", desc: "Add teachers, toggle availability, set daily caps.", href: "/faculty", icon: "👥" },
            { title: "Edit Subjects", desc: "Configure codes, L-T-P hours, and room types.", href: "/subjects", icon: "📚" },
            { title: "Bulk Data Ingest", desc: "Upload faculty PDF to auto-populate records.", href: "/dashboard", icon: "📄" },
          ].map(a => (
            <Link key={a.title} href={a.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#FFFDF5', border: '1px solid #E2D9C5', borderRadius: 4,
                  padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C8C0A8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2D9C5'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <ArrowRight size={13} color="#C8C0A8" />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2D3436', margin: '8px 0 3px' }}>{a.title}</h3>
                <p style={{ fontSize: 11, lineHeight: 1.4, color: '#8B7D6B', margin: 0 }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {!loading && data.slotCount === 0 && (
        <div style={{
          background: '#FFFDF5', border: '1.5px dashed #C8C0A8', borderRadius: 4,
          padding: '32px 24px', textAlign: 'center',
        }}>
          <Clock size={28} color="#C8C0A8" style={{ margin: '0 auto 10px' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2D3436', margin: '0 0 6px' }}>No Schedule Yet</h2>
          <p style={{ fontSize: 12, color: '#8B7D6B', margin: '0 0 16px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Once your data is ready, head to the <strong>Timetable</strong> page and click <strong>Generate</strong> to create your first timetable.
          </p>
          <Link href="/timetable" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', background: '#2D3436', borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: '#FFFDF5',
            textDecoration: 'none', transition: 'background 0.2s',
          }}>
            Go to Timetable <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
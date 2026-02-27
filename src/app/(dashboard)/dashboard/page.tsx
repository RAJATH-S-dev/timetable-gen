"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Users, BookOpen, TableProperties, Calendar, ArrowRight } from "lucide-react";

interface Stats {
  totalFaculty: number;
  totalSubjects: number;
  totalSlots: number;
  lockedSlots: number;
  timetableCount: number;
  lastGenerated: string | null;
}

interface TimetableDetail {
  section: string;
  slotCount: number;
  lastGenerated: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalFaculty: 0,
    totalSubjects: 0,
    totalSlots: 0,
    lockedSlots: 0,
    timetableCount: 0,
    lastGenerated: null,
  });
  const [loading, setLoading] = useState(true);
  const [ttDetails, setTtDetails] = useState<TimetableDetail[]>([]);
  const [showTtBreakdown, setShowTtBreakdown] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);

      const [
        { count: facultyCount },
        { count: subjectCount },
        { count: slotCount },
        { count: lockedCount },
      ] = await Promise.all([
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("timetable_slots").select("*", { count: "exact", head: true }),
        supabase.from("timetable_slots").select("*", { count: "exact", head: true }).eq("is_locked", true),
      ]);

      // Get the most recent slot's created_at as "last generation"
      const { data: latestSlot } = await supabase
        .from("timetable_slots")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      // Count distinct generated timetables (unique section values)
      const { data: sectionSlots } = await supabase
        .from("timetable_slots")
        .select("section, created_at")
        .order("created_at", { ascending: false });

      // Group by section
      const sectionMap = new Map<string, { count: number; latest: string }>();
      (sectionSlots ?? []).forEach((s: any) => {
        const key = s.section || 'A';
        const existing = sectionMap.get(key);
        if (!existing) {
          sectionMap.set(key, { count: 1, latest: s.created_at });
        } else {
          existing.count++;
          if (s.created_at > existing.latest) existing.latest = s.created_at;
        }
      });

      const details: TimetableDetail[] = Array.from(sectionMap.entries())
        .map(([section, info]) => ({ section, slotCount: info.count, lastGenerated: info.latest }))
        .sort((a, b) => a.section.localeCompare(b.section));

      setTtDetails(details);

      setStats({
        totalFaculty: facultyCount ?? 0,
        totalSubjects: subjectCount ?? 0,
        totalSlots: slotCount ?? 0,
        lockedSlots: lockedCount ?? 0,
        timetableCount: details.length,
        lastGenerated: latestSlot?.[0]?.created_at ?? null,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Faculty",
      value: stats.totalFaculty,
      icon: Users,
      color: "#2D3436",
      href: "/faculty",
    },
    {
      label: "Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "#8B7D6B",
      href: "/subjects",
    },
    {
      label: "Scheduled Slots",
      value: stats.totalSlots,
      icon: TableProperties,
      color: "#27AE60",
      href: "/timetable",
    },
    {
      label: "Timetables Generated",
      value: stats.timetableCount,
      icon: Calendar,
      color: "#4834D4",
      href: "#timetable-breakdown",
      onClick: () => setShowTtBreakdown(v => !v),
    },
    {
      label: "Locked / Manual",
      value: stats.lockedSlots,
      icon: TableProperties,
      color: "#C0392B",
      href: "/timetable",
    },
  ];

  const quickActions = [
    {
      title: "Manage Faculty",
      desc: "Add, edit, or remove teachers and their subject assignments.",
      href: "/faculty",
      icon: "👥",
    },
    {
      title: "Edit Subjects",
      desc: "Configure subject codes, credits, and room preferences.",
      href: "/subjects",
      icon: "📚",
    },
    {
      title: "Generate Timetable",
      desc: "Run the OR-Tools solver to create an optimized schedule.",
      href: "/timetable",
      icon: "⚡",
    },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2D3436', margin: '0 0 4px' }}>
          Department Overview
        </h1>
        <p style={{ fontSize: 13, color: '#8B7D6B', margin: 0 }}>
          Maharaja Institute of Technology Mysore — ISE Department
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 32,
      }}>
        {statCards.map((card) => {
          const inner = (
            <div
              key={card.label}
              onClick={card.onClick}
              style={{
                background: '#FFFDF5',
                border: card.onClick && showTtBreakdown ? '1.5px solid #4834D4' : '1.5px solid #E2D9C5',
                borderRadius: 6,
                padding: '18px 20px',
                transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = card.onClick ? '#4834D4' : '#C8C0A8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = card.onClick && showTtBreakdown ? '#4834D4' : '#E2D9C5'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1.5, color: '#8B7D6B',
                }}>
                  {card.label}
                </span>
                <card.icon size={14} color={card.color} />
              </div>
              <p style={{
                fontSize: loading ? 14 : 28,
                fontWeight: 700,
                color: card.color,
                margin: 0,
                fontFamily: "'Courier New', monospace",
              }}>
                {loading ? '…' : card.value}
              </p>
            </div>
          );
          if (card.onClick) return <div key={card.label}>{inner}</div>;
          return <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>{inner}</Link>;
        })}
      </div>

      {/* Timetable Breakdown Panel */}
      {showTtBreakdown && (
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #C8C0A8', borderRadius: 6,
          padding: '18px 22px', marginBottom: 24, fontFamily: "'Georgia', serif",
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8B7D6B', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
              Generated Timetables — Breakdown by Section
            </p>
            <button onClick={() => setShowTtBreakdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#8B7D6B' }}>✕</button>
          </div>
          {ttDetails.length === 0 ? (
            <p style={{ fontSize: 13, color: '#8B7D6B', margin: 0 }}>No timetables have been generated yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {ttDetails.map(d => (
                <Link key={d.section} href={`/timetable`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    border: '1px solid #E2D9C5', borderRadius: 4, padding: '14px 16px',
                    background: '#FDFAF0', transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4834D4'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2D9C5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#4834D4', fontFamily: "'Courier New', monospace" }}>Section {d.section}</span>
                      <Calendar size={14} color="#4834D4" />
                    </div>
                    <p style={{ fontSize: 11, color: '#636E72', margin: '0 0 2px', fontWeight: 600 }}>
                      {d.slotCount} slots scheduled
                    </p>
                    <p style={{ fontSize: 10, color: '#8B7D6B', margin: 0 }}>
                      Generated: {formatDate(d.lastGenerated)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Generation + Engine Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        marginBottom: 32,
      }}>
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #E2D9C5',
          borderRadius: 6, padding: '18px 20px',
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 8px',
          }}>
            Last Schedule Generated
          </p>
          <p style={{
            fontSize: 15, fontWeight: 700, color: '#2D3436', margin: 0,
            fontFamily: "'Courier New', monospace",
          }}>
            {loading ? '…' : formatDate(stats.lastGenerated)}
          </p>
        </div>
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #E2D9C5',
          borderRadius: 6, padding: '18px 20px',
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 8px',
          }}>
            Engine Status
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#27AE60',
              boxShadow: '0 0 6px rgba(39,174,96,0.4)',
            }} />
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#27AE60',
              fontFamily: "'Courier New', monospace",
            }}>
              READY
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 16 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, color: '#8B7D6B', margin: '0 0 14px',
        }}>
          Quick Actions
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#FFFDF5',
                  border: '1px solid #E2D9C5',
                  borderRadius: 6,
                  padding: '16px 18px',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C8C0A8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2D9C5'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20 }}>{action.icon}</span>
                  <ArrowRight size={14} color="#C8C0A8" />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', margin: '10px 0 4px' }}>
                  {action.title}
                </h3>
                <p style={{ fontSize: 11, lineHeight: 1.5, color: '#8B7D6B', margin: 0 }}>
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
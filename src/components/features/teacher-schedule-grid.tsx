"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIME_SLOTS = [
  { label: "9:00 AM", start: "09:00:00" },
  { label: "10:00 AM", start: "10:00:00" },
  { label: "11:15 AM", start: "11:15:00" },
  { label: "12:15 PM", start: "12:15:00" },
  { label: "2:00 PM", start: "14:00:00" },
  { label: "3:00 PM", start: "15:00:00" },
];

// Maps start_time string to our slot index (0–5)
// Uses same formula as timetable-client: slot = floor((totalMinutes - 9*60) / 60)
// DB stores hourly times: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00
function timeToSlotIndex(startTime: string): number {
  const parts = startTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const slotIdx = Math.floor((h * 60 + m - 9 * 60) / 60);
  if (slotIdx < 0 || slotIdx > 5) return -1;
  return slotIdx;
}

interface ScheduleSlot {
  day: number;       // 0-indexed (0=Mon)
  period: number;    // 0-indexed
  subjectCode: string;
  departmentId: string;
  isLab: boolean;
  section: string;
}

interface TeacherScheduleGridProps {
  teacherId: string;
  teacherName: string;
  highlightDay?: number;    // 1-indexed (1=Mon)
  highlightPeriod?: number; // 0-indexed
  onSelectSlot?: () => void;
}

export default function TeacherScheduleGrid({
  teacherId,
  teacherName,
  highlightDay,
  highlightPeriod,
  onSelectSlot,
}: TeacherScheduleGridProps) {
  const [grid, setGrid] = useState<(ScheduleSlot | null)[][]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);

      const { data: slots } = await supabase
        .from("timetable_slots")
        .select("day_of_week, start_time, is_lab, section, subjects(code), department_id")
        .eq("teacher_id", teacherId);

      // Build 5×6 grid (5 days × 6 periods)
      const newGrid: (ScheduleSlot | null)[][] = Array.from(
        { length: 5 },
        () => Array(6).fill(null)
      );

      (slots ?? []).forEach((s: any) => {
        const dayIdx = s.day_of_week - 1; // 1-indexed → 0-indexed
        const periodIdx = timeToSlotIndex(s.start_time);
        if (dayIdx >= 0 && dayIdx < 5 && periodIdx >= 0 && periodIdx < 6) {
          const existing = newGrid[dayIdx][periodIdx];
          if (existing) {
            // Same slot occupied in multiple sections — merge section labels
            const secs = existing.section ? existing.section.split(', ') : [];
            const newSec = s.section ?? '';
            if (newSec && !secs.includes(newSec)) secs.push(newSec);
            existing.section = secs.sort().join(', ');
          } else {
            newGrid[dayIdx][periodIdx] = {
              day: dayIdx,
              period: periodIdx,
              subjectCode: s.subjects?.code ?? "—",
              departmentId: s.department_id,
              isLab: !!s.is_lab,
              section: s.section ?? '',
            };
          }
        }
      });

      setGrid(newGrid);
      setLoading(false);
    }

    if (teacherId) fetchSchedule();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-stone-400 mr-2" />
        <span className="text-sm text-stone-500">Loading schedule...</span>
      </div>
    );
  }

  // Header colors matching the uploaded image style
  const dayColors = ["#E8DAEF", "#D5F5E3", "#FADBD8", "#D4EFDF", "#FCF3CF"];

  const isHighlighted = (dayIdx: number, periodIdx: number) =>
    highlightDay !== undefined &&
    highlightPeriod !== undefined &&
    dayIdx === highlightDay - 1 &&
    periodIdx === highlightPeriod;

  return (
    <div style={{
      background: "#FDFAF0",
      border: "1px solid #E2D9C5",
      borderRadius: 8,
      padding: 16,
      fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid #E2D9C5",
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#2D3436",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}>
          Teaching Schedule
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#636E72",
          marginTop: 4,
        }}>
          {teacherName}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #DDD",
          tableLayout: "fixed",
          fontSize: 11,
        }}>
          <thead>
            <tr>
              <th style={{
                border: "1px solid #DDD",
                padding: "6px 4px",
                background: "#F8F0E0",
                fontSize: 10,
                fontWeight: 700,
                color: "#2D3436",
                width: 65,
              }}>
                Time
              </th>
              {DAYS.map((day, i) => (
                <th key={day} style={{
                  border: "1px solid #DDD",
                  padding: "6px 4px",
                  background: dayColors[i],
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#2D3436",
                  textAlign: "center",
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot, periodIdx) => (
              <tr key={slot.start}>
                {/* Time label */}
                <td style={{
                  border: "1px solid #DDD",
                  padding: "6px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#636E72",
                  background: periodIdx % 2 === 0 ? "#F0EBE0" : "#F8F3E8",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}>
                  {slot.label}
                </td>

                {/* Day cells */}
                {DAYS.map((_, dayIdx) => {
                  const cellData = grid[dayIdx]?.[periodIdx] ?? null;
                  const isBusy = !!cellData;
                  const isHL = isHighlighted(dayIdx, periodIdx);

                  return (
                    <td
                      key={dayIdx}
                      onClick={!isBusy && isHL ? onSelectSlot : undefined}
                      style={{
                        border: isHL
                          ? "2.5px solid #4834D4"
                          : "1px solid #DDD",
                        padding: "4px 3px",
                        textAlign: "center",
                        verticalAlign: "middle",
                        minHeight: 36,
                        background: isHL && !isBusy
                          ? "#EDE8FD"          // highlighted + free = purple tint
                          : isBusy
                            ? "#FADBD8"        // busy = soft red
                            : "#D5F5E3",       // free = soft green
                        cursor: !isBusy && isHL ? "pointer" : "default",
                        transition: "all 0.15s",
                      }}
                    >
                      {isBusy && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "'Courier New', monospace",
                          color: "#C0392B",
                          lineHeight: 1.3,
                        }}>
                          {cellData.subjectCode}
                          {cellData.isLab && (
                            <span style={{ display: "block", fontSize: 7, color: "#1A5276", fontWeight: 700 }}>*lab</span>
                          )}
                          {cellData.section && (
                            <span style={{ display: "block", fontSize: 7, color: "#636E72", fontWeight: 600 }}>Sec {cellData.section}</span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        gap: 16,
        marginTop: 8,
        fontSize: 9,
        color: "#636E72",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#D5F5E3", border: "1px solid #CCC", borderRadius: 2 }} />
          Free
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#FADBD8", border: "1px solid #CCC", borderRadius: 2 }} />
          Booked
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#EDE8FD", border: "2px solid #4834D4", borderRadius: 2 }} />
          Selected Slot
        </span>
      </div>
    </div>
  );
}

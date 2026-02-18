"use client";

import React, { useState } from "react";

interface SlotData {
  code: string;
  isLab?: boolean;
  isDoubleStart?: boolean;
  isConflict?: boolean;
  conflictInfo?: string;
  isLocked?: boolean;
  slotId?: string;
  subjectId?: string;
}

interface TimetableGridProps {
  grid: (SlotData | null)[][];
  subjectLegend: { code: string; title: string; initials: string; faculty: string }[];
  institutionName: string;
  tableTitle: string;
  semesterInfo: string;
  roomNo: string;
  onCellClick?: (day: number, slot: number, data: SlotData | null) => void;
  onSwapSlots?: (
    source: { day: number; slot: number; data: SlotData | null },
    target: { day: number; slot: number; data: SlotData | null }
  ) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// 6 slots: 0=9-10, 1=10-11, [TEA], 2=11:15-12:15, 3=12:15-1:15, [LUNCH], 4=2-3, 5=3-4
const TIME_HEADERS = [
  "9:00 AM\nTO\n10:00 AM",
  "10:00 AM\nTO\n11:00 AM",
  "11:15 AM\nTO\n12:15 PM",
  "12:15 PM\nTO\n1:15 PM",
  "2:00 PM\nTO\n3:00 PM",
  "3:00 PM\nTO\n4:00 PM",
];

export default function TimetableGrid({
  grid,
  subjectLegend,
  institutionName,
  tableTitle,
  semesterInfo,
  roomNo,
  onCellClick,
  onSwapSlots,
}: TimetableGridProps) {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<{ day: number; slot: number; data: SlotData | null } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const handleCellClick = (day: number, slot: number, data: SlotData | null) => {
    setActiveSubject(prev => prev === data?.code ? null : (data?.code ?? null));
    onCellClick?.(day, slot, data ?? null);
  };

  const handleDragStart = (e: React.DragEvent, day: number, slot: number, data: SlotData | null) => {
    if (!data || data.isLocked) { e.preventDefault(); return; }
    setDragSource({ day, slot, data });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${day}-${slot}`);
  };

  const handleDragOver = (e: React.DragEvent, day: number, slot: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`${day}-${slot}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, day: number, slot: number, data: SlotData | null) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!dragSource || (dragSource.day === day && dragSource.slot === slot)) {
      setDragSource(null);
      return;
    }
    onSwapSlots?.(dragSource, { day, slot, data });
    setDragSource(null);
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOverCell(null);
  };

  const cellStyle = (data: SlotData | null | undefined, day?: number, slot?: number): React.CSSProperties => {
    const isHighlighted = !!(activeSubject && data?.code && activeSubject === data.code);
    const isShadowed = !!(activeSubject && data?.code && activeSubject !== data.code);
    const isLabCell = !!(data?.isLab);
    const isDragOver = !!(day !== undefined && slot !== undefined && dragOverCell === `${day}-${slot}`);
    const isDragSrc = !!(dragSource && day !== undefined && slot !== undefined && dragSource.day === day && dragSource.slot === slot);

    return {
      border: isDragOver ? "2px dashed #4834D4"
        : isLabCell ? "1.5px solid #2C6E8A" : "1px solid #C8C0A8",
      borderLeft: isDragOver ? "2px dashed #4834D4"
        : isLabCell ? "3px solid #2C6E8A" : "1px solid #C8C0A8",
      padding: "4px",
      textAlign: "center",
      verticalAlign: "middle",
      minHeight: 56,
      background: isDragOver ? "#EDE8FD"
        : isDragSrc ? "#F0EBE0"
          : data?.isConflict ? "#FFF0EF"
            : isHighlighted ? "#E8F0FE"
              : isLabCell ? "#EEF7FB"
                : isShadowed ? "#F5F0E8"
                  : "#FFFFFF",
      cursor: data?.isLocked ? "not-allowed" : "grab",
      transition: "background 0.15s, border 0.15s",
      opacity: isDragSrc ? 0.4 : isShadowed ? 0.5 : 1,
    };
  };

  const codeStyle = (data: SlotData | null | undefined): React.CSSProperties => ({
    fontSize: data?.code && data.code.length > 12 ? 9 : 10,
    fontFamily: "'Courier New', monospace",
    fontWeight: 700,
    color: data?.isConflict ? "#C0392B"
      : data?.isLab ? "#1A5276"
        : "#2D3436",
    lineHeight: 1.4,
  });

  const breakColStyle: React.CSSProperties = {
    border: "1px solid #C8C0A8",
    background: "#EDE8DC",
    padding: 0,
    width: 32,
  };

  const breakHeaderStyle: React.CSSProperties = {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontSize: 8,
    fontWeight: 700,
    color: "#8B7D6B",
    letterSpacing: 2,
    padding: "6px 0",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  // Renders slot cells for a group of slot indices.
  // Each slot is always its own <td> — no colspan merging.
  // Lab slots get a blue left border + "*lab" badge.
  // Consecutive lab cells for the same subject appear naturally
  // because the solver always places pairs adjacently.
  const renderSlotGroup = (indices: number[], slots: (SlotData | null)[], dayIdx: number) => (
    <>
      {indices.map((si) => {
        const data = slots[si] ?? null;
        const dayForGrid = dayIdx + 1;
        return (
          <td
            key={si}
            style={cellStyle(data, dayForGrid, si)}
            title={data?.conflictInfo || undefined}
            onClick={() => handleCellClick(dayForGrid, si, data)}
            draggable={!!data && !data.isLocked && !!onSwapSlots}
            onDragStart={(e) => handleDragStart(e, dayForGrid, si, data)}
            onDragOver={(e) => handleDragOver(e, dayForGrid, si)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, dayForGrid, si, data)}
            onDragEnd={handleDragEnd}
          >
            {data && (
              <span style={codeStyle(data)}>
                {data.code}
                {data.isLab && (
                  <span style={{
                    display: "block",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#2C6E8A",
                    marginTop: 2,
                    letterSpacing: 0.5,
                  }}>
                    *lab
                  </span>
                )}
                {data.isConflict && (
                  <span style={{
                    display: "block",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#C0392B",
                    marginTop: 2,
                  }}>
                    ⚠ collision
                  </span>
                )}
              </span>
            )}
          </td>
        );
      })}
    </>
  );

  return (
    <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      background: "#FFFDF5",
      padding: 24,
      border: "2px solid #2D3436",
      boxShadow: "6px 6px 0 rgba(45,52,54,0.08)",
    }}>

      {/* ── Header ── */}
      <div style={{
        textAlign: "center",
        marginBottom: 16,
        borderBottom: "2px solid #2D3436",
        paddingBottom: 12,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#2D3436", letterSpacing: 1 }}>
          {institutionName}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2D3436", marginTop: 2 }}>
          {tableTitle}
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 12,
          fontWeight: 700,
          color: "#2D3436",
        }}>
          <span>{semesterInfo}</span>
          <span>ROOM No. : {roomNo}</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "2px solid #2D3436",
          tableLayout: "fixed",
        }}>
          {/* 9 columns: day | s0 | s1 | tea | s2 | s3 | lunch | s4 | s5 */}
          <colgroup>
            <col style={{ width: 60 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 32 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 32 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
          </colgroup>

          <thead>
            <tr>
              <th style={{
                border: "1px solid #C8C0A8",
                background: "#F0EBE0",
                padding: "8px 4px",
                fontSize: 11,
                fontWeight: 700,
                color: "#2D3436",
              }}>
                Days
              </th>

              {/* Morning: slots 0, 1 */}
              {TIME_HEADERS.slice(0, 2).map((h, i) => (
                <th key={`am-${i}`} style={{
                  border: "1px solid #C8C0A8",
                  background: "#FFFDF5",
                  padding: "6px 4px",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#2D3436",
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                }}>{h}</th>
              ))}

              {/* Tea break */}
              <th style={breakColStyle}>
                <div style={breakHeaderStyle}>Tea Break</div>
              </th>

              {/* Midday: slots 2, 3 */}
              {TIME_HEADERS.slice(2, 4).map((h, i) => (
                <th key={`mid-${i}`} style={{
                  border: "1px solid #C8C0A8",
                  background: "#FFFDF5",
                  padding: "6px 4px",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#2D3436",
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                }}>{h}</th>
              ))}

              {/* Lunch break */}
              <th style={breakColStyle}>
                <div style={breakHeaderStyle}>Lunch Break</div>
              </th>

              {/* Afternoon: slots 4, 5 */}
              {TIME_HEADERS.slice(4, 6).map((h, i) => (
                <th key={`pm-${i}`} style={{
                  border: "1px solid #C8C0A8",
                  background: "#FFFDF5",
                  padding: "6px 4px",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#2D3436",
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {DAYS.map((day, dayIdx) => {
              const slots = grid[dayIdx] ?? Array(6).fill(null);
              return (
                <tr key={day}>
                  <td style={{
                    border: "1px solid #C8C0A8",
                    background: "#F0EBE0",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#2D3436",
                    padding: "4px 2px",
                  }}>
                    {day}
                  </td>

                  {/* Morning: slots 0, 1 */}
                  {renderSlotGroup([0, 1], slots, dayIdx)}

                  {/* Tea break */}
                  <td style={breakColStyle} />

                  {/* Midday: slots 2, 3 */}
                  {renderSlotGroup([2, 3], slots, dayIdx)}

                  {/* Lunch break */}
                  <td style={breakColStyle} />

                  {/* Afternoon: slots 4, 5 */}
                  {renderSlotGroup([4, 5], slots, dayIdx)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 6, fontSize: 10, color: "#8B7D6B", fontStyle: "italic" }}>
        *Compulsory lab session
      </div>

      {/* ── Legend ── */}
      {subjectLegend.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #2D3436",
            fontSize: 10.5,
          }}>
            <thead>
              <tr style={{ background: "#F0EBE0" }}>
                {["SUBJECT CODE", "SUBJECT", "INITIALS", "FACULTY"].map(h => (
                  <th key={h} style={{
                    border: "1px solid #C8C0A8",
                    padding: "6px 10px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#2D3436",
                    fontSize: 10,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectLegend.map((row, i) => (
                <tr key={row.code} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFFDF5" }}>
                  <td style={{
                    border: "1px solid #E2D9C5",
                    padding: "5px 10px",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: 10,
                  }}>{row.code}</td>
                  <td style={{ border: "1px solid #E2D9C5", padding: "5px 10px" }}>{row.title}</td>
                  <td style={{
                    border: "1px solid #E2D9C5",
                    padding: "5px 10px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}>{row.initials}</td>
                  <td style={{ border: "1px solid #E2D9C5", padding: "5px 10px" }}>{row.faculty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Signature blocks ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 32,
        paddingTop: 8,
        borderTop: "1px solid #E2D9C5",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ minWidth: 180, borderBottom: "1px solid #2D3436", marginBottom: 4, height: 32 }} />
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2D3436" }}>Time Table in charge</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ minWidth: 180, borderBottom: "1px solid #2D3436", marginBottom: 4, height: 32 }} />
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2D3436" }}>Principal</div>
        </div>
      </div>
    </div>
  );
}
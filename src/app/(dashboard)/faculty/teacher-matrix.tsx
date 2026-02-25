"use client";

import { useState } from "react";
import { removeAssignmentAction } from "./actions";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Subject {
  id: string;
  code: string;
  title: string;
  semester?: number;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  is_available: boolean;
  max_daily_slots: number;
  assignments: { subject: Subject }[];
}

interface TeacherMatrixProps {
  teachers: Teacher[];
  subjects: Subject[];
}

export default function TeacherMatrix({ teachers, subjects }: TeacherMatrixProps) {
  const [semFilter, setSemFilter] = useState<number | "all">("all");

  const filteredSubjects = semFilter === "all"
    ? subjects
    : subjects.filter((s) => s.semester === semFilter);

  // Build a quick lookup: teacherId -> Set of subjectIds
  const assignmentMap = new Map<string, Set<string>>();
  for (const t of teachers) {
    const ids = new Set(t.assignments.map((a) => a.subject.id));
    assignmentMap.set(t.id, ids);
  }

  const semesters = [...new Set(subjects.map((s) => s.semester).filter(Boolean))].sort(
    (a, b) => (a as number) - (b as number)
  );

  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      {/* Semester filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1 }}>
          Semester
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setSemFilter("all")}
            style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: "pointer",
              border: "1.5px solid #2D3436", transition: "all 0.15s",
              background: semFilter === "all" ? "#2D3436" : "transparent",
              color: semFilter === "all" ? "#FFFDF5" : "#2D3436",
            }}
          >
            All
          </button>
          {semesters.map((s) => (
            <button
              key={s}
              onClick={() => setSemFilter(s as number)}
              style={{
                padding: "4px 12px", fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: "pointer",
                border: "1.5px solid #2D3436", transition: "all 0.15s",
                background: semFilter === s ? "#2D3436" : "transparent",
                color: semFilter === s ? "#FFFDF5" : "#2D3436",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div style={{ overflowX: "auto", border: "1.5px solid #2D3436", borderRadius: 4 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#2D3436" }}>
              <th style={{
                padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                color: "#FFFDF5", textTransform: "uppercase", letterSpacing: 0.8,
                borderRight: "1px solid #3D4446", position: "sticky", left: 0, background: "#2D3436", zIndex: 1,
              }}>
                Teacher
              </th>
              {filteredSubjects.map((s) => (
                <th
                  key={s.id}
                  style={{
                    padding: "10px 8px", textAlign: "center", fontSize: 9, fontWeight: 700,
                    color: "#FFFDF5", textTransform: "uppercase", letterSpacing: 0.5,
                    borderRight: "1px solid #3D4446", whiteSpace: "nowrap",
                    writingMode: filteredSubjects.length > 8 ? "vertical-rl" : undefined,
                    minWidth: 50,
                  }}
                  title={s.title}
                >
                  {s.code}
                </th>
              ))}
              <th style={{
                padding: "10px 12px", textAlign: "center", fontSize: 10, fontWeight: 700,
                color: "#FFFDF5", letterSpacing: 0.5,
              }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, idx) => {
              const tAssignments = assignmentMap.get(teacher.id) || new Set();
              const count = filteredSubjects.filter((s) => tAssignments.has(s.id)).length;

              return (
                <tr
                  key={teacher.id}
                  style={{
                    background: idx % 2 === 0 ? "#FFFDF5" : "#F8F4EB",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE8DD")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFDF5" : "#F8F4EB")}
                >
                  <td style={{
                    padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#2D3436",
                    borderRight: "1px solid #E2D9C5", borderBottom: "1px solid #E2D9C5",
                    whiteSpace: "nowrap", position: "sticky", left: 0,
                    background: "inherit", zIndex: 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {teacher.name}
                      {!teacher.is_available && (
                        <span style={{
                          fontSize: 8, fontWeight: 800, color: "#C0392B", background: "#FFF0EF",
                          padding: "1px 5px", borderRadius: 2, textTransform: "uppercase",
                        }}>
                          Leave
                        </span>
                      )}
                    </div>
                  </td>
                  {filteredSubjects.map((subject) => {
                    const isAssigned = tAssignments.has(subject.id);
                    return (
                      <td
                        key={subject.id}
                        style={{
                          padding: "4px 8px", textAlign: "center",
                          borderRight: "1px solid #E2D9C5", borderBottom: "1px solid #E2D9C5",
                        }}
                      >
                        {isAssigned ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                title={`Remove ${subject.code} from ${teacher.name}`}
                                style={{
                                  background: "#27AE60", color: "white", border: "none",
                                  borderRadius: 3, width: 22, height: 22, cursor: "pointer",
                                  fontSize: 12, fontWeight: 800, lineHeight: 1,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#C0392B"; e.currentTarget.textContent = "✕"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#27AE60"; e.currentTarget.textContent = "✓"; }}
                              >
                                ✓
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#FFFDF5]" style={{ fontFamily: "'Georgia', serif" }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: "#2D3436" }}>Remove Assignment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove <strong>{subject.code}</strong> from <strong>{teacher.name}</strong>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel style={{ border: "1px solid #C8C0A8" }}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  style={{ background: "#C0392B", color: "white" }}
                                  onClick={() => removeAssignmentAction(teacher.id, subject.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span style={{ color: "#E2D9C5", fontSize: 14 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{
                    padding: "8px 12px", textAlign: "center", fontWeight: 800, fontSize: 13,
                    color: count > 0 ? "#2D3436" : "#B0A898", borderBottom: "1px solid #E2D9C5",
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: 12, fontSize: 11, color: "#8B7D6B" }}>
        {teachers.length} teachers · {filteredSubjects.length} subjects
        {semFilter !== "all" && ` (Semester ${semFilter})`}
      </div>
    </div>
  );
}

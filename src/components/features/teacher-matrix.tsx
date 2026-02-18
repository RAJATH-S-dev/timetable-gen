// src/components/features/scheduler/teacher-matrix.tsx

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function timeToSlotIndex(startTime: string): number {
  const [h, m] = startTime.split(":").map(Number);
  return Math.floor((h * 60 + m - 9 * 60) / 60);
}

interface TeacherMatrixProps {
  day: string;
  period: number; 
  subjectId: string | null; 
  departmentId: string;
  onSelectTeacher: (teacherId: string) => void;
}

interface TeacherStatus {
  id: string;
  name: string;
  isBusy: boolean;
  busyReason: string; 
}

export default function TeacherMatrix({
  day,
  period,
  subjectId,
  departmentId,
  onSelectTeacher,
}: TeacherMatrixProps) {
  const [teachers, setTeachers] = useState<TeacherStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAvailability() {
      // If no subject is selected, we cannot determine "Qualified" teachers
      if (!subjectId) return;
      
      setLoading(true);

      // QUERY OPTIMIZATION: 
      // We filter by 'teacher_subjects.subject_id' directly in the DB.
      // This ensures we only download teachers who are QUALIFIED for this subject.
      const { data: qualifiedTeachers } = await supabase
        .from("teachers")
        .select(`
          id,
          name,
          teacher_subject_assignments!inner(subject_id),
          timetable_slots(day_of_week, start_time, subject_id)
        `)
        .eq("department_id", departmentId)
        .eq("teacher_subject_assignments.subject_id", subjectId);

      if (qualifiedTeachers) {
        const matrix = qualifiedTeachers.map((t: any) => {
          // Check if they have a slot booked at this specific Day/Period
          const conflictSlot = t.timetable_slots.find(
          (slot: any) => slot.day_of_week === Number(day) && 
          timeToSlotIndex(slot.start_time) === period
          );

          // Note: In a real app, you could fetch the conflict subject name here 
          // if you join 'subjects' inside 'timetables'
          const busyReason = conflictSlot 
            ? "Already Booked" 
            : "Free & Qualified";

          return {
            id: t.id,
            name: t.name,
            isBusy: !!conflictSlot,
            busyReason,
          };
        });

        // Sort: Free teachers FIRST, Busy teachers LAST
        matrix.sort((a, b) => {
            if (a.isBusy === b.isBusy) return 0;
            return a.isBusy ? 1 : -1;
        });

        setTeachers(matrix);
      }
      setLoading(false);
    }

    fetchAvailability();
  }, [day, period, subjectId, departmentId]);

  if (!subjectId) return null;

  return (
    <Card className="w-80 shadow-lg border-stone-200 bg-[#FFFDF5] fixed right-4 top-20 z-50"> 
      {/* bg-[#FFFDF5] matches Soft Cream Surface Palette [cite: 27] */}
      
      <CardHeader className="pb-2 border-b border-stone-100">
        <CardTitle className="text-lg font-semibold text-[#2D3436] flex items-center justify-between">
          <span>Faculty Availability</span>
          <span className="text-xs font-normal text-stone-500">
            {day} • Period {period}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                disabled={teacher.isBusy}
                onClick={() => onSelectTeacher(teacher.id)}
                className={`w-full text-left p-3 rounded-md flex items-center justify-between transition-all group
                  ${
                    teacher.isBusy
                      ? "opacity-60 cursor-not-allowed bg-stone-50"
                      : "hover:bg-white hover:shadow-sm bg-[#FFFDF5] border border-stone-200"
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#2D3436]">
                    {teacher.name}
                  </span>
                  <span className={`text-xs ${teacher.isBusy ? "text-[#FF7675]" : "text-stone-500"}`}>
                     {/* Muted Coral text for conflict reason [cite: 36] */}
                    {teacher.busyReason}
                  </span>
                </div>

                {teacher.isBusy ? (
                  <XCircle className="h-4 w-4 text-[#FF7675]" /> 
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}

            {teachers.length === 0 && (
              <p className="text-sm text-stone-500 text-center py-4">
                No qualified teachers found.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
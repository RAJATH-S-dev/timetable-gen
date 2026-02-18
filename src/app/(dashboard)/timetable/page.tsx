// src/app/(dashboard)/timetable/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimetableClient from "./timetable-client";

export default async function TimetablePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("department_id")
    .eq("email", user.email)
    .maybeSingle();  // ← won't throw if 0 or multiple rows

  if (!teacher) {
    return (
      <div className="p-8 bg-[#FFFDF5] min-h-screen font-mono text-sm">
        <p className="text-red-500 font-bold mb-4">Access Denied</p>
        <p className="text-gray-600 mb-2">Logged in as: <strong>{user.email}</strong></p>
        {teacherError && (
          <p className="text-red-400 mb-2">DB Error: <strong>{teacherError.message}</strong></p>
        )}
      </div>
    );
  }

  return <TimetableClient departmentId={teacher.department_id} />;
}
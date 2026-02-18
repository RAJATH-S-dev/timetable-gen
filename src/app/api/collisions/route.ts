import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/collisions?department_id=MIT-ISE
 * 
 * Finds teachers who are double-booked across departments at the same
 * (day_of_week, start_time). Returns a list of collision objects
 * that the frontend can overlay on the timetable grid.
 */
export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get('department_id');
  if (!departmentId) {
    return NextResponse.json({ error: 'department_id is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch all slots for the current department
  const { data: mySlots, error: myErr } = await supabase
    .from('timetable_slots')
    .select('id, day_of_week, start_time, teacher_id, teachers(name)')
    .eq('department_id', departmentId);

  if (myErr) {
    return NextResponse.json({ error: myErr.message }, { status: 500 });
  }

  if (!mySlots || mySlots.length === 0) {
    return NextResponse.json({ collisions: [] });
  }

  // Get teacher IDs in this department
  const teacherIds = [...new Set(mySlots.map((s: any) => s.teacher_id).filter(Boolean))];

  if (teacherIds.length === 0) {
    return NextResponse.json({ collisions: [] });
  }

  // Find slots from OTHER departments that overlap for the same teacher
  const { data: otherSlots, error: otherErr } = await supabase
    .from('timetable_slots')
    .select('day_of_week, start_time, teacher_id, department_id')
    .in('teacher_id', teacherIds)
    .neq('department_id', departmentId);

  if (otherErr) {
    return NextResponse.json({ error: otherErr.message }, { status: 500 });
  }

  // Build a lookup: "teacher_id|day|start_time" → other department
  const otherMap = new Map<string, string>();
  (otherSlots ?? []).forEach((s: any) => {
    const key = `${s.teacher_id}|${s.day_of_week}|${s.start_time}`;
    otherMap.set(key, s.department_id);
  });

  // Find collisions
  const collisions: {
    slot_id: string;
    day_of_week: number;
    start_time: string;
    teacher_name: string;
    other_department: string;
  }[] = [];

  mySlots.forEach((s: any) => {
    if (!s.teacher_id) return;
    const key = `${s.teacher_id}|${s.day_of_week}|${s.start_time}`;
    const otherDept = otherMap.get(key);
    if (otherDept) {
      collisions.push({
        slot_id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        teacher_name: (s.teachers as any)?.name ?? 'Unknown',
        other_department: otherDept,
      });
    }
  });

  return NextResponse.json({ collisions });
}

"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addTeacherAction(data: { name: string; email: string; max_daily_slots?: number }) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('teachers')
    .insert({
      name: data.name,
      email: data.email,
      department_id: 'MIT-ISE',
      is_available: true,
      max_daily_slots: data.max_daily_slots ?? 4,
    });

  if (error) throw new Error(error.message);
  revalidatePath('/faculty');
}

export async function updateTeacherAction(id: string, updates: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id);

  if (!error) revalidatePath('/faculty');
}

export async function assignSubjectAction(teacherId: string, subjectId: string, section: string = 'A') {
  const supabase = await createClient();

  await supabase
    .from('teacher_subject_assignments')
    .insert({
      teacher_id: teacherId,
      subject_id: subjectId,
      department_id: 'MIT-ISE',  // ← fixed
      section,
    });

  revalidatePath('/faculty');
}

export async function upsertTeacherData(rows: any[]) {
  const supabase = await createClient();

  // Force correct department_id regardless of what comes in
  const normalized = rows.map(r => ({
    ...r,
    department_id: 'MIT-ISE',
  }));

  const { error } = await supabase
    .from('teachers')
    .upsert(normalized, { onConflict: 'email' });

  if (error) throw new Error(error.message);
  revalidatePath('/faculty');
}

export async function deleteTeacherAction(teacherId: string) {
  const supabase = await createClient();

  // Remove timetable slots assigned to this teacher
  await supabase
    .from('timetable_slots')
    .delete()
    .eq('teacher_id', teacherId);

  // Remove subject assignments
  await supabase
    .from('teacher_subject_assignments')
    .delete()
    .eq('teacher_id', teacherId);

  // Delete the teacher
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', teacherId);

  if (error) throw new Error(error.message);
  revalidatePath('/faculty');
}

export async function removeAssignmentAction(teacherId: string, subjectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('teacher_subject_assignments')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('subject_id', subjectId);

  if (error) throw new Error(error.message);
  revalidatePath('/faculty');
}

export async function swapSlotsAction(slotIdA: string, slotIdB: string) {
  const supabase = await createClient();

  const { data: slotA } = await supabase
    .from('timetable_slots')
    .select('teacher_id, subject_id, room_id, is_lab, is_double_start')
    .eq('id', slotIdA)
    .single();

  const { data: slotB } = await supabase
    .from('timetable_slots')
    .select('teacher_id, subject_id, room_id, is_lab, is_double_start')
    .eq('id', slotIdB)
    .single();

  if (!slotA || !slotB) throw new Error('Slot not found');

  const { error: errA } = await supabase
    .from('timetable_slots')
    .update({
      teacher_id: slotB.teacher_id,
      subject_id: slotB.subject_id,
      room_id: slotB.room_id,
      is_lab: slotB.is_lab,
      is_double_start: slotB.is_double_start,
    })
    .eq('id', slotIdA);

  const { error: errB } = await supabase
    .from('timetable_slots')
    .update({
      teacher_id: slotA.teacher_id,
      subject_id: slotA.subject_id,
      room_id: slotA.room_id,
      is_lab: slotA.is_lab,
      is_double_start: slotA.is_double_start,
    })
    .eq('id', slotIdB);

  if (errA || errB) throw new Error('Failed to swap slots');
  revalidatePath('/timetable');
}
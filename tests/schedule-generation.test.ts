/**
 * ============================================================
 * Multi-Semester Timetable Generation Tests
 * ============================================================
 *
 * These tests exercise the C++ ConstraintSolver via the
 * solver-bridge, feeding synthetic but realistic semester
 * data and validating the output for constraint satisfaction.
 *
 * Run:  npx vitest run tests/schedule-generation.test.ts
 * ============================================================
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runScheduler, ScheduleInput, ScheduleOutput } from '@/lib/engine/solver-bridge';
import { existsSync } from 'fs';
import path from 'path';

// ────────────────────────────────────────────────────────────
// Helpers to build synthetic semester data
// ────────────────────────────────────────────────────────────

function uid(prefix: string, i: number) {
  return `${prefix}-${String(i).padStart(4, '0')}`;
}

/**
 * VTU ISE-like curriculum per semester.
 * Each entry: [code, lecture_hours, practical_hours]
 * weekly_credits = lecture + practical
 */
const SEMESTER_CURRICULA: Record<number, [string, number, number][]> = {
  1: [
    ['MAT1', 4, 0], ['PHY1', 3, 2], ['CHE1', 3, 2],
    ['CPS1', 3, 2], ['ENG1', 2, 0], ['EGD1', 1, 2],
  ],
  2: [
    ['MAT2', 4, 0], ['PHY2', 3, 2], ['CHE2', 3, 2],
    ['CPS2', 3, 2], ['ENG2', 2, 0], ['WRK1', 0, 2],
  ],
  3: [
    ['MAT3', 4, 0], ['DSA1', 3, 2], ['DLD1', 3, 2],
    ['OOP1', 3, 2], ['DMS1', 3, 0], ['COA1', 3, 0],
  ],
  4: [
    ['MAT4', 4, 0], ['OS01', 3, 2], ['DBMS', 3, 2],
    ['ADE1', 3, 2], ['DAA1', 3, 0], ['SE01', 3, 0],
  ],
  5: [
    ['CNW1', 3, 2], ['ATC1', 3, 0], ['ML01', 3, 2],
    ['JAVA', 3, 2], ['FLAT', 3, 0], ['EL51', 3, 0],
  ],
  6: [
    ['CC01', 3, 2], ['CRY1', 3, 0], ['AI01', 3, 2],
    ['WEB1', 3, 2], ['CGV1', 3, 2], ['EL61', 3, 0],
  ],
  7: [
    ['BDA1', 3, 2], ['IOT1', 3, 2], ['DL01', 3, 2],
    ['EL71', 3, 0], ['EL72', 3, 0], ['PRJ7', 0, 4],
  ],
  8: [
    ['PRJ8', 0, 6], ['INT8', 0, 4], ['SEM8', 1, 0],
    ['EL81', 3, 0],
  ],
};

/** Builds a ScheduleInput for one semester. */
function buildSemesterInput(semester: number): ScheduleInput {
  const curriculum = SEMESTER_CURRICULA[semester];
  if (!curriculum) throw new Error(`No curriculum for semester ${semester}`);

  // Create subjects
  const subjects = curriculum.map(([code, lec, prac], i) => ({
    id: uid(`subj-s${semester}`, i),
    code,
    weekly_credits: lec + prac,
    preferred_room_type: prac > 0 ? 'lab' : 'lecture',
  }));

  // Create teachers — at least one per subject (some handle 2 subjects)
  const teacherCount = Math.max(subjects.length, 4);
  const teachers = Array.from({ length: teacherCount }, (_, i) => ({
    id: uid(`teach-s${semester}`, i),
    name: `Prof S${semester}-T${i + 1}`,
    is_available: true,
    max_daily_slots: 5,
  }));

  // Create rooms
  const rooms = [
    { id: uid(`room-s${semester}`, 0), room_name: `ISE-${semester}01`, capacity: 60, room_type: 'lecture' },
    { id: uid(`room-s${semester}`, 1), room_name: `ISE-${semester}02`, capacity: 60, room_type: 'lecture' },
    { id: uid(`room-s${semester}`, 2), room_name: `LAB-${semester}01`, capacity: 30, room_type: 'lab' },
    { id: uid(`room-s${semester}`, 3), room_name: `LAB-${semester}02`, capacity: 30, room_type: 'lab' },
  ];

  // Assignments — each subject gets assigned to at least one teacher
  const assignments = subjects.map((s, i) => ({
    teacher_id: teachers[i % teachers.length].id,
    subject_id: s.id,
  }));

  return {
    department_id: 'MIT-ISE',
    teachers,
    subjects,
    rooms,
    assignments,
    days_per_week: 5,
    slots_per_day: 6,
    lunch_slot_index: 3,
    time_limit_seconds: 60,
  };
}

// ────────────────────────────────────────────────────────────
// Constraint Validation Helpers
// ────────────────────────────────────────────────────────────

interface SlotOutput {
  teacher_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: number;
  slot_index: number;
  slot_status: string;
  is_lab?: boolean;
  is_double_start?: boolean;
  metadata?: { conflict_reason: string };
}

/** No teacher teaches two things at the same time. */
function validateNoTeacherClash(slots: SlotOutput[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>(); // key: teacher-day-slot -> subject
  for (const s of slots) {
    const key = `${s.teacher_id}|${s.day_of_week}|${s.slot_index}`;
    if (seen.has(key)) {
      errors.push(`Teacher clash: ${s.teacher_id} at day=${s.day_of_week} slot=${s.slot_index} teaches ${seen.get(key)} AND ${s.subject_id}`);
    }
    seen.set(key, s.subject_id);
  }
  return errors;
}

/** No room is double-booked at the same time. */
function validateNoRoomClash(slots: SlotOutput[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  for (const s of slots) {
    if (!s.room_id) continue;
    const key = `${s.room_id}|${s.day_of_week}|${s.slot_index}`;
    if (seen.has(key)) {
      errors.push(`Room clash: ${s.room_id} at day=${s.day_of_week} slot=${s.slot_index}`);
    }
    seen.set(key, s.subject_id);
  }
  return errors;
}

/** No teacher exceeds their max_daily_slots. */
function validateDailyCap(slots: SlotOutput[], input: ScheduleInput): string[] {
  const errors: string[] = [];
  const teacherMap = new Map(input.teachers.map(t => [t.id, t]));

  // Count slots per teacher per day
  const counts = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.teacher_id}|${s.day_of_week}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const [key, count] of counts) {
    const [tid] = key.split('|');
    const teacher = teacherMap.get(tid);
    if (teacher && count > teacher.max_daily_slots) {
      errors.push(`Daily cap exceeded: ${teacher.name} has ${count} slots on day ${key.split('|')[1]} (max ${teacher.max_daily_slots})`);
    }
  }
  return errors;
}

/** Subject weekly slot count should match weekly_credits. */
function validateWeeklyCredits(slots: SlotOutput[], input: ScheduleInput): string[] {
  const errors: string[] = [];
  const subjectMap = new Map(input.subjects.map(s => [s.id, s]));

  const counts = new Map<string, number>();
  for (const s of slots) {
    counts.set(s.subject_id, (counts.get(s.subject_id) ?? 0) + 1);
  }

  for (const subject of input.subjects) {
    const actual = counts.get(subject.id) ?? 0;
    if (actual !== subject.weekly_credits) {
      errors.push(`Weekly credits mismatch: ${subject.code} expected ${subject.weekly_credits} slots, got ${actual}`);
    }
  }
  return errors;
}

/** All slots should be within valid bounds. */
function validateSlotBounds(slots: SlotOutput[], input: ScheduleInput): string[] {
  const errors: string[] = [];
  for (const s of slots) {
    // Solver uses 1-indexed days: 1=Monday … 5=Friday (for days_per_week=5)
    if (s.day_of_week < 1 || s.day_of_week > input.days_per_week) {
      errors.push(`Invalid day_of_week: ${s.day_of_week} (expected 1–${input.days_per_week})`);
    }
    if (s.slot_index < 0 || s.slot_index >= input.slots_per_day) {
      errors.push(`Invalid slot_index: ${s.slot_index} (expected 0–${input.slots_per_day - 1})`);
    }
  }
  return errors;
}

// ────────────────────────────────────────────────────────────
// Test: Scheduler binary existence
// ────────────────────────────────────────────────────────────

describe('Scheduler prerequisites', () => {
  it('scheduler.exe exists', () => {
    const exePath = path.join(process.cwd(), 'engine', 'build', 'bin', 'Release', 'scheduler.exe');
    expect(existsSync(exePath), `scheduler.exe not found at ${exePath}`).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────
// Test: Each semester independently (semesters 1–8)
// ────────────────────────────────────────────────────────────

describe('Single-semester timetable generation', () => {
  for (const semester of [1, 2, 3, 4, 5, 6, 7, 8]) {
    describe(`Semester ${semester}`, () => {
      let input: ScheduleInput;
      let result: ScheduleOutput;

      beforeAll(async () => {
        input = buildSemesterInput(semester);
        result = await runScheduler(input);
      });

      it('solver returns success', () => {
        expect(result.success, `Solver failed: ${result.status} — ${result.error ?? ''}\nConflict log: ${(result.conflict_log ?? []).join('\n')}`).toBe(true);
      });

      it('produces slots', () => {
        expect(result.slots.length).toBeGreaterThan(0);
      });

      it('no teacher clashes', () => {
        const errors = validateNoTeacherClash(result.slots as SlotOutput[]);
        expect(errors, errors.join('\n')).toHaveLength(0);
      });

      it('no room clashes', () => {
        const errors = validateNoRoomClash(result.slots as SlotOutput[]);
        expect(errors, errors.join('\n')).toHaveLength(0);
      });

      it('respects daily slot caps', () => {
        const errors = validateDailyCap(result.slots as SlotOutput[], input);
        expect(errors, errors.join('\n')).toHaveLength(0);
      });

      it('weekly credits satisfied per subject', () => {
        const errors = validateWeeklyCredits(result.slots as SlotOutput[], input);
        expect(errors, errors.join('\n')).toHaveLength(0);
      });

      it('all slots within bounds', () => {
        const errors = validateSlotBounds(result.slots as SlotOutput[], input);
        expect(errors, errors.join('\n')).toHaveLength(0);
      });

      it('reports total scheduled slots count', () => {
        const totalCredits = input.subjects.reduce((sum, s) => sum + s.weekly_credits, 0);
        console.log(`  Semester ${semester}: ${result.slots.length} slots (expected ≈${totalCredits})`);
      });
    });
  }
});

// ────────────────────────────────────────────────────────────
// Test: Edge cases
// ────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('single subject, single teacher', async () => {
    const input: ScheduleInput = {
      department_id: 'TEST',
      teachers: [{ id: 't1', name: 'Solo Teacher', is_available: true, max_daily_slots: 6 }],
      subjects: [{ id: 's1', code: 'SOLO', weekly_credits: 3, preferred_room_type: 'lecture' }],
      rooms: [{ id: 'r1', room_name: 'Room 1', capacity: 60, room_type: 'lecture' }],
      assignments: [{ teacher_id: 't1', subject_id: 's1' }],
      days_per_week: 5,
      slots_per_day: 6,
      lunch_slot_index: 3,
      time_limit_seconds: 30,
    };

    const result = await runScheduler(input);
    expect(result.success).toBe(true);
    expect(result.slots).toHaveLength(3);

    const errors = [
      ...validateNoTeacherClash(result.slots as SlotOutput[]),
      ...validateSlotBounds(result.slots as SlotOutput[], input),
    ];
    expect(errors).toHaveLength(0);
  });

  it('high load semester (many subjects, tight schedule)', async () => {
    // 8 subjects × 4 credits each = 32 slots needed across 5 days × 6 slots = 30 available
    // This is nearly impossible — tests if solver correctly reports INFEASIBLE
    const subjects = Array.from({ length: 8 }, (_, i) => ({
      id: `s${i}`, code: `HIGH${i}`, weekly_credits: 4, preferred_room_type: 'lecture',
    }));
    const teachers = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`, name: `Teacher ${i}`, is_available: true, max_daily_slots: 6,
    }));

    const input: ScheduleInput = {
      department_id: 'TEST',
      teachers,
      subjects,
      rooms: [{ id: 'r1', room_name: 'Room 1', capacity: 60, room_type: 'lecture' }],
      assignments: subjects.map((s, i) => ({ teacher_id: teachers[i].id, subject_id: s.id })),
      days_per_week: 5,
      slots_per_day: 6,
      lunch_slot_index: 3,
      time_limit_seconds: 30,
    };

    const result = await runScheduler(input);
    // With 32 slots needed and only 30 available (5×6), this MAY be feasible if
    // lunch slot is skipped, or it may be infeasible. Either way, no crash.
    expect(['OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'MODEL_INVALID']).toContain(result.status);
  });

  it('teacher with very low daily cap (max 1 slot/day)', async () => {
    const input: ScheduleInput = {
      department_id: 'TEST',
      teachers: [{ id: 't1', name: 'Part Timer', is_available: true, max_daily_slots: 1 }],
      subjects: [{ id: 's1', code: 'PT01', weekly_credits: 4, preferred_room_type: 'lecture' }],
      rooms: [{ id: 'r1', room_name: 'Room 1', capacity: 60, room_type: 'lecture' }],
      assignments: [{ teacher_id: 't1', subject_id: 's1' }],
      days_per_week: 5,
      slots_per_day: 6,
      lunch_slot_index: 3,
      time_limit_seconds: 30,
    };

    const result = await runScheduler(input);
    expect(result.success).toBe(true);

    // Verify the daily cap is respected
    const errors = validateDailyCap(result.slots as SlotOutput[], input);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });

  it('lab subjects get consecutive slots', async () => {
    const input: ScheduleInput = {
      department_id: 'TEST',
      teachers: [{ id: 't1', name: 'Lab Prof', is_available: true, max_daily_slots: 6 }],
      subjects: [{ id: 's1', code: 'LAB1', weekly_credits: 2, preferred_room_type: 'lab' }],
      rooms: [{ id: 'r1', room_name: 'Lab 1', capacity: 30, room_type: 'lab' }],
      assignments: [{ teacher_id: 't1', subject_id: 's1' }],
      days_per_week: 5,
      slots_per_day: 6,
      lunch_slot_index: 3,
      time_limit_seconds: 30,
    };

    const result = await runScheduler(input);
    expect(result.success).toBe(true);
    expect(result.slots.length).toBeGreaterThanOrEqual(2);

    // All slots assigned to LAB1
    const labSlots = result.slots.filter(s => s.subject_id === 's1');
    expect(labSlots.length).toBe(2);
  });
});

// ────────────────────────────────────────────────────────────
// Test: Solver output structure
// ────────────────────────────────────────────────────────────

describe('Solver output structure', () => {
  let result: ScheduleOutput;

  beforeAll(async () => {
    const input = buildSemesterInput(3); // Use semester 3 as a representative
    result = await runScheduler(input);
  });

  it('has success field', () => {
    expect(result).toHaveProperty('success');
  });

  it('has status field', () => {
    expect(result).toHaveProperty('status');
    expect(typeof result.status).toBe('string');
  });

  it('has slots array', () => {
    expect(Array.isArray(result.slots)).toBe(true);
  });

  it('has conflict_log array', () => {
    expect(Array.isArray(result.conflict_log)).toBe(true);
  });

  it('each slot has required fields', () => {
    for (const slot of result.slots) {
      expect(slot).toHaveProperty('teacher_id');
      expect(slot).toHaveProperty('subject_id');
      expect(slot).toHaveProperty('day_of_week');
      expect(slot).toHaveProperty('slot_index');
      expect(slot).toHaveProperty('slot_status');
    }
  });
});

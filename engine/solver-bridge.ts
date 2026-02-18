import { spawn } from 'child_process';
import path from 'path';

// ============================================================
// Types — mirror ConstraintSolver.cpp structs exactly
// ============================================================

export interface Teacher {
  id: string;
  name: string;
  is_available: boolean;
  max_daily_slots: number;
}

export interface Subject {
  id: string;
  code: string;
  weekly_credits: number;
  practical_hours: number;
  preferred_room_type: string;
}

export interface Room {
  id: string;
  room_name: string;
  capacity: number;
  room_type: string;
}

export interface TeacherSubjectAssignment {
  teacher_id: string;
  subject_id: string;
}

export interface ScheduleInput {
  department_id: string;
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  assignments: TeacherSubjectAssignment[];
  days_per_week: number;
  slots_per_day: number;
  lunch_slot_index: number;
  time_limit_seconds: number;
}

export interface ScheduledSlot {
  teacher_id:      string;
  subject_id:      string;
  room_id:         string;
  day_of_week:     number;
  slot_index:      number;
  slot_status:     string;
  is_lab:          boolean;   // true if this slot is part of a lab pair
  is_double_start: boolean;   // true if this is the FIRST slot of a lab pair
  metadata:        { conflict_reason: string };
}

export interface ScheduleOutput {
  success: boolean;
  status: string;
  slots: ScheduledSlot[];
  conflict_log: string[];
  error?: string;
}

// ============================================================
// Resolve scheduler.exe path
// ============================================================

function getSchedulerPath(): string {
  return path.join(
    process.cwd(),
    'engine',
    'build',
    'bin',
    'Release',
    'scheduler.exe'
  );
}

// ============================================================
// Main bridge function
// ============================================================

export async function runScheduler(input: ScheduleInput): Promise<ScheduleOutput> {
  return new Promise((resolve) => {
    const schedulerPath = getSchedulerPath();
    const inputJson = JSON.stringify(input);

    let stdout = '';
    let stderr = '';

    console.log('[solver-bridge] Scheduler path:', schedulerPath);
    console.log('[solver-bridge] Input summary:', {
      teachers:    input.teachers.length,
      subjects:    input.subjects.map(s => ({ code: s.code, weekly_credits: s.weekly_credits, practical_hours: s.practical_hours })),
      rooms:       input.rooms.length,
      assignments: input.assignments.length,
    });

    const child = spawn(schedulerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdin.write(inputJson);
    child.stdin.end();

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        status:  'TIMEOUT',
        slots:   [],
        conflict_log: [],
        error: `Solver exceeded ${input.time_limit_seconds + 5}s and was killed`,
      });
    }, (input.time_limit_seconds + 5) * 1000);

    child.on('close', (code: number) => {
      clearTimeout(timeout);

      if (code !== 0) {
        resolve({
          success: false,
          status:  'ERROR',
          slots:   [],
          conflict_log: [],
          error: `Solver exited with code ${code}. stderr: ${stderr}`,
        });
        return;
      }

      try {
        const result: ScheduleOutput = JSON.parse(stdout.trim());
        resolve(result);
      } catch {
        resolve({
          success: false,
          status:  'PARSE_ERROR',
          slots:   [],
          conflict_log: [],
          error: `Failed to parse solver output: ${stdout}`,
        });
      }
    });

    child.on('error', (err: Error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        status:  'SPAWN_ERROR',
        slots:   [],
        conflict_log: [],
        error: `Failed to start scheduler: ${err.message}`,
      });
    });
  });
}

// ============================================================
// Helper: convert slot_index → start_time / end_time strings
// Day starts at 09:00, each slot = 60 minutes
// slot 0 = 09:00–10:00, slot 1 = 10:00–11:00, etc.
// ============================================================

export function slotIndexToTime(
  slotIndex: number,
  startHour: number = 9,
  slotDurationMinutes: number = 60
): { start_time: string; end_time: string } {
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}:00`;
  };

  const startMins = startHour * 60 + slotIndex * slotDurationMinutes;
  return {
    start_time: fmt(startMins),
    end_time:   fmt(startMins + slotDurationMinutes),
  };
}

// ============================================================
// Helper: day number → name
// ============================================================

export function dayOfWeekToName(day: number): string {
  const days: Record<number, string> = {
    1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday',
  };
  return days[day] ?? `Day ${day}`;
}
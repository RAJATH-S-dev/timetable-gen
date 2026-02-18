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
  teacher_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: number;
  slot_index: number;
  slot_status: string;
  metadata: { conflict_reason: string };
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
  const isWin = process.platform === 'win32';
  return path.join(
    process.cwd(),
    'engine',
    'build',
    'bin',
    ...(isWin ? ['Release', 'scheduler.exe'] : ['scheduler'])
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
        status: 'TIMEOUT',
        slots: [],
        conflict_log: [],
        error: `Solver exceeded ${input.time_limit_seconds + 5}s and was killed`,
      });
    }, (input.time_limit_seconds + 5) * 1000);

    child.on('close', (code: number) => {
      clearTimeout(timeout);
      // Always try to parse stdout first — the solver writes valid JSON
      // even on failure (INFEASIBLE, ERROR) with a useful conflict_log.
      try {
        const result: ScheduleOutput = JSON.parse(stdout.trim());
        resolve(result);
      } catch {
        // stdout wasn't valid JSON — solver crashed or produced garbage.
        // Fall back to exit code + stderr for diagnostics.
        resolve({
          success: false,
          status: code !== 0 ? 'ERROR' : 'PARSE_ERROR',
          slots: [],
          conflict_log: [],
          error: code !== 0
            ? `Solver exited with code ${code}. stderr: ${stderr}`
            : `Failed to parse solver output: ${stdout}`,
        });
      }
    });

    child.on('error', (err: Error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        status: 'SPAWN_ERROR',
        slots: [],
        conflict_log: [],
        error: `Failed to start scheduler: ${err.message}`,
      });
    });
  });
}

// ============================================================
// Helper: convert slot_index → start_time / end_time strings
// Day starts 08:00, each slot = 60 minutes
// Slot 0 = 08:00-09:00, Slot 4 = 12:00-13:00 (lunch), etc.
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
    end_time: fmt(startMins + slotDurationMinutes),
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
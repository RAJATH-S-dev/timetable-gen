// =============================================================================
// wasm-loader.ts
// src/lib/engine/wasm-loader.ts
//
// WASM Bridge: Hydrates data from Supabase → serializes to JSON →
// passes to C++ solver → parses result → returns typed ScheduleOutput.
// Runs inside a Web Worker to prevent UI thread blocking.
// =============================================================================

// -----------------------------------------------------------------------
// Types (mirror the C++ structs exactly)
// -----------------------------------------------------------------------

export interface TeacherInput {
  id: string;
  name: string;
  email: string;
  department_id: string;
  is_available: boolean;
}

export interface SubjectInput {
  id: string;
  code: string;
  title: string;
  weekly_credits: number;
  department_id: string;
  preferred_room_type: 'Lecture' | 'Lab' | 'Seminar Hall';
}

export interface RoomInput {
  id: string;
  room_name: string;
  capacity: number;
  room_type: 'Lecture' | 'Lab' | 'Seminar Hall';
  department_id: string;
}

export interface AssignmentInput {
  teacher_id: string;
  subject_id: string;
}

export interface SchedulerInput {
  department_id: string;       // Always 'ISE' — RLS enforcement
  num_days: number;            // 5 or 6
  slots_per_day: number;       // e.g. 8
  lunch_slot_index: number;    // e.g. 4
  max_daily_hours_per_teacher: number;
  teachers: TeacherInput[];
  subjects: SubjectInput[];
  rooms: RoomInput[];
  assignments: AssignmentInput[];
}

export interface TimetableSlotOutput {
  teacher_id: string;
  subject_id: string;
  room_id: string;             // Empty string = pending_room
  day_of_week: number;         // 1–6
  slot_index: number;          // 0-indexed within the day
  slot_status: 'scheduled' | 'conflict' | 'pending_room';
  metadata: {
    conflict_reason: string;   // Stored in metadata JSONB on timetable_slots
  };
}

export interface SchedulerOutput {
  success: boolean;
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'ERROR' | 'UNKNOWN';
  slots: TimetableSlotOutput[];
  conflict_log: string[];
}

// -----------------------------------------------------------------------
// WASM Module Type
// -----------------------------------------------------------------------
interface SchedulerWasmModule {
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => string;
  generateTimetable?: (input: string) => string; // embind path
}

// -----------------------------------------------------------------------
// Module Singleton
// Loaded once, reused across all solver calls.
// -----------------------------------------------------------------------
let wasmModule: SchedulerWasmModule | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Loads the WASM module from /wasm/scheduler.js
 * Must be called before generateTimetable().
 * Safe to call multiple times — returns cached module on repeat calls.
 */
export async function initializeEngine(): Promise<void> {
  if (wasmModule) return;           // Already loaded
  if (loadError) throw loadError;   // Cached failure

  if (isLoading) {
    // Wait for in-progress load
    await new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if (wasmModule)      { clearInterval(interval); resolve(); }
        else if (loadError)  { clearInterval(interval); reject(loadError); }
      }, 50);
    });
    return;
  }

  isLoading = true;

  try {
    // Dynamically import the Emscripten-generated JS glue file
    // This file lives in /public/wasm/scheduler.js (served as static asset)
    // @ts-ignore — generated at build time via: make wasm
    const SchedulerModuleFactory = (await import('/wasm/scheduler.js')).default;
    wasmModule = await SchedulerModuleFactory({
      locateFile: (path: string) => {
        // Point to the .wasm binary in the public directory
        if (path.endsWith('.wasm')) return `/wasm/${path}`;
        return path;
      },
    }) as SchedulerWasmModule;

    console.log('[Engine] WASM module loaded successfully.');
  } catch (err) {
    loadError = err instanceof Error ? err : new Error(String(err));
    isLoading = false;
    throw loadError;
  }

  isLoading = false;
}

/**
 * Main entry point.
 * Serializes input → calls C++ solver via WASM → parses output.
 *
 * @param input - Fully hydrated scheduler input from Supabase
 * @returns     - Parsed SchedulerOutput with slots and conflict log
 */
export async function generateTimetable(
  input: SchedulerInput
): Promise<SchedulerOutput> {
  if (!wasmModule) {
    await initializeEngine();
  }

  // --- RLS Guard (TypeScript layer, mirrors C++ guard) ---
  const invalidTeacher = input.teachers.find(
    (t) => t.department_id !== input.department_id
  );
  if (invalidTeacher) {
    throw new Error(
      `RLS Violation: Teacher "${invalidTeacher.name}" belongs to wrong department.`
    );
  }

  // Serialize input to JSON string for C++ consumption
  const inputJson = JSON.stringify(input);

  let resultJson: string;

  try {
    if (wasmModule!.generateTimetable) {
      // embind path (preferred)
      resultJson = wasmModule!.generateTimetable(inputJson);
    } else {
      // ccall path (C export fallback)
      resultJson = wasmModule!.ccall(
        'generateTimetable',
        'string',
        ['string'],
        [inputJson]
      );
    }
  } catch (err) {
    console.error('[Engine] WASM call failed:', err);
    return {
      success: false,
      status: 'ERROR',
      slots: [],
      conflict_log: [
        `WASM runtime error: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  // Parse the JSON result from C++
  try {
    const output = JSON.parse(resultJson) as SchedulerOutput;
    return output;
  } catch (err) {
    console.error('[Engine] Failed to parse WASM output:', resultJson);
    return {
      success: false,
      status: 'ERROR',
      slots: [],
      conflict_log: ['Failed to parse engine output. Raw: ' + resultJson],
    };
  }
}

/**
 * Maps slot_index (0-based) back to a human-readable time string.
 * Matches the start_time / end_time columns in timetable_slots.
 *
 * Slot layout (8 slots/day):
 *   0: 09:00–10:00
 *   1: 10:00–11:00
 *   2: 11:00–12:00
 *   3: 12:00–13:00
 *   4: 13:00–14:00  ← lunch (blocked by engine)
 *   5: 14:00–15:00
 *   6: 15:00–16:00
 *   7: 16:00–17:00
 */
export function slotIndexToTime(index: number): {
  start_time: string;
  end_time: string;
} {
  const BASE_HOUR = 9;
  const start = BASE_HOUR + index;
  const end   = start + 1;
  const fmt   = (h: number) => `${String(h).padStart(2, '0')}:00:00`;
  return { start_time: fmt(start), end_time: fmt(end) };
}

/**
 * Day index (0-based from C++) → day name
 * Matches day_of_week column (1-indexed) in timetable_slots.
 */
export const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
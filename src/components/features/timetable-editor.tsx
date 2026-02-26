"use client";

import { useState, useEffect } from "react";
import TimetableGrid from "@/components/features/timetable-grid";
import TeacherScheduleGrid from "@/components/features/teacher-schedule-grid";
import { SwapConfirmDialog } from "@/components/features/swap-confirm-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { swapSlotsAction } from "@/app/(dashboard)/faculty/actions";
import { Loader2, Plus } from "lucide-react";

// Period index (0–5) → actual DB start_time/end_time
const PERIOD_TIMES: { start_time: string; end_time: string }[] = [
  { start_time: "09:00:00", end_time: "10:00:00" },
  { start_time: "10:00:00", end_time: "11:00:00" },
  { start_time: "11:15:00", end_time: "12:15:00" },
  { start_time: "12:15:00", end_time: "13:15:00" },
  { start_time: "14:00:00", end_time: "15:00:00" },
  { start_time: "15:00:00", end_time: "16:00:00" },
];

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

interface TeacherOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  code: string;
  title: string;
  semester?: number;
}

interface EditorProps {
  initialGrid: (SlotData | null)[][];
  departmentId: string;
  legend: { code: string; title: string; initials: string; faculty: string }[];
  onRefresh: () => void;
  institutionName: string;
  departmentName: string;
  tableTitle: string;
  semesterInfo: string;
  roomNo: string;
}

export default function TimetableEditor({
  initialGrid,
  departmentId,
  legend,
  onRefresh,
  institutionName,
  departmentName,
  tableTitle,
  semesterInfo,
  roomNo,
}: EditorProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(680);
  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    period: number;
    data: SlotData | null;
  } | null>(null);

  // Teachers list for the dropdown
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Subjects list for empty cell assignment
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [semesterPicker, setSemesterPicker] = useState<number | "all">("all");

  // Swap state
  const [swapSource, setSwapSource] = useState<{ day: number; slot: number; data: SlotData | null } | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ day: number; slot: number; data: SlotData | null } | null>(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const supabase = createClient();

  const isEmptySlot = !selectedCell?.data;

  // Fetch subjects for empty cell picker
  useEffect(() => {
    async function fetchSubjects() {
      if (!isEmptySlot || !isPanelOpen) return;
      setLoadingSubjects(true);

      const { data } = await supabase
        .from("subjects")
        .select("id, code, title, semester")
        .eq("department_id", departmentId)
        .order("semester")
        .order("code");

      setSubjects((data ?? []) as SubjectOption[]);
      setLoadingSubjects(false);
    }

    fetchSubjects();
  }, [isPanelOpen, isEmptySlot, departmentId]);

  // Fetch qualified teachers when a subject is selected (for filled or empty cells)
  useEffect(() => {
    async function fetchTeachers() {
      const subId = isEmptySlot ? selectedSubjectId : selectedCell?.data?.subjectId;
      if (!subId || !isPanelOpen) {
        setTeachers([]);
        return;
      }

      setLoadingTeachers(true);

      const { data } = await supabase
        .from("teachers")
        .select(`
          id,
          name,
          teacher_subject_assignments!inner(subject_id)
        `)
        .eq("department_id", departmentId)
        .eq("teacher_subject_assignments.subject_id", subId);

      setTeachers(
        (data ?? []).map((t: any) => ({ id: t.id, name: t.name }))
      );
      setLoadingTeachers(false);
      setSelectedTeacherId("");
    }

    fetchTeachers();
  }, [isPanelOpen, selectedCell?.data?.subjectId, selectedSubjectId, departmentId]);

  const handleCellClick = (day: number, period: number, data: SlotData | null) => {
    setSelectedCell({ day, period, data });
    setSelectedTeacherId("");
    setSelectedSubjectId("");
    setSubjectSearch("");
    setSemesterPicker("all");
    setIsPanelOpen(true);
  };

  const handleSwapSlots = (
    source: { day: number; slot: number; data: SlotData | null },
    target: { day: number; slot: number; data: SlotData | null }
  ) => {
    setSwapSource(source);
    setSwapTarget(target);
    setSwapDialogOpen(true);
  };

  const confirmSwap = async () => {
    if (!swapSource?.data?.slotId || !swapTarget) return;
    if (!swapTarget.data?.slotId) {
      toast.error("Cannot swap with an empty slot");
      setSwapDialogOpen(false);
      return;
    }

    setSwapping(true);
    const toastId = toast.loading("Swapping slots...");
    try {
      await swapSlotsAction(swapSource.data.slotId, swapTarget.data.slotId);
      toast.success("Slots swapped!", { id: toastId });
      setSwapDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to swap", { id: toastId, description: err.message });
    } finally {
      setSwapping(false);
    }
  };

  const cancelSwap = () => {
    setSwapDialogOpen(false);
    setSwapSource(null);
    setSwapTarget(null);
  };

  // Assign teacher to existing slot (filled cell)
  const handleAssignTeacher = async () => {
    if (!selectedCell?.data?.slotId || !selectedTeacherId) return;

    const toastId = toast.loading("Assigning teacher to slot...");
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .update({
          teacher_id: selectedTeacherId,
          is_locked: true,
          metadata: { manually_assigned: true },
        })
        .eq("id", selectedCell.data.slotId);

      if (error) throw error;

      toast.success("Teacher Assigned & Slot Locked!", { id: toastId });
      setIsPanelOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to assign teacher", {
        id: toastId,
        description: err.message,
      });
    }
  };

  // Unlock a locked slot so it can be cleared
  const handleUnlockSlot = async () => {
    if (!selectedCell?.data?.slotId) return;

    const toastId = toast.loading("Unlocking slot...");
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .update({ is_locked: false })
        .eq("id", selectedCell.data.slotId);

      if (error) throw error;

      toast.success("Slot unlocked! It will be removed on next Clear.", { id: toastId });
      setIsPanelOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to unlock slot", {
        id: toastId,
        description: err.message,
      });
    }
  };

  // Place subject + teacher in empty slot (new row)
  const handlePlaceInEmptySlot = async () => {
    if (!selectedCell || !selectedSubjectId || !selectedTeacherId) return;

    const period = PERIOD_TIMES[selectedCell.period];
    if (!period) {
      toast.error("Invalid period index");
      return;
    }

    const toastId = toast.loading("Placing subject in slot...");
    try {
      const { error } = await supabase.from("timetable_slots").insert({
        department_id: departmentId,
        teacher_id: selectedTeacherId,
        subject_id: selectedSubjectId,
        room_id: null,
        day_of_week: selectedCell.day,
        start_time: period.start_time,
        end_time: period.end_time,
        slot_status: "scheduled",
        is_locked: true,
        is_lab: false,
        is_double_start: false,
        metadata: { manually_placed: true },
      });

      if (error) throw error;

      toast.success("Subject placed & locked!", { id: toastId });
      setIsPanelOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to place subject", {
        id: toastId,
        description: err.message,
      });
    }
  };

  const DAYS_DISPLAY = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Filter subjects by semester and search text
  const filteredSubjects = subjects.filter(
    (s) =>
      (semesterPicker === "all" || s.semester === semesterPicker) &&
      (s.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.title.toLowerCase().includes(subjectSearch.toLowerCase()))
  );

  return (
    <div className="relative">
      <TimetableGrid
        grid={initialGrid}
        subjectLegend={legend}
        institutionName={institutionName}
        departmentName={departmentName}
        tableTitle={tableTitle}
        semesterInfo={semesterInfo}
        roomNo={roomNo}
        onCellClick={handleCellClick}
        onSwapSlots={handleSwapSlots}
      />

      {/* Swap Confirmation Dialog */}
      <SwapConfirmDialog
        isOpen={swapDialogOpen}
        source={swapSource}
        target={swapTarget}
        onConfirm={confirmSwap}
        onCancel={cancelSwap}
        loading={swapping}
      />

      {/* Editor Sheet Panel */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent
          className="overflow-y-auto bg-[#FFFDF5] p-0"
          style={{ width: panelWidth, maxWidth: '90vw', minWidth: 400 }}
        >
          {/* Resize drag handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startW = panelWidth;
              const onMove = (ev: MouseEvent) => {
                const delta = startX - ev.clientX;
                setPanelWidth(Math.max(400, Math.min(900, startW + delta)));
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
              };
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
              cursor: 'col-resize', zIndex: 50,
              background: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C8C0A8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          />
          <div className="p-6">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-xl font-serif text-[#2D3436]">
                {isEmptySlot ? "Place Subject" : "Edit Slot"}
              </SheetTitle>
              <SheetDescription>
                {selectedCell && (
                  <span className="font-mono text-xs uppercase tracking-wider text-[#FF7675]">
                    {DAYS_DISPLAY[selectedCell.day - 1]} • Period{" "}
                    {selectedCell.period + 1}
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            {selectedCell && (
              <div className="space-y-5">

                {/* ── EMPTY SLOT: Subject Picker ── */}
                {isEmptySlot ? (
                  <div className="space-y-4">
                    {/* Subject Search & Selection */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-xs text-stone-500 uppercase flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Choose Subject
                      </h3>

                      {loadingSubjects ? (
                        <div className="flex items-center gap-2 p-3 text-stone-500 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading subjects...
                        </div>
                      ) : (
                        <>
                          {/* Semester filter pills */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">Sem</span>
                            {["all" as const, ...([...new Set(subjects.map(s => s.semester).filter(Boolean))].sort((a, b) => (a as number) - (b as number)))].map(s => (
                              <button
                                key={String(s)}
                                onClick={() => setSemesterPicker(s === "all" ? "all" : s as number)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${semesterPicker === s
                                  ? "bg-[#2D3436] text-white border-[#2D3436]"
                                  : "bg-white text-stone-500 border-stone-300 hover:border-stone-400"
                                  }`}
                              >
                                {s === "all" ? "All" : s}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Search by code or title..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:border-[#4834D4] placeholder:text-stone-400"
                          />
                          <div className="max-h-[180px] overflow-y-auto border border-stone-200 rounded bg-white">
                            {filteredSubjects.length === 0 ? (
                              <p className="text-sm text-stone-400 p-3 text-center">No subjects found</p>
                            ) : (
                              filteredSubjects.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => setSelectedSubjectId(s.id === selectedSubjectId ? "" : s.id)}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b border-stone-100 last:border-b-0 ${selectedSubjectId === s.id
                                    ? "bg-[#4834D4]/10 text-[#4834D4]"
                                    : "hover:bg-stone-50 text-[#2D3436]"
                                    }`}
                                >
                                  <span className="font-mono text-xs font-bold min-w-[100px]">{s.code}</span>
                                  <span className="truncate">{s.title}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Teacher Selection (appears after subject is chosen) */}
                    {selectedSubjectId && (
                      <div className="space-y-2">
                        <h3 className="font-bold text-xs text-stone-500 uppercase">
                          Select Faculty
                        </h3>
                        {loadingTeachers ? (
                          <div className="flex items-center gap-2 p-3 text-stone-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading teachers...
                          </div>
                        ) : teachers.length === 0 ? (
                          <p className="text-sm text-stone-400 p-3 bg-stone-50 rounded border border-stone-200">
                            No teachers assigned to this subject yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {teachers.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setSelectedTeacherId(t.id === selectedTeacherId ? "" : t.id)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-all border ${selectedTeacherId === t.id
                                  ? "bg-[#4834D4] text-white border-[#4834D4]"
                                  : "bg-white text-[#2D3436] border-stone-300 hover:border-[#4834D4] hover:text-[#4834D4]"
                                  }`}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher Schedule Grid + Confirm */}
                    {selectedTeacherId && selectedTeacher && (
                      <div className="space-y-2">
                        <TeacherScheduleGrid
                          teacherId={selectedTeacherId}
                          teacherName={selectedTeacher.name}
                          highlightDay={selectedCell.day}
                          highlightPeriod={selectedCell.period}
                        />
                        <button
                          onClick={handlePlaceInEmptySlot}
                          className="w-full py-2.5 bg-[#27AE60] hover:bg-[#27AE60]/90 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Place {subjects.find((s) => s.id === selectedSubjectId)?.code} here
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── FILLED SLOT: Existing flow ── */
                  <>
                    {/* Current Subject Info */}
                    <div className="p-3 border border-[#2D3436] bg-white rounded-sm">
                      <h3 className="font-bold text-xs text-stone-500 uppercase mb-1">
                        Current Subject
                      </h3>
                      <p className="text-lg font-bold text-[#2D3436]">
                        {selectedCell.data?.code || "—"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {selectedCell.data?.isLocked && (
                          <span className="inline-flex items-center text-xs font-bold text-[#2D3436] bg-stone-100 px-2 py-0.5">
                            🔒 Locked
                          </span>
                        )}
                        {selectedCell.data?.isLab && (
                          <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5">
                            🧪 Lab
                          </span>
                        )}
                      </div>
                      {selectedCell.data?.isLocked && (
                        <button
                          onClick={handleUnlockSlot}
                          className="mt-2 w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-300 transition-colors"
                        >
                          🔓 Unlock this slot
                        </button>
                      )}
                    </div>

                    {/* Teacher Selector */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-xs text-stone-500 uppercase">
                        Select Faculty
                      </h3>
                      {loadingTeachers ? (
                        <div className="flex items-center gap-2 p-3 text-stone-500 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading teachers...
                        </div>
                      ) : teachers.length === 0 ? (
                        <p className="text-sm text-stone-400 p-3 bg-stone-50 rounded border border-stone-200">
                          No qualified teachers found.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teachers.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTeacherId(t.id === selectedTeacherId ? "" : t.id)}
                              className={`px-3 py-1.5 rounded text-sm font-medium transition-all border ${selectedTeacherId === t.id
                                ? "bg-[#4834D4] text-white border-[#4834D4]"
                                : "bg-white text-[#2D3436] border-stone-300 hover:border-[#4834D4] hover:text-[#4834D4]"
                                }`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Teacher Schedule Grid + Confirm */}
                    {selectedTeacherId && selectedTeacher && (
                      <div className="space-y-2">
                        <TeacherScheduleGrid
                          teacherId={selectedTeacherId}
                          teacherName={selectedTeacher.name}
                          highlightDay={selectedCell.day}
                          highlightPeriod={selectedCell.period}
                          onSelectSlot={handleAssignTeacher}
                        />
                        <button
                          onClick={handleAssignTeacher}
                          className="w-full py-2 bg-[#4834D4] hover:bg-[#4834D4]/90 text-white text-sm font-bold rounded transition-colors"
                        >
                          Assign {selectedTeacher.name} to this slot
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
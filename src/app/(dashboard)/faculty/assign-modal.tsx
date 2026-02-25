"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { assignSubjectAction } from "./actions"

interface AssignModalProps {
  teacher: { id: string; name: string } | null
  subjects: { id: string; code: string; title: string; semester?: number }[]
  isOpen: boolean
  onClose: () => void
}

export function AssignModal({ teacher, subjects, isOpen, onClose }: AssignModalProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [semesterFilter, setSemesterFilter] = React.useState<number | "all">("all")
  const [selectedSection, setSelectedSection] = React.useState<string>("A")

  const selectedSubject = subjects.find((s) => s.id === selectedId)

  // Get unique semesters from subjects
  const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort() as number[]

  // Filter subjects by semester
  const filteredSubjects = semesterFilter === "all"
    ? subjects
    : subjects.filter(s => s.semester === semesterFilter)

  const handleAssign = async () => {
    if (!teacher || !selectedId) return
    setLoading(true)
    await assignSubjectAction(teacher.id, selectedId, selectedSection)
    setLoading(false)
    setSelectedId("")
    setSemesterFilter("all")
    setSelectedSection("A")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#FFFDF5]">
        <DialogHeader>
          <DialogTitle className="text-[#2D3436]">Assign Subject to {teacher?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          {/* Section Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
              Section
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['A', 'B', 'C', 'D'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${selectedSection === sec
                    ? "bg-[#2D3436] text-white border-[#2D3436]"
                    : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                    }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
              Semester
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setSemesterFilter("all"); setSelectedId(""); }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${semesterFilter === "all"
                  ? "bg-[#2D3436] text-white border-[#2D3436]"
                  : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                  }`}
              >
                All
              </button>
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => { setSemesterFilter(sem); setSelectedId(""); }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${semesterFilter === sem
                    ? "bg-[#2D3436] text-white border-[#2D3436]"
                    : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                    }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Combobox */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white border-[#2D3436]/10"
              >
                {selectedSubject
                  ? `${selectedSubject.code} — ${selectedSubject.title}`
                  : "Search by code or title..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0">
              <Command>
                <CommandInput placeholder="Type code or title to filter..." />
                <CommandList>
                  <CommandEmpty>No subject found.</CommandEmpty>
                  <CommandGroup heading={
                    semesterFilter === "all"
                      ? `All Subjects (${filteredSubjects.length})`
                      : `Semester ${semesterFilter} (${filteredSubjects.length})`
                  }>
                    {filteredSubjects.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.code} ${s.title}`}
                        onSelect={() => {
                          setSelectedId(s.id === selectedId ? "" : s.id)
                          setOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedId === s.id ? "opacity-100" : "opacity-0")} />
                        <span className="font-mono text-xs font-bold mr-2">{s.code}</span>
                        <span className="text-sm truncate">{s.title}</span>
                        {s.semester && (
                          <span className="ml-auto text-[10px] text-stone-400 font-medium">
                            S{s.semester}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleAssign}
            disabled={!selectedId || loading}
            className="bg-[#4834D4] hover:bg-[#4834D4]/90 text-white"
          >
            {loading ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
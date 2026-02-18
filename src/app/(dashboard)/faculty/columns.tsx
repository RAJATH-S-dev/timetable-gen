"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, Trash2, X } from "lucide-react"
import { Teacher } from "@/lib/engine/solver-bridge"
import { updateTeacherAction, deleteTeacherAction, removeAssignmentAction } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "name",
    header: "Teacher Name",
    cell: ({ row }) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, color: '#2D3436', fontSize: 13 }}>{row.original.name}</span>
        <span style={{ fontSize: 10, color: '#B0A898', fontFamily: "'Courier New', monospace" }}>{row.original.id.slice(0, 8)}</span>
      </div>
    ),
  },
  {
    accessorKey: "is_available",
    header: "Status",
    cell: ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch
          checked={row.getValue("is_available")}
          onCheckedChange={(checked) =>
            updateTeacherAction(row.original.id, { is_available: checked })
          }
        />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: row.getValue("is_available") ? '#27AE60' : '#C0392B',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {row.getValue("is_available") ? "Active" : "On Leave"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "max_daily_slots",
    header: "Daily Cap",
    cell: ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          min={1}
          max={8}
          defaultValue={row.getValue("max_daily_slots")}
          style={{
            width: 48,
            padding: '4px 8px',
            fontSize: 12,
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            background: '#FFFDF5',
            border: '1px solid #E2D9C5',
            borderRadius: 3,
            color: '#2D3436',
            textAlign: 'center',
            outline: 'none',
          }}
          onBlur={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
              updateTeacherAction(row.original.id, { max_daily_slots: val });
            }
          }}
        />
        <span style={{ fontSize: 10, color: '#8B7D6B' }}>slots/day</span>
      </div>
    ),
  },
  {
    id: "subjects",
    header: "Assignments",
    cell: ({ row }) => {
      const assignments = (row.original as any).assignments || [];

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 320 }}>
          {assignments.length > 0 ? (
            assignments.map((a: any) => (
              <AlertDialog key={a.subject.id}>
                <AlertDialogTrigger asChild>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors group"
                    style={{
                      background: '#F0EBE0',
                      color: '#2D3436',
                      border: '1px solid #C8C0A8',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "'Courier New', monospace",
                      padding: '2px 8px',
                      borderRadius: 3,
                    }}
                  >
                    {a.subject.code}
                    <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#FFFDF5]" style={{ fontFamily: "'Georgia', serif" }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: '#2D3436' }}>Remove Assignment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove <strong>{a.subject.code}</strong> from <strong>{row.original.name}</strong>?
                      This won&apos;t delete the teacher or the subject, only the assignment link.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ border: '1px solid #C8C0A8' }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      style={{ background: '#C0392B', color: 'white' }}
                      onClick={() => removeAssignmentAction(row.original.id, a.subject.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))
          ) : (
            <span style={{ fontSize: 11, color: '#B0A898', fontStyle: 'italic' }}>No subjects assigned</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Manage",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onAssign: (teacher: Teacher) => void;
        onEdit: (teacher: Teacher) => void;
      };

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Assign Subject */}
          <button
            onClick={() => meta?.onAssign(row.original)}
            title="Assign subject"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', borderRadius: 3,
              color: '#2D3436', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F0EBE0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <UserPlus size={15} />
          </button>

          {/* Edit Teacher */}
          <button
            onClick={() => meta?.onEdit(row.original)}
            title="Edit teacher"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', borderRadius: 3,
              color: '#8B7D6B', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F0EBE0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Pencil size={15} />
          </button>

          {/* Delete Teacher */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                title="Delete teacher"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: 3,
                  color: '#C0392B', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF0EF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={15} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#FFFDF5]" style={{ fontFamily: "'Georgia', serif" }}>
              <AlertDialogHeader>
                <AlertDialogTitle style={{ color: '#2D3436' }}>Delete Teacher</AlertDialogTitle>
                <AlertDialogDescription>
                  Permanently delete <strong>{row.original.name}</strong>?
                  This will also remove all their subject assignments and timetable slots.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel style={{ border: '1px solid #C8C0A8' }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  style={{ background: '#C0392B', color: 'white' }}
                  onClick={() => deleteTeacherAction(row.original.id)}
                >
                  Delete Teacher
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
]
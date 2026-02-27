"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { AssignModal } from "./assign-modal";
import { EditTeacherDialog } from "./edit-teacher-dialog";
import TeacherMatrix from "./teacher-matrix";
import { columns } from "./columns";
import { LayoutGrid, Table, Plus } from "lucide-react";
import { addTeacherAction } from "./actions";

interface Subject {
  id: string;
  code: string;
  title: string;
  semester?: number;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  is_available: boolean;
  max_daily_slots: number;
  assignments: { subject: Subject }[];
}

interface FacultyClientProps {
  faculty: Teacher[];
  subjects: Subject[];
}

export default function FacultyClient({ faculty, subjects }: FacultyClientProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addMaxSlots, setAddMaxSlots] = useState(4);
  const [addSaving, setAddSaving] = useState(false);

  const handleAssign = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setAssignModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditDialogOpen(true);
  };

  const handleCloseAssign = () => {
    setAssignModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedTeacher(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button
          onClick={() => setAddOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            border: "1.5px solid #27AE60", borderRadius: 4, cursor: "pointer",
            background: addOpen ? "#27AE60" : "transparent",
            color: addOpen ? "#FFFDF5" : "#27AE60",
            transition: "all 0.15s",
            fontFamily: "'Georgia', serif",
          }}
        >
          <Plus size={14} />
          Add Faculty
        </button>
        <button
          onClick={() => setShowMatrix((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            border: "1.5px solid #2D3436", borderRadius: 4, cursor: "pointer",
            background: showMatrix ? "#2D3436" : "transparent",
            color: showMatrix ? "#FFFDF5" : "#2D3436",
            transition: "all 0.15s",
            fontFamily: "'Georgia', serif",
          }}
        >
          {showMatrix ? <Table size={14} /> : <LayoutGrid size={14} />}
          {showMatrix ? "View Table" : "View Matrix"}
        </button>
      </div>

      {addOpen && (
        <div style={{
          background: "#FFFDF5", border: "1.5px solid #C8C0A8", borderRadius: 4,
          padding: "16px 20px", marginBottom: 16, fontFamily: "'Georgia', serif",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8B7D6B", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>New Faculty Member</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>NAME *</label>
              <input
                value={addName} onChange={e => setAddName(e.target.value)}
                placeholder="Dr. John Doe"
                style={{ width: "100%", border: "1px solid #C8C0A8", borderRadius: 3, padding: "6px 8px", fontSize: 12, fontFamily: "'Georgia', serif", background: "#FFFDF5", color: "#2D3436" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>EMAIL *</label>
              <input
                value={addEmail} onChange={e => setAddEmail(e.target.value)}
                placeholder="john@mit.edu"
                style={{ width: "100%", border: "1px solid #C8C0A8", borderRadius: 3, padding: "6px 8px", fontSize: 12, fontFamily: "'Georgia', serif", background: "#FFFDF5", color: "#2D3436" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#8B7D6B", display: "block", marginBottom: 4 }}>MAX SLOTS/DAY</label>
              <input
                type="number" min={1} max={6}
                value={addMaxSlots} onChange={e => setAddMaxSlots(Number(e.target.value))}
                style={{ width: "100%", border: "1px solid #C8C0A8", borderRadius: 3, padding: "6px 8px", fontSize: 12, fontFamily: "'Georgia', serif", background: "#FFFDF5", color: "#2D3436" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              disabled={addSaving || !addName.trim() || !addEmail.trim()}
              onClick={async () => {
                setAddSaving(true);
                try {
                  await addTeacherAction({ name: addName.trim(), email: addEmail.trim(), max_daily_slots: addMaxSlots });
                  setAddName(''); setAddEmail(''); setAddMaxSlots(4); setAddOpen(false);
                  window.location.reload();
                } catch (err) {
                  alert('Failed to add teacher: ' + (err instanceof Error ? err.message : 'Unknown error'));
                } finally {
                  setAddSaving(false);
                }
              }}
              style={{
                padding: "7px 20px", fontSize: 12, fontWeight: 700, borderRadius: 4, border: "none",
                background: (!addName.trim() || !addEmail.trim()) ? "#C8C0A8" : "#27AE60",
                color: "#FFFDF5", cursor: (!addName.trim() || !addEmail.trim()) ? "not-allowed" : "pointer",
                fontFamily: "'Georgia', serif",
              }}
            >
              {addSaving ? "Saving…" : "✓ Add Faculty"}
            </button>
            <button
              onClick={() => { setAddOpen(false); setAddName(''); setAddEmail(''); }}
              style={{
                padding: "7px 14px", fontSize: 12, fontWeight: 600, borderRadius: 4,
                border: "1px solid #C8C0A8", background: "transparent", color: "#8B7D6B",
                cursor: "pointer", fontFamily: "'Georgia', serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showMatrix ? (
        <TeacherMatrix teachers={faculty} subjects={subjects} />
      ) : (
        <DataTable
          columns={columns}
          data={faculty}
          meta={{ onAssign: handleAssign, onEdit: handleEdit }}
        />
      )}

      <AssignModal
        teacher={selectedTeacher}
        subjects={subjects}
        isOpen={assignModalOpen}
        onClose={handleCloseAssign}
      />
      <EditTeacherDialog
        teacher={selectedTeacher}
        isOpen={editDialogOpen}
        onClose={handleCloseEdit}
      />
    </>
  );
}

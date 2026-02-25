"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { AssignModal } from "./assign-modal";
import { EditTeacherDialog } from "./edit-teacher-dialog";
import TeacherMatrix from "./teacher-matrix";
import { columns } from "./columns";
import { LayoutGrid, Table } from "lucide-react";

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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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

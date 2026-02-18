"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { AssignModal } from "./assign-modal";
import { EditTeacherDialog } from "./edit-teacher-dialog";
import { columns } from "./columns";

interface Subject {
  id: string;
  code: string;
  title: string;
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
      <DataTable
        columns={columns}
        data={faculty}
        meta={{ onAssign: handleAssign, onEdit: handleEdit }}
      />
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
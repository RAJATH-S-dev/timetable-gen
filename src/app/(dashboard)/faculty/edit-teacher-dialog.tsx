"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateTeacherAction } from "./actions"

interface EditTeacherDialogProps {
  teacher: { id: string; name: string; email?: string } | null
  isOpen: boolean
  onClose: () => void
}

export function EditTeacherDialog({ teacher, isOpen, onClose }: EditTeacherDialogProps) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (teacher) {
      setName(teacher.name)
      setEmail(teacher.email ?? "")
    }
  }, [teacher])

  const handleSave = async () => {
    if (!teacher || !name.trim()) return
    setLoading(true)
    try {
      await updateTeacherAction(teacher.id, {
        name: name.trim(),
        ...(email.trim() && { email: email.trim() }),
      })
      onClose()
    } catch {
      // Error handling via revalidation
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-[#FFFDF5]">
        <DialogHeader>
          <DialogTitle className="text-[#2D3436]">Edit Teacher</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="teacher-name" className="text-sm font-medium text-stone-600">Name</Label>
            <Input
              id="teacher-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-[#2D3436]/10 focus:ring-[#4834D4]"
              placeholder="Dr. Teacher Name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="teacher-email" className="text-sm font-medium text-stone-600">Email</Label>
            <Input
              id="teacher-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-[#2D3436]/10 focus:ring-[#4834D4]"
              placeholder="teacher@mitmysore.in"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-stone-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="bg-[#4834D4] hover:bg-[#4834D4]/90 text-white"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

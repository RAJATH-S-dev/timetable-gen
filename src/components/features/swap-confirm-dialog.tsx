"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SlotInfo {
  day: number;
  slot: number;
  data: { code: string; isLab?: boolean } | null;
}

interface SwapConfirmDialogProps {
  isOpen: boolean;
  source: SlotInfo | null;
  target: SlotInfo | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1 (9-10)", "P2 (10-11)", "P3 (11:15-12:15)", "P4 (12:15-1:15)", "P5 (2-3)", "P6 (3-4)"];

export function SwapConfirmDialog({
  isOpen,
  source,
  target,
  onConfirm,
  onCancel,
  loading,
}: SwapConfirmDialogProps) {
  if (!source || !target) return null;

  const srcLabel = source.data?.code || "Empty";
  const tgtLabel = target.data?.code || "Empty";
  const srcPos = `${DAYS[source.day]} ${PERIODS[source.slot] || "P" + (source.slot + 1)}`;
  const tgtPos = `${DAYS[target.day]} ${PERIODS[target.slot] || "P" + (target.slot + 1)}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="bg-[#FFFDF5]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#2D3436]">Swap Slots</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to swap these slots?</p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-3 bg-white rounded-md border border-stone-200">
                <div className="text-center">
                  <div className="text-xs text-stone-500">{srcPos}</div>
                  <div className="text-sm font-bold text-[#2D3436] font-mono mt-1">{srcLabel}</div>
                  {source.data?.isLab && <span className="text-xs text-blue-600">🧪 Lab</span>}
                </div>
                <div className="text-lg text-stone-400">⇄</div>
                <div className="text-center">
                  <div className="text-xs text-stone-500">{tgtPos}</div>
                  <div className="text-sm font-bold text-[#2D3436] font-mono mt-1">{tgtLabel}</div>
                  {target.data?.isLab && <span className="text-xs text-blue-600">🧪 Lab</span>}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-stone-300" onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-[#4834D4] hover:bg-[#4834D4]/90 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Swapping..." : "Swap"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

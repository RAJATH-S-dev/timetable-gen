'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReviewTable } from "@/components/features/review-table" // Ensure kebab-case here too
import { upsertTeacherData } from '@/lib/supabase/actions'

export default function FileUploadModal({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (o: boolean) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/extract-data?data_type=teachers', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      // Extract the relevant array from the Python response
      setPreviewData(result.data || []) 
    } catch (err) {
      console.error("Ingestion Failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  // The new logic to save reviewed data to Supabase
  const handleFinalImport = async () => {
    if (!previewData) return
    try {
      setIsUploading(true)
      await upsertTeacherData(previewData) // Sends to Supabase with RLS context
      setIsOpen(false)
      setPreviewData(null) // Reset for next use
    } catch (err) {
      console.error("Save failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-cream border-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-2xl">Bulk Data Ingestion</DialogTitle>
        </DialogHeader>
        
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          {!isUploading && !previewData && (
            <div className="text-center space-y-4">
              <input type="file" onChange={handleFileDrop} className="hidden" id="file-input" />
              <label htmlFor="file-input" className="cursor-pointer block p-10">
                <p className="text-charcoal font-medium">Drop PDF or CSV here to extract faculty details</p>
                <p className="text-gray-400 text-sm mt-2">Maximum file size: 10MB</p>
              </label>
            </div>
          )}

          {isUploading && (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-4 border-[#4834D4] border-t-transparent rounded-full"
              />
              <p className="text-charcoal font-medium">Processing Data Bridge...</p>
            </div>
          )}

          {previewData && !isUploading && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-charcoal">Review Extracted Faculty</h3>
                <Button variant="ghost" onClick={() => setPreviewData(null)}>Clear</Button>
              </div>
              
              {/* This is where the admin alters the data per requirements */}
              <ReviewTable data={previewData} setData={setPreviewData} /> 
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleFinalImport} className="bg-[#4834D4] text-white px-8">
                  Confirm & Import to ISE Dept
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'
import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import FileUploadModal from '@/components/features/file-upload-modal'

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <header style={{
      height: 56,
      background: '#FFFDF5',
      borderBottom: '1.5px solid #E2D9C5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Search */}
      <div style={{ position: 'relative', width: 320 }}>
        <Search
          size={15}
          style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#B0A898',
          }}
        />
        <input
          type="text"
          placeholder="Search faculty or schedules..."
          style={{
            width: '100%',
            background: '#F0EBE0',
            border: '1px solid #E2D9C5',
            borderRadius: 4,
            padding: '7px 12px 7px 32px',
            fontSize: 12,
            fontFamily: "'Georgia', serif",
            color: '#2D3436',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Bulk Ingest */}
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px',
            background: '#2D3436', border: 'none', borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: '#FFFDF5',
            cursor: 'pointer', fontFamily: "'Georgia', serif",
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#3D4D4F'}
          onMouseLeave={e => e.currentTarget.style.background = '#2D3436'}
        >
          <Plus size={14} />
          Bulk Ingest
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#E2D9C5' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2D3436', margin: 0 }}>ISE Admin</p>
            <p style={{ fontSize: 10, color: '#8B7D6B', margin: 0 }}>MIT Mysore</p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: '#F0EBE0', border: '1px solid #E2D9C5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#2D3436',
            fontFamily: "'Courier New', monospace",
          }}>IS</div>
        </div>
      </div>

      <FileUploadModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </header>
  )
}
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, LogOut } from 'lucide-react'
import FileUploadModal from '@/components/features/file-upload-modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { signOutAdmin } from '@/lib/supabase/actions'

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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
        <Popover>
          <PopoverTrigger asChild>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left'
            }}>
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
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" style={{ width: 140, padding: 4 }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px',
                fontSize: 12, color: '#C0392B', fontWeight: 600,
                background: 'none', border: 'none', borderRadius: 4,
                cursor: 'pointer', fontFamily: "'Georgia', serif",
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <FileUploadModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </header>
  )
}
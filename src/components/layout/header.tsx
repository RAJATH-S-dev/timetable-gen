'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, KeyRound } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { signOutAdmin, changePassword } from '@/lib/supabase/actions'

export function Header() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const allPages = [
    { label: 'Dashboard', desc: 'Department overview & stats', href: '/dashboard', icon: '📊', keywords: 'dashboard overview home stats' },
    { label: 'Faculty Registry', desc: 'Manage teachers & assignments', href: '/faculty', icon: '👥', keywords: 'faculty teacher registry assign' },
    { label: 'Subject Registry', desc: 'Subjects, credits, semesters', href: '/subjects', icon: '📚', keywords: 'subject course credit semester' },
    { label: 'Timetable', desc: 'Generate & edit schedules', href: '/timetable', icon: '📅', keywords: 'timetable schedule generate solver' },
  ]

  const searchResults = searchQuery.length > 0
    ? allPages.filter(p =>
      (p.label + ' ' + p.keywords).toLowerCase().includes(searchQuery.toLowerCase())
    )
    : []

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleChangePassword = async () => {
    setPwMessage(null)
    if (newPassword.length < 6) {
      setPwMessage({ type: 'err', text: 'Password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'err', text: 'Passwords do not match' })
      return
    }
    setPwLoading(true)
    try {
      await changePassword(newPassword)
      setPwMessage({ type: 'ok', text: 'Password changed successfully!' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setShowChangePassword(false); setPwMessage(null) }, 1500)
    } catch (err: any) {
      setPwMessage({ type: 'err', text: err?.message || 'Failed to change password' })
    } finally {
      setPwLoading(false)
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
            transform: 'translateY(-50%)', color: '#B0A898', zIndex: 1,
          }}
        />
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length > 0) {
              router.push(searchResults[0].href)
              setSearchQuery('')
            }
            if (e.key === 'Escape') {
              setSearchQuery('')
            }
          }}
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
        {searchQuery.length > 0 && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#FFFDF5', border: '1.5px solid #E2D9C5', borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden',
          }}>
            {searchResults.map((r) => (
              <button
                key={r.href}
                onClick={() => { router.push(r.href); setSearchQuery('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', background: 'none',
                  border: 'none', borderBottom: '1px solid #F0EBE0',
                  cursor: 'pointer', textAlign: 'left', fontFamily: "'Georgia', serif",
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F0EBE0'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 16 }}>{r.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2D3436', margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 10, color: '#8B7D6B', margin: 0 }}>{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* User */}
        <Popover onOpenChange={(open) => { if (!open) { setShowChangePassword(false); setPwMessage(null) } }}>
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
          <PopoverContent align="end" style={{ width: showChangePassword ? 260 : 180, padding: 4 }}>
            {showChangePassword ? (
              <div style={{ padding: '8px 8px 4px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#2D3436', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Change Password
                </p>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', fontSize: 12,
                    border: '1.5px solid #E2D9C5', borderRadius: 4,
                    background: '#FFFDF5', color: '#2D3436', outline: 'none',
                    marginBottom: 6, fontFamily: "'Georgia', serif",
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', fontSize: 12,
                    border: '1.5px solid #E2D9C5', borderRadius: 4,
                    background: '#FFFDF5', color: '#2D3436', outline: 'none',
                    marginBottom: 8, fontFamily: "'Georgia', serif",
                  }}
                />
                {pwMessage && (
                  <p style={{
                    fontSize: 11, fontWeight: 600, margin: '0 0 8px',
                    color: pwMessage.type === 'ok' ? '#27AE60' : '#C0392B',
                  }}>
                    {pwMessage.text}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setShowChangePassword(false); setPwMessage(null) }}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
                      background: 'none', border: '1px solid #C8C0A8', borderRadius: 3,
                      cursor: 'pointer', color: '#8B7D6B', fontFamily: "'Georgia', serif",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
                      background: '#2D3436', border: 'none', borderRadius: 3,
                      cursor: pwLoading ? 'not-allowed' : 'pointer',
                      color: '#FFFDF5', fontFamily: "'Georgia', serif",
                    }}
                  >
                    {pwLoading ? 'Saving…' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 12px',
                    fontSize: 12, color: '#2D3436', fontWeight: 600,
                    background: 'none', border: 'none', borderRadius: 4,
                    cursor: 'pointer', fontFamily: "'Georgia', serif",
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0EBE0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <KeyRound size={14} />
                  Change Password
                </button>
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
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
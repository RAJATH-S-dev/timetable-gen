'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInAdmin } from '@/lib/supabase/actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signInAdmin(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    background: '#FFFDF5',
    border: '1.5px solid #E2D9C5',
    borderRadius: 4,
    color: '#2D3436',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#8B7D6B',
    display: 'block',
    marginBottom: 6,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0EBE0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      padding: 24,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: fadeIn 0.5s ease-out both; }
        .login-input:focus { border-color: #2D3436 !important; }
      `}</style>

      <div className="login-card" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo + Back */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#8B7D6B', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
            ← Back to Home
          </Link>
          <div style={{
            width: 48, height: 48,
            background: '#2D3436', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#FFFDF5',
            fontFamily: "'Courier New', monospace",
            margin: '16px auto 0',
          }}>T</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFDF5',
          border: '1.5px solid #C8C0A8',
          borderRadius: 6,
          padding: '36px 32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2D3436', margin: '0 0 6px' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 13, color: '#8B7D6B', margin: 0 }}>
              Sign in to manage your department timetable
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16, borderRadius: 4,
              background: '#FDF2F2', border: '1px solid #FADBD8',
              fontSize: 12, color: '#C0392B', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email Address</label>
              <input
                className="login-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mitmysore.in"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: '#8B7D6B', padding: 4,
                  }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: 14, fontWeight: 700,
                fontFamily: "'Georgia', serif",
                background: isLoading ? '#8B7D6B' : '#2D3436',
                color: '#FFFDF5',
                border: 'none', borderRadius: 4,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#3D4D4F'; }}
              onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#2D3436'; }}
            >
              {isLoading ? 'Signing In…' : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#8B7D6B', marginTop: 20 }}>
          Don&apos;t have access?{' '}
          <Link href="/register" style={{ color: '#2D3436', fontWeight: 700, textDecoration: 'none' }}>
            Register your department
          </Link>
        </p>
      </div>
    </div>
  )
}
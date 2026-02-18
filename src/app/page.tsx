"use client";

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#F0EBE0',
      color: '#2D3436',
      fontFamily: "'Georgia', serif",
    }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-1 { animation: fadeInUp 0.6s ease-out 0.1s both; }
        .fade-2 { animation: fadeInUp 0.6s ease-out 0.25s both; }
        .fade-3 { animation: fadeInUp 0.6s ease-out 0.4s both; }
        .fade-4 { animation: fadeInUp 0.6s ease-out 0.55s both; }
        .fade-5 { animation: fadeInUp 0.6s ease-out 0.7s both; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: '#2D3436', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#FFFDF5',
            fontFamily: "'Courier New', monospace",
          }}>T</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
            TimeTableGen
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login">
            <button style={{
              padding: '7px 18px', fontSize: 12, fontWeight: 600,
              background: 'transparent', border: '1.5px solid #C8C0A8',
              borderRadius: 4, color: '#2D3436', cursor: 'pointer',
              fontFamily: "'Georgia', serif",
            }}>
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button style={{
              padding: '7px 18px', fontSize: 12, fontWeight: 700,
              background: '#2D3436', border: 'none',
              borderRadius: 4, color: '#FFFDF5', cursor: 'pointer',
              fontFamily: "'Georgia', serif",
            }}>
              Register
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 900, margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center',
      }}>
        <div className="fade-1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 3,
          background: '#FFFDF5', border: '1px solid #C8C0A8',
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          textTransform: 'uppercase', color: '#8B7D6B',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27AE60', display: 'inline-block' }} />
          Powered by Google OR-Tools
        </div>

        <h1 className="fade-2" style={{
          fontSize: 'clamp(32px, 5.5vw, 60px)',
          fontWeight: 700, lineHeight: 1.1, marginTop: 28,
          letterSpacing: -1.5, color: '#2D3436',
        }}>
          Automated Timetable<br />Generation System
        </h1>

        <p className="fade-3" style={{
          fontSize: 16, lineHeight: 1.8, color: '#8B7D6B',
          maxWidth: 520, margin: '20px auto 0',
        }}>
          Constraint-satisfaction solver that creates conflict-free
          academic schedules. Drag-and-drop editing, cross-department
          collision detection, and PDF export — all in one place.
        </p>

        <div className="fade-4" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
          <Link href="/login">
            <button style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 700,
              background: '#2D3436', border: 'none',
              borderRadius: 4, color: '#FFFDF5', cursor: 'pointer',
              fontFamily: "'Georgia', serif", letterSpacing: 0.5,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#3D4D4F'}
              onMouseLeave={e => e.currentTarget.style.background = '#2D3436'}
            >
              Open Dashboard →
            </button>
          </Link>
          <Link href="/register">
            <button style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 600,
              background: 'transparent', border: '1.5px solid #C8C0A8',
              borderRadius: 4, color: '#2D3436', cursor: 'pointer',
              fontFamily: "'Georgia', serif",
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#8B7D6B'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#C8C0A8'}
            >
              Register Department
            </button>
          </Link>
        </div>

        {/* Institution badge */}
        <div className="fade-5" style={{
          marginTop: 28,
          fontSize: 11, color: '#8B7D6B', fontWeight: 600,
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
          🏛 Maharaja Institute of Technology Mysore — ISE Department
        </div>
      </section>

      {/* ── Timetable Preview Card ── */}
      <section className="fade-5" style={{
        maxWidth: 800, margin: '20px auto 0', padding: '0 24px',
      }}>
        <div style={{
          background: '#FFFDF5', border: '1.5px solid #C8C0A8',
          borderRadius: 6, padding: 20, overflow: 'hidden',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: '#8B7D6B', marginBottom: 12,
          }}>
            Sample Output
          </div>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: 10,
            fontFamily: "'Courier New', monospace",
          }}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Mon</th>
                <th style={thStyle}>Tue</th>
                <th style={thStyle}>Wed</th>
                <th style={thStyle}>Thu</th>
                <th style={thStyle}>Fri</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['9:00', 'M23CS1', '', 'M23IS3', '', 'M23IS1'],
                ['10:00', '', 'M23CS2', 'M23IS1', 'M23CS1', ''],
                ['11:15', 'M23IS3', 'M23IS1', '', 'M23CS2', 'M23CS1'],
                ['12:15', '', '', 'M23CS1', '', ''],
              ].map((row, ri) => (
                <tr key={ri}>
                  <td style={{ ...tdStyle, background: '#F0EBE0', fontWeight: 700, color: '#8B7D6B' }}>{row[0]}</td>
                  {row.slice(1).map((cell, ci) => (
                    <td key={ci} style={{
                      ...tdStyle,
                      background: cell ? '#FFFDF5' : '#F8F3E8',
                      color: cell ? '#2D3436' : 'transparent',
                      fontWeight: cell ? 700 : 400,
                    }}>
                      {cell || '·'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section style={{
        maxWidth: 1000, margin: '0 auto', padding: '60px 24px 40px',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, color: '#8B7D6B', textAlign: 'center',
          marginBottom: 28,
        }}>Features</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {[
            { icon: '⚡', title: 'OR-Tools Solver', desc: 'CP-SAT constraint solver with compactness optimization generates optimal schedules in seconds.' },
            { icon: '🔀', title: 'Drag & Drop', desc: 'Swap slots, reassign teachers, and place subjects in empty periods directly on the grid.' },
            { icon: '🔍', title: 'Collision Detection', desc: 'Cross-department teacher conflict detection highlights double-bookings automatically.' },
            { icon: '📊', title: 'Teacher Schedule', desc: 'Full weekly schedule view per teacher with green/red availability grid for assignments.' },
            { icon: '👥', title: 'Faculty Management', desc: 'Complete CRUD for teachers and subject assignments with inline editing.' },
            { icon: '📄', title: 'PDF Export', desc: 'Download publication-ready timetable PDFs and upload to Google Drive.' },
          ].map(f => (
            <div key={f.title} style={{
              padding: '20px 22px', borderRadius: 6,
              background: '#FFFDF5', border: '1px solid #E2D9C5',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C8C0A8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2D9C5'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', margin: '8px 0 6px' }}>{f.title}</h3>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: '#8B7D6B', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '16px 24px 20px', textAlign: 'center' }}>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, color: '#8B7D6B', marginBottom: 14,
        }}>Built With</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Next.js 14', 'TypeScript', 'Google OR-Tools', 'Supabase', 'C++ Engine'].map(t => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 600, color: '#8B7D6B',
              padding: '4px 12px', borderRadius: 3,
              border: '1px solid #E2D9C5', background: '#FFFDF5',
              fontFamily: "'Courier New', monospace", letterSpacing: 0.5,
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #E2D9C5', textAlign: 'center',
        padding: '24px 24px', fontSize: 11, color: '#8B7D6B',
        marginTop: 40,
      }}>
        <div>Built for MITM ISE Department • v2.0</div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#B0A898' }}>
          Developed by{' '}
          <span style={{ fontWeight: 700, color: '#2D3436' }}>Rajath S</span>
          {' · '}
          <a
            href="mailto:rajaths543@gmail.com"
            style={{ color: '#8B7D6B', textDecoration: 'none', borderBottom: '1px dotted #C8C0A8' }}
          >
            rajaths543@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}

// Shared table styles
const thStyle: React.CSSProperties = {
  border: '1px solid #E2D9C5', padding: '6px 8px',
  background: '#F0EBE0', fontWeight: 700, color: '#2D3436',
  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #E2D9C5', padding: '8px 8px',
  textAlign: 'center', fontSize: 10,
};
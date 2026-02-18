"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Calendar, TableProperties } from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Faculty', href: '/faculty', icon: Users },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Schedule', href: '/workspace', icon: Calendar },
  { name: 'Timetable', href: '/timetable', icon: TableProperties },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      background: '#F0EBE0',
      borderRight: '1.5px solid #E2D9C5',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '4px 10px', marginBottom: 32,
      }}>
        <div style={{
          width: 30, height: 30,
          background: '#2D3436', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#FFFDF5',
          fontFamily: "'Courier New', monospace",
        }}>T</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#2D3436', letterSpacing: -0.3 }}>
          MITM ISE
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 4,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2D3436' : '#8B7D6B',
                background: isActive ? '#FFFDF5' : 'transparent',
                border: isActive ? '1px solid #E2D9C5' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Engine Status */}
      <div style={{
        padding: '12px 14px',
        background: '#FFFDF5',
        border: '1px solid #E2D9C5',
        borderRadius: 4,
      }}>
        <p style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1.5, color: '#8B7D6B', margin: '0 0 6px',
        }}>
          System Status
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#27AE60',
            boxShadow: '0 0 6px rgba(39,174,96,0.4)',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#2D3436' }}>Engine Ready</span>
        </div>
      </div>
    </aside>
  );
}
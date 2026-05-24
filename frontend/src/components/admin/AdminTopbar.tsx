'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const [notif] = useState(3);
  const [showMenu, setShowMenu] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header style={{
      position: 'fixed', top: 0, left: '260px', right: 0, zIndex: 40,
      height: '64px', background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 28px', gap: '8px',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* ── Theme Toggle ── */}
      <button
        onClick={() => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }}
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'transparent',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          transition: 'all 0.18s ease', color: 'var(--text-secondary)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        title="Changer de thème"
      >
        <i className="fas fa-moon" style={{ fontSize: '15px' }} />
      </button>

      {/* ── Bell ── */}
      <button
        style={{
          position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'transparent',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          transition: 'all 0.18s ease', color: 'var(--text-secondary)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <i className="far fa-bell" style={{ fontSize: '15px' }} />
        {notif > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '14px', height: '14px', borderRadius: '50%',
            background: 'var(--danger)', color: 'white',
            fontSize: '8px', fontWeight: 700,
            display: 'grid', placeItems: 'center',
            border: '2px solid var(--surface)',
          }}>{notif}</span>
        )}
      </button>

      {/* ── Separator ── */}
      <div style={{ width: '1px', height: '28px', background: '#e9eef6', margin: '0 4px' }} />

      {/* ── User ── */}
      <div
        style={{ position: 'relative' }}
        onMouseLeave={() => setShowMenu(false)}
      >
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 12px 6px 6px', border: '1px solid var(--border)',
            borderRadius: '50px', background: 'var(--surface)',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--purple))',
            display: 'grid', placeItems: 'center',
            fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ lineHeight: 1.3, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Administrateur'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</div>
          </div>
          {/* Chevron */}
          <i className="fas fa-chevron-down" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px' }} />
        </button>

        {/* Dropdown */}
        {showMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', boxShadow: 'var(--shadow-md)',
            minWidth: '180px', overflow: 'hidden', zIndex: 100,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Administrateur système</div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: 500, color: 'var(--danger)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <i className="fas fa-sign-out-alt" style={{ fontSize: '12px' }} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import { AdminPageId } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
  activePage: AdminPageId;
  onNavigate: (page: AdminPageId) => void;
}

const navItems: { id: AdminPageId; label: string; icon: string }[] = [
  { id: 'dashboard',       label: 'Tableau de bord',    icon: 'fa-th-large' },
  { id: 'inscriptions',    label: 'Inscriptions',        icon: 'fa-user-plus' },
  { id: 'adherents',       label: 'Adhérents',           icon: 'fa-users' },
  { id: 'cartes',          label: 'Cartes',              icon: 'fa-id-card' },
  { id: 'communications',  label: 'Communications',      icon: 'fa-paper-plane' },
  { id: 'documents',       label: 'Documents',           icon: 'fa-file-alt' },
  { id: 'evenements',      label: 'Événements',          icon: 'fa-calendar-alt' },
  { id: 'renouvellements', label: 'Renouvellements',     icon: 'fa-sync' },
];

export default function AdminSidebar({ activePage, onNavigate }: AdminSidebarProps) {
  const { logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: '260px', zIndex: 50,
      background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1740 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '0',
      overflowY: 'auto',
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          display: 'grid', placeItems: 'center',
          fontSize: '16px', fontWeight: 800, color: 'white',
          boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
        }}>A</div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
            Gestion Adhérents
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>
            Espace Administrateur
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 10px 6px' }}>
          Menu principal
        </div>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                cursor: 'pointer', marginBottom: '2px',
                fontFamily: 'inherit',
                fontSize: '13px', fontWeight: isActive ? 600 : 500,
                color: isActive ? 'white' : 'rgba(203,213,225,0.75)',
                background: isActive ? '#4F46E5' : 'transparent',
                boxShadow: isActive ? '0 4px 12px rgba(79,70,229,0.35)' : 'none',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.color = 'white'; }}}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(203,213,225,0.75)'; }}}
            >
              <i className={`fas ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '13px', flexShrink: 0 }} />
              {item.label}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '13px', fontWeight: 500,
            color: 'rgba(248,113,113,0.75)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLDivElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(248,113,113,0.75)'; }}
        >
          <i className="fas fa-sign-out-alt" style={{ width: '16px', textAlign: 'center', fontSize: '13px' }} />
          Déconnexion
        </div>
      </div>
    </aside>
  );
}

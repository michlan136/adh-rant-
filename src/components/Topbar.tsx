'use client';

import { PageId } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface TopbarProps {
  onNavigate: (page: PageId) => void;
}

export default function Topbar({ onNavigate }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-icon">GA</div>
        <div className="brand-text">
          <h1>Gestion Adhérents</h1>
          <p>Espace Personnel</p>
        </div>
      </div>
      <div className="topbar-right">
        <div className="notif-btn" onClick={() => onNavigate('notifications')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-badge">5</span>
        </div>
        <div className="user-chip">
          <div className="user-avatar">{user?.initials || 'JD'}</div>
          <div className="user-info">
            <div className="name">{user?.name || 'Jean Dupont'}</div>
            <div className="role">{user?.role === 'admin' ? 'Administrateur' : 'Personne Physique'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

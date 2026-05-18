'use client';

import { AdminPageId } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
  activePage: AdminPageId;
  onNavigate: (page: AdminPageId) => void;
}

const navItems: { id: AdminPageId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: <i className="fas fa-th-large" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'inscriptions',
    label: 'Inscriptions',
    icon: <i className="fas fa-user-plus" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'adherents',
    label: 'Adhérents',
    icon: <i className="fas fa-users" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'cartes',
    label: 'Cartes',
    icon: <i className="far fa-credit-card" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: <i className="fas fa-paper-plane" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <i className="far fa-file-alt" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'evenements',
    label: 'Événements',
    icon: <i className="fas fa-calendar-alt" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'renouvellements',
    label: 'Renouvellements',
    icon: <i className="fas fa-sync" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
  {
    id: 'finances' as AdminPageId,
    label: 'Finances',
    icon: <i className="fas fa-wallet" style={{width: 18, textAlign: 'center', fontSize: 15}}></i>,
  },
];

export default function AdminSidebar({ activePage, onNavigate }: AdminSidebarProps) {
  const { logout } = useAuth();

  return (
    <aside className="admin-sidebar sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">A</div>
        <div className="logo-text">
          <h2>Gestion Adhérents</h2>
          <span>Espace Administrateur</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon} {item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item logout" onClick={logout}>
          <i className="fas fa-sign-out-alt" style={{width: 18, textAlign: 'center', fontSize: 15}}></i> Déconnexion
        </div>
      </div>
    </aside>
  );
}

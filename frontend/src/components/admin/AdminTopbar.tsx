'use client';

import { useAuth } from '@/context/AuthContext';

export default function AdminTopbar() {
  const { user } = useAuth();

  return (
    <header className="header admin-header">
      <div className="header-bell">
        <i className="far fa-bell"></i>
        <span className="bell-dot"></span>
      </div>
      <div className="header-user">
        <div className="header-user-text">
          <div className="name">{user?.name || 'Admin Système'}</div>
          <div className="role">Administrateur</div>
        </div>
        <div className="header-avatar"><i className="fas fa-user"></i></div>
      </div>
    </header>
  );
}

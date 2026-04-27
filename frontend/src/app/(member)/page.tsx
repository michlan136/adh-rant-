'use client';

import { useState } from 'react';
import { PageId } from '@/types';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import DashboardPage from '@/components/pages/DashboardPage';
import CartePage from '@/components/pages/CartePage';
import DocumentsPage from '@/components/pages/DocumentsPage';
import EvenementsPage from '@/components/pages/EvenementsPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import RenouvellementPage from '@/components/pages/RenouvellementPage';
import HistoriquePage from '@/components/pages/HistoriquePage';

export default function Home() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':      return <DashboardPage onNavigate={setActivePage} />;
      case 'carte':          return <CartePage />;
      case 'documents':      return <DocumentsPage />;
      case 'evenements':     return <EvenementsPage />;
      case 'notifications':  return <NotificationsPage />;
      case 'renouvellement': return <RenouvellementPage />;
      case 'historique':     return <HistoriquePage />;
      default:               return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <>
      <Topbar onNavigate={setActivePage} />
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main">
        {renderPage()}
      </main>
    </>
  );
}

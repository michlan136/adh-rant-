'use client';

import { PageId } from '@/types';
import { useState, useEffect } from 'react';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

interface DashboardData {
  stats: {
    statut: string;
    expiration: string;
    events_count: number;
    docs_count: number;
    messages_count: number;
  };
  activities: Array<{
    color: string;
    title: string;
    desc: string;
    time: string;
  }>;
  upcoming_events: Array<{
    title: string;
    date: string;
    time: string;
    location: string;
    tag: string;
  }>;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/adherents/me/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
          }
        });
        if (response.ok) {
          const d = await response.json();
          setData(d);
        }
      } catch (err) {
        console.error("Erreur fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="loading-spinner" style={{ marginBottom: '16px' }}>Chargement du tableau de bord...</div>
      </div>
    );
  }

  const stats = data?.stats || {
    statut: 'Active',
    expiration: 'Non définie',
    events_count: 0,
    docs_count: 0,
    messages_count: 0
  };

  const activities = data?.activities || [];
  const upcoming_events = data?.upcoming_events || [];

  return (
    <div className="page-enter">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="badge green">Adhésion</span>
          <div className="value">{stats.statut}</div>
          <div className="label">Expire le {stats.expiration}</div>
        </div>
        <div className="stat-card">
          <span className="badge blue">Événements</span>
          <div className="value">{stats.events_count}</div>
          <div className="label">À venir</div>
        </div>
        <div className="stat-card">
          <span className="badge purple">Documents</span>
          <div className="value">{stats.docs_count}</div>
          <div className="label">Disponibles</div>
        </div>
        <div className="stat-card">
          <span className="badge orange">Messages</span>
          <div className="value">{stats.messages_count}</div>
          <div className="label">Non lus</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Activités récentes */}
        <div className="card">
          <div className="card-body">
            <div className="section-header">
              <span className="section-title">Activités Récentes</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
            <div className="activity-list">
              {activities.length > 0 ? activities.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${item.color}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                      {item.color === 'blue' ? (
                        <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></>
                      ) : (
                        <polyline points="20,6 9,17 4,12" />
                      )}
                    </svg>
                  </div>
                  <div className="activity-content">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                    <div className="time">{item.time}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                  Aucune activité récente.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Événements à venir */}
        <div>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <span className="section-title">Événements à venir</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          {upcoming_events.length > 0 ? upcoming_events.map((ev, i) => (
            <div key={i} className="event-card">
              <div className="event-img-placeholder" style={{ background: i === 0 ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'linear-gradient(135deg,#0EA5E9,#0369A1)' }}>
                <span className="event-tag">{ev.tag}</span>
              </div>
              <div className="event-body">
                <h3>{ev.title}</h3>
                <div className="event-meta">
                  <div className="event-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>{ev.date}
                  </div>
                  <div className="event-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                    </svg>{ev.time}
                  </div>
                  <div className="event-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>{ev.location}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
              Aucun événement à venir.
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .loading-spinner {
          display: inline-block;
          width: 30px;
          height: 30px;
          border: 3px solid rgba(79, 70, 229, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

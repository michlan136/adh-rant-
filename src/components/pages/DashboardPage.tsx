'use client';

import { PageId } from '@/types';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="page-enter">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="badge green">Adhésion</span>
          <div className="value">Active</div>
          <div className="label">Expire le 15 Juin 2026</div>
        </div>
        <div className="stat-card">
          <span className="badge blue">Événements</span>
          <div className="value">3</div>
          <div className="label">À venir ce mois</div>
        </div>
        <div className="stat-card">
          <span className="badge purple">Documents</span>
          <div className="value">12</div>
          <div className="label">Disponibles</div>
        </div>
        <div className="stat-card">
          <span className="badge orange">Messages</span>
          <div className="value">5</div>
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
              {[
                { color: 'green', icon: <polyline points="20,6 9,17 4,12" />, title: 'Participation confirmée', desc: <>Atelier Formation Professionnelle · <span style={{ color: 'var(--primary)' }}>25 Mai 2026</span></>, time: 'Il y a 2 heures' },
                { color: 'blue', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></>, title: 'Nouveau document disponible', desc: 'Guide des bénéfices adhérents 2026', time: 'Il y a 1 jour' },
                { color: 'purple', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, title: 'Nouvel événement', desc: <>Conférence Annuelle · <span style={{ color: 'var(--primary)' }}>10 Juin 2026</span></>, time: 'Il y a 3 jours' },
                { color: 'orange', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>, title: 'Rappel', desc: 'Votre carte expire dans 45 jours', time: 'Il y a 5 jours' },
              ].map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${item.color}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                      {item.icon}
                    </svg>
                  </div>
                  <div className="activity-content">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                    <div className="time">{item.time}</div>
                  </div>
                </div>
              ))}
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

          {[
            { gradient: 'linear-gradient(135deg,#667eea,#764ba2)', tag: 'Formation', title: 'Atelier Formation Professionnelle', date: '25 Mai 2026', time: '14:00 – 17:00', location: 'Salle de Conférence A' },
            { gradient: 'linear-gradient(135deg,#0EA5E9,#0369A1)', tag: 'Conférence', title: 'Conférence Annuelle', date: '10 Juin 2026', time: '09:00 – 18:00', location: 'Grand Palais, Paris' },
          ].map((ev, i) => (
            <div key={i} className="event-card">
              <div className="event-img-placeholder" style={{ background: ev.gradient }}>
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
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

type FilterTab = 'Tout' | 'Emails' | 'Événements' | 'Paiements' | 'Documents';

const histItems = [
  {
    color: 'purple',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    title: 'Inscription événement',
    desc: 'Atelier Formation Professionnelle',
    date: '18 Avril 2026',
    time: '14:30',
    type: 'Événements',
  },
  {
    color: 'blue',
    icon: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
    title: 'Email reçu',
    desc: "Confirmation d'inscription à l'événement",
    date: '18 Avril 2026',
    time: '14:32',
    type: 'Emails',
    descHighlight: true,
  },
  {
    color: 'green',
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    title: 'Paiement adhésion',
    desc: 'Renouvellement annuel 2025 — 150€',
    date: '15 Juin 2025',
    time: '10:00',
    type: 'Paiements',
  },
  {
    color: 'orange',
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </>
    ),
    title: 'Document téléchargé',
    desc: 'Attestation de membre 2025',
    date: '15 Juin 2025',
    time: '10:05',
    type: 'Documents',
  },
];

const filterTabs: FilterTab[] = ['Tout', 'Emails', 'Événements', 'Paiements', 'Documents'];

export default function HistoriquePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Tout');

  const filtered = histItems.filter(item => activeFilter === 'Tout' || item.type === activeFilter);

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Historique</h2>
        <p>Consultez l&apos;historique de toutes vos activités</p>
      </div>

      {/* Stats */}
      <div className="hist-stats">
        <div className="hist-stat blue"><div className="label">Emails reçus</div><div className="number">4</div></div>
        <div className="hist-stat purple"><div className="label">Événements</div><div className="number">2</div></div>
        <div className="hist-stat green"><div className="label">Paiements</div><div className="number">2</div></div>
        <div className="hist-stat orange"><div className="label">Documents</div><div className="number">2</div></div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab}
            className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="timeline">
        {filtered.map((item, i) => (
          <div key={i} className="timeline-item">
            <div className={`timeline-icon ${item.color}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                {item.icon}
              </svg>
            </div>
            <div className="timeline-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4>{item.title}</h4>
                  <p style={item.descHighlight ? { color: 'var(--primary)' } : {}}>{item.desc}</p>
                  <div className="meta">
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {item.date}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                        <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                      </svg>
                      {item.time}
                    </span>
                  </div>
                </div>
                <div className="status-ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

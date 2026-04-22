'use client';

import { useState } from 'react';

const events = [
  {
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    tag: 'Formation',
    title: 'Atelier Formation Professionnelle',
    desc: 'Développez vos compétences avec nos experts certifiés',
    date: '25 Mai 2026',
    time: '14:00 – 17:00',
    location: 'Salle de Conférence A',
    participants: '45/60',
    progress: 75,
  },
  {
    gradient: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
    tag: 'Conférence',
    title: 'Conférence Annuelle 2026',
    desc: 'Grand événement annuel de notre association',
    date: '10 Juin 2026',
    time: '09:00 – 18:00',
    location: 'Grand Palais, Paris',
    participants: '120/200',
    progress: 60,
  },
  {
    gradient: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
    tag: 'Networking',
    title: 'Networking Evening',
    desc: 'Soirée de networking pour créer des connexions professionnelles',
    date: '25 Juin 2026',
    time: '18:00 – 21:00',
    location: 'Rooftop Lounge, Paris',
    participants: '52/80',
    progress: 65,
  },
  {
    gradient: 'linear-gradient(135deg, #14B8A6, #0891B2)',
    tag: 'Formation',
    title: 'Formation Leadership',
    desc: "Développez vos compétences en leadership et management d'équipe",
    date: '1 Juillet 2026',
    time: '09:00 – 17:00',
    location: 'Centre de Formation, Bordeaux',
    participants: '18/25',
    progress: 72,
  },
];

export default function EvenementsPage() {
  const [search, setSearch] = useState('');

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Événements à venir</h2>
        <p>Découvrez et inscrivez-vous aux prochains événements</p>
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <div className="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
          </svg>
          Tous les types
        </button>
      </div>

      <div className="events-grid">
        {filtered.map((ev, i) => (
          <div key={i} className="event-card-full">
            <div className="event-hero" style={{ background: ev.gradient }}>
              <span className="tag">{ev.tag}</span>
            </div>
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{ev.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{ev.desc}</p>
              <div className="event-meta" style={{ marginTop: 10 }}>
                <div className="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {ev.date}
                </div>
                <div className="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                  </svg>
                  {ev.time}
                </div>
                <div className="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {ev.location}
                </div>
                <div className="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  {ev.participants} participants
                </div>
              </div>
              <div className="event-progress">
                <div className="event-progress-bar" style={{ width: `${ev.progress}%` }}></div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>
                {ev.progress}% de remplissage
              </div>
              <button className="btn btn-primary btn-full">S&apos;inscrire</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

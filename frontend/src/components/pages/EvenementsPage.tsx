'use client';

import { useState, useEffect } from 'react';

interface EventData {
  id: number;
  titre: string;
  description: string;
  date_evenement: string;
  heure_debut: string | null;
  heure_fin: string | null;
  lieu: string;
  categorie: string;
  places_limitees: number | null;
  participants_count: number;
  progress: number;
  is_registered: boolean;
  is_past: boolean;
  is_full: boolean;
  statut: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #0EA5E9, #0369A1)',
  'linear-gradient(135deg, #7C3AED, #4F46E5)',
  'linear-gradient(135deg, #14B8A6, #0891B2)',
  'linear-gradient(135deg, #f97316, #ef4444)',
];

export default function EvenementsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'tous' | 'disponibles' | 'inscrits' | 'termines'>('tous');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/adherents/me/events', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` }
      });
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRegister = async (eventId: number) => {
    setRegistering(eventId);
    try {
      const res = await fetch(`/api/adherents/me/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Inscription réussie à "${data.event}" !`, 'success');
        fetchEvents();
      } else {
        showToast(`❌ ${data.detail}`, 'error');
      }
    } catch {
      showToast('❌ Erreur de connexion', 'error');
    } finally {
      setRegistering(null);
    }
  };

  const filtered = events.filter(ev => {
    const matchesSearch = ev.titre.toLowerCase().includes(search.toLowerCase()) ||
      ev.categorie.toLowerCase().includes(search.toLowerCase()) ||
      ev.lieu.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'disponibles') return !ev.is_past && !ev.is_registered;
    if (filter === 'inscrits') return ev.is_registered;
    if (filter === 'termines') return ev.is_past;
    return true;
  });

  const counts = {
    tous: events.length,
    disponibles: events.filter(e => !e.is_past && !e.is_registered).length,
    inscrits: events.filter(e => e.is_registered).length,
    termines: events.filter(e => e.is_past).length,
  };

  return (
    <div className="page-enter">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '14px 22px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h2>Événements</h2>
        <p>Découvrez et inscrivez-vous aux événements disponibles</p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {([
          { key: 'tous', label: 'Total', color: '#6366f1' },
          { key: 'disponibles', label: 'Disponibles', color: '#10b981' },
          { key: 'inscrits', label: 'Mes inscriptions', color: '#3b82f6' },
          { key: 'termines', label: 'Terminés', color: 'var(--text-muted)' },
        ] as const).map(({ key, label, color }) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? color : 'white',
              border: `2px solid ${filter === key ? color : '#e2e8f0'}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              transition: 'all .2s', textAlign: 'center',
              boxShadow: filter === key ? `0 4px 14px ${color}33` : 'none'
            }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: filter === key ? 'white' : color }}>
              {counts[key]}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: filter === key ? 'rgba(255,255,255,.85)' : '#64748b', marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, background: 'var(--surface)', padding: '12px 16px', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text" placeholder="Rechercher un événement, lieu, catégorie..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent' }}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>×</button>
        )}
      </div>

      {/* Grille d'événements */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Chargement des événements...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 16, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucun événement trouvé.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((ev, i) => {
            const isPast = ev.is_past;
            const isRegistered = ev.is_registered;
            const isFull = ev.is_full;
            const gradient = GRADIENTS[i % GRADIENTS.length];
            const placesLeft = ev.places_limitees ? ev.places_limitees - ev.participants_count : null;

            return (
              <div key={ev.id} style={{
                background: 'var(--surface)', borderRadius: 20,
                overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: isRegistered ? '2px solid #10b981' : '1px solid #e2e8f0',
                opacity: isPast ? 0.75 : 1,
                transition: 'transform .2s, box-shadow .2s',
                display: 'flex', flexDirection: 'column'
              }}
                onMouseOver={e => { if (!isPast) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; } }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
              >
                {/* Hero */}
                <div style={{ background: isPast ? '#94a3b8' : gradient, padding: '20px 16px 16px', position: 'relative', minHeight: 90 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                      {ev.categorie}
                    </span>
                    {isPast ? (
                      <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>TERMINÉ</span>
                    ) : isRegistered ? (
                      <span style={{ background: '#10b981', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>✓ INSCRIT</span>
                    ) : isFull ? (
                      <span style={{ background: '#f97316', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>COMPLET</span>
                    ) : null}
                  </div>
                  <h3 style={{ color: 'white', margin: '10px 0 0', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{ev.titre}</h3>
                </div>

                {/* Body */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ev.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {ev.description.length > 100 ? ev.description.slice(0, 100) + '...' : ev.description}
                    </p>
                  )}

                  {/* Infos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>📅</span>
                      {new Date(ev.date_evenement).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {(ev.heure_debut || ev.heure_fin) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🕐</span>
                        {ev.heure_debut?.slice(0, 5)} — {ev.heure_fin?.slice(0, 5)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>📍</span> {ev.lieu}
                    </div>
                  </div>

                  {/* Participants */}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span>👥 {ev.participants_count} participant{ev.participants_count > 1 ? 's' : ''}{ev.places_limitees ? ` / ${ev.places_limitees}` : ''}</span>
                      {ev.places_limitees && placesLeft !== null && !isPast && (
                        <span style={{ color: placesLeft <= 5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                          {placesLeft <= 0 ? 'Complet' : `${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
                    {ev.places_limitees && (
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999,
                          width: `${Math.min(ev.progress, 100)}%`,
                          background: ev.progress >= 90 ? '#ef4444' : ev.progress >= 60 ? '#f97316' : '#10b981',
                          transition: 'width .5s ease'
                        }} />
                      </div>
                    )}
                    {ev.places_limitees && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{ev.progress}% de remplissage</div>
                    )}
                  </div>

                  {/* Bouton */}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    {isPast ? (
                      <button disabled style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#e2e8f0', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'not-allowed' }}>
                        Événement terminé
                      </button>
                    ) : isRegistered ? (
                      <button disabled style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px solid #10b981', background: '#f0fdf4', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                        ✓ Déjà inscrit
                      </button>
                    ) : isFull ? (
                      <button disabled style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'not-allowed' }}>
                        Places épuisées
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(ev.id)}
                        disabled={registering === ev.id}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                          background: registering === ev.id ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          color: 'white', fontWeight: 700, fontSize: 13, cursor: registering === ev.id ? 'wait' : 'pointer',
                          transition: 'opacity .2s'
                        }}>
                        {registering === ev.id ? '⏳ Inscription...' : "S'inscrire à cet événement"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

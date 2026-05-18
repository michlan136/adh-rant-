'use client';

import { useState, useEffect } from 'react';
import ReceiptModal from '@/components/ReceiptModal';
import { useAuth } from '@/context/AuthContext';

type FilterTab = 'Tout' | 'Emails' | 'Événements' | 'Paiements' | 'Alertes';

const iconMap: Record<string, string> = {
  blue: '📧', green: '💰', purple: '📅', orange: '⚠️'
};

export default function HistoriquePage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Tout');
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ emails: 0, evenements: 0, paiements: 0, alertes: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/adherents/me/historique', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          setStats(data.stats || { emails: 0, evenements: 0, paiements: 0, alertes: 0 });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  const filterTabs: FilterTab[] = ['Tout', 'Emails', 'Événements', 'Paiements', 'Alertes'];
  const filtered = items.filter(item => activeFilter === 'Tout' || item.type === activeFilter);

  return (
    <div className="page-enter">
      {/* Modal Reçu */}
      <ReceiptModal 
        data={selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
      />

      <div className="page-header">
        <h2>Historique</h2>
        <p>Consultez l&apos;historique de toutes vos activités</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Emails', val: stats.emails, color: '#3b82f6', bg: '#eff6ff', icon: '📧' },
          { label: 'Événements', val: stats.evenements, color: '#8b5cf6', bg: '#f5f3ff', icon: '📅' },
          { label: 'Paiements', val: stats.paiements, color: '#10b981', bg: '#f0fdf4', icon: '💰' },
          { label: 'Alertes', val: stats.alertes, color: '#f97316', bg: '#fff7ed', icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'white', padding: 6, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveFilter(tab)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: activeFilter === tab ? '#4f46e5' : 'transparent',
              color: activeFilter === tab ? 'white' : '#64748b',
              transition: 'all .2s'
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ fontWeight: 600 }}>Aucune activité trouvée.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 30 }}>
          <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
          {filtered.map((item, i) => {
            const colorMap: Record<string, string> = { blue: '#3b82f6', green: '#10b981', purple: '#8b5cf6', orange: '#f97316' };
            const c = colorMap[item.icon_color] || '#6366f1';
            return (
              <div key={i} style={{ position: 'relative', marginBottom: 16, animation: `fadeIn .3s ease ${i * 0.05}s both` }}>
                <div style={{ position: 'absolute', left: -24, top: 6, width: 14, height: 14, borderRadius: '50%', background: c, border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }} />
                <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,.04)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{item.titre}</h4>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>{item.description}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                      <span>📅 {item.date}</span>
                      {item.heure && <span>🕐 {item.heure}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {item.type === 'Paiements' && (
                      <button 
                        onClick={() => setSelectedReceipt({
                          ref: item.ref,
                          nom: user?.name,
                          adherent_id: user?.reference,
                          date: item.date,
                          mode: item.mode,
                          montant: item.montant,
                          annee: item.annee
                        })}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#4f46e5', cursor: 'pointer' }}
                      >
                        Voir le reçu
                      </button>
                    )}
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', display: 'grid', placeItems: 'center', color: '#10b981', flexShrink: 0 }}>✓</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

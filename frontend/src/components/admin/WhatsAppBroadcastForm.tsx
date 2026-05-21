'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Cible = 'tous' | 'partie' | 'evenement';
interface Adherent  { id: number; nom: string; telephone?: string; reference?: string; }
interface Evenement { id: number; titre: string; date_evenement?: string; }
interface FormState { titre: string; contenu: string; cible: Cible; evenement_id: string; adherent_ids: number[]; }
interface ApiResponse { message: string; communication_id: number; expediteur: string; destinataires_total: number; numeros_valides: number; numeros_invalides: number; }
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; title: string; body: string; }

// ── Toast ──────────────────────────────────────────────────────────────────────
function ToastNotif({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  const cfg: Record<ToastType, { bg: string; bar: string; icon: string }> = {
    success: { bg: '#f0fdf4', bar: '#10B981', icon: '✅' },
    error:   { bg: '#fef2f2', bar: '#EF4444', icon: '❌' },
    warning: { bg: '#fffbeb', bar: '#F59E0B', icon: '⚠️' },
  };
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', width: '360px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: cfg[t.type].bg, border: `1px solid ${cfg[t.type].bar}30`, borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', overflow: 'hidden', animation: 'slideUp 0.3s ease' }}>
          <div style={{ height: '3px', background: cfg[t.type].bar }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{cfg[t.type].icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{t.body}</div>
            </div>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
interface Props { onSuccess?: (r: ApiResponse) => void; adherents?: Adherent[]; evenements?: Evenement[]; }
const INIT: FormState = { titre: '', contenu: '', cible: 'tous', evenement_id: '', adherent_ids: [] };
const CHAR_LIMIT = 4096;

export default function WhatsAppBroadcastForm({ onSuccess, adherents: pAdh, evenements: pEvt }: Props) {
  const [form, setForm]           = useState<FormState>(INIT);
  const [loading, setLoading]     = useState(false);
  const [adherents, setAdherents] = useState<Adherent[]>(pAdh || []);
  const [evenements, setEvts]     = useState<Evenement[]>(pEvt || []);
  const [dataLoading, setDL]      = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [search, setSearch]       = useState('');
  const toastId = useRef(0);

  const addToast = useCallback((type: ToastType, title: string, body: string) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, type, title, body }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5500);
  }, []);

  useEffect(() => {
    if (pAdh && pEvt) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    setDL(true);
    Promise.all([
      !pAdh ? fetch('/api/admin/adherents', { headers: h }).then(r => r.json()) : Promise.resolve(pAdh),
      !pEvt ? fetch('/api/admin/evenements', { headers: h }).then(r => r.json()) : Promise.resolve(pEvt),
    ])
      .then(([a, e]) => { setAdherents(a); setEvts(e); })
      .catch(() => addToast('error', 'Chargement échoué', 'Impossible de récupérer les données.'))
      .finally(() => setDL(false));
  }, []);

  const filtered  = adherents.filter(a => !search || a.nom.toLowerCase().includes(search.toLowerCase()) || (a.telephone || '').includes(search));
  const toggleAdh = (id: number) => setForm(p => ({ ...p, adherent_ids: p.adherent_ids.includes(id) ? p.adherent_ids.filter(x => x !== id) : [...p.adherent_ids, id] }));
  const selectAll = () => setForm(p => ({ ...p, adherent_ids: filtered.map(a => a.id) }));
  const clearAll  = () => setForm(p => ({ ...p, adherent_ids: [] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim())                                             return addToast('warning', 'Champ requis', 'Veuillez saisir un titre.');
    if (!form.contenu.trim())                                           return addToast('warning', 'Champ requis', 'Veuillez rédiger le message.');
    if (form.cible === 'evenement' && !form.evenement_id)               return addToast('warning', 'Champ requis', 'Sélectionnez un événement.');
    if (form.cible === 'partie' && form.adherent_ids.length === 0)      return addToast('warning', 'Champ requis', 'Sélectionnez au moins un adhérent.');
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const body = { titre: form.titre.trim(), contenu: form.contenu.trim(), cible: form.cible,
      ...(form.cible === 'evenement' && { evenement_id: parseInt(form.evenement_id) }),
      ...(form.cible === 'partie'    && { adherent_ids: form.adherent_ids }),
    };
    try {
      const res  = await fetch('/api/communication/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);
      const r = data as ApiResponse;
      addToast('success', '🚀 Envoi lancé !',
        `${r.numeros_valides} message(s) envoyé(s)` + (r.numeros_invalides > 0 ? `. ${r.numeros_invalides} numéro(s) ignoré(s).` : '.')
      );
      setForm(INIT);
      onSuccess?.(r);
    } catch (err: any) {
      addToast('error', "Échec de l'envoi", err?.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const charCount  = form.contenu.length;
  const charPct    = Math.min((charCount / CHAR_LIMIT) * 100, 100);
  const charDanger = charCount > CHAR_LIMIT * 0.9;

  const cibles: { id: Cible; label: string; desc: string; icon: string }[] = [
    { id: 'tous',      label: 'Tous',       desc: 'Tous les adhérents actifs',  icon: 'fa-users' },
    { id: 'partie',    label: 'Sélection',  desc: 'Choisir individuellement',   icon: 'fa-user-check' },
    { id: 'evenement', label: 'Événement',  desc: 'Participants d\'un événement', icon: 'fa-calendar-check' },
  ];

  // shared input style
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #e5e7eb', borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '13px',
    background: 'white', color: '#0f172a',
    outline: 'none', transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .wa-input:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important; }
        .wa-btn-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.38) !important; }
        .wa-btn-submit:active { transform: translateY(0) !important; }
        .wa-adh-row:hover { background: #f8fafc !important; }
      `}</style>

      <ToastNotif toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* ── Card principale ── */}
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.04)', border: '1px solid #e9eef6', overflow: 'hidden', maxWidth: '760px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <i className="fas fa-paper-plane" style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Diffusion WhatsApp</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Envoi simultané et parallèle via asyncio.gather</p>
            </div>
          </div>

          {/* Callout expéditeur */}
          <div style={{ background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.18)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(79,70,229,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <i className="fas fa-check-circle" style={{ color: '#4F46E5', fontSize: '14px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4F46E5' }}>Expéditeur vérifié : </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#3730A3' }}>+212 713 571 887</span>
              <span style={{ fontSize: '12px', color: '#6366F1' }}> — via Ultramsg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>Actif</span>
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: '0 32px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Titre */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Titre / Objet
              </label>
              <input
                id="wa-titre"
                type="text"
                placeholder="Ex : Convocation Assemblée Générale 2026"
                value={form.titre}
                onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                maxLength={255}
                className="wa-input"
                style={{ ...inputStyle }}
              />
            </div>

            {/* Cible — Segmented Control */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Destinataires
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {cibles.map(c => {
                  const isActive = form.cible === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      id={`wa-cible-${c.id}`}
                      onClick={() => setForm(p => ({ ...p, cible: c.id, evenement_id: '', adherent_ids: [] }))}
                      style={{
                        padding: '14px 12px', borderRadius: '12px', cursor: 'pointer',
                        border: isActive ? '2px solid #4F46E5' : '1.5px solid #e5e7eb',
                        background: isActive ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'white',
                        color: isActive ? 'white' : '#374151',
                        transition: 'all 0.2s ease',
                        textAlign: 'center', fontFamily: 'inherit',
                        boxShadow: isActive ? '0 4px 12px rgba(79,70,229,0.28)' : '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ marginBottom: '6px' }}>
                        <i className={`fas ${c.icon}`} style={{ fontSize: '18px', opacity: isActive ? 1 : 0.5 }} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{c.label}</div>
                      <div style={{ fontSize: '11px', opacity: isActive ? 0.85 : 0.55, marginTop: '2px' }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sélection événement */}
            {form.cible === 'evenement' && (
              <div style={{ animation: 'slideUp 0.25s ease' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Événement
                </label>
                {dataLoading ? (
                  <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>Chargement…</div>
                ) : (
                  <select
                    id="wa-evenement"
                    value={form.evenement_id}
                    onChange={e => setForm(p => ({ ...p, evenement_id: e.target.value }))}
                    className="wa-input"
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">-- Sélectionnez un événement --</option>
                    {evenements.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.titre}{ev.date_evenement ? ` — ${new Date(ev.date_evenement).toLocaleDateString('fr-MA')}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Sélection individuelle */}
            {form.cible === 'partie' && (
              <div style={{ animation: 'slideUp 0.25s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Adhérents <span style={{ color: '#4F46E5', textTransform: 'none', fontWeight: 600 }}>({form.adherent_ids.length} sélectionné{form.adherent_ids.length > 1 ? 's' : ''})</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" id="wa-select-all" onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#4F46E5', fontFamily: 'inherit' }}>Tout sélectionner</button>
                    <button type="button" id="wa-clear-all"  onClick={clearAll}  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#EF4444', fontFamily: 'inherit' }}>Effacer</button>
                  </div>
                </div>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }} />
                  <input
                    type="text" placeholder="Rechercher un adhérent…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="wa-input"
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                  />
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e9eef6', borderRadius: '12px', background: '#fafafa' }}>
                  {dataLoading ? <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chargement…</div>
                  : filtered.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Aucun résultat</div>
                  : filtered.map(adh => {
                    const sel = form.adherent_ids.includes(adh.id);
                    return (
                      <label key={adh.id} htmlFor={`wa-adh-${adh.id}`} className="wa-adh-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: sel ? 'rgba(79,70,229,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                        <input id={`wa-adh-${adh.id}`} type="checkbox" checked={sel} onChange={() => toggleAdh(adh.id)} style={{ width: '16px', height: '16px', accentColor: '#4F46E5', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adh.nom}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{adh.telephone || 'Pas de téléphone'}{adh.reference ? ` · ${adh.reference}` : ''}</div>
                        </div>
                        {sel && <span style={{ color: '#4F46E5', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>✓</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Message
                </label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: charDanger ? '#EF4444' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                  {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                </span>
              </div>
              <textarea
                id="wa-contenu"
                placeholder="Rédigez votre message WhatsApp ici… Les emojis sont supportés 🎉"
                value={form.contenu}
                onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setForm(p => ({ ...p, contenu: e.target.value })); }}
                rows={6}
                className="wa-input"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              {/* Barre de progression */}
              <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${charPct}%`, background: charDanger ? '#EF4444' : '#4F46E5', borderRadius: '2px', transition: 'width 0.3s ease, background 0.3s' }} />
              </div>
            </div>

            {/* Récapitulatif */}
            <div style={{ background: '#f8fafc', border: '1px solid #e9eef6', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(79,70,229,0.10)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: '1px' }}>
                <i className="fas fa-info" style={{ color: '#4F46E5', fontSize: '13px' }} />
              </div>
              <div style={{ fontSize: '13px', color: '#374151', flex: 1 }}>
                <span style={{ fontWeight: 700 }}>Récapitulatif : </span>
                {form.cible === 'tous'      && `Envoi à tous les adhérents actifs (${adherents.length} profil${adherents.length > 1 ? 's' : ''})`}
                {form.cible === 'partie'    && `${form.adherent_ids.length} adhérent(s) sélectionné(s) manuellement`}
                {form.cible === 'evenement' && (form.evenement_id ? `Participants de l'événement sélectionné` : 'Sélectionnez un événement')}
                <div style={{ fontSize: '11px', color: '#4F46E5', marginTop: '4px', fontWeight: 500 }}>
                  Expéditeur fixe : +212 713 571 887 · Envoi simultané
                </div>
              </div>
            </div>

            {/* Bouton */}
            <button
              id="wa-submit-btn"
              type="submit"
              disabled={loading}
              className="wa-btn-submit"
              style={{
                width: '100%', padding: '14px 24px',
                border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: 'white',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(79,70,229,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" style={{ fontSize: '16px' }} />
                  Envoyer le message WhatsApp
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

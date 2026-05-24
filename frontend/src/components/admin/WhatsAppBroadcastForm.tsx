'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Adherent { id: number; nom: string; telephone?: string; reference?: string; }
interface CibleElement { id: number; nom: string; }
interface CibleCategorie { type: string; label: string; elements: CibleElement[]; }
interface TargetGroup { type: string; label: string; element_id: number; element_nom: string; }

interface FormState {
  titre: string;
  contenu: string;
  target_groups: TargetGroup[];
  adherent_ids: number[];
  attachment: File | null;
}

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
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>{t.body}</div>
            </div>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
interface Props { onSuccess?: (r: any) => void; adherents?: Adherent[]; evenements?: any[]; }
const INIT: FormState = { titre: '', contenu: '', target_groups: [], adherent_ids: [], attachment: null };
const CHAR_LIMIT = 4096;

export default function WhatsAppBroadcastForm({ onSuccess, adherents: pAdh }: Props) {
  const [form, setForm]           = useState<FormState>(INIT);
  const [loading, setLoading]     = useState(false);
  const [adherents, setAdherents] = useState<Adherent[]>(pAdh || []);
  const [cibles, setCibles]       = useState<CibleCategorie[]>([]);
  const [dataLoading, setDL]      = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [search, setSearch]       = useState('');
  
  // UI states pour la sélection de cible
  const [showCiblePicker, setShowCiblePicker]   = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<CibleCategorie | null>(null);
  const [cibleAdherents, setCibleAdherents]     = useState<{[key: string]: Adherent[]}>({});
  const [loadingCibleAdh, setLoadingCibleAdh]   = useState(false);
  const [mainMode, setMainMode]                 = useState<'groupes' | 'individuel'>('groupes');
  
  const toastId = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((type: ToastType, title: string, body: string) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, type, title, body }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5500);
  }, []);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('ga_auth_token') : null;
  const authHeaders = (): Record<string, string> => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

  // Chargement initial des cibles et adhérents
  useEffect(() => {
    setDL(true);
    Promise.all([
      !pAdh ? fetch('/api/admin/adherents', { headers: authHeaders() }).then(r => r.json()) : Promise.resolve(pAdh),
      fetch('/api/admin/cibles', { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([adh, cibs]) => {
        setAdherents(Array.isArray(adh) ? adh : []);
        setCibles(Array.isArray(cibs) ? cibs : []);
      })
      .catch(() => addToast('error', 'Chargement échoué', 'Impossible de récupérer les données.'))
      .finally(() => setDL(false));
  }, []);

  // Charger les adhérents d'une cible lors de la sélection d'un élément
  const loadCibleAdherents = async (type: string, element_id: number) => {
    const key = `${type}-${element_id}`;
    if (cibleAdherents[key]) return; // Déjà chargé
    setLoadingCibleAdh(true);
    try {
      const r = await fetch(`/api/admin/cibles/${type}/${element_id}/adherents`, { headers: authHeaders() });
      const data = await r.json();
      setCibleAdherents(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }));
    } catch {
      setCibleAdherents(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingCibleAdh(false);
    }
  };

  const addTargetGroup = (group: TargetGroup) => {
    // Éviter les doublons
    const exists = form.target_groups.some(g => g.type === group.type && g.element_id === group.element_id);
    if (!exists) {
      setForm(p => ({ ...p, target_groups: [...p.target_groups, group] }));
      loadCibleAdherents(group.type, group.element_id);
    }
    setShowCiblePicker(false);
    setSelectedCategorie(null);
  };

  const removeTargetGroup = (index: number) => {
    setForm(p => ({ ...p, target_groups: p.target_groups.filter((_, i) => i !== index) }));
  };

  const filtered = adherents.filter(a =>
    !search || a.nom.toLowerCase().includes(search.toLowerCase()) || (a.telephone || '').includes(search)
  );
  const toggleAdh = (id: number) => setForm(p => ({
    ...p,
    adherent_ids: p.adherent_ids.includes(id)
      ? p.adherent_ids.filter(x => x !== id)
      : [...p.adherent_ids, id]
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return addToast('warning', 'Champ requis', 'Veuillez saisir un titre.');
    if (!form.contenu.trim()) return addToast('warning', 'Champ requis', 'Veuillez rédiger le message.');
    if (form.target_groups.length === 0 && form.adherent_ids.length === 0) {
      return addToast('warning', 'Cible requise', 'Sélectionnez au moins une cible ou un adhérent.');
    }
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('titre', form.titre.trim());
      fd.append('contenu', form.contenu.trim());

      if (form.adherent_ids.length > 0 && form.target_groups.length === 0) {
        // Mode individuel seulement
        fd.append('cible', 'partie');
        fd.append('adherent_ids', JSON.stringify(form.adherent_ids));
      } else if (form.target_groups.length > 0) {
        // Multi-cibles
        fd.append('cible', form.target_groups[0].type);
        if (form.target_groups[0].element_id) {
          fd.append('evenement_id', String(form.target_groups[0].element_id));
        }
        if (form.target_groups.length > 1) {
          fd.append('cibles_json', JSON.stringify(
            form.target_groups.map(g => ({ type: g.type, element_id: g.element_id }))
          ));
        }
        if (form.adherent_ids.length > 0) {
          fd.append('adherent_ids', JSON.stringify(form.adherent_ids));
        }
      } else {
        fd.append('cible', 'tous');
      }

      if (form.attachment) {
        fd.append('attachment', form.attachment);
      }

      const res = await fetch('/api/communication/whatsapp', {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);

      addToast('success', '🚀 Envoi lancé !',
        `${data.numeros_valides} message(s) en cours d'envoi`
        + (data.numeros_invalides > 0 ? `. ${data.numeros_invalides} numéro(s) ignoré(s).` : '.')
        + (data.piece_jointe ? ` | PJ: ${data.piece_jointe}` : '')
      );
      setForm(INIT);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess?.(data);
    } catch (err: any) {
      addToast('error', "Échec de l'envoi", err?.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = form.contenu.length;
  const charPct   = Math.min((charCount / CHAR_LIMIT) * 100, 100);
  const charDanger = charCount > CHAR_LIMIT * 0.9;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1px solid var(--border)', borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '13px',
    background: 'var(--surface)', color: 'var(--text-primary)',
    outline: 'none', transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  // Calcul du nombre total d'adhérents ciblés (estimation)
  const totalCibleAdh = form.target_groups.reduce((acc, g) => {
    const key = `${g.type}-${g.element_id}`;
    return acc + (cibleAdherents[key]?.length || 0);
  }, 0) + form.adherent_ids.length;

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .wa-input:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important; }
        .wa-btn-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .wa-adh-row:hover { background: var(--surface-2) !important; }
        .cible-cat-btn:hover { background: #f0f4ff !important; border-color: #4F46E5 !important; }
        .cible-el-btn:hover { background: #e8edff !important; }
      `}</style>

      <ToastNotif toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div style={{ background: 'var(--surface)', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e9eef6', overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
              <i className="fab fa-whatsapp" style={{ color: 'white', fontSize: '22px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Diffusion WhatsApp en masse</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Ciblez des groupes par type de participation ou sélectionnez individuellement</p>
            </div>
          </div>

          {/* Expéditeur */}
          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>Expéditeur : <strong>+212 713 571 887</strong> · Envoi simultané via asyncio.gather</span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: '0 32px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Titre */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>
                Titre / Objet
              </label>
              <input id="wa-titre" type="text" placeholder="Ex : Convocation Assemblée Générale 2026"
                value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                maxLength={255} className="wa-input" style={inputStyle} />
            </div>

            {/* ── Destinataires ── */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Destinataires
              </label>

              {/* Tabs mode */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 10, padding: 4, marginBottom: 14, width: 'fit-content' }}>
                {[
                  { key: 'groupes', label: '🎯 Par groupe / cible' },
                  { key: 'individuel', label: '👤 Sélection individuelle' },
                ].map(tab => (
                  <button key={tab.key} type="button"
                    onClick={() => setMainMode(tab.key as any)}
                    style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: mainMode === tab.key ? 700 : 500, background: mainMode === tab.key ? 'white' : 'transparent', color: mainMode === tab.key ? '#1e293b' : '#64748b', boxShadow: mainMode === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mode Groupes */}
              {mainMode === 'groupes' && (
                <div style={{ animation: 'slideUp 0.2s ease' }}>
                  {/* Groupes sélectionnés */}
                  {form.target_groups.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {form.target_groups.map((g, i) => {
                        const key = `${g.type}-${g.element_id}`;
                        const adhCount = cibleAdherents[key]?.length ?? '...';
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '1px solid #a78bfa', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>{g.label}</span>
                            <span>→ {g.element_nom}</span>
                            <span style={{ background: '#7c3aed', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'grid', placeItems: 'center', fontSize: 10 }}>{adhCount}</span>
                            <button type="button" onClick={() => removeTargetGroup(i)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: 14, lineHeight: 1, marginLeft: 2 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bouton Nouvelle cible */}
                  <button type="button" id="wa-nouvelle-cible" onClick={() => { setShowCiblePicker(true); setSelectedCategorie(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '2px dashed #4F46E5', background: 'rgba(79,70,229,0.05)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#4F46E5', transition: 'all 0.2s', width: '100%', justifyContent: 'center' }}>
                    <i className="fas fa-plus-circle" />
                    {form.target_groups.length === 0 ? 'Sélectionner une cible' : 'Ajouter une autre cible'}
                  </button>

                  {/* Picker de cible */}
                  {showCiblePicker && (
                    <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', animation: 'slideUp 0.2s ease' }}>
                      {!selectedCategorie ? (
                        // Étape 1 : choisir la catégorie
                        <div>
                          <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Choisir une catégorie</span>
                            <button type="button" onClick={() => setShowCiblePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: 12 }}>
                            {dataLoading ? (
                              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Chargement...</div>
                            ) : cibles.map(cat => (
                              <button key={cat.type} type="button" className="cible-cat-btn"
                                onClick={() => setSelectedCategorie(cat)}
                                style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{cat.elements.length} élément(s)</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // Étape 2 : choisir l'élément
                        <div>
                          <div style={{ padding: '12px 16px', background: '#f0f4ff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" onClick={() => setSelectedCategorie(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: 14 }}>← Retour</button>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>{selectedCategorie.label}</span>
                          </div>
                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                            {selectedCategorie.elements.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Aucun élément disponible</div>
                            ) : selectedCategorie.elements.map(el => {
                              const alreadySelected = form.target_groups.some(g => g.type === selectedCategorie.type && g.element_id === el.id);
                              return (
                                <button key={el.id} type="button" className="cible-el-btn" disabled={alreadySelected}
                                  onClick={() => addTargetGroup({ type: selectedCategorie.type, label: selectedCategorie.label, element_id: el.id, element_nom: el.nom })}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: alreadySelected ? '1.5px solid #a78bfa' : '1.5px solid #e5e7eb', background: alreadySelected ? '#ede9fe' : 'white', cursor: alreadySelected ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', opacity: alreadySelected ? 0.6 : 1 }}>
                                  <i className="fas fa-check-circle" style={{ color: alreadySelected ? '#7c3aed' : '#d1d5db', fontSize: 14 }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{el.nom}</span>
                                  {alreadySelected && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7c3aed', fontWeight: 700 }}>Déjà ajouté</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aperçu des adhérents de chaque cible */}
                  {form.target_groups.map((g, gi) => {
                    const key = `${g.type}-${g.element_id}`;
                    const adhs = cibleAdherents[key];
                    if (!adhs) return null;
                    return (
                      <div key={gi} style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: '#5b21b6' }}>{g.label} → {g.element_nom}</span>
                          <span style={{ background: '#7c3aed', color: 'white', borderRadius: 8, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{adhs.length} adhérent(s)</span>
                        </div>
                        {adhs.length > 0 ? (
                          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                            {adhs.map(adh => (
                              <div key={adh.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'grid', placeItems: 'center', fontSize: 11, color: '#7c3aed', flexShrink: 0 }}>
                                  {adh.nom.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{adh.nom}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{adh.telephone || 'Pas de téléphone'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Aucun adhérent inscrit dans cet élément.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode Individuel */}
              {mainMode === 'individuel' && (
                <div style={{ animation: 'slideUp 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {form.adherent_ids.length} adhérent(s) sélectionné(s)
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" onClick={() => setForm(p => ({ ...p, adherent_ids: filtered.map(a => a.id) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#4F46E5', fontFamily: 'inherit' }}>
                        Tout sélectionner
                      </button>
                      <button type="button" onClick={() => setForm(p => ({ ...p, adherent_ids: [] }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444', fontFamily: 'inherit' }}>
                        Effacer
                      </button>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }} />
                    <input type="text" placeholder="Rechercher un adhérent…"
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="wa-input" style={{ ...inputStyle, paddingLeft: '36px' }} />
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e9eef6', borderRadius: '12px', background: '#fafafa' }}>
                    {filtered.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Aucun résultat</div>
                    ) : filtered.map(adh => {
                      const sel = form.adherent_ids.includes(adh.id);
                      return (
                        <label key={adh.id} htmlFor={`wa-adh-${adh.id}`} className="wa-adh-row"
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: sel ? 'rgba(79,70,229,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                          <input id={`wa-adh-${adh.id}`} type="checkbox" checked={sel} onChange={() => toggleAdh(adh.id)}
                            style={{ width: '16px', height: '16px', accentColor: '#4F46E5', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adh.nom}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{adh.telephone || 'Pas de téléphone'}{adh.reference ? ` · ${adh.reference}` : ''}</div>
                          </div>
                          {sel && <span style={{ color: '#4F46E5', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>✓</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: charDanger ? '#EF4444' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                  {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                </span>
              </div>
              <textarea id="wa-contenu" placeholder="Rédigez votre message WhatsApp ici… Les emojis sont supportés 🎉"
                value={form.contenu}
                onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setForm(p => ({ ...p, contenu: e.target.value })); }}
                rows={5} className="wa-input" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              <div style={{ height: '3px', background: 'var(--surface-2)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${charPct}%`, background: charDanger ? '#EF4444' : '#25D366', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Pièce jointe */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                🔗 Pièce jointe (Optionnel)
              </label>
              <div style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: '14px 18px', background: form.attachment ? 'rgba(37,211,102,0.05)' : '#fafafa', transition: 'all 0.2s', borderColor: form.attachment ? '#25D366' : '#e5e7eb' }}>
                <input ref={fileRef} id="wa-attachment" type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.mp4,.mp3"
                  onChange={e => setForm(p => ({ ...p, attachment: e.target.files?.[0] || null }))}
                  style={{ display: 'none' }} />
                {form.attachment ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-file" style={{ color: '#25D366', fontSize: 18 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.attachment.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{(form.attachment.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" onClick={() => { setForm(p => ({ ...p, attachment: null })); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <label htmlFor="wa-attachment" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <i className="fas fa-paperclip" style={{ color: 'var(--text-muted)', fontSize: 18 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Cliquez pour joindre un fichier</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, Word, Image, Excel — Max 16 MB</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Récapitulatif */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid #e9eef6', borderRadius: '12px', padding: '14px 18px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 700 }}>Récapitulatif : </span>
                {form.target_groups.length > 0 ? (
                  <>
                    {form.target_groups.map(g => `${g.label} → ${g.element_nom}`).join(' + ')}
                    {totalCibleAdh > 0 && <strong style={{ color: '#4F46E5' }}> ({totalCibleAdh} adhérent(s))</strong>}
                  </>
                ) : form.adherent_ids.length > 0 ? (
                  `${form.adherent_ids.length} adhérent(s) sélectionné(s) manuellement`
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Aucune cible sélectionnée</span>
                )}
                {form.attachment && <span style={{ color: '#25D366', fontWeight: 600 }}> · 📎 {form.attachment.name}</span>}
              </div>
            </div>

            {/* Bouton envoi */}
            <button id="wa-submit-btn" type="submit" disabled={loading} className="wa-btn-submit"
              style={{ width: '100%', padding: '14px 24px', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: 'white', background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: loading ? 'none' : '0 4px 12px rgba(37,211,102,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s ease', opacity: loading ? 0.8 : 1 }}>
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
                  <i className="fab fa-whatsapp" style={{ fontSize: '18px' }} />
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

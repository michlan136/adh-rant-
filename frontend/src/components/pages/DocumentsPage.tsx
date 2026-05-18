'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Document {
  id: number;
  name: string;
  category: string;
  type: string;
  size: string | null;
  url: string;
  created_at: string;
}

const DocIcon = ({ type }: { type: string }) => {
  if (type.toLowerCase() === 'pdf') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <path d="M9 13v-3h6v3" /><path d="M9 17v-3h6v3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
};

const getCategoryClass = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('guide')) return 'cat-guide';
  if (c.includes('règlement') || c.includes('reglement')) return 'cat-reg';
  if (c.includes('formation')) return 'cat-formation';
  if (c.includes('partenaire')) return 'cat-partenaires';
  if (c.includes('facture')) return 'cat-facture';
  if (c.includes('attestation')) return 'cat-attestation';
  if (c.includes('newsletter') || c.includes('bulletin')) return 'cat-newsletter';
  return 'cat-reg';
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', category: 'Général' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      // Adaptation : Utilisation du chemin proxy /api
      const response = await fetch('/api/documents/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Erreur fetch docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert("Veuillez sélectionner un fichier");

    setIsUploading(true);
    const formData = new FormData();
    formData.append('name', uploadData.name || selectedFile.name);
    formData.append('category', uploadData.category);
    formData.append('file', selectedFile);

    try {
      // Adaptation : Utilisation du chemin proxy /api
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
        },
        body: formData
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({ name: '', category: 'Général' });
        setSelectedFile(null);
        fetchDocs(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue" }));
        alert(`Erreur lors de l'envoi : ${errorData.detail || "Le serveur a refusé le fichier."}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.category));
    return ['Tous', ...Array.from(cats)];
  }, [documents]);

  const filtered = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                         d.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'Tous' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();
    
    return {
      total: documents.length,
      thisMonth: documents.filter(d => new Date(d.created_at).getMonth() === thisMonth).length,
      newThisWeek: documents.filter(d => new Date(d.created_at) >= oneWeekAgo).length
    };
  }, [documents]);

  const handleDownload = (doc: Document) => {
    // On garde l'URL directe vers le backend pour les fichiers statiques
    const fullUrl = doc.url.startsWith('http') ? doc.url : `http://127.0.0.1:8000${doc.url}`;
    window.open(fullUrl, '_blank');
  };

  const handleView = (doc: Document) => {
    const fullUrl = doc.url.startsWith('http') ? doc.url : `http://127.0.0.1:8000${doc.url}`;
    window.open(fullUrl, '_blank');
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      // Adaptation : Utilisation du chemin proxy /api
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
        }
      });
      if (response.ok) {
        fetchDocs(); // Refresh list
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Mes Documents</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Consultez, recherchez et téléchargez vos documents officiels.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Ajouter un document
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Imprimer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="doc-stats" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="label" style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Total Documents</div>
          <div className="value" style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{stats.total}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            Archive complète
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div className="label" style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Nouveautés (Mois)</div>
          <div className="value" style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{stats.thisMonth}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Mis à jour récemment
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="label" style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Cette semaine</div>
          <div className="value" style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{stats.newThisWeek}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
            Nouveaux fichiers
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="search-bar" style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="search-input" style={{ flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou catégorie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '14px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--border)',
                background: categoryFilter === cat ? 'var(--primary-glow)' : 'transparent',
                color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="doc-table card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ marginBottom: '16px' }}>Chargement des documents...</div>
          </div>
        ) : filtered.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catégorie</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taille</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '16px' }}>
                    <div className="doc-name" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className="doc-icon" style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', 
                        background: doc.type.toLowerCase() === 'pdf' ? '#FEE2E2' : '#E0F2FE',
                        display: 'grid', placeItems: 'center'
                      }}>
                        <DocIcon type={doc.type} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{doc.type.toUpperCase()} • Modifié le {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`doc-cat ${getCategoryClass(doc.category)}`} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {doc.size || 'N/A'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="doc-action-btn" onClick={() => handleView(doc)} title="Aperçu rapide">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="doc-action-btn" onClick={() => handleDownload(doc)} title="Télécharger">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button className="doc-action-btn delete-btn" onClick={() => handleDelete(doc.id)} title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ background: 'var(--surface-2)', width: '60px', height: '60px', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" width="24" height="24">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13,2 13,9 20,9" />
              </svg>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Aucun document trouvé</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Vous n&apos;avez pas encore ajouté de documents.</p>
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowUploadModal(true)}>
              Ajouter mon premier document
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Ajouter un nouveau document</h3>
                <button onClick={() => setShowUploadModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>Nom du document (Optionnel)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Facture Mars 2026" 
                    value={uploadData.name}
                    onChange={e => setUploadData({...uploadData, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Catégorie</label>
                  <select 
                    value={uploadData.category}
                    onChange={e => setUploadData({...uploadData, category: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', fontFamily: 'inherit' }}
                  >
                    <option value="Général">Général</option>
                    <option value="Facture">Facture</option>
                    <option value="Guide">Guide</option>
                    <option value="Réglementation">Réglementation</option>
                    <option value="Formation">Formation</option>
                    <option value="Attestation">Attestation</option>
                  </select>
                </div>

                <div style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: '12px', 
                  padding: '30px', 
                  textAlign: 'center', 
                  marginBottom: '20px',
                  background: selectedFile ? 'var(--primary-glow)' : 'transparent',
                  borderColor: selectedFile ? 'var(--primary)' : 'var(--border)',
                  cursor: 'pointer'
                }} onClick={() => document.getElementById('file-upload')?.click()}>
                  <input 
                    type="file" 
                    id="file-upload" 
                    hidden 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" width="32" height="32" style={{ marginBottom: '12px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {selectedFile ? selectedFile.name : "Cliquez pour choisir un fichier"}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    PDF, JPG, PNG (Max 10MB)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isUploading}>
                    {isUploading ? "Envoi en cours..." : "Télécharger"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .table-row-hover:hover {
          background-color: var(--surface-2);
        }
        .doc-action-btn.delete-btn:hover {
          background: var(--danger);
          border-color: var(--danger);
        }
        .doc-action-btn.delete-btn:hover svg {
          stroke: white;
        }
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

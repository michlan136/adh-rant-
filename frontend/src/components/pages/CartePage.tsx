'use client';

import { useState, useRef, useEffect } from 'react';
import { PageId } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface CartePageProps {
  onNavigate?: (page: PageId) => void;
}

export default function CartePage({ onNavigate }: CartePageProps) {
  const { user, updateUser } = useAuth();
  
  // Nouveaux états pour l'édition et la photo
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activités récentes réelles
  const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    const fetchAct = async () => {
      try {
        const res = await fetch('/api/adherents/me/notifications', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          const colorMap: Record<string, string> = { alerte: 'orange', succes: 'green', rappel: 'purple', info: 'blue' };
          setActivities(data.slice(0, 4).map((n: any) => ({
            color: colorMap[n.type_notif] || 'blue',
            title: n.titre,
            time: n.date
          })));
        }
      } catch(e) { console.error(e); }
    };
    fetchAct();
  }, []);

  const handlePrint = () => {
    const frontEl = document.getElementById('carte-front');
    const backEl = document.getElementById('carte-back');
    if (!frontEl || !backEl) {
      alert("Éléments de la carte non trouvés.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour télécharger la carte.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression Carte</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { padding: 0; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            .card-container {
              width: 340px;
              height: 215px;
              position: relative;
              border: 1.5px solid #c8b89a;
              border-radius: 7px;
              overflow: hidden;
              box-shadow: 0 4px 18px rgba(0,0,0,.22);
            }
          </style>
        </head>
        <body>
          <div class="card-container">${frontEl.innerHTML}</div>
          <div class="card-container">${backEl.innerHTML}</div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File selection triggered...");
    if (e.target.files && e.target.files[0] && user?.adherent_id) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, "for adherent:", user.adherent_id);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        // Adaptation : Utilisation du chemin proxy /api/adherents
        const response = await fetch(`/api/adherents/${user.adherent_id}/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
          },
          body: formDataUpload
        });

        console.log("Response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Photo uploaded successfully. New path:", data.photo_url);
          // Adaptation : On garde le chemin relatif /uploads/...
          const newPhotoUrl = data.photo_url;
          updateUser({ photo_url: newPhotoUrl });
          alert("Photo de profil mise à jour !");
        } else {
          const errData = await response.json();
          console.error("Upload failed:", errData);
          alert(`Erreur lors de l'envoi de la photo: ${errData.detail || "Inconnue"}`);
        }
      } catch (err) {
        console.error("Upload photo error:", err);
        alert("Erreur de connexion lors de l'envoi de la photo.");
      }
    }
  };

  const handleSave = async () => {
    if (!user?.adherent_id) {
      alert("Erreur: Impossible d'identifier l'adhérent.");
      return;
    }

    setIsSaving(true);
    try {
      // Adaptation : Utilisation du chemin proxy /api/adherents
      const response = await fetch(`/api/adherents/${user.adherent_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
        },
        body: JSON.stringify({
          nom: formData.name.split(' ').slice(1).join(' ') || formData.name,
          prenom: formData.name.split(' ')[0],
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          photo_url: user?.photo_url
        }),
      });

      if (response.ok) {
        updateUser({
          name: formData.name,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse
        });
        setIsEditing(false);
        alert("Profil mis à jour avec succès !");
      } else {
        const err = await response.json();
        alert("Erreur lors de la sauvegarde: " + (err.detail || "Inconnue"));
      }
    } catch (error) {
      console.error("Erreur save:", error);
      alert("Erreur de connexion au serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const dateAdhesion = user?.date_adhesion ? new Date(user.date_adhesion) : new Date();
  const dateExpiration = new Date(dateAdhesion);
  dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);
  const formattedExpiration = dateExpiration.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const formattedAdhesion = dateAdhesion.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const isActif = user?.statut === 'Actif' || user?.statut === 'Validé' || !user?.statut;

  return (
    <div className="page-enter">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-card-section, .print-card-section * { visibility: visible; }
          .print-card-section {
            position: absolute; left: 50%; top: 20px; transform: translateX(-50%) !important;
            width: 100%; max-width: 450px; box-shadow: none !important; background: white !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .membership-card-visual { background: linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%) !important; color: white !important; }
          .membership-card-visual .mc-logo, .membership-card-visual .mc-type, .membership-card-visual .mc-name, .membership-card-visual .mc-number, .membership-card-visual .mc-expiry, .membership-card-visual .mc-date { color: white !important; }
        }
      `}</style>

      {/* Input de fichier caché */}
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />

      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h2>Ma Carte Adhérent</h2>
        <p>Votre identité officielle et vos actions rapides</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Card & Quick Actions & Activity */}
        <div>
          {/* Membership Card Visual */}
          <div 
            id="carte-front"
            className="membership-card-visual print-card-section" 
            style={{ 
              width: 442,
              height: 279.5,
              fontFamily: '"Arial", "Helvetica Neue", sans-serif',
              border: '1.5px solid #c8b89a',
              borderRadius: 7,
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,.22)',
              flexShrink: 0,
              userSelect: 'none',
              position: 'relative',
              marginBottom: '24px',
              color: '#000'
            }}
          >
            {/* Image de fond */}
            <img src="/carte_background.png" alt="Fond Carte" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

            {/* Nom */}
            <div style={{ position: 'absolute', top: '100px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              {formData.name.split(' ')[1] || formData.name}
            </div>
            
            {/* Prénom */}
            <div style={{ position: 'absolute', top: '122px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              {formData.name.split(' ')[0] || ''}
            </div>
            
            {/* Profession */}
            <div style={{ position: 'absolute', top: '144px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              Commerçant
            </div>
            
            {/* Patente */}
            <div style={{ position: 'absolute', top: '166px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              {user?.numero_patente || '-'}
            </div>
            
            {/* R.C */}
            <div style={{ position: 'absolute', top: '188px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              {user?.ice || '-'}
            </div>
            
            {/* Validité */}
            <div style={{ position: 'absolute', top: '210px', left: '195px', padding: '0 4px', fontSize: '11px', fontWeight: 'bold', zIndex: 1 }}>
              {formattedExpiration}
            </div>
            
            {/* Numéro de carte */}
            <div style={{ position: 'absolute', bottom: '13px', left: '13px', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold', zIndex: 1 }}>
              {user?.reference || 'ADH-2026-0001'}
            </div>

            {/* Photo Avatar avec fonction Upload */}
            <div 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ position: 'absolute', top: '104px', left: '36.4px', width: '78px', height: '101.4px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px', cursor: 'pointer', zIndex: 1 }}
            >
              {user?.photo_url ? (
                <img src={user.photo_url.startsWith('http') ? user.photo_url : `http://127.0.0.1:8000${user.photo_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Photo</span>
              )}
              {/* Icône de caméra superposée */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px', display: 'grid', placeItems: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Verso de la carte (caché, utilisé pour l'impression) */}
          <div id="carte-back" style={{ display: 'none' }}>
            <img src="/carte_back.png" alt="Fond Carte Verso" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '14px', background: 'var(--surface)' }} onClick={handlePrint}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Télécharger
            </button>
            {isEditing ? (
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '14px', background: 'var(--success)', borderColor: 'var(--success)', opacity: isSaving ? 0.7 : 1 }} 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  "Sauvegarde..."
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Sauvegarder
                  </>
                )}
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ flex: 1, padding: '14px', background: 'var(--surface)' }} onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                Modifier
              </button>
            )}
          </div>

          {/* Activité Récente */}
          <div className="card">
            <div className="card-body">
              <div className="section-header">
                <span className="section-title">Activité Récente</span>
              </div>
              <div className="activity-list">
                {activities.length > 0 ? activities.map((item, i) => (
                  <div key={i} className="activity-item" style={{ padding: '16px 0' }}>
                    <div className={`activity-dot ${item.color}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <h4 style={{ fontSize: '14px' }}>{item.title}</h4>
                      <div className="time">{item.time}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Aucune activité récente.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Informations Personnelles
              </div>
              {[
                { icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, label: 'Nom complet', key: 'name', value: formData.name },
                { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>, label: 'Email', key: 'email', value: formData.email },
                { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z" />, label: 'Téléphone', key: 'telephone', value: formData.telephone },
                { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>, label: 'Adresse', key: 'adresse', value: formData.adresse },
              ].map((row, i) => (
                <div key={i} className="info-row" style={{ padding: '12px 0' }}>
                  <div className="info-row-icon" style={{ background: 'var(--surface)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      {row.icon}
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', display: 'block' }}>{row.label}</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={row.value} 
                        onChange={(e) => setFormData({...formData, [row.key]: e.target.value})}
                        style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '14px', marginTop: '4px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '14px' }}>{row.value || 'Non renseigné'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Détails de l&apos;Adhésion
              </div>
              {[
                { dotColor: isActif ? 'var(--success)' : 'var(--warning)', label: 'Statut', value: user?.statut || 'Active', valueClass: isActif ? 'green' : 'orange' },
                { dotColor: 'var(--primary)', label: "Type d'adhésion", value: 'Membre', valueClass: '' },
                { dotColor: 'var(--accent)', label: "Date d'adhésion", value: formattedAdhesion, valueClass: '' },
                { dotColor: 'var(--warning)', label: "Date d'expiration", value: formattedExpiration, valueClass: '' },
              ].map((row, i) => (
                <div key={i} className="detail-row" style={{ padding: '12px 0' }}>
                  <div className="detail-dot" style={{ background: row.dotColor, width: '10px', height: '10px' }}></div>
                  <label style={{ fontSize: '12px', minWidth: '130px' }}>{row.label}</label>
                  <div className={`val ${row.valueClass}`} style={{ fontSize: '14px' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

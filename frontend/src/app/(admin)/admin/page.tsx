'use client';

import { useState } from 'react';
import { AdminPageId } from '@/types';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export default function AdminPage() {
  const [activePage, setActivePage] = useState<AdminPageId>('dashboard');

  return (
    <>
      <AdminTopbar />
      <AdminSidebar activePage={activePage} onNavigate={setActivePage} />
      
      <main className="main" style={{ minHeight: 'calc(100vh - var(--topbar-h))', padding: '32px' }}>
        {/* TABLEAU DE BORD */}
        {activePage === 'dashboard' && (
          <div className="page-content animation-fade-in">
            <div className="page-title">
              <h1>Tableau de bord</h1>
              <p>Vue d'ensemble de la gestion des adhérents</p>
            </div>

            <div className="stat-grid admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginTop: '28px' }}>
              <div className="stat-card">
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon purple" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: 'white', background: '#7c3aed' }}><i className="fas fa-users"></i></div>
                  <div className="stat-trend" style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="fas fa-arrow-trend-up"></i> +12%</div>
                </div>
                <div className="stat-value" style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>1,284</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Adhérents</div>
              </div>
              <div className="stat-card">
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon orange" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: 'white', background: '#f97316' }}><i className="fas fa-clock"></i></div>
                  <div className="stat-trend" style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="fas fa-arrow-trend-up"></i> +5</div>
                </div>
                <div className="stat-value" style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>23</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Inscriptions en attente</div>
              </div>
              <div className="stat-card">
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon green" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: 'white', background: '#10b981' }}><i className="far fa-credit-card"></i></div>
                  <div className="stat-trend" style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="fas fa-arrow-trend-up"></i> +89</div>
                </div>
                <div className="stat-value" style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>1,156</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Cartes générées</div>
              </div>
              <div className="stat-card">
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon violet" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, color: 'white', background: '#8b5cf6' }}><i className="fas fa-rotate"></i></div>
                  <div className="stat-trend" style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="fas fa-arrow-trend-up"></i> +12</div>
                </div>
                <div className="stat-value" style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>45</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Renouvellements</div>
              </div>
            </div>

            <div className="section-card" style={{ background: 'white', borderRadius: 16, padding: 24, marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 18px 0' }}>Activités récentes</h3>
              <div className="activity-item admin-activity" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="activity-avatar blue-soft" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: '#dbeafe', color: '#3b82f6' }}><i className="fas fa-user-plus"></i></div>
                <div className="activity-info" style={{ flex: 1 }}>
                  <div className="aname" style={{ fontSize: 14, fontWeight: 700 }}>Marie Martin</div>
                  <div className="adesc" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>Nouvelle demande d'inscription</div>
                </div>
                <div className="activity-time" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Il y a 5 min</div>
              </div>
              <div className="activity-item admin-activity" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="activity-avatar green-soft" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: '#d1fae5', color: '#10b981' }}><i className="fas fa-circle-check"></i></div>
                <div className="activity-info" style={{ flex: 1 }}>
                  <div className="aname" style={{ fontSize: 14, fontWeight: 700 }}>Pierre Dubois</div>
                  <div className="adesc" style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>Inscription validée</div>
                </div>
                <div className="activity-time" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Il y a 12 min</div>
              </div>
              <div className="activity-item admin-activity" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="activity-avatar orange-soft" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: '#ffedd5', color: '#f97316' }}><i className="far fa-credit-card"></i></div>
                <div className="activity-info" style={{ flex: 1 }}>
                  <div className="aname" style={{ fontSize: 14, fontWeight: 700 }}>Tech Solutions SAS</div>
                  <div className="adesc" style={{ color: '#f97316', fontSize: 13, fontWeight: 500 }}>Carte générée</div>
                </div>
                <div className="activity-time" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Il y a 28 min</div>
              </div>
              <div className="activity-item admin-activity" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                <div className="activity-avatar blue-soft" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: '#dbeafe', color: '#3b82f6' }}><i className="fas fa-user"></i></div>
                <div className="activity-info" style={{ flex: 1 }}>
                  <div className="aname" style={{ fontSize: 14, fontWeight: 700 }}>Sophie Bernard</div>
                  <div className="adesc" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>Profil mis à jour</div>
                </div>
                <div className="activity-time" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Il y a 1h</div>
              </div>
            </div>
          </div>
        )}

        {/* INSCRIPTIONS */}
        {activePage === 'inscriptions' && (
          <div className="page-content animation-fade-in">
            <div className="page-title">
              <h1>Inscriptions</h1>
              <p>Gérer les demandes d'inscription en attente</p>
            </div>

            <div className="section-card" style={{ marginTop: 24, padding: 24, background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Demandes en attente <span className="admin-badge admin-badge-pending" style={{ marginLeft: 8, background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>23</span></h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" style={{ background: 'white', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>Tout refuser</button>
                  <button className="btn btn-primary">Tout valider</button>
                </div>
              </div>

              {[
                { name: 'Marie Martin', email: 'marie.martin@email.com', type: 'Physique', time: '5 min', avatar: 'purple-soft', icon: 'fa-user' },
                { name: 'Innova Group SARL', email: 'contact@innovagroup.fr', type: 'Moral', time: '2h', avatar: 'blue-soft', icon: 'fa-building' },
                { name: 'Thomas Leroy', email: 't.leroy@mail.com', type: 'Physique', time: '5h', avatar: 'green-soft', icon: 'fa-user' },
                { name: 'Céline Moreau', email: 'c.moreau@gmail.com', type: 'Physique', time: 'hier', avatar: 'orange-soft', icon: 'fa-user' },
              ].map((insc, idx) => (
                <div key={idx} className="insc-card" style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div className={`td-avatar ${insc.avatar}`} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...getAvatarStyle(insc.avatar) }}><i className={`fas ${insc.icon}`}></i></div>
                  <div className="insc-info" style={{ flex: 1 }}>
                    <div className="iname" style={{ fontSize: 15, fontWeight: 800 }}>{insc.name}</div>
                    <div className="imeta" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{insc.email} &nbsp;·&nbsp; {insc.type} &nbsp;·&nbsp; Soumis il y a {insc.time}</div>
                  </div>
                  <div className="insc-actions" style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-danger" style={{ background: '#fee2e2', color: 'var(--danger)' }}>Refuser</button>
                    <button className="btn btn-success" style={{ background: '#d1fae5', color: 'var(--success)' }}>Valider</button>
                    <button className="btn btn-primary">Voir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... Autres pages (Adhérents, Cartes, Communications, Documents) basées sur la structure HTML ... */}
        {/* Pour gagner de l'espace et du temps, je mets la structure de base. Je vais injecter le reste après. */}
        {activePage === 'adherents' && (
          <div className="page-content animation-fade-in">
            <div className="page-title">
              <h1>Adhérents</h1>
              <p>Gérer et rechercher les adhérents actifs</p>
            </div>
            
            <div className="search-filter-row" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '16px 20px', marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div className="search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: '9px 14px' }}>
                <i className="fas fa-search" style={{ color: 'var(--text-muted)' }}></i>
                <input type="text" placeholder="Rechercher par nom, email..." style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, width: '100%' }} />
              </div>
              <button className="filter-btn active" style={activeTabStyle}>Tous</button>
              <button className="filter-btn" style={inactiveTabStyle}><i className="fas fa-user"></i> Physique</button>
              <button className="filter-btn" style={inactiveTabStyle}><i className="far fa-building"></i> Moral</button>
            </div>
            <div className="results-count" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, fontWeight: 600 }}>5 adhérents trouvés</div>

            <div className="data-table" style={{ background: 'white', borderRadius: 16, marginTop: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Réf.</th>
                    <th style={thStyle}>Nom / Raison sociale</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Membre depuis</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ref: 'ADH001', name: 'Jean Dupont', subName: '', type: 'Physique', email: 'jean.dupont@email.com', tel: '06 12 34 56 78', statut: 'Actif', depuis: '15/03/2023', avatar: 'purple-soft', icon: 'fa-user' },
                    { ref: 'ADH002', name: 'Tech Solutions SAS', subName: 'Tech Solutions SAS', type: 'Moral', email: 'contact@techsolutions.fr', tel: '01 23 45 67 89', statut: 'Actif', depuis: '10/01/2024', avatar: 'blue-soft', icon: 'fa-building' },
                    { ref: 'ADH003', name: 'Marie Martin', subName: '', type: 'Physique', email: 'marie.martin@email.com', tel: '07 98 76 54 32', statut: 'Actif', depuis: '20/06/2025', avatar: 'green-soft', icon: 'fa-user' },
                  ].map((adh, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{adh.ref}</span></td>
                      <td style={tdStyle}>
                        <div className="td-name" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                          <div className={`td-avatar ${adh.avatar}`} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, ...getAvatarStyle(adh.avatar) }}><i className={`fas ${adh.icon}`}></i></div>
                          <div>
                            <div>{adh.name}</div>
                            {adh.subName && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{adh.subName}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ background: adh.type === 'Physique' ? '#dbeafe' : '#fef3c7', color: adh.type === 'Physique' ? '#3b82f6' : '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{adh.type}</span></td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13 }}>
                          <div><i className="far fa-envelope" style={{ color: 'var(--text-muted)', marginRight: 5 }}></i>{adh.email}</div>
                          <div style={{ marginTop: 3 }}><i className="fas fa-phone" style={{ color: 'var(--text-muted)', marginRight: 5 }}></i>{adh.tel}</div>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ background: '#d1fae5', color: '#10b981', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{adh.statut}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13 }}>{adh.depuis}</span></td>
                      <td style={tdStyle}>
                        <div className="td-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button className="icon-btn edit" style={iconBtnStyle('#dbeafe', '#3b82f6')}><i className="fas fa-pen"></i></button>
                          <button className="icon-btn del" style={iconBtnStyle('#fee2e2', '#ef4444')}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CARTES */}
        {activePage === 'cartes' && (
           <div className="page-content animation-fade-in">
             <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <div className="page-title">
                 <h1>Cartes d'adhérent</h1>
                 <p>Gérer et générer les cartes d'adhésion</p>
               </div>
               <button className="btn btn-primary" style={{ marginTop: 8 }}><i className="far fa-credit-card" style={{ marginRight: 6 }}></i>Générer une carte</button>
             </div>

             <div className="cartes-grid admin-cartes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginTop: 24 }}>
               {[
                 { name: 'Jean Dupont', img: 'blue-grad', badge: 'Physique', id: '2026-PP-001284', emit: '15/01/2026', exp: '15/01/2027', icon: 'fa-user' },
                 { name: 'Tech Solutions SAS', img: 'pink-grad', badge: 'Moral', id: '2026-PM-000567', emit: '10/02/2026', exp: '10/02/2027', icon: 'fa-building' },
                 { name: 'Marie Martin', img: 'indigo-grad', badge: 'Physique', id: '2025-PP-001156', emit: '20/06/2025', exp: '20/06/2026', icon: 'fa-user' }
               ].map((c, idx) => (
                 <div key={idx} className="carte-card" style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,.08)', overflow: 'hidden' }}>
                   <div className={`carte-visual ${c.img}`} style={{ height: 130, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 18, position: 'relative', background: getGradient(c.img) }}>
                     <div className="cv-icon" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 }}><i className={`fas ${c.icon}`}></i></div>
                     <div className="cv-badge" style={{ background: 'rgba(255,255,255,.25)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{c.badge}</div>
                     <div className="cv-name" style={{ position: 'absolute', bottom: 14, left: 18, color: 'white' }}>
                       <div className="cn" style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
                       <div className="cid" style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{c.id}</div>
                     </div>
                   </div>
                   <div className="carte-details" style={{ padding: '16px 18px' }}>
                     <div className="carte-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Émission</span><span style={{ fontWeight: 700 }}>{c.emit}</span></div>
                     <div className="carte-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Expiration</span><span style={{ fontWeight: 700 }}>{c.exp}</span></div>
                     <div className="carte-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Statut</span><span style={{ background: '#d1fae5', color: '#10b981', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Active</span></div>
                   </div>
                   <div className="carte-footer" style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                     <button className="btn btn-outline" style={{ flex: 1, fontSize: 12, background: 'white', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>Télécharger</button>
                     <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}>Renouveler</button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* COMMUNICATIONS */}
        {activePage === 'communications' && (
           <div className="page-content animation-fade-in">
             <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <div className="page-title">
                 <h1>Communications</h1>
                 <p>Envoyer des messages aux adhérents</p>
               </div>
               <button className="btn btn-primary" style={{ marginTop: 8 }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i>Nouvelle communication</button>
             </div>

             <div className="section-card" style={{ marginTop: 24, padding: 24, background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
               <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 18px 0' }}>Historique des communications</h3>

               {[
                 { title: "Rappel de renouvellement d'adhésion", meta: "Email · Envoyé à 1,156 adhérents · Taux d'ouverture: 68%", date: "15/04/2026", type: "email", icon: "fa-envelope", bg: "#dbeafe", color: "#3b82f6" },
                 { title: "Confirmation d'inscription - Pierre Dubois", meta: "SMS · Envoyé à 1 adhérent · Livré", date: "12/01/2026", type: "sms", icon: "fa-comment-sms", bg: "#d1fae5", color: "#10b981" },
                 { title: "Assemblée Générale 2026 - Convocation", meta: "Notification · Envoyé à tous les adhérents · Taux de lecture: 82%", date: "05/01/2026", type: "notif", icon: "fa-bell", bg: "#ede9fe", color: "#8b5cf6" },
               ].map((comm, idx) => (
                 <div key={idx} className="comm-card" style={{ background: 'white', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 16, border: '1px solid var(--border)' }}>
                   <div className="comm-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: comm.bg, color: comm.color }}><i className={`far ${comm.icon}`}></i></div>
                   <div className="comm-info" style={{ flex: 1 }}>
                     <div className="ctitle" style={{ fontSize: 15, fontWeight: 700 }}>{comm.title}</div>
                     <div className="cmeta" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{comm.meta}</div>
                   </div>
                   <div className="comm-date" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{comm.date}</div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* DOCUMENTS */}
        {activePage === 'documents' && (
           <div className="page-content animation-fade-in">
             <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <div className="page-title">
                 <h1>Documents</h1>
                 <p>Gérer les documents accessibles aux adhérents</p>
               </div>
               <button className="btn btn-primary" style={{ marginTop: 8 }}><i className="fas fa-upload" style={{ marginRight: 6 }}></i>Téléverser un document</button>
             </div>

             <div className="data-table" style={{ background: 'white', borderRadius: 16, marginTop: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                   <tr>
                     <th style={thStyle}>Nom du document</th>
                     <th style={thStyle}>Catégorie</th>
                     <th style={thStyle}>Taille</th>
                     <th style={thStyle}>Date d'ajout</th>
                     <th style={thStyle}>Ajouté par</th>
                     <th style={thStyle}>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {[
                     { name: 'Règlement intérieur 2026.pdf', cat: 'Règlements', catBg: '#fef3c7', catColor: '#b45309', size: '245 KB', date: '10/01/2026', by: 'Admin Système' },
                     { name: 'Formulaire adhésion.pdf', cat: 'Formulaires', catBg: '#d1fae5', catColor: '#065f46', size: '128 KB', date: '15/01/2026', by: 'Admin Système' },
                     { name: 'Compte-rendu AG 2025.pdf', cat: 'Comptes-rendus', catBg: '#dbeafe', catColor: '#1e40af', size: '1.2 MB', date: '20/12/2025', by: 'Secrétaire' },
                   ].map((doc, idx) => (
                     <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                       <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="doc-icon" style={{ width: 34, height: 34, background: '#dbeafe', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}><i className="fas fa-file-pdf"></i></div><span style={{ fontWeight: 700 }}>{doc.name}</span></div></td>
                       <td style={tdStyle}><span style={{ background: doc.catBg, color: doc.catColor, fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>{doc.cat}</span></td>
                       <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doc.size}</span></td>
                       <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--primary)' }}>{doc.date}</span></td>
                       <td style={tdStyle}><span style={{ fontSize: 13 }}>{doc.by}</span></td>
                       <td style={tdStyle}>
                         <div className="td-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <button className="icon-btn view-btn" style={iconBtnStyle('#ede9fe', 'var(--primary)')}><i className="fas fa-eye"></i></button>
                           <button className="icon-btn dl" style={iconBtnStyle('#d1fae5', '#10b981')}><i className="fas fa-download"></i></button>
                           <button className="icon-btn del" style={iconBtnStyle('#fee2e2', '#ef4444')}><i className="fas fa-trash"></i></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </main>
    </>
  );
}

// Helpers styles
const thStyle = { padding: '14px 18px', textAlign: 'left' as const, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' };
const tdStyle = { padding: '14px 18px', fontSize: 14, verticalAlign: 'middle' as const };
const inactiveTabStyle = { padding: '9px 18px', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 };
const activeTabStyle = { ...inactiveTabStyle, background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' };

function getAvatarStyle(type: string) {
  switch (type) {
    case 'purple-soft': return { background: '#ede9fe', color: 'var(--purple)' };
    case 'blue-soft': return { background: '#dbeafe', color: '#3b82f6' };
    case 'green-soft': return { background: '#d1fae5', color: '#10b981' };
    case 'orange-soft': return { background: '#ffedd5', color: '#f97316' };
    default: return { background: '#f3f4f6', color: '#9ca3af' };
  }
}

function getGradient(type: string) {
  switch (type) {
    case 'blue-grad': return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    case 'pink-grad': return 'linear-gradient(135deg, #ec4899, #f97316)';
    case 'indigo-grad': return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    default: return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
  }
}

function iconBtnStyle(bg: string, color: string) {
  return { width: 30, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: '.15s', background: bg, color: color };
}

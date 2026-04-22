'use client';

export default function CartePage() {
  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Ma Carte Adhérent</h2>
        <p>Téléchargez et gérez votre carte de membre</p>
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Membership Card Visual */}
        <div className="membership-card-visual">
          <div className="mc-header">
            <div>
              <div className="mc-logo">Gestion Adhérents</div>
              <div className="mc-type">Carte de Membre</div>
            </div>
            <div className="mc-qr">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="1" y="1" width="8" height="8" rx="1" stroke="white" strokeWidth="1.5" />
                <rect x="3" y="3" width="4" height="4" fill="white" />
                <rect x="13" y="1" width="8" height="8" rx="1" stroke="white" strokeWidth="1.5" />
                <rect x="15" y="3" width="4" height="4" fill="white" />
                <rect x="1" y="13" width="8" height="8" rx="1" stroke="white" strokeWidth="1.5" />
                <rect x="3" y="15" width="4" height="4" fill="white" />
                <rect x="13" y="13" width="3" height="3" fill="white" opacity="0.7" />
                <rect x="17" y="13" width="3" height="3" fill="white" opacity="0.7" />
                <rect x="13" y="17" width="3" height="3" fill="white" opacity="0.7" />
                <rect x="17" y="17" width="3" height="3" fill="white" opacity="0.7" />
              </svg>
            </div>
          </div>
          <div className="mc-name">Jean Dupont</div>
          <div className="mc-number">N° 2025-001234</div>
          <div className="mc-footer">
            <div>
              <div className="mc-expiry">Valide jusqu&apos;au</div>
              <div className="mc-date">15 Juin 2026</div>
            </div>
            <div className="mc-status">✓ Active</div>
          </div>
        </div>

        {/* Download Button */}
        <button className="btn btn-primary btn-full" style={{ marginBottom: 20, padding: '13px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger la carte (PDF)
        </button>

        {/* Info Cards */}
        <div className="grid-2">
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Informations Personnelles
              </div>
              {[
                { icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, label: 'Nom complet', value: 'Jean Dupont' },
                { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>, label: 'Email', value: 'jean.dupont@email.com' },
                { icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z" />, label: 'Téléphone', value: '+33 6 12 34 56 78' },
                { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>, label: 'Adresse', value: '123 Rue de la République, 75001 Paris' },
              ].map((row, i) => (
                <div key={i} className="info-row">
                  <div className="info-row-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                      {row.icon}
                    </svg>
                  </div>
                  <div><label>{row.label}</label><span>{row.value}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Détails de l&apos;Adhésion
              </div>
              {[
                { dotColor: 'var(--success)', label: 'Statut', value: 'Active', valueClass: 'green' },
                { dotColor: 'var(--primary)', label: "Type d'adhésion", value: 'Personne Physique', valueClass: '' },
                { dotColor: 'var(--accent)', label: "Date d'adhésion", value: '15 Juin 2025', valueClass: '' },
                { dotColor: 'var(--warning)', label: "Date d'expiration", value: '15 Juin 2026', valueClass: '' },
              ].map((row, i) => (
                <div key={i} className="detail-row">
                  <div className="detail-dot" style={{ background: row.dotColor }}></div>
                  <label>{row.label}</label>
                  <div className={`val ${row.valueClass}`}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advantages */}
        <div style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Vos Avantages Membres</div>
          <div className="advantages-grid">
            {[
              { icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>, title: 'Formations exclusives', desc: 'Accès prioritaire aux ateliers' },
              { icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />, title: 'Réductions partenaires', desc: "Jusqu'à 30% de remise" },
              { icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" /><path d="M2 2l20 20" /></>, title: 'Support prioritaire', desc: 'Assistance dédiée 7j/7' },
            ].map((adv, i) => (
              <div key={i} className="advantage-item">
                <div className="adv-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    {adv.icon}
                  </svg>
                </div>
                <div className="adv-text">
                  <h4>{adv.title}</h4>
                  <p>{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

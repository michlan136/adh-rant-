'use client';

import { useState } from 'react';

const documents = [
  { name: 'Guide des bénéfices adhérents 2026', type: 'PDF', cat: 'Guide', catClass: 'cat-guide', date: '18 Avril 2026', size: '2.5 MB' },
  { name: 'Règlement intérieur', type: 'PDF', cat: 'Réglementation', catClass: 'cat-reg', date: '10 Avril 2026', size: '1.8 MB' },
  { name: 'Catalogue formations 2026', type: 'PDF', cat: 'Formation', catClass: 'cat-formation', date: '5 Avril 2026', size: '3.2 MB' },
  { name: 'Liste des partenaires', type: 'PDF', cat: 'Partenaires', catClass: 'cat-partenaires', date: '1 Avril 2026', size: '1.2 MB' },
  { name: 'Facture adhésion 2025', type: 'PDF', cat: 'Facture', catClass: 'cat-facture', date: '15 Juin 2025', size: '0.8 MB' },
  { name: 'Attestation de membre', type: 'PDF', cat: 'Attestation', catClass: 'cat-attestation', date: '15 Juin 2025', size: '0.5 MB' },
  { name: 'Bulletin d\'information Mars 2026', type: 'PDF', cat: 'Newsletter', catClass: 'cat-newsletter', date: '1 Mars 2026', size: '2.1 MB' },
  { name: 'Plan d\'action annuel 2026', type: 'PDF', cat: 'Guide', catClass: 'cat-guide', date: '1 Janvier 2026', size: '4.5 MB' },
];

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

export default function DocumentsPage() {
  const [search, setSearch] = useState('');

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.cat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Mes Documents</h2>
        <p>Consultez et téléchargez vos documents</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
          </svg>
          Toutes les catégories
        </button>
      </div>

      {/* Stats */}
      <div className="doc-stats">
        <div className="doc-stat-card blue"><div className="label">Total Documents</div><div className="number">8</div></div>
        <div className="doc-stat-card purple"><div className="label">Téléchargés ce mois</div><div className="number">8</div></div>
        <div className="doc-stat-card green"><div className="label">Nouveaux cette semaine</div><div className="number">3</div></div>
      </div>

      {/* Table */}
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Catégorie</th>
              <th>Date</th>
              <th>Taille</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <tr key={i}>
                <td>
                  <div className="doc-name">
                    <div className="doc-icon"><DocIcon /></div>
                    <div className="doc-name-text">
                      <h4>{doc.name}</h4>
                      <p>{doc.type}</p>
                    </div>
                  </div>
                </td>
                <td><span className={`doc-cat ${doc.catClass}`}>{doc.cat}</span></td>
                <td>{doc.date}</td>
                <td>{doc.size}</td>
                <td>
                  <div className="doc-actions">
                    <div className="doc-action-btn" title="Aperçu">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div className="doc-action-btn" title="Télécharger">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

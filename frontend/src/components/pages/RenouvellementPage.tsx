'use client';

import { useState } from 'react';

type MemberType = 'physique' | 'morale';
type PayMethod = 'carte' | 'virement' | 'cheque';

export default function RenouvellementPage() {
  const [memberType, setMemberType] = useState<MemberType>('physique');
  const [payMethod, setPayMethod] = useState<PayMethod>('carte');

  const price = memberType === 'physique' ? 150 : 500;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Demander un renouvellement</h2>
        <p>Renouvelez votre adhésion en quelques étapes simples</p>
      </div>

      <div className="renew-layout">
        <div>
          {/* Type d'adhésion */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Type d&apos;adhésion</h3>
              <div className="type-cards">
                {/* Physique */}
                <div
                  className={`type-card ${memberType === 'physique' ? 'selected' : ''}`}
                  onClick={() => setMemberType('physique')}
                >
                  {memberType === 'physique' && (
                    <div className="selected-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                  )}
                  <div className="type-icon blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3>Personne Physique</h3>
                  <p>Adhésion individuelle</p>
                  <div className="price">150€<span>/an</span></div>
                </div>

                {/* Morale */}
                <div
                  className={`type-card ${memberType === 'morale' ? 'selected' : ''}`}
                  onClick={() => setMemberType('morale')}
                >
                  {memberType === 'morale' && (
                    <div className="selected-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                  )}
                  <div className="type-icon purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                  </div>
                  <h3>Personne Morale</h3>
                  <p>Adhésion entreprise/société</p>
                  <div className="price">500€<span>/an</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="card">
            <div className="card-body">
              <div className="pay-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Méthode de paiement
                </h3>

                {[
                  {
                    id: 'carte' as PayMethod,
                    iconClass: 'blue',
                    icon: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
                    title: 'Carte bancaire',
                    desc: 'Paiement sécurisé en ligne',
                  },
                  {
                    id: 'virement' as PayMethod,
                    iconClass: 'green',
                    icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
                    title: 'Virement bancaire',
                    desc: 'Paiement par virement',
                  },
                  {
                    id: 'cheque' as PayMethod,
                    iconClass: 'purple',
                    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></>,
                    title: 'Chèque',
                    desc: 'Paiement par chèque',
                  },
                ].map((method) => (
                  <div
                    key={method.id}
                    className={`pay-method ${payMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setPayMethod(method.id)}
                  >
                    <div className={`pm-icon ${method.iconClass}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {method.icon}
                      </svg>
                    </div>
                    <div>
                      <h4>{method.title}</h4>
                      <p>{method.desc}</p>
                    </div>
                    {payMethod === method.id && (
                      <div className="pay-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sticky Card */}
        <div className="summary-card">
          <h3>Récapitulatif</h3>
          <div className="summary-row">
            <label>Type d&apos;adhésion</label>
            <span style={{ fontWeight: 600 }}>{memberType === 'physique' ? 'Personne Physique' : 'Personne Morale'}</span>
          </div>
          <div className="summary-row"><label>Durée</label><span style={{ fontWeight: 600 }}>1 an</span></div>
          <div className="summary-row"><label>Date de début</label><span style={{ fontWeight: 600 }}>16 Juin 2026</span></div>
          <div className="summary-row"><label>Date de fin</label><span style={{ fontWeight: 600 }}>16 Juin 2027</span></div>
          <div className="summary-row"><label>Montant</label><span>{price}€</span></div>
          <div className="summary-row"><label>TVA (0%)</label><span>0€</span></div>
          <div className="summary-total">
            <label>Total</label>
            <span className="amount">{price}€</span>
          </div>
          <button className="btn btn-primary btn-full" style={{ padding: 13 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Procéder au renouvellement
          </button>
          <ul className="benefits-list">
            <li>Formations exclusives</li>
            <li>Réductions partenaires</li>
            <li>Support prioritaire</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

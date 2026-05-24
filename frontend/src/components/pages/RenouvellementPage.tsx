'use client';

import { useState, useEffect, useRef } from 'react';
import ReceiptModal from '@/components/ReceiptModal';
import { useAuth } from '@/context/AuthContext';

type PayMethod = 'carte' | 'virement' | 'cheque';
type Step = 'check' | 'documents' | 'payment' | 'confirm';

interface EligibilityData {
  eligible: boolean;
  message: string;
  days_remaining: number | null;
  expiry_date?: string;
  type_adherent?: string;
  date_debut?: string;
  date_fin?: string;
  active_renewal?: {
    id: number;
    statut: string;
    statut_paiement: string;
  }
}

export default function RenouvellementPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('check');
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<PayMethod>('carte');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [docs, setDocs] = useState<{ [key: string]: File | null }>({
    identite: null, photo: null, rc: null, patente: null
  });
  const fileRefs = {
    identite: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null),
    rc: useRef<HTMLInputElement>(null),
    patente: useRef<HTMLInputElement>(null),
    recu: useRef<HTMLInputElement>(null),
  };
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [senderInfo, setSenderInfo] = useState({ nom: '', banque: '', date: '' });
  const [cardType, setCardType] = useState<'cmi' | 'visa' | 'mastercard'>('cmi');

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/adherents/me/renouvellement/check', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEligibility(data);
          
          if (data.active_renewal) {
            const r = data.active_renewal;
            if (r.statut === 'attente_docs') setStep('documents'); // Juste pour info, mais il a déjà envoyé
            else if (r.statut === 'docs_approuves' && r.statut_paiement === 'en attente') setStep('payment');
            else if (r.statut_paiement === 'payé') setStep('confirm');
            else if (r.statut === 'validé') setStep('confirm');
          } else if (data.eligible) {
            setStep('documents');
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    check();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isPhysique = eligibility?.type_adherent === 'Physique';
  const price = isPhysique ? 150 : 500;

  const requiredDocs = isPhysique
    ? [{ key: 'identite', label: 'Pièce d\'identité (CIN)' }, { key: 'photo', label: 'Photo d\'identité' }]
    : [{ key: 'rc', label: 'Registre de commerce (RC)' }, { key: 'patente', label: 'Patente' }, { key: 'identite', label: 'CIN du dirigeant' }];

  const allDocsUploaded = requiredDocs.every(d => docs[d.key]);

  const handleSubmit = async () => {
    // Cas spécial: Upload du paiement seul après approbation docs
    if (eligibility?.active_renewal?.statut === 'docs_approuves' && step === 'payment') {
      if (!paymentProof) {
        showToast('Veuillez télécharger une preuve de paiement.', 'error');
        return;
      }
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('preuve_paiement', paymentProof);
        const res = await fetch(`/api/adherents/me/renouvellement/${eligibility.active_renewal.id}/paiement`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` },
          body: formData
        });
        if (res.ok) {
          setStep('confirm');
          showToast('✅ Preuve de paiement envoyée !', 'success');
        } else {
          const err = await res.json();
          showToast(`❌ ${err.detail || 'Erreur'}`, 'error');
        }
      } catch { showToast('❌ Erreur de connexion', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    // Cas standard: Premier envoi (Docs + Optionnel Paiement si Carte/Déjà fait)
    if (payMethod !== 'carte' && !paymentProof && step === 'payment' && payMethod !== 'virement') {
      showToast('Veuillez télécharger une preuve de paiement.', 'error');
      return;
    }

    if (payMethod === 'virement' && (!senderInfo.nom || !senderInfo.banque)) {
      showToast('Veuillez remplir les informations de l\'expéditeur.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('mode_paiement', payMethod);
      formData.append('montant', price.toString());
      if (docs.identite) formData.append('document_identite', docs.identite);
      if (docs.photo) formData.append('document_photo', docs.photo);
      if (docs.rc) formData.append('document_rc', docs.rc);
      if (docs.patente) formData.append('document_patente', docs.patente);
      if (paymentProof) formData.append('preuve_paiement', paymentProof);
      if (payMethod === 'virement') {
        formData.append('sender_nom', senderInfo.nom);
        formData.append('sender_banque', senderInfo.banque);
      }
      if (payMethod === 'carte') {
        formData.append('card_type', cardType);
      }

      const res = await fetch('/api/adherents/me/renouvellement', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}` },
        body: formData
      });
      if (res.ok) {
        setStep('confirm');
        showToast('✅ Demande envoyée avec succès !', 'success');
      } else {
        const err = await res.json();
        showToast(`❌ ${err.detail || 'Erreur'}`, 'error');
      }
    } catch { showToast('❌ Erreur de connexion', 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        Vérification de l&apos;éligibilité...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeR = eligibility?.active_renewal;

  // CAS: ATTENTE DOCS APPROVAL
  if (activeR && activeR.statut === 'attente_docs') {
    return (
      <div className="page-enter">
        <div className="page-header"><h2>Renouvellement</h2><p>En cours de traitement</p></div>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 28 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Documents envoyés</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
            Vos documents pour le renouvellement {today.getFullYear()} ont été envoyés. 
            L&apos;administration est en train de les vérifier. Vous recevrez une notification dès qu&apos;ils seront approuvés pour procéder au paiement.
          </p>
          <button onClick={() => window.location.href='/'} style={{ marginTop: 24, padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600, cursor: 'pointer' }}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // CAS: PAIEMENT EN ATTENTE VALIDATION
  if (activeR && activeR.statut_paiement === 'payé') {
    return (
      <div className="page-enter">
        <div className="page-header"><h2>Renouvellement</h2><p>Validation finale</p></div>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 28 }}>💳</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Paiement en cours de vérification</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
            Nous avons bien reçu votre preuve de paiement. L&apos;administration procède à la validation finale de votre adhésion.
          </p>
          <button onClick={() => window.location.href='/'} style={{ marginTop: 24, padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600, cursor: 'pointer' }}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // NON ÉLIGIBLE
  if (eligibility && !eligibility.eligible && !activeR) {
    return (
      <div className="page-enter">
        <div className="page-header"><h2>Renouvellement</h2><p>Vérification de votre éligibilité</p></div>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 28 }}>⏳</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Renouvellement non disponible</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{eligibility.message}</p>
          {eligibility.expiry_date && (
            <div style={{ marginTop: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>Date d&apos;expiration</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{new Date(eligibility.expiry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{eligibility.days_remaining} jours restants</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SUCCESS / CONFIRMATION
  if (step === 'confirm' || (activeR && activeR.statut === 'validé')) {
    return (
      <div className="page-enter">
        <ReceiptModal 
          onClose={() => setShowReceipt(false)}
          data={showReceipt ? {
            ref: `REC-${activeR?.id || '0000'}`,
            nom: user?.name || '',
            adherent_id: user?.reference || '',
            date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            mode: activeR?.statut_paiement === 'validé' ? 'virement' : payMethod,
            montant: price,
            annee: new Date().getFullYear()
          } : null}
        />

        <div className="page-header"><h2>Succès !</h2><p>Votre adhésion est renouvelée</p></div>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', display: 'grid', placeItems: 'center', margin: '0 auto 24px', fontSize: 40 }}>✅</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Renouvellement validé</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15, marginBottom: 32 }}>
            Félicitations ! Votre adhésion pour l&apos;année {new Date().getFullYear()} est maintenant active et valide. Vous pouvez télécharger votre reçu ci-dessous.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              onClick={() => setShowReceipt(true)}
              style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            >
              📥 Télécharger mon reçu de paiement (PDF)
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPES PROGRESSIVES
  const steps: { key: Step; label: string }[] = [
    { key: 'documents', label: 'Documents' },
    { key: 'payment', label: 'Paiement' },
  ];

  return (
    <div className="page-enter">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '14px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h2>Demander un renouvellement</h2>
        <p>Renouvelez votre adhésion en quelques étapes</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
              background: step === s.key ? '#4f46e5' : (steps.findIndex(x => x.key === step) > i ? '#10b981' : '#e2e8f0'),
              color: step === s.key || steps.findIndex(x => x.key === step) > i ? 'white' : '#94a3b8'
            }}>
              {steps.findIndex(x => x.key === step) > i ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: step === s.key ? '#1e293b' : '#94a3b8' }}>{s.label}</span>
            {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: steps.findIndex(x => x.key === step) > i ? '#10b981' : '#e2e8f0' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* STEP: Documents */}
          {step === 'documents' && (
            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                📄 Documents requis
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                {activeR ? "Documents envoyés. Attendez l'approbation." : `Veuillez importer les documents nécessaires pour votre type d'adhésion (${isPhysique ? 'Personne Physique' : 'Personne Morale'})`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {requiredDocs.map(doc => (
                  <div key={doc.key} style={{
                    padding: 16, borderRadius: 14, border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: docs[doc.key] ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-2)',
                    borderColor: docs[doc.key] ? '#10b981' : '#e2e8f0', transition: 'all .2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: docs[doc.key] ? '#d1fae5' : '#fff', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                        {docs[doc.key] ? '✅' : '📁'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{doc.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{docs[doc.key] ? (docs[doc.key] as File).name : 'Format PDF, JPG, PNG (Max 5MB)'}</div>
                      </div>
                    </div>
                    <input type="file" hidden ref={fileRefs[doc.key as keyof typeof fileRefs]} onChange={e => setDocs({ ...docs, [doc.key]: e.target.files?.[0] || null })} accept=".pdf,.jpg,.jpeg,.png" />
                    <button onClick={() => fileRefs[doc.key as keyof typeof fileRefs].current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {docs[doc.key] ? 'Changer' : 'Parcourir'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>💡</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Note importante :</span> L&apos;administration vérifiera vos documents avant de débloquer l&apos;étape du paiement.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button 
                  disabled={!allDocsUploaded || submitting}
                  onClick={() => setStep('payment')}
                  style={{ borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, background: allDocsUploaded ? '#4f46e5' : '#e2e8f0', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Continuer vers le paiement
                </button>
              </div>
            </div>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>💳 Méthode de paiement</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { id: 'carte', label: 'Carte Bancaire', icon: '💳' },
                  { id: 'virement', label: 'Virement', icon: '🏦' },
                  { id: 'cheque', label: 'Chèque', icon: '📝' }
                ].map(m => (
                  <div key={m.id} onClick={() => setPayMethod(m.id as PayMethod)} style={{
                    padding: 16, borderRadius: 16, border: '2px solid', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                    background: payMethod === m.id ? '#f5f3ff' : 'white',
                    borderColor: payMethod === m.id ? '#4f46e5' : '#e2e8f0'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: payMethod === m.id ? '#4f46e5' : '#64748b' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {payMethod === 'carte' && (
                <div style={{ marginTop: 20, background: 'var(--surface-2)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>Type de carte</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    {[
                      { id: 'cmi', label: 'CMI' },
                      { id: 'visa', label: 'Visa' },
                      { id: 'mastercard', label: 'Mastercard' }
                    ].map(c => (
                      <div key={c.id} onClick={() => setCardType(c.id as any)} style={{
                        flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                        borderColor: cardType === c.id ? '#4f46e5' : '#e2e8f0',
                        background: cardType === c.id ? '#f5f3ff' : 'white',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cardType === c.id ? '#4f46e5' : '#64748b' }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Numéro de carte</label>
                    <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Expiration</label>
                      <input type="text" placeholder="MM/AA" maxLength={5} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>CVV</label>
                      <input type="text" placeholder="123" maxLength={4} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'virement' && (
                <div style={{ marginTop: 20, background: '#f0fdf4', borderRadius: 14, padding: 20, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Coordonnées du destinataire (Fixes) :</p>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, margin: '0 0 20px' }}>
                    <strong>RIB :</strong> 360 021 0000030512320011 11<br />
                    <strong>Bénéficiaire :</strong> Association CCS
                  </p>
                  
                  <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 12 }}>Informations de l&apos;expéditeur :</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nom complet de l&apos;expéditeur</label>
                        <input type="text" value={senderInfo.nom} onChange={e => setSenderInfo({...senderInfo, nom: e.target.value})} placeholder="Ex: Ahmed Benani" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Banque émettrice</label>
                        <input type="text" value={senderInfo.banque} onChange={e => setSenderInfo({...senderInfo, banque: e.target.value})} placeholder="Ex: Attijariwafa Bank" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'cheque' && (
                <div style={{ marginTop: 20, background: '#fff7ed', borderRadius: 14, padding: 20, border: '1px solid #ffedd5' }}>
                  <p style={{ fontSize: 13, color: '#9a3412', lineHeight: 1.8, margin: 0 }}>
                    Veuillez libeller votre chèque à l'ordre de <strong>Association CCS</strong> et l'envoyer ou le déposer au bureau de l'association.
                  </p>
                  <div style={{ marginTop: 16, borderTop: '1px solid #ffedd5', paddingTop: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', display: 'block', marginBottom: 8 }}>
                      📸 Télécharger une photo du chèque
                    </label>
                    <div 
                      onClick={() => fileRefs.recu.current?.click()}
                      style={{ 
                        border: '2px dashed #ffedd5', 
                        borderRadius: 12, 
                        padding: '16px', 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        background: paymentProof ? '#fff7ed' : 'transparent'
                      }}
                    >
                      <input type="file" ref={fileRefs.recu} hidden onChange={(e) => setPaymentProof(e.target.files?.[0] || null)} accept="image/*,application/pdf" />
                      {paymentProof ? (
                        <div style={{ fontSize: 13, color: '#9a3412', fontWeight: 600 }}>✅ {paymentProof.name}</div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#9a3412' }}>Cliquez pour sélectionner le fichier</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep('documents')} style={{ flex: 1, padding: 14, borderRadius: 12, border: '2px solid #e2e8f0', background: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  ← Retour
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 700, fontSize: 14, cursor: submitting ? 'wait' : 'pointer' }}>
                  {submitting ? '⏳ Envoi en cours...' : `Confirmer le paiement — ${price} MAD`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Récapitulatif Sticky */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,.06)', position: 'sticky', top: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>📋 Récapitulatif</h3>
          {[
            { label: 'Type d\'adhésion', value: isPhysique ? 'Personne Physique' : 'Personne Morale' },
            { label: 'Durée', value: '1 an' },
            { label: 'Date de début', value: fmtDate(today) },
            { label: 'Date de fin', value: fmtDate(nextYear) },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Montant</span><span style={{ fontWeight: 600 }}>{price} MAD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>TVA (0%)</span><span>0 MAD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 16 }}>
            <span style={{ fontWeight: 800 }}>Total</span>
            <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: 20 }}>{price} MAD</span>
          </div>
          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 14, marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, margin: '0 0 6px' }}>Avantages inclus :</p>
            {['Formations exclusives', 'Réductions partenaires', 'Support prioritaire', 'Carte adhérent renouvelée'].map((b, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ color: '#10b981' }}>✓</span> {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

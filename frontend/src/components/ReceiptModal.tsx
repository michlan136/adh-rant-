'use client';

import React from 'react';

interface ReceiptData {
  ref: string;
  nom: string;
  adherent_id: string;
  date: string;
  mode: string;
  montant: number;
  annee: number;
}

interface ReceiptModalProps {
  data: ReceiptData | null;
  onClose: () => void;
}

export default function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = document.getElementById('receipt-content')?.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Reçu de Paiement - ${data.ref}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 60px; }
            .logo-section h1 { margin: 0; color: #1e1b4b; font-size: 28px; letter-spacing: 1px; }
            .logo-section p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
            .title-section { text-align: right; }
            .title-section h2 { margin: 0; color: #1e1b4b; font-size: 20px; font-weight: 800; }
            .title-section p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; }
            .info-box h3 { font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px; }
            .info-box p { margin: 2px 0; font-size: 15px; font-weight: 700; color: #1e293b; }
            .info-box span { font-size: 13px; color: #64748b; font-weight: 500; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 12px; border-bottom: 1px solid #eee; }
            td { padding: 20px 0; border-bottom: 1px solid #eee; }
            .desc h4 { margin: 0; font-size: 15px; color: #1e293b; }
            .desc p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
            .amount { text-align: right; font-weight: 700; color: #1e293b; }

            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
            .total-row { display: flex; justify-content: space-between; width: 200px; }
            .total-row.grand { margin-top: 10px; padding-top: 10px; border-top: 2px solid #1e1b4b; }
            .total-row label { font-size: 13px; color: #64748b; }
            .total-row span { font-weight: 800; font-size: 16px; color: #1e1b4b; }

            @media print {
              body { padding: 0; }
              .receipt-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">${content}</div>
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 850, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Aperçu du Reçu</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrint} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              🖨️ Imprimer / PDF
            </button>
            <button onClick={onClose} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>

      <div id="receipt-content" style={{ padding: 48, overflowY: 'auto' }}>
          <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 60 }}>
            <div className="logo-section">
              <h1 style={{ margin: 0, color: '#1e1b4b', fontSize: 28, letterSpacing: 1 }}>ADH-RANT</h1>
              {/* C'est ici que la correction a été faite (fontSize au lieu de font_size) 👇 */}
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Portail Membre Officiel</p>
            </div>
            <div className="title-section" style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b', fontSize: 20, fontWeight: 800 }}>REÇU DE PAIEMENT</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Réf: #{data.ref}</p>
            </div>
          </div>

          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 60 }}>
            <div className="info-box">
              <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, letterSpacing: 1 }}>ÉMIS POUR</h3>
              <p style={{ margin: '2px 0', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{data.nom}</p>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Identifiant: {data.adherent_id}</span>
            </div>
            <div className="info-box" style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, letterSpacing: 1 }}>DÉTAILS DE TRANSACTION</h3>
              <p style={{ margin: '2px 0', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Date: {data.date}</p>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Mode: {data.mode.toUpperCase()}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', paddingBottom: 12, borderBottom: '1px solid #eee' }}>DESCRIPTION</th>
                <th style={{ textAlign: 'right', fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', paddingBottom: 12, borderBottom: '1px solid #eee' }}>MONTANT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                  <h4 style={{ margin: 0, font_size: 15, color: '#1e293b' }}>Renouvellement d'adhésion annuelle</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Période {data.annee} - {data.annee + 1}</p>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #eee' }}>{data.montant} MAD</td>
              </tr>
            </tbody>
          </table>

          <div className="totals" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: 200 }}>
              <label style={{ fontSize: 13, color: '#64748b' }}>Sous-total</label>
              <span style={{ fontWeight: 600 }}>{data.montant} MAD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, marginTop: 10, paddingTop: 10, borderTop: '2px solid #1e1b4b' }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Total Payé</label>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#1e1b4b' }}>{data.montant} MAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import os

tsx_content = """'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import FileUploader from './FileUploader';

interface InscriptionFormProps {
  onSuccess?: (data: any) => void;
}

export default function InscriptionForm({ onSuccess }: InscriptionFormProps) {
  // Referentiels dynamiques
  const [villes, setVilles] = useState<any[]>([]);
  const [formesJuridiques, setFormesJuridiques] = useState<any[]>([]);
  const [cas, setCas] = useState<any[]>([]);
  const [effectifs, setEffectifs] = useState<any[]>([]);
  const [servicesCategories, setServicesCategories] = useState<any>({});
  const [evenements, setEvenements] = useState<any[]>([]);

  // State principal
  const [formeJuridique, setFormeJuridique] = useState('Sélectionner...');
  
  // Nouveaux champs + existants
  const [formData, setFormData] = useState({
    nomContact: '', prenomContact: '', emailContact: '', telGsm: '', telFixe: '', adresse: '', ville_id: '',
    activitePrincipale: '', activiteSecondaire: '', secteurActivite: '',
    
    // Personne Morale (Société)
    raisonSociale: '', abreviation: '', siteWeb: '', facebook: '',
    dateCreation: '', ice: '', rc: '', capital: '', ca_id: '', effectif_id: '', pourcentageEtrangers: '', nationalite: '',
    nomDirigeant: '', fonctionDirigeant: '', gsmDirigeant: '', emailDirigeant: '', linkedinDirigeant: '', facebookDirigeant: '',
    paysImportation: '', paysExportation: '', marquesRepresentees: '', franchises: '',
    
    // Personne Physique & Auto-entrepreneur
    cin: '', dateNaissance: '', profession: '', numeroPatente: '', numeroRegistre: '', numeroAutoEntrepreneur: '',
    
    // Association
    objetAssociation: '', nomPresident: '', listeMembresBureau: '',
  });

  const [servicesDemandes, setServicesDemandes] = useState<Record<string, number[]>>({});
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [vRes, fRes, cRes, eRes, sRes, evtRes] = await Promise.all([
          fetchWithAuth('/api/referentiels/villes'),
          fetchWithAuth('/api/referentiels/formes-juridiques'),
          fetchWithAuth('/api/referentiels/cas'),
          fetchWithAuth('/api/referentiels/effectifs'),
          fetchWithAuth('/api/referentiels/services'),
          fetchWithAuth('/api/admin/evenements?page=1&size=50')
        ]);
        setVilles(vRes || []);
        setFormesJuridiques(fRes || []);
        setCas(cRes || []);
        setEffectifs(eRes || []);
        setServicesCategories(sRes || {});
        setEvenements(evtRes?.items || []);
      } catch (err) {
        console.error("Erreur chargement référentiels", err);
      }
    }
    loadRefs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      nom_contact: formData.nomContact || formData.nomPresident || formData.nomDirigeant || 'Non renseigné',
      prenom_contact: formData.prenomContact || '-',
      email_contact: formData.emailContact,
      telephone_contact: formData.telGsm,
      tel_fixe: formData.telFixe,
      adresse: formData.adresse,
      ville_id: formData.ville_id ? parseInt(formData.ville_id) : null,
      activite_principale: formData.activitePrincipale,
      activite_secondaire: formData.activiteSecondaire,
      secteur_activite: formData.secteurActivite || null,

      forme_juridique_id: formesJuridiques.find(f => f.titre === formeJuridique)?.id || null,

      // Société / Personne Morale
      raison_sociale_entreprise: formData.raisonSociale || formData.nomContact || null,
      abreviation: formData.abreviation || null,
      site_web: formData.siteWeb || null,
      facebook_entreprise: formData.facebook || null,
      date_creation: formData.dateCreation || null,
      ice: formData.ice || null,
      rc: formData.rc || null,
      capital: formData.capital || null,
      ca_id: formData.ca_id ? parseInt(formData.ca_id) : null,
      effectif_id: formData.effectif_id ? parseInt(formData.effectif_id) : null,
      pourcentage_etrangers: formData.pourcentageEtrangers || null,
      nationalite: formData.nationalite || null,

      nom_dirigeant: formData.nomDirigeant || formData.nomPresident || null,
      fonction_dirigeant: formData.fonctionDirigeant || null,
      gsm_dirigeant: formData.gsmDirigeant || null,
      email_dirigeant: formData.emailDirigeant || null,
      linkedin_dirigeant: formData.linkedinDirigeant || null,
      facebook_dirigeant: formData.facebookDirigeant || null,

      pays_importation: formData.paysImportation || null,
      pays_exportation: formData.paysExportation || null,
      marques_representees: formData.marquesRepresentees || null,
      franchises: formData.franchises || null,

      // Personne Physique
      cin: formData.cin || null,
      date_naissance: formData.dateNaissance || null,
      profession: formData.profession || null,
      numero_patente: formData.numeroPatente || null,
      numero_registre: formData.numeroRegistre || null,
      
      // Auto-entrepreneur
      numero_auto_entrepreneur: formData.numeroAutoEntrepreneur || null,
      
      // Association
      objet_association: formData.objetAssociation || null,
      nom_president: formData.nomPresident || null,
      liste_membres_bureau: formData.listeMembresBureau || null,

      documents: JSON.stringify(uploadedUrls),
      services_demandes: servicesDemandes,
      evenement_ids: selectedEventIds,
    };

    try {
      const res = await fetchWithAuth('/api/admin/inscriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      alert(`Erreur lors de l'enregistrement : ${err?.message || 'Email peut-être déjà utilisé.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category: string, id: number) => {
    setServicesDemandes((prev) => {
      const currentList = prev[category] || [];
      const isSelected = currentList.includes(id);
      return {
        ...prev,
        [category]: isSelected ? currentList.filter(item => item !== id) : [...currentList, id]
      };
    });
  };

  const showForm = formeJuridique !== 'Sélectionner...';
  
  // Helper functions
  const isPhysique = formeJuridique === 'Personne physique';
  const isSociete = ['Société', 'SARL', 'SA', 'Personne morale'].includes(formeJuridique);
  const isAutoEnt = formeJuridique === 'Auto-entrepreneur';
  const isAssoc = formeJuridique === 'Association';

  const selectStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: '14px',
    background: 'var(--surface-2)', outline: 'none'
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <h2 style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
        Nouvelle Inscription Adhérent
      </h2>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Forme Juridique *</label>
          <select 
            value={formeJuridique} 
            onChange={(e) => {
               setFormeJuridique(e.target.value);
               setUploadedUrls({});
            }}
            style={selectStyle}
          >
            <option>Sélectionner...</option>
            <option value="Personne physique">Personne physique</option>
            <option value="Société">Société (Personne Morale)</option>
            <option value="Auto-entrepreneur">Auto-entrepreneur</option>
            <option value="Association">Association</option>
            {formesJuridiques.map((f: any) => (
              !['Personne physique', 'Société', 'Auto-entrepreneur', 'Association'].includes(f.titre) && (
                <option key={f.id} value={f.titre}>{f.titre}</option>
              )
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          
          {/* ======================================================== */}
          {/* 1. PERSONNE PHYSIQUE */}
          {/* ======================================================== */}
          {isPhysique && (
            <>
              {/* Informations de base */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>1. Informations de base</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Nom complet *</label><input type="text" name="nomContact" value={formData.nomContact} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>CIN *</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} required /></div>
                  </div>
                  <div className="form-group"><label>Adresse</label><input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} /></div>
                  <div className="grid-2">
                    <div className="form-group"><label>Ville</label>
                      <select name="ville_id" value={formData.ville_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner une ville...</option>
                        {villes.map((v: any) => (<option key={v.id} value={v.id}>{v.titre}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Téléphone *</label><input type="text" name="telGsm" value={formData.telGsm} onChange={handleInputChange} required /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Email *</label><input type="email" name="emailContact" value={formData.emailContact} onChange={handleInputChange} required /></div>
                  </div>
                </div>
              </div>

              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>2. Informations spécifiques (Personne Physique)</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Activité principale</label><input type="text" name="activitePrincipale" value={formData.activitePrincipale} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Secteur d’activité</label><input type="text" name="secteurActivite" value={formData.secteurActivite} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Numéro de registre (si existant)</label><input type="text" name="numeroRegistre" value={formData.numeroRegistre} onChange={handleInputChange} /></div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* 2. SOCIETE (PERSONNE MORALE) */}
          {/* ======================================================== */}
          {isSociete && (
            <>
              {/* Informations de base */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>1. Informations de base</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Raison sociale *</label><input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Abréviation</label><input type="text" name="abreviation" value={formData.abreviation} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group"><label>Adresse</label><input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} /></div>
                  <div className="grid-2">
                    <div className="form-group"><label>Ville</label>
                      <select name="ville_id" value={formData.ville_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner une ville...</option>
                        {villes.map((v: any) => (<option key={v.id} value={v.id}>{v.titre}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label>Site web</label><input type="text" name="siteWeb" value={formData.siteWeb} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Facebook</label><input type="text" name="facebook" value={formData.facebook} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Téléphone *</label><input type="text" name="telGsm" value={formData.telGsm} onChange={handleInputChange} required /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Email *</label><input type="email" name="emailContact" value={formData.emailContact} onChange={handleInputChange} required /></div>
                  </div>
                </div>
              </div>

              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>2. Informations spécifiques</h3>
                  
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>📌 Légal & Financier</h4>
                  <div className="grid-2">
                    <div className="form-group"><label>Date de création</label><input type="date" name="dateCreation" value={formData.dateCreation} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>ICE</label><input type="text" name="ice" value={formData.ice} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label>Registre du Commerce (RC)</label><input type="text" name="rc" value={formData.rc} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Capital en DH</label><input type="text" name="capital" value={formData.capital} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group">
                    <label>Chiffre d’affaires</label>
                    <select name="ca_id" value={formData.ca_id} onChange={handleInputChange} style={selectStyle}>
                      <option value="">Sélectionner...</option>
                      {cas.map((c: any) => (<option key={c.id} value={c.id}>{c.titre}</option>))}
                    </select>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 12 }}>📌 Ressources Humaines</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Effectif total</label>
                      <select name="effectif_id" value={formData.effectif_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner...</option>
                        {effectifs.map((e: any) => (<option key={e.id} value={e.id}>{e.titre}</option>))}
                      </select>
                    </div>
                    <div className="form-group"><label>% d’étrangers</label><input type="text" name="pourcentageEtrangers" value={formData.pourcentageEtrangers} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group"><label>Nationalité dominante</label><input type="text" name="nationalite" value={formData.nationalite} onChange={handleInputChange} /></div>

                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 12 }}>📌 Dirigeant</h4>
                  <div className="grid-2">
                    <div className="form-group"><label>Nom du dirigeant</label><input type="text" name="nomDirigeant" value={formData.nomDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Fonction</label><input type="text" name="fonctionDirigeant" value={formData.fonctionDirigeant} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label>GSM</label><input type="text" name="gsmDirigeant" value={formData.gsmDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Email</label><input type="email" name="emailDirigeant" value={formData.emailDirigeant} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>LinkedIn</label><input type="text" name="linkedinDirigeant" value={formData.linkedinDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Facebook</label><input type="text" name="facebookDirigeant" value={formData.facebookDirigeant} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 12 }}>📌 International & Distribution</h4>
                  <div className="grid-2">
                    <div className="form-group"><label>Pays d’importation</label><input type="text" name="paysImportation" value={formData.paysImportation} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Pays d’exportation</label><input type="text" name="paysExportation" value={formData.paysExportation} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Marques représentées</label><input type="text" name="marquesRepresentees" value={formData.marquesRepresentees} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Franchises</label><input type="text" name="franchises" value={formData.franchises} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>

              {/* Services demandés */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>3. Services demandés</h3>
                  {Object.entries(servicesCategories).map(([category, services]: [string, any]) => (
                    <div key={category} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>{category}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {services.map((svc: any) => (
                          <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="checkbox"
                              checked={(servicesDemandes[category] || []).includes(svc.id)}
                              onChange={() => handleCheckboxChange(category, svc.id)}
                            />
                            {svc.titre}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* 3. AUTO-ENTREPRENEUR */}
          {/* ======================================================== */}
          {isAutoEnt && (
            <>
              {/* Informations de base */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>1. Informations de base</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Nom complet *</label><input type="text" name="nomContact" value={formData.nomContact} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>CIN *</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} required /></div>
                  </div>
                  <div className="form-group"><label>Adresse</label><input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} /></div>
                  <div className="grid-2">
                    <div className="form-group"><label>Ville</label>
                      <select name="ville_id" value={formData.ville_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner une ville...</option>
                        {villes.map((v: any) => (<option key={v.id} value={v.id}>{v.titre}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Téléphone *</label><input type="text" name="telGsm" value={formData.telGsm} onChange={handleInputChange} required /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Email *</label><input type="email" name="emailContact" value={formData.emailContact} onChange={handleInputChange} required /></div>
                  </div>
                </div>
              </div>

              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>2. Informations spécifiques</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Activité</label><input type="text" name="activitePrincipale" value={formData.activitePrincipale} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Numéro d’auto-entrepreneur</label><input type="text" name="numeroAutoEntrepreneur" value={formData.numeroAutoEntrepreneur} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Secteur d’activité</label><input type="text" name="secteurActivite" value={formData.secteurActivite} onChange={handleInputChange} /></div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* 4. ASSOCIATION */}
          {/* ======================================================== */}
          {isAssoc && (
            <>
              {/* Informations de base */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>1. Informations de base</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Nom de l’association *</label><input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Adresse</label><input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label>Ville</label>
                      <select name="ville_id" value={formData.ville_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner une ville...</option>
                        {villes.map((v: any) => (<option key={v.id} value={v.id}>{v.titre}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Téléphone *</label><input type="text" name="telGsm" value={formData.telGsm} onChange={handleInputChange} required /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Email *</label><input type="email" name="emailContact" value={formData.emailContact} onChange={handleInputChange} required /></div>
                  </div>
                </div>
              </div>

              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>2. Informations spécifiques</h3>
                  <div className="grid-2">
                    <div className="form-group"><label>Date de création</label><input type="date" name="dateCreation" value={formData.dateCreation} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Objet de l’association</label><input type="text" name="objetAssociation" value={formData.objetAssociation} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Nom du président</label><input type="text" name="nomPresident" value={formData.nomPresident} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                    <label>Liste des membres du bureau (Texte)</label>
                    <textarea name="listeMembresBureau" value={formData.listeMembresBureau} onChange={handleInputChange} style={{...selectStyle, height: '80px', resize: 'vertical'}} placeholder="Nom - Rôle..." />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* DOCUMENTS REQUIS (Commun avec variables) */}
          {/* ======================================================== */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>Documents requis</h3>
              <div className="grid-2">
                {isPhysique && (
                  <>
                    <FileUploader label="Registre de commerce (original)" fileId="rc_doc" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, rc_doc: url }))} />
                    <FileUploader label="Taxe professionnelle (original)" fileId="taxe_pro" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, taxe_pro: url }))} />
                    <FileUploader label="Copie de la CNI" fileId="cni" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, cni: url }))} />
                    <FileUploader label="Photo d'identité" fileId="photo" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, photo: url }))} />
                  </>
                )}
                {isSociete && (
                  <>
                    <FileUploader label="Statuts de la société (original)" fileId="statuts" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, statuts: url }))} />
                    <FileUploader label="Registre de commerce Modèle J (original)" fileId="rc_j" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, rc_j: url }))} />
                    <FileUploader label="Taxe professionnelle (original)" fileId="taxe_pro" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, taxe_pro: url }))} />
                    <FileUploader label="Copie de la CNI" fileId="cni" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, cni: url }))} />
                    <FileUploader label="Photo d'identité" fileId="photo" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, photo: url }))} />
                  </>
                )}
                {isAutoEnt && (
                  <>
                    <FileUploader label="Copie de la CNI" fileId="cni" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, cni: url }))} />
                    <FileUploader label="Carte d'auto-entrepreneur" fileId="carte_auto" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, carte_auto: url }))} />
                    <FileUploader label="Photo d'identité" fileId="photo" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, photo: url }))} />
                    <FileUploader label="Taxe professionnelle" fileId="taxe_pro" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, taxe_pro: url }))} />
                  </>
                )}
                {isAssoc && (
                  <>
                    <FileUploader label="Statuts de l'association" fileId="statuts" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, statuts: url }))} />
                    <FileUploader label="Liste des membres du bureau" fileId="liste_membres_doc" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, liste_membres_doc: url }))} />
                    <FileUploader label="Récépissé de dépôt final" fileId="recepisse" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, recepisse: url }))} />
                    <FileUploader label="Procès-verbal de la dernière AG" fileId="pv_ag" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, pv_ag: url }))} />
                    <FileUploader label="Copie de la CNI du responsable" fileId="cni_resp" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, cni_resp: url }))} />
                    <FileUploader label="Photo d'identité" fileId="photo" onUploadSuccess={(url) => setUploadedUrls(p => ({ ...p, photo: url }))} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ÉVÉNEMENTS DISPONIBLES */}
          {/* ======================================================== */}
          {evenements.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>Événements ({selectedEventIds.length} sélectionné(s))</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {evenements.map((evt: any) => (
                    <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', background: selectedEventIds.includes(evt.id) ? 'var(--primary-glow)' : 'transparent', borderColor: selectedEventIds.includes(evt.id) ? 'var(--primary)' : 'var(--border)' }} onClick={() => setSelectedEventIds(prev => prev.includes(evt.id) ? prev.filter(id => id !== evt.id) : [...prev, evt.id])}>
                      <input type="checkbox" checked={selectedEventIds.includes(evt.id)} onChange={() => {}} style={{ width: '18px', height: '18px' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{evt.titre}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(evt.date_debut).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="submit" disabled={submitting} style={{ padding: '12px 32px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '100px', fontSize: '15px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s' }}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
"""

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "w", encoding="utf-8") as f:
    f.write(tsx_content)

print("InscriptionForm rewritten successfully.")

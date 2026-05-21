'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

const FORMES_JURIDIQUES = [
  'Sélectionner...',
  'Personne physique',
  'Société',
  'Auto-entrepreneur',
  'Association',
  'Autre'
];

const DOCUMENTS_REQUIS: Record<string, { docs: string[], frais: string[] }> = {
  'Personne physique': {
    docs: ['Registre de commerce (original)', 'Taxe professionnelle (original)', 'Copie de la CNI', 'Photo d’identité'],
    frais: ['100 DH (carte professionnelle)', '100 DH (attestation d’exercice)', '500 DH (carte d’adhésion)']
  },
  'Société': {
    docs: ['Statuts de la société (original)', 'Registre de commerce Modèle J (original)', 'Taxe professionnelle (original)', 'Copie de la CNI', 'Photo d’identité'],
    frais: ['300 DH (carte professionnelle)', '200 DH (attestation d\'exercice)', '1000 DH (SARL) ou 2000 DH (SA) pour l\'adhésion']
  },
  'Auto-entrepreneur': {
    docs: ['Copie de la CNI', 'Copie de la carte d’auto-entrepreneur', 'Photo d’identité', 'Taxe professionnelle', 'Certificat d’inscription au registre'],
    frais: ['100 DH (attestation d’exercice)']
  },
  'Association': {
    docs: ['Statuts de l’association', 'Liste des membres du bureau', 'Récépissé de dépôt final', 'Procès-verbal de la dernière AG'],
    frais: []
  }
};

const SERVICES_CATEGORIES = {
  'Événementiels': ['Salon', 'Séminaire', 'Journée d\'information'],
  'Publication': ['Flash info', 'Enconews', 'Massa Souss Iktissad', 'Annuaire pro'],
  'Formation': ['Cycle court', 'Cycle long'],
  'Prospection': ['BtoB', 'Délégation étrangère', 'Calendrier foires', 'Opportunité', 'Mission à l\'étranger'],
  'Assistance TPE': ['Aide au montage', 'Aide démarrage', 'Diagnostic'],
  'Guichet': ['ASMEX', 'Maroc PME', 'Dar Al Moukawil', 'OMPIC', 'ISM', 'Centre de médiation'],
  'Location salles': ['Amphithéâtre', 'Salle polyvalente', 'Salle conférence', 'Salle formation', 'Salle exposition'],
};

export default function InscriptionForm() {
  const [formeJuridique, setFormeJuridique] = useState(FORMES_JURIDIQUES[0]);

  // État global du formulaire
  const [formData, setFormData] = useState({
    nom: '', prenom: '', adresse: '', ville: '', telGsm: '', telFixe: '', email: '',
    activitePrincipale: '', activiteSecondaire: '',
    raisonSociale: '', abreviation: '', siteWeb: '', facebook: '',
    dateCreation: '', ice: '', rc: '', capital: '', chiffreAffaires: '',
    effectif: '', pourcentageEtrangers: '', nationalite: '',
    nomDirigeant: '', fonctionDirigeant: '', gsmDirigeant: '', linkedinDirigeant: '', emailDirigeant: '', facebookDirigeant: '',
    paysImportation: '', paysExportation: '', marquesRepresentees: '', franchises: '',
    cin: '', dateNaissance: '', profession: '', numeroPatente: ''
  });

  const [servicesDemandes, setServicesDemandes] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [evenements, setEvenements] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    fetchWithAuth('/api/admin/evenements')
      .then((data) => setEvenements(data))
      .catch(() => setEvenements([]));
  }, []);

  const handleEventCheckbox = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const uploadedUrls: Record<string, string> = {};
    try {
      // Upload each file
      for (const [docName, file] of Object.entries(docFiles)) {
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          const upRes = await fetch('/api/admin/upload-doc', {
            method: 'POST',
            body: fd
          });
          if (upRes.ok) {
            const data = await upRes.json();
            uploadedUrls[docName] = data.filepath;
          }
        }
      }
    } catch (err) {
      console.error("Erreur upload", err);
      alert("Erreur lors du téléversement des documents.");
      setSubmitting(false);
      return;
    }

    const payload = {
      // Informations de base
      nom_contact: formData.nom,
      prenom_contact: formData.prenom,
      email_contact: formData.email,
      telephone_contact: formData.telGsm,
      tel_fixe: formData.telFixe,
      adresse: formData.adresse,
      ville: formData.ville,
      activite_principale: formData.activitePrincipale,
      activite_secondaire: formData.activiteSecondaire,

      // Forme juridique
      forme_juridique: formeJuridique,

      // Personne Morale
      raison_sociale_entreprise: formData.raisonSociale || null,
      abreviation: formData.abreviation || null,
      site_web: formData.siteWeb || null,
      facebook_entreprise: formData.facebook || null,
      date_creation: formData.dateCreation || null,
      ice: formData.ice || null,
      rc: formData.rc || null,
      capital: formData.capital || null,
      chiffre_affaires: formData.chiffreAffaires || null,
      effectif: formData.effectif || null,
      pourcentage_etrangers: formData.pourcentageEtrangers || null,
      nationalite: formData.nationalite || null,

      // Dirigeant
      nom_dirigeant: formData.nomDirigeant || null,
      fonction_dirigeant: formData.fonctionDirigeant || null,
      gsm_dirigeant: formData.gsmDirigeant || null,
      email_dirigeant: formData.emailDirigeant || null,
      linkedin_dirigeant: formData.linkedinDirigeant || null,
      facebook_dirigeant: formData.facebookDirigeant || null,

      // International
      pays_importation: formData.paysImportation || null,
      pays_exportation: formData.paysExportation || null,
      marques_representees: formData.marquesRepresentees || null,
      franchises: formData.franchises || null,

      // Personne Physique
      cin: formData.cin || null,
      date_naissance: formData.dateNaissance || null,
      profession: formData.profession || null,
      numero_patente: formData.numeroPatente || null,

      // Documents
      documents: JSON.stringify(uploadedUrls),

      // Services
      services_demandes: servicesDemandes,

      // Événements sélectionnés
      evenement_ids: selectedEventIds,
    };

    try {
      const res = await fetchWithAuth('/api/admin/inscriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      alert(
        `Inscription créée et enregistrée en base !\n\nEmail : ${res.email}\nMot de passe généré : ${res.password_genere}\n\nCes identifiants ont été sauvegardés.`
      );
    } catch (err: any) {
      alert(`Erreur lors de l'enregistrement : ${err?.message || 'Email peut-être déjà utilisé.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isPersonneMorale = ['Société', 'Association', 'Autre'].includes(formeJuridique);
  const isPersonnePhysique = ['Personne physique', 'Auto-entrepreneur'].includes(formeJuridique);
  const showForm = formeJuridique !== 'Sélectionner...';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (service: string) => {
    setServicesDemandes((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };



  // Styles réutilisables pour simuler les inputs de globals.css sur les selects
  const selectStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: '14px',
    background: 'var(--surface-2)', outline: 'none'
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <h2 style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
        Création d'une nouvelle Inscription
      </h2>

      <form onSubmit={handleSubmit}>
        {/* SÉLECTION FORME JURIDIQUE */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Forme Juridique *</label>
              <select
                value={formeJuridique}
                onChange={(e) => setFormeJuridique(e.target.value)}
                style={selectStyle}
                required
              >
                {FORMES_JURIDIQUES.map((forme) => (
                  <option key={forme} value={forme}>{forme}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="page-enter">
            {/* BLOC 1 : Informations de base */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>1. Informations de base</h3>
                </div>

                <div className="grid-2">
                  <div className="form-group"><label>Nom *</label><input type="text" name="nom" value={formData.nom} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label>Prénom *</label><input type="text" name="prenom" value={formData.prenom} onChange={handleInputChange} required /></div>
                </div>
                
                <div className="form-group"><label>Adresse</label><input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} /></div>
                
                <div className="grid-3">
                  <div className="form-group"><label>Ville</label><input type="text" name="ville" value={formData.ville} onChange={handleInputChange} /></div>
                  <div className="form-group"><label>Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label>Téléphone (GSM) *</label><input type="tel" name="telGsm" value={formData.telGsm} onChange={handleInputChange} required /></div>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Tél Fixe</label><input type="tel" name="telFixe" value={formData.telFixe} onChange={handleInputChange} /></div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Secteur d'activité</h4>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Activité principale</label><input type="text" name="activitePrincipale" value={formData.activitePrincipale} onChange={handleInputChange} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Activité secondaire</label><input type="text" name="activiteSecondaire" value={formData.activiteSecondaire} onChange={handleInputChange} /></div>
                </div>
              </div>
            </div>

            {/* BLOC 2 : Informations Spécifiques */}
            {isPersonneMorale && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="far fa-building"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Informations Spécifiques (Personne Morale)</h3>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Identité</h4>
                  <div className="grid-2">
                    <div className="form-group"><label>Raison sociale *</label><input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Abréviation</label><input type="text" name="abreviation" value={formData.abreviation} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Site web</label><input type="url" name="siteWeb" value={formData.siteWeb} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Facebook</label><input type="url" name="facebook" value={formData.facebook} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Légal & Financier</h4>
                  <div className="grid-3">
                    <div className="form-group"><label>Date de création</label><input type="date" name="dateCreation" value={formData.dateCreation} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>ICE</label><input type="text" name="ice" value={formData.ice} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Registre du Commerce (RC)</label><input type="text" name="rc" value={formData.rc} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Capital en DH</label><input type="number" name="capital" value={formData.capital} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                      <label>Chiffre d'affaires</label>
                      <select name="chiffreAffaires" value={formData.chiffreAffaires} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner...</option>
                        <option value="Supérieur à 3M">Supérieur à 3M</option>
                        <option value="De 3M à 50M">De 3M à 50M</option>
                        <option value="Plus de 50M">Plus de 50M</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Ressources Humaines</h4>
                  <div className="grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Effectif total</label>
                      <select name="effectif" value={formData.effectif} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner...</option>
                        <option value="1-10">1-10</option>
                        <option value="10-50">10-50</option>
                        <option value="51-200">51-200</option>
                        <option value="+200">+200</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>% d'étrangers</label><input type="number" name="pourcentageEtrangers" value={formData.pourcentageEtrangers} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Nationalité dominante</label><input type="text" name="nationalite" value={formData.nationalite} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Contact Dirigeant</h4>
                  <div className="grid-3">
                    <div className="form-group"><label>Nom dirigeant</label><input type="text" name="nomDirigeant" value={formData.nomDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Fonction</label><input type="text" name="fonctionDirigeant" value={formData.fonctionDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>GSM Dirigeant</label><input type="tel" name="gsmDirigeant" value={formData.gsmDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Email Dirigeant</label><input type="email" name="emailDirigeant" value={formData.emailDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>LinkedIn</label><input type="url" name="linkedinDirigeant" value={formData.linkedinDirigeant} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Facebook</label><input type="url" name="facebookDirigeant" value={formData.facebookDirigeant} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>International & Distribution</h4>
                  <div className="grid-2">
                    <div className="form-group"><label>Pays d'importation</label><input type="text" name="paysImportation" value={formData.paysImportation} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Pays d'exportation</label><input type="text" name="paysExportation" value={formData.paysExportation} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Marques représentées</label><input type="text" name="marquesRepresentees" value={formData.marquesRepresentees} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Franchises</label><input type="text" name="franchises" value={formData.franchises} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* BLOC 2 BIS : Informations Spécifiques Personne Physique */}
            {isPersonnePhysique && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="far fa-id-card"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Informations Spécifiques (Personne Physique)</h3>
                  </div>

                  <div className="grid-2">
                    <div className="form-group"><label>CIN *</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Date de naissance</label><input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleInputChange} /></div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Profession / Fonction</label><input type="text" name="profession" value={formData.profession} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>N° Patente (Si applicable)</label><input type="text" name="numeroPatente" value={formData.numeroPatente} onChange={handleInputChange} /></div>
                  </div>
                  
                  <div className="grid-2" style={{ marginTop: 24 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>ICE (Si auto-entrepreneur)</label><input type="text" name="ice" value={formData.ice} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Registre du Commerce (RC)</label><input type="text" name="rc" value={formData.rc} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* BLOC 4 : Événements disponibles */}
            {evenements.length > 0 && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>4. Événements ({selectedEventIds.length} sélectionné(s))</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sélectionnez les événements auxquels cet adhérent souhaite participer.</p>

                  <div className="grid-2" style={{ gap: '12px' }}>
                    {evenements.map((evt: any) => (
                      <label key={evt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: selectedEventIds.includes(evt.id) ? 'var(--primary-glow)' : 'var(--surface-2)', border: selectedEventIds.includes(evt.id) ? '1.5px solid var(--primary)' : '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', transition: '.15s' }}>
                        <input
                          type="checkbox"
                          checked={selectedEventIds.includes(evt.id)}
                          onChange={() => handleEventCheckbox(evt.id)}
                          style={{ marginTop: 2, width: 15, height: 15, accentColor: 'var(--primary)', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{evt.titre}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Date(evt.date_evenement).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BLOC 5 : Services demandés */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                    <i className="fas fa-briefcase"></i>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>5. Services demandés</h3>
                </div>

                <div className="grid-3" style={{ gap: '20px' }}>
                  {Object.entries(SERVICES_CATEGORIES).map(([category, services]) => (
                    <div key={category} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{category}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {services.map((service) => (
                          <label key={service} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={servicesDemandes.includes(service)}
                              onChange={() => handleCheckboxChange(service)}
                              style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BLOC 6 : Documents et Frais */}
            {formeJuridique !== 'Sélectionner...' && formeJuridique !== 'Autre' && DOCUMENTS_REQUIS[formeJuridique] && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="fas fa-file-invoice"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>6. Documents Requis et Frais</h3>
                  </div>

                  <div className="grid-2" style={{ gap: '20px' }}>
                    {/* Colonne 1: Documents à téléverser */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Documents à importer</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {DOCUMENTS_REQUIS[formeJuridique].docs.map((docName) => (
                          <div key={docName}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{docName} *</label>
                            <input 
                              type="file" 
                              required
                              onChange={(e) => setDocFiles({...docFiles, [docName]: e.target.files ? e.target.files[0] : null})}
                              style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', fontSize: 13 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Colonne 2: Frais d'inscription */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Frais d'inscription</h4>
                      <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {DOCUMENTS_REQUIS[formeJuridique].frais.map((frais, idx) => (
                          <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{frais}</li>
                        ))}
                        {DOCUMENTS_REQUIS[formeJuridique].frais.length === 0 && (
                          <li style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aucun frais pour cette forme juridique.</li>
                        )}
                      </ul>
                      <div style={{ marginTop: '20px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                        <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-info-circle"></i> Note d'information
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
                          Veuillez fournir les justificatifs demandés. Les documents originaux peuvent être demandés lors du retrait de la carte.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOUTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px 30px', fontSize: '14px', opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
              >
                <i className={submitting ? 'fas fa-spinner fa-spin' : 'fas fa-check'}></i>
                {submitting ? ' Enregistrement en cours...' : " Enregistrer l'inscription"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

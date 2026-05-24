'use client';

import { useState, useEffect } from 'react';
import { AdminPageId } from '@/types';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { fetchWithAuth } from '@/lib/api';
import InscriptionForm from '@/components/admin/InscriptionForm';
import WhatsAppBroadcastForm from '@/components/admin/WhatsAppBroadcastForm';

export default function AdminPage() {
  const [activePage, setActivePage] = useState<AdminPageId>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [adherents, setAdherents] = useState<any[]>([]);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [cartes, setCartes] = useState<any[]>([]);
  const [renouvellements, setRenouvellements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Nouveaux états
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [showNewInscModal, setShowNewInscModal] = useState(false);
  const [newInscForm, setNewInscForm] = useState({ nom_contact: '', prenom_contact: '', email_contact: '', telephone_contact: '', raison_sociale_entreprise: '' });

  // Nouveaux états pour Adhérents (Recherche, Filtre, Édition)
  const [searchQuery, setSearchQuery] = useState('');
  const [cartesSearchQuery, setCartesSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [editingAdherent, setEditingAdherent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Nouveaux états pour Communications
  const [communications, setCommunications] = useState<any[]>([]);
  const [evenements, setEvenements] = useState<any[]>([]);
  const [showCommModal, setShowCommModal] = useState(false);
  
  // Nouveaux états pour Événements
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    titre: '',
    date_evenement: '',
    heure_debut: '',
    heure_fin: '',
    categorie: 'Conférence',
    lieu: '',
    description: '',
    places_limitees: ''
  });
  const [commForm, setCommForm] = useState({
    titre: '',
    canal: 'Email',
    contenu: '',
    cible: 'tous',
    evenement_id: '',
    adherent_ids: [] as number[],
    file: null as File | null
  });
  const [whatsappQueue, setWhatsappQueue] = useState<any[]>([]);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [sentWhatsappIds, setSentWhatsappIds] = useState<string[]>([]);
  // Sous-onglet Communications : 'historique' | 'whatsapp' | 'autre'
  const [commSubTab, setCommSubTab] = useState<'historique' | 'whatsapp'>('historique');

  // États pour les cibles de communication (2 niveaux)
  const [ciblesData, setCiblesData] = useState<any[]>([]);
  const [commCibleType, setCommCibleType] = useState<string>('');
  const [commCibleElementId, setCommCibleElementId] = useState<string>('');
  const [cibleAdherentsPreview, setCibleAdherentsPreview] = useState<any[]>([]);
  const [loadingCiblePreview, setLoadingCiblePreview] = useState(false);

  // Nouveaux états pour Documents
  const [globalDocuments, setGlobalDocuments] = useState<any[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ nom_fichier: '', categorie: 'Règlements', file: null as File | null });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Modal credentials après validation
  const [credentials, setCredentials] = useState<{ email: string; password: string | null } | null>(null);


  const handleRefuser = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) return;
    try {
      await fetchWithAuth(`/api/admin/demandes/${id}/refuser`, { method: 'POST' });
      setDemandes(demandes.filter(d => d.id !== id));
      const s = await fetchWithAuth('/api/admin/stats');
      setStats(s);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du refus');
    }
  };

  const handleValider = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/api/admin/demandes/${id}/valider`, { method: 'POST' });
      setDemandes(demandes.filter(d => d.id !== id));
      const s = await fetchWithAuth('/api/admin/stats');
      setStats(s);
      setCredentials({ email: res.email, password: res.password_genere || null });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation');
    }
  };

  const handleCreateInsc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/admin/inscriptions', {
        method: 'POST',
        body: JSON.stringify(newInscForm)
      });
      alert(`Inscription créée et validée automatiquement !\nEmail : ${res.email}\nMot de passe : ${res.password_genere}`);
      setShowNewInscModal(false);
      setNewInscForm({ nom_contact: '', prenom_contact: '', email_contact: '', telephone_contact: '', raison_sociale_entreprise: '' });
      const s = await fetchWithAuth('/api/admin/stats');
      setStats(s);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de l\'inscription. L\'email est peut-être déjà utilisé.');
    }
  };

  const handlePrint = (frontId: string, backId: string) => {
    const frontEl = document.getElementById(frontId);
    const backEl = document.getElementById(backId);
    if (!frontEl || !backEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression Carte</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; }
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

  const handleUpdateAdherent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdherent) return;
    try {
      await fetchWithAuth(`/api/admin/adherents/${editingAdherent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nom: editingAdherent.nom,
          prenom: editingAdherent.prenom,
          raison_sociale: editingAdherent.raison_sociale,
          email: editingAdherent.email,
          telephone: editingAdherent.telephone,
          statut: editingAdherent.statut,
          ice: editingAdherent.ice,
          adresse: editingAdherent.adresse,
          cin: editingAdherent.cin,
          date_naissance: editingAdherent.date_naissance,
          profession: editingAdherent.profession,
          numero_patente: editingAdherent.numero_patente,
          tax_professionnelle: editingAdherent.tax_professionnelle,
          description_activite: editingAdherent.description_activite,
          donnees_extra: editingAdherent.donnees_extra,
        }),
      });
      alert('Adhérent mis à jour !');
      setEditingAdherent(null);
      // Reload adherents
      const data = await fetchWithAuth('/api/admin/adherents');
      setAdherents(data);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAdherent = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet adhérent et son compte de connexion ? Cette action est irréversible.')) return;
    try {
      await fetchWithAuth(`/api/admin/adherents/${id}`, { method: 'DELETE' });
      // Update local state to avoid refetching
      setAdherents(adherents.filter(a => a.id !== id));
      const s = await fetchWithAuth('/api/admin/stats');
      setStats(s);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression de l\'adhérent');
    }
  };

  const handleApprouverRenouvellement = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/api/admin/renouvellements/${id}/approuver`, { method: 'POST' });
      alert(res.message);
      const rens = await fetchWithAuth('/api/admin/renouvellements');
      setRenouvellements(rens);
      const s = await fetchWithAuth('/api/admin/stats');
      setStats(s);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleRefuserRenouvellement = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce renouvellement ?')) return;
    try {
      await fetchWithAuth(`/api/admin/renouvellements/${id}/refuser`, { method: 'POST' });
      alert('Renouvellement refusé');
      const rens = await fetchWithAuth('/api/admin/renouvellements');
      setRenouvellements(rens);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du refus');
    }
  };



  const handleRenouveler = async (carteId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir créer une demande de renouvellement pour cette carte ?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/cartes/${carteId}/renouveler`, { method: 'POST' });
      alert(res.message);
      // Recharge les cartes pour refléter le changement (inactive/active)
      const data = await fetchWithAuth('/api/admin/cartes');
      setCartes(data);
    } catch (err: any) {
      console.error(err);
      alert(err.detail || 'Erreur lors du renouvellement');
    }
  };

  const handleTelechargerCarte = async (carteId: number, nomAdherent: string) => {
    const element = document.getElementById(`carte-${carteId}`);
    if (!element) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `carte_${nomAdherent.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erreur de téléchargement", error);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.file || !docForm.nom_fichier || !docForm.categorie) {
      alert('Veuillez remplir tous les champs et sélectionner un fichier.');
      return;
    }
    setUploadingDoc(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', docForm.file);
      const uploadRes = await fetch('/api/admin/upload-doc', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Erreur lors de l\'upload du fichier');
      const uploadData = await uploadRes.json();

      // 2. Create document entry
      const docFormData = new FormData();
      docFormData.append('nom_fichier', docForm.nom_fichier);
      docFormData.append('chemin_fichier', uploadData.filepath);
      docFormData.append('categorie', docForm.categorie);
      docFormData.append('taille', (docForm.file.size / 1024).toFixed(1) + ' KB');
      
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: docFormData,
      });
      if (!res.ok) throw new Error('Erreur lors de la création du document');
      
      alert('Document ajouté avec succès !');
      setShowDocModal(false);
      setDocForm({ nom_fichier: '', categorie: 'Règlements', file: null });
      // Refresh list
      const docs = await fetchWithAuth('/api/admin/documents');
      setGlobalDocuments(docs);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await fetchWithAuth(`/api/admin/documents/${id}`, { method: 'DELETE' });
      setGlobalDocuments(globalDocuments.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmitCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commForm.cible === 'evenement' && !commForm.evenement_id) {
      alert("Veuillez sélectionner un événement.");
      return;
    }
    if (commForm.cible === 'partie' && commForm.adherent_ids.length === 0) {
      alert("Veuillez sélectionner au moins un adhérent.");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('titre', commForm.titre);
      formData.append('canal', commForm.canal);
      formData.append('contenu', commForm.contenu);
      formData.append('cible', commForm.cible);
      if (commForm.evenement_id) formData.append('evenement_id', commForm.evenement_id);
      if (commForm.adherent_ids.length > 0) formData.append('adherent_ids', JSON.stringify(commForm.adherent_ids));
      if (commForm.file) formData.append('file', commForm.file);

      const res = await fetchWithAuth('/api/admin/communications', {
        method: 'POST',
        body: formData
      });
      
      setShowCommModal(false);
      setCommForm({ titre: '', canal: 'Email', contenu: '', cible: 'tous', evenement_id: '', adherent_ids: [], file: null });
      
      const comms = await fetchWithAuth('/api/admin/communications');
      setCommunications(comms);

      if (res.whatsapp_links && res.whatsapp_links.length > 0) {
        setWhatsappQueue(res.whatsapp_links);
        setSentWhatsappIds([]);
        setShowWhatsappModal(true);
        
        // If only 1 recipient, open immediately
        if (res.whatsapp_links.length === 1) {
          window.open(res.whatsapp_links[0].link, '_blank');
        }
      } else {
        alert(`Communication envoyée avec succès !`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la communication");
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        places_limitees: eventForm.places_limitees ? parseInt(eventForm.places_limitees) : null,
        heure_debut: eventForm.heure_debut || null,
        heure_fin: eventForm.heure_fin || null,
      };
      await fetchWithAuth('/api/admin/evenements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert('Événement créé avec succès !');
      setShowEventModal(false);
      setEventForm({ titre: '', date_evenement: '', heure_debut: '', heure_fin: '', categorie: 'Conférence', lieu: '', description: '', places_limitees: '' });
      const evts = await fetchWithAuth('/api/admin/evenements');
      setEvenements(evts);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'événement");
    }
  };

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const payload = {
        ...editingEvent,
        places_limitees: editingEvent.places_limitees ? parseInt(editingEvent.places_limitees) : null,
        heure_debut: editingEvent.heure_debut || null,
        heure_fin: editingEvent.heure_fin || null,
      };
      console.log('Update Event Payload:', payload);
      await fetchWithAuth(`/api/admin/evenements/${editingEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('Événement mis à jour avec succès !');
      setEditingEvent(null);
      const evts = await fetchWithAuth('/api/admin/evenements');
      setEvenements(evts);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de l'événement");
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      await fetchWithAuth(`/api/admin/evenements/${eventId}`, {
        method: 'DELETE'
      });
      alert('Événement supprimé avec succès !');
      const evts = await fetchWithAuth('/api/admin/evenements');
      setEvenements(evts);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de l'événement");
    }
  };


  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (activePage === 'dashboard' || activePage === 'inscriptions') {
          const data = await fetchWithAuth('/api/admin/stats');
          setStats(data);

          if (activePage === 'inscriptions') {
            const d = await fetchWithAuth('/api/admin/demandes');
            setDemandes(d);
          }
        }
        if (activePage === 'adherents') {
          const data = await fetchWithAuth('/api/admin/adherents');
          setAdherents(data);
        }
        if (activePage === 'cartes') {
          const data = await fetchWithAuth('/api/admin/cartes');
          setCartes(data);
        }
        if (activePage === 'communications') {
          const comms = await fetchWithAuth('/api/admin/communications');
          setCommunications(comms);
          const evts = await fetchWithAuth('/api/admin/evenements');
          setEvenements(evts);
          if (adherents.length === 0) {
            const adh = await fetchWithAuth('/api/admin/adherents');
            setAdherents(adh);
          }
        }
        if (activePage === 'documents') {
          const docs = await fetchWithAuth('/api/admin/documents');
          setGlobalDocuments(docs);
        }
        if (activePage === 'evenements') {
          const evts = await fetchWithAuth('/api/admin/evenements');
          setEvenements(evts);
        }
        if (activePage === 'renouvellements') {
          const rens = await fetchWithAuth('/api/admin/renouvellements');
          setRenouvellements(rens);
        }

      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activePage]);

  // Filtrage des adhérents
  const filteredAdherents = adherents.filter(adh => {
    const matchesFilter = filterType === 'Tous' || adh.type_adherent === filterType;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (adh.nom && adh.nom.toLowerCase().includes(lowerQuery)) ||
      (adh.sub_nom && adh.sub_nom.toLowerCase().includes(lowerQuery)) ||
      (adh.reference && adh.reference.toLowerCase().includes(lowerQuery)) ||
      (adh.email && adh.email.toLowerCase().includes(lowerQuery)) ||
      (adh.telephone && adh.telephone.toLowerCase().includes(lowerQuery));
      
    return matchesFilter && matchesSearch;
  });

  const filteredCartes = cartes.filter(c => {
    const lowerQuery = cartesSearchQuery.toLowerCase();
    return !cartesSearchQuery || 
      (c.nom_adherent && c.nom_adherent.toLowerCase().includes(lowerQuery)) ||
      (c.numero_carte && c.numero_carte.toLowerCase().includes(lowerQuery));
  });

  return (
    <>
      <AdminTopbar />
      <AdminSidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="main" style={{ minHeight: 'calc(100vh - var(--topbar-h))', padding: '32px' }}>
        {/* TABLEAU DE BORD */}
        {activePage === 'dashboard' && (
          <div className="page-content animation-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', padding: '24px', borderRadius: '20px' }}>
            <div className="page-title">
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Tableau de bord</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Vue d'ensemble de la gestion des adhérents</p>
            </div>

            <div className="stat-grid admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '24px' }}>
              {/* Card 1 */}
              <div className="stat-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon purple" style={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '20px', color: 'white', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}><i className="fas fa-users"></i></div>
                  <div className="stat-trend" style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="fas fa-arrow-trend-up"></i> +12%</div>
                </div>
                <div className="stat-value" style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px', color: 'var(--text-primary)' }}>{loading ? '...' : (stats?.total_adherents || 0)}</div>
                <div className="stat-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Total Adhérents</div>
              </div>
              
              {/* Card 2 */}
              <div className="stat-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.05)'; }}>
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon orange" style={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '20px', color: 'white', background: 'linear-gradient(135deg, #fb923c, #f97316)' }}><i className="fas fa-clock"></i></div>
                  <div className="stat-trend" style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="fas fa-arrow-trend-up"></i> +5</div>
                </div>
                <div className="stat-value" style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px', color: 'var(--text-primary)' }}>{loading ? '...' : (stats?.inscriptions_attente || 0)}</div>
                <div className="stat-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Inscriptions en attente</div>
              </div>
              
              {/* Card 3 */}
              <div className="stat-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.05)'; }}>
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon green" style={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '20px', color: 'white', background: 'linear-gradient(135deg, #4ade80, #10b981)' }}><i className="far fa-credit-card"></i></div>
                  <div className="stat-trend" style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="fas fa-arrow-trend-up"></i> +89</div>
                </div>
                <div className="stat-value" style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px', color: 'var(--text-primary)' }}>{loading ? '...' : (stats?.cartes_generees || 0)}</div>
                <div className="stat-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Cartes générées</div>
              </div>
              
              {/* Card 4 */}
              <div className="stat-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.05)'; }}>
                <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-icon violet" style={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '20px', color: 'white', background: 'linear-gradient(135deg, #c084fc, #8b5cf6)' }}><i className="fas fa-rotate"></i></div>
                  <div className="stat-trend" style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="fas fa-arrow-trend-up"></i> +12</div>
                </div>
                <div className="stat-value" style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px', color: 'var(--text-primary)' }}>{loading ? '...' : (stats?.renouvellements || 0)}</div>
                <div className="stat-label" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Renouvellements</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
              {/* Colonne Gauche: Demandes d'inscription */}
              <div className="section-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Demandes d'inscription récentes</h3>
                  <button className="btn" style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, padding: '8px 16px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'} onClick={() => setActivePage('inscriptions')}>Voir tout</button>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Chargement des demandes...</div>
                ) : demandes.length > 0 ? (
                  demandes.slice(0, 3).map((insc: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: idx !== demandes.slice(0, 3).length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5', flexShrink: 0, fontSize: '16px' }}><i className="fas fa-user"></i></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{insc.prenom_contact} {insc.nom_contact}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{insc.email_contact} · {insc.raison_sociale_entreprise || "Individuel"}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(insc.date_demande).toLocaleDateString()}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Aucune demande en attente.</div>
                )}
              </div>

              {/* Colonne Droite: Activités récentes */}
              <div className="section-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Activités récentes</h3>
                
                {loading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Chargement des activités...</div>
                ) : stats?.activites_recentes?.length > 0 ? (
                  stats.activites_recentes.map((act: any, idx: number) => (
                    <div key={idx} className="activity-item admin-activity" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: idx !== stats.activites_recentes.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <div className="activity-avatar blue-soft" style={{ width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' }}><i className="fas fa-info-circle"></i></div>
                      <div className="activity-info" style={{ flex: 1 }}>
                        <div className="aname" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{act.name}</div>
                        <div className="adesc" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{act.desc}</div>
                      </div>
                      <div className="activity-time" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{act.time}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Aucune activité récente.</div>
                )}
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

            <div className="section-card" style={{ marginTop: 24, padding: 24, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Demandes en attente <span className="admin-badge admin-badge-pending" style={{ marginLeft: 8, background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{loading ? '...' : (stats?.inscriptions_attente || 0)}</span></h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => setShowNewInscModal(true)}>Nouvelle inscription</button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Chargement des données...</div>
              ) : demandes.length > 0 ? (
                demandes.map((insc, idx) => (
                  <div key={idx} className="insc-card" style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div className={`td-avatar purple-soft`} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...getAvatarStyle('purple-soft') }}><i className={`fas fa-user`}></i></div>
                    <div className="insc-info" style={{ flex: 1 }}>
                      <div className="iname" style={{ fontSize: 15, fontWeight: 800 }}>{insc.prenom_contact} {insc.nom_contact}</div>
                      <div className="imeta" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{insc.email_contact} &nbsp;·&nbsp; {insc.raison_sociale_entreprise || "Individuel"} &nbsp;·&nbsp; Soumis le {new Date(insc.date_demande).toLocaleDateString()}</div>
                    </div>
                    <div className="insc-actions" style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-danger" style={{ background: '#fee2e2', color: 'var(--danger)' }} onClick={() => handleRefuser(insc.id)}>Refuser</button>
                      <button className="btn btn-success" style={{ background: '#d1fae5', color: 'var(--success)' }} onClick={() => handleValider(insc.id)}>Valider</button>
                      <button className="btn btn-primary" onClick={() => { setSelectedDemande(insc); setShowVoirModal(true); }}>Voir</button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Aucune demande d'inscription en attente.</div>
              )}
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

            <div className="search-filter-row" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', borderRadius: 14, padding: '16px 20px', marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div className="search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: '9px 14px' }}>
                <i className="fas fa-search" style={{ color: 'var(--text-muted)' }}></i>
                <input 
                  type="text" 
                  placeholder="Rechercher par nom, email, téléphone, CIN/ICE, référence..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, width: '100%' }} 
                />
              </div>
              <button className="filter-btn" style={filterType === 'Tous' ? activeTabStyle : inactiveTabStyle} onClick={() => setFilterType('Tous')}>Tous</button>
              <button className="filter-btn" style={filterType === 'Physique' ? activeTabStyle : inactiveTabStyle} onClick={() => setFilterType('Physique')}><i className="fas fa-user"></i> Physique</button>
              <button className="filter-btn" style={filterType === 'Moral' ? activeTabStyle : inactiveTabStyle} onClick={() => setFilterType('Moral')}><i className="far fa-building"></i> Moral</button>
            </div>
            <div className="results-count" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, fontWeight: 600 }}>{loading ? 'Recherche en cours...' : `${filteredAdherents.length} adhérent(s) trouvé(s)`}</div>

            <div className="data-table" style={{ background: 'var(--surface)', borderRadius: 16, marginTop: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
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
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Chargement des adhérents...</td></tr>
                  ) : filteredAdherents.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Aucun adhérent ne correspond à votre recherche.</td></tr>
                  ) : filteredAdherents.map((adh, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{adh.reference}</span></td>
                      <td style={tdStyle}>
                        <div className="td-name" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                          <div className={`td-avatar blue-soft`} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, ...getAvatarStyle('blue-soft') }}><i className={adh.type_adherent === 'Physique' ? 'fas fa-user' : 'fas fa-building'}></i></div>
                          <div>
                            <div>{adh.nom}</div>
                            {adh.sub_nom && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{adh.sub_nom}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ background: adh.type_adherent === 'Physique' ? '#dbeafe' : '#fef3c7', color: adh.type_adherent === 'Physique' ? '#3b82f6' : '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{adh.type_adherent}</span></td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13 }}>
                          <div><i className="far fa-envelope" style={{ color: 'var(--text-muted)', marginRight: 5 }}></i>{adh.email}</div>
                          {adh.telephone && <div style={{ marginTop: 3 }}><i className="fas fa-phone" style={{ color: 'var(--text-muted)', marginRight: 5 }}></i>{adh.telephone}</div>}
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ background: adh.statut === 'Actif' ? '#d1fae5' : '#fef3c7', color: adh.statut === 'Actif' ? '#10b981' : '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{adh.statut}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13 }}>{new Date(adh.date_adhesion).toLocaleDateString()}</span></td>
                      <td style={tdStyle}>
                        <div className="td-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button className="icon-btn edit" style={iconBtnStyle('#dbeafe', '#3b82f6')} onClick={() => setEditingAdherent(adh)}><i className="fas fa-pen"></i></button>
                          <button className="icon-btn del" style={iconBtnStyle('#fee2e2', '#ef4444')} onClick={() => handleDeleteAdherent(adh.id)}><i className="fas fa-trash"></i></button>
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
            <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div className="page-title">
                <h1>Cartes d'adhérent</h1>
                <p>Gérer les cartes d'adhésion</p>
              </div>
              <div className="header-actions" style={{ display: 'flex', gap: 12 }}>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '8px 16px', borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,.05)', border: '1px solid var(--border)' }}>
                  <i className="fas fa-search" style={{ color: '#999', marginRight: 10 }}></i>
                  <input 
                    type="text" 
                    placeholder="Rechercher une carte..." 
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, width: 250 }}
                    value={cartesSearchQuery}
                    onChange={(e) => setCartesSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="cartes-grid admin-cartes-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
              {loading ? (
                <div style={{ color: '#999', padding: 20 }}>Chargement des cartes...</div>
              ) : filteredCartes.length === 0 ? (
                <div style={{ color: '#999', padding: 20 }}>Aucune carte trouvée.</div>
              ) : filteredCartes.map((c: any, idx: number) => {
                const isActive = c.statut?.toLowerCase() === 'active';
                const numStr = c.numero_carte || '';
                const shortNum = numStr.includes('-') ? numStr.split('-').pop() : numStr;
                const anneeEmission = c.date_emission ? new Date(c.date_emission).getFullYear() : new Date().getFullYear();
                const displayNum = `N° : ${shortNum}/${anneeEmission}`;
                const moisFr = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];
                const validite = c.date_expiration
                  ? `${moisFr[new Date(c.date_expiration).getMonth()]} ${new Date(c.date_expiration).getFullYear()}`
                  : '—';
                const nomAffiche = (c.nom || c.nom_adherent || '').toUpperCase().trim();
                const prenomAffiche = (c.prenom || '').trim();
                const profAffiche = (c.profession || 'COMMERCANT').toUpperCase();

                return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* ══════════════════════════════════════════
                      CCS — CARTE PROFESSIONNELLE
                      Dimensions : 340 × 215 px ≈ ratio carte ID
                      ══════════════════════════════════════════ */}
                  <div id={`carte-${c.id}`} style={{
                    width: 340,
                    height: 215,
                    fontFamily: '"Arial", "Helvetica Neue", sans-serif',
                    border: '1.5px solid #c8b89a',
                    borderRadius: 7,
                    overflow: 'hidden',
                    boxShadow: '0 4px 18px rgba(0,0,0,.22)',
                    flexShrink: 0,
                    userSelect: 'none',
                    position: 'relative',
                  }}>
                    {/* Image de fond pour forcer l'impression */}
                    <img src="/carte_background.png" alt="Fond Carte" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

                    {/* Nom */}
                    <div style={{ position: 'absolute', top: '75px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {nomAffiche}
                    </div>
                    
                    {/* Prénom */}
                    <div style={{ position: 'absolute', top: '95px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {prenomAffiche}
                    </div>
                    
                    {/* Profession */}
                    <div style={{ position: 'absolute', top: '115px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {profAffiche}
                    </div>
                    
                    {/* Patente */}
                    <div style={{ position: 'absolute', top: '135px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {c.numero_patente || ''}
                    </div>
                    
                    {/* R.C */}
                    <div style={{ position: 'absolute', top: '155px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {c.rc || ''}
                    </div>
                    
                    {/* Validité */}
                    <div style={{ position: 'absolute', top: '175px', left: '150px', padding: '0 4px', fontSize: '9px', fontWeight: 'bold' }}>
                      {validite}
                    </div>
                    
                    {/* Numéro de carte */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold' }}>
                      {displayNum}
                    </div>

                    {/* Photo */}
                    <div style={{ position: 'absolute', top: '80px', left: '28px', width: '60px', height: '78px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                      {c.photo_path ? (
                        <img src={`https://adh-rant.onrender.com${c.photo_path}`} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Photo</span>
                      )}
                    </div>


                  </div>

                    {/* Deuxième face (Verso) */}
                    <div id={`carte-back-${c.id}`} style={{
                      display: 'none',
                      width: 340,
                      height: 215,
                      fontFamily: '"Arial", "Helvetica Neue", sans-serif',
                      border: '1.5px solid #c8b89a',
                      borderRadius: 7,
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px rgba(0,0,0,.22)',
                      flexShrink: 0,
                      userSelect: 'none',
                      position: 'relative',
                      marginTop: 10,
                    }}>
                      <img src="/carte_back.png" alt="Fond Carte Verso" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                    </div>
                  {/* ─────────────────────────────── */}

                  {/* Contrôles sous la carte */}
                  <div style={{ display: 'flex', gap: 8, width: 340 }}>
                    <span style={{
                      background: isActive ? '#d1fae5' : '#fee2e2',
                      color: isActive ? '#10b981' : '#ef4444',
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      textTransform: 'capitalize', alignSelf: 'center',
                    }}>{c.statut}</span>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-secondary"
                      style={{ fontSize: 11, padding: '5px 14px' }}
                      onClick={() => handlePrint(`carte-${c.id}`, `carte-back-${c.id}`)}>
                      <i className="fas fa-print" style={{ marginRight: 5 }}></i>Imprimer
                    </button>
                    {(() => {
                      const diffDays = c.date_expiration
                        ? Math.ceil((new Date(c.date_expiration).getTime() - Date.now()) / 86400000)
                        : 999;
                      const canRenew = diffDays <= 30 && c.statut !== 'expire';
                      return (
                        <button className="btn btn-primary"
                          style={{ fontSize: 11, padding: '5px 14px', opacity: canRenew ? 1 : 0.42, cursor: canRenew ? 'pointer' : 'not-allowed' }}
                          onClick={() => canRenew && handleRenouveler(c.id)}
                          title={canRenew ? 'Renouveler la carte' : 'Renouvellement possible 30j avant expiration'}>
                          <i className="fas fa-sync-alt" style={{ marginRight: 5 }}></i>Renouveler
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* COMMUNICATIONS */}
        {activePage === 'communications' && (
          <div className="page-content animation-fade-in">
            {/* En-tête */}
            <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="page-title">
                <h1>Communications</h1>
                <p>Gérez l'historique et envoyez des messages à vos adhérents</p>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowCommModal(true)}>
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Email / Notification
              </button>
            </div>

            {/* Barre d'onglets */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                background: 'var(--surface-2)',
                borderRadius: 12,
                padding: 4,
                marginTop: 20,
                width: 'fit-content',
              }}
            >
              {([
                { key: 'historique', label: '📋 Historique', id: 'comm-tab-historique' },
                { key: 'whatsapp',   label: '📲 WhatsApp en masse', id: 'comm-tab-whatsapp' },
              ] as { key: 'historique' | 'whatsapp'; label: string; id: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  id={tab.id}
                  onClick={() => setCommSubTab(tab.key)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: commSubTab === tab.key ? 700 : 500,
                    background: commSubTab === tab.key ? 'white' : 'transparent',
                    color: commSubTab === tab.key ? '#1e293b' : '#64748b',
                    boxShadow: commSubTab === tab.key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.18s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Onglet Historique ── */}
            {commSubTab === 'historique' && (
              <div className="section-card" style={{ marginTop: 20, padding: 24, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 18px 0' }}>Historique des communications</h3>

                {communications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>Aucune communication envoyée pour le moment.</p>
                  </div>
                ) : (
                  communications.map((comm) => {
                    const date = new Date(comm.date_envoi).toLocaleDateString('fr-FR');
                    const isWhatsapp = ['whatsapp', 'watsp'].includes((comm.canal || '').toLowerCase());
                    const icon = (comm.canal || '').toLowerCase() === 'email' ? 'fa-envelope' : isWhatsapp ? 'fa-whatsapp' : 'fa-bell';
                    const bg = (comm.canal || '').toLowerCase() === 'email' ? '#dbeafe' : isWhatsapp ? '#d1fae5' : '#ede9fe';
                    const color = (comm.canal || '').toLowerCase() === 'email' ? '#3b82f6' : isWhatsapp ? '#10b981' : '#8b5cf6';

                    return (
                      <div
                        key={comm.id}
                        style={{
                          background: 'var(--surface)',
                          borderRadius: 14,
                          padding: '18px 22px',
                          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: bg, color }}>
                          <i className={isWhatsapp ? `fab ${icon}` : `far ${icon}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{comm.titre}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                            {comm.canal} · {comm.nombre_destinataires} destinataire(s)
                            {comm.statut_ou_metrique ? ` · ${comm.statut_ou_metrique}` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>{date}</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Onglet WhatsApp ── */}
            {commSubTab === 'whatsapp' && (
              <div style={{ marginTop: 20 }}>
                <WhatsAppBroadcastForm
                  adherents={adherents}
                  evenements={evenements}
                  onSuccess={async () => {
                    const comms = await fetchWithAuth('/api/admin/communications');
                    setCommunications(comms);
                  }}
                />
              </div>
            )}
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
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowDocModal(true)}><i className="fas fa-upload" style={{ marginRight: 6 }}></i>Téléverser un document</button>
            </div>

            <div className="data-table" style={{ background: 'var(--surface)', borderRadius: 16, marginTop: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
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
                  {globalDocuments.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Aucun document.</td></tr>
                  ) : globalDocuments.map((doc, idx) => {
                    const catBg = doc.categorie === 'Règlements' ? '#fef3c7' : doc.categorie === 'Formulaires' ? '#d1fae5' : '#dbeafe';
                    const catColor = doc.categorie === 'Règlements' ? '#b45309' : doc.categorie === 'Formulaires' ? '#065f46' : '#1e40af';
                    return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="doc-icon" style={{ width: 34, height: 34, background: '#dbeafe', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}><i className="fas fa-file-pdf"></i></div><span style={{ fontWeight: 700 }}>{doc.nom_fichier}</span></div></td>
                      <td style={tdStyle}><span style={{ background: catBg, color: catColor, fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>{doc.categorie}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doc.taille}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--primary)' }}>{new Date(doc.date_importation).toLocaleDateString('fr-FR')}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13 }}>{doc.ajoute_par || 'Admin Système'}</span></td>
                      <td style={tdStyle}>
                        <div className="td-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <a href={`https://adh-rant.onrender.com${doc.chemin_fichier}`} target="_blank" rel="noreferrer" className="icon-btn view-btn" style={iconBtnStyle('#ede9fe', 'var(--primary)')}><i className="fas fa-eye"></i></a>
                          <a href={`https://adh-rant.onrender.com${doc.chemin_fichier}`} download className="icon-btn dl" style={iconBtnStyle('#d1fae5', '#10b981')}><i className="fas fa-download"></i></a>
                          <button className="icon-btn del" style={iconBtnStyle('#fee2e2', '#ef4444')} onClick={() => handleDeleteDocument(doc.id)}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ÉVÉNEMENTS */}
        {activePage === 'evenements' && (
          <div className="page-content animation-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', padding: '24px', borderRadius: '20px' }}>
            <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="page-title">
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Événements</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Gérer les événements et les lieux</p>
              </div>
              <button className="btn" style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, padding: '10px 20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)', transition: 'all 0.2s', marginTop: 8 }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'} onClick={() => setShowEventModal(true)}>
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Nouvel événement
              </button>
            </div>

            <div className="section-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', marginTop: 24 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Liste des événements</h3>

              {evenements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }}><i className="fas fa-calendar-times"></i></div>
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>Aucun événement trouvé.</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Cliquez sur "Nouvel événement" pour en ajouter un.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {evenements.map((evt, idx) => (
                    <div key={evt.id} style={{ background: 'var(--surface)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>Événement</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setEditingEvent(evt)}><i className="fas fa-pen"></i></button>
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} onClick={() => handleDeleteEvent(evt.id)}><i className="fas fa-trash"></i></button>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{evt.titre}</h4>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#4f46e5', margin: '4px 0 0 0' }}>{evt.categorie || 'Général'}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{evt.description || 'Pas de description.'}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="far fa-calendar-alt" style={{ width: '14px', color: 'var(--text-muted)' }}></i>
                          <span>{new Date(evt.date_evenement).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="far fa-clock" style={{ width: '14px', color: 'var(--text-muted)' }}></i>
                          <span>Début: {evt.heure_debut || 'Non spécifiée'} | Fin: {evt.heure_fin || 'Non spécifiée'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-map-marker-alt" style={{ width: '14px', color: 'var(--text-muted)' }}></i>
                          <span>Lieu: {evt.lieu || 'Non spécifié'}</span>
                        </div>
                        {evt.places_limitees && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-users" style={{ width: '14px', color: 'var(--text-muted)' }}></i>
                            <span>{evt.places_limitees} places limitées</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RENOUVELLEMENTS */}
        {activePage === 'renouvellements' && (
          <div className="page-content animation-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', padding: '24px', borderRadius: '20px' }}>
            <div className="page-title">
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Renouvellements</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Gérer les demandes de renouvellement d'adhésion</p>
            </div>

            <div className="section-card" style={{ background: 'var(--surface)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', marginTop: 24 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Demandes en attente</h3>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chargement des demandes...</div>
              ) : renouvellements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }}><i className="fas fa-check-circle"></i></div>
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>Aucune demande en attente.</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tous les renouvellements ont été traités.</p>
                </div>
              ) : (
                <div className="data-table" style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Adhérent</th>
                        <th style={thStyle}>Année</th>
                        <th style={thStyle}>Montant</th>
                        <th style={thStyle}>Mode Paiement</th>
                        <th style={thStyle}>Date Demande</th>
                        <th style={thStyle}>Preuve</th>
                        <th style={thStyle}>Statut</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renouvellements.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.nom_adherent}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.email_adherent}</div>
                          </td>
                          <td style={tdStyle}>{r.annee}</td>
                          <td style={tdStyle}><span style={{ fontWeight: 700, color: '#10b981' }}>{r.montant} MAD</span></td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: 13, background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                              {r.mode_paiement}
                            </span>
                          </td>
                          <td style={tdStyle}>{r.date_paiement ? new Date(r.date_paiement).toLocaleDateString() : '—'}</td>
                          <td style={tdStyle}>
                            {r.preuve_paiement ? (
                              <a 
                                href={`https://adh-rant.onrender.com${r.preuve_paiement}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <i className="fas fa-eye"></i> Voir
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune</span>
                            )}

                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {r.statut}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button 
                              className="btn btn-success" 
                              style={{ background: '#d1fae5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '6px 14px' }}
                              onClick={() => handleApprouverRenouvellement(r.id)}
                            >
                              Approuver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


      </main>

      {/* MODAL VOIR */}
      {showVoirModal && selectedDemande && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Détails de la demande</h3>
              <button onClick={() => setShowVoirModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Nom & Prénom</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.prenom_contact} {selectedDemande.nom_contact}</span>
              </div>
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Email</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.email_contact}</span>
              </div>
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Téléphone</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.telephone_contact || 'Non renseigné'}</span>
              </div>
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Raison sociale (Si entreprise)</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.raison_sociale_entreprise || 'N/A'}</span>
              </div>
              {selectedDemande.cin && (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>CIN</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.cin}</span>
                </div>
              )}
              {selectedDemande.date_naissance && (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Date de naissance</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.date_naissance}</span>
                </div>
              )}
              {selectedDemande.profession && (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Profession</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.profession}</span>
                </div>
              )}
              {selectedDemande.numero_patente && (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>N° Patente</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{selectedDemande.numero_patente}</span>
                </div>
              )}

              {/* Documents */}
              <div style={{ marginTop: 8 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700 }}>Documents importés</h4>
                {selectedDemande.documents ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(() => {
                      try {
                        const docs = JSON.parse(selectedDemande.documents);
                        if (typeof docs === 'object' && docs !== null && !Array.isArray(docs)) {
                          return Object.entries(docs).map(([docName, url]) => (
                            <div key={docName} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px' }}>
                              <i className="fas fa-file-pdf" style={{ color: '#e53e3e', fontSize: 16 }}></i>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>{docName}</span>
                              <a href={`https://adh-rant.onrender.com${url}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="fas fa-eye"></i> Voir
                              </a>
                              <a href={`https://adh-rant.onrender.com${url}`} download style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="fas fa-download"></i>
                              </a>
                            </div>
                          ));
                        }
                        // Array format
                        if (Array.isArray(docs)) {
                          return docs.map((doc: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px' }}>
                              <i className="fas fa-file-pdf" style={{ color: '#e53e3e', fontSize: 16 }}></i>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>{doc.nom || doc.name || `Document ${i+1}`}</span>
                              {doc.url && <a href={`https://adh-rant.onrender.com${doc.url}`} target="_blank" rel="noreferrer" style={{ marginLeft: 8, background: '#3b82f6', color: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}><i className="fas fa-eye"></i> Voir</a>}
                            </div>
                          ));
                        }
                      } catch(e) {}
                      return <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-file-pdf"></i> Document joint</div>;
                    })()}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#999', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>Aucun document importé.</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setShowVoirModal(false)}>Fermer</button>
              <button className="btn btn-success" onClick={() => { handleValider(selectedDemande.id); setShowVoirModal(false); }}>Valider l'inscription</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREDENTIALS après validation */}
      {credentials && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
              <i className="fas fa-check" style={{ color: '#10b981' }}></i>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Inscription validée !</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>Les identifiants ont été générés. Communiquez-les à l&apos;adhérent.</p>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', background: '#e0f2fe', padding: '6px 12px', borderRadius: 8 }}>{credentials.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Mot de passe</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: credentials.password ? '#1e293b' : '#94a3b8', fontFamily: 'monospace', background: credentials.password ? '#fef3c7' : '#f1f5f9', padding: '6px 12px', borderRadius: 8 }}>
                  {credentials.password || '(Compte existant — mot de passe inchangé)'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>⚠️ Notez le mot de passe, il ne sera plus affiché.</p>
            <button onClick={() => setCredentials(null)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE INSCRIPTION */}
      {showNewInscModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 1000, maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button onClick={() => setShowNewInscModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#999', zIndex: 50 }}>&times;</button>
            <InscriptionForm onSuccess={async (data) => {
              setShowNewInscModal(false);
              setCredentials({ email: data.email, password: data.password_genere });
              try {
                const adh = await fetchWithAuth('/api/admin/adherents');
                setAdherents(adh);
              } catch(e) {}
            }} />
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS / MODIFIER ADHÉRENT — Enrichi avec scroll, tous les champs, bouton Fermer */}
      {editingAdherent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Header fixe */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white' }}>Détails Adhérent</h3>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{editingAdherent.reference} · {editingAdherent.type_adherent || 'Physique'}</div>
              </div>
              <button onClick={() => setEditingAdherent(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-times" /> Fermer
              </button>
            </div>

            {/* Contenu scrollable */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>
              <form onSubmit={handleUpdateAdherent}>
                {/* Section Identité */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-user" /> Identité
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nom / Raison sociale *</label>
                      <input type="text" required value={editingAdherent.nom || ''} onChange={e => setEditingAdherent({ ...editingAdherent, nom: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Prénom</label>
                      <input type="text" value={editingAdherent.prenom || ''} onChange={e => setEditingAdherent({ ...editingAdherent, prenom: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>CIN</label>
                      <input type="text" value={editingAdherent.cin || ''} onChange={e => setEditingAdherent({ ...editingAdherent, cin: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Date de naissance</label>
                      <input type="date" value={editingAdherent.date_naissance ? String(editingAdherent.date_naissance).substring(0,10) : ''} onChange={e => setEditingAdherent({ ...editingAdherent, date_naissance: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Adresse</label>
                      <input type="text" value={editingAdherent.adresse || ''} onChange={e => setEditingAdherent({ ...editingAdherent, adresse: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Section Contact */}
                <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-envelope" /> Contact & Accès
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Email *</label>
                      <input type="email" required value={editingAdherent.email || ''} onChange={e => setEditingAdherent({ ...editingAdherent, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Téléphone</label>
                      <input type="tel" value={editingAdherent.telephone || ''} onChange={e => setEditingAdherent({ ...editingAdherent, telephone: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Mot de passe (lecture seule)</label>
                      <input type="text" readOnly value={editingAdherent.mot_de_passe || 'Non généré'} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text-secondary)', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </div>

                {/* Section Entreprise */}
                <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-building" /> Informations Entreprise
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>ICE</label>
                      <input type="text" value={editingAdherent.ice || ''} onChange={e => setEditingAdherent({ ...editingAdherent, ice: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Numéro de Patente</label>
                      <input type="text" value={editingAdherent.numero_patente || ''} onChange={e => setEditingAdherent({ ...editingAdherent, numero_patente: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Registre de Commerce (RC)</label>
                      <input type="text" value={editingAdherent.tax_professionnelle || ''} onChange={e => setEditingAdherent({ ...editingAdherent, tax_professionnelle: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Profession</label>
                      <input type="text" value={editingAdherent.profession || ''} onChange={e => setEditingAdherent({ ...editingAdherent, profession: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Description de l'activité</label>
                      <textarea value={editingAdherent.description_activite || ''} onChange={e => setEditingAdherent({ ...editingAdherent, description_activite: e.target.value })} rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Section Informations supplémentaires */}
                {editingAdherent.donnees_extra && Object.keys(editingAdherent.donnees_extra).length > 0 && (
                  <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-info-circle" /> Informations supplémentaires
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {Object.entries(editingAdherent.donnees_extra).map(([key, value]) => {
                        if (value === null || value === '') return null;
                        return (
                          <div key={key}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</label>
                            <input type="text" value={typeof value === 'object' ? JSON.stringify(value) : String(value)} onChange={e => setEditingAdherent({ ...editingAdherent, donnees_extra: { ...editingAdherent.donnees_extra, [key]: e.target.value } })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section Statut */}
                <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-toggle-on" /> Statut d'adhésion
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Statut</label>
                      <select value={editingAdherent.statut} onChange={e => setEditingAdherent({ ...editingAdherent, statut: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', boxSizing: 'border-box' }}>
                        <option value="Actif">Actif</option>
                        <option value="En attente">En attente</option>
                        <option value="Refusé">Refusé</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Type d'adhérent</label>
                      <select value={editingAdherent.type_adherent || 'Physique'} onChange={e => setEditingAdherent({ ...editingAdherent, type_adherent: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', boxSizing: 'border-box' }}>
                        <option value="Physique">Personne Physique</option>
                        <option value="Moral">Personne Morale</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {editingAdherent.documents && editingAdherent.documents.length > 0 && (
                  <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-paperclip" /> Documents rattachés
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {editingAdherent.documents.map((doc: any, idx: number) => (
                        <a href={`https://adh-rant.onrender.com${doc.chemin_fichier}`} target="_blank" rel="noreferrer" key={idx} style={{ background: '#dbeafe', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                          <i className="fas fa-file-pdf"></i>
                          {doc.nom_fichier}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons d'action (dans le scroll) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" onClick={() => setEditingAdherent(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-times" /> Fermer
                  </button>
                  <button type="submit" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                    <i className="fas fa-save" /> Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE COMMUNICATION */}
      {showCommModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 600, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Nouvelle communication</h3>
              <button onClick={() => setShowCommModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmitCommunication} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Titre *</label>
                <input type="text" required value={commForm.titre} onChange={e => setCommForm({ ...commForm, titre: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }} placeholder="Objet de l'email ou titre de la notification" />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Canal *</label>
                  <select required value={commForm.canal} onChange={e => setCommForm({ ...commForm, canal: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)' }}>
                    <option value="Email">Email</option>
                    <option value="Notification">Notification Push (App)</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Cible *</label>
                  <select required value={commForm.cible} onChange={e => {
                    setCommForm({ ...commForm, cible: e.target.value, evenement_id: '', adherent_ids: [] });
                    setCommCibleType('');
                    setCommCibleElementId('');
                    setCibleAdherentsPreview([]);
                    // Charger les cibles si pas encore chargé
                    if (ciblesData.length === 0) {
                      fetchWithAuth('/api/admin/cibles')
                        .then(data => setCiblesData(Array.isArray(data) ? data : []))
                        .catch(() => {});
                    }
                  }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)' }}>
                    <option value="tous">Tous les adhérents</option>
                    <option value="partie">Sélection individuelle</option>
                    <option value="cible">Par type de participation</option>
                  </select>
                </div>
              </div>

              {/* Sélection par type de participation (2 niveaux) */}
              {commForm.cible === 'cible' && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Étape 1 — Catégorie</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: 12 }}>
                    {ciblesData.map((cat: any) => (
                      <button key={cat.type} type="button"
                        onClick={() => { setCommCibleType(cat.type); setCommCibleElementId(''); setCibleAdherentsPreview([]); }}
                        style={{ padding: '10px 8px', borderRadius: 9, border: commCibleType === cat.type ? '2px solid #4f46e5' : '1.5px solid #e5e7eb', background: commCibleType === cat.type ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : 'white', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: commCibleType === cat.type ? '#5b21b6' : '#374151', textTransform: 'uppercase', letterSpacing: 0.3, transition: 'all 0.15s' }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {commCibleType && (
                    <>
                      <div style={{ padding: '10px 14px', background: '#f0f4ff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5 }}>Étape 2 — Élément</div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                        {(ciblesData.find((c: any) => c.type === commCibleType)?.elements || []).map((el: any) => (
                          <label key={el.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: commCibleElementId === String(el.id) ? '1.5px solid #4f46e5' : '1.5px solid #e5e7eb', background: commCibleElementId === String(el.id) ? 'rgba(79,70,229,0.05)' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <input type="radio" name="comm-cible-el" value={el.id}
                              checked={commCibleElementId === String(el.id)}
                              onChange={() => {
                                setCommCibleElementId(String(el.id));
                                setCommForm(p => ({ ...p, evenement_id: String(el.id) }));
                                // Charger les adhérents
                                setLoadingCiblePreview(true);
                                fetchWithAuth(`/api/admin/cibles/${commCibleType}/${el.id}/adherents`)
                                  .then(data => setCibleAdherentsPreview(Array.isArray(data) ? data : []))
                                  .catch(() => setCibleAdherentsPreview([]))
                                  .finally(() => setLoadingCiblePreview(false));
                              }}
                              style={{ accentColor: '#4f46e5' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{el.nom}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Aperçu des adhérents */}
                  {commCibleElementId && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {loadingCiblePreview ? 'Chargement...' : `${cibleAdherentsPreview.length} adhérent(s) concerné(s)`}
                      </div>
                      {!loadingCiblePreview && cibleAdherentsPreview.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {cibleAdherentsPreview.slice(0, 8).map((adh: any) => (
                            <span key={adh.id} style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{adh.nom}</span>
                          ))}
                          {cibleAdherentsPreview.length > 8 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>+{cibleAdherentsPreview.length - 8} autres</span>}
                        </div>
                      )}
                      {!loadingCiblePreview && cibleAdherentsPreview.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun adhérent inscrit dans cet élément.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {commForm.cible === 'partie' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Sélectionner les adhérents ({commForm.adherent_ids.length} sélectionnés) *</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                    {adherents.map((adh: any) => (
                      <label key={adh.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                        <input type="checkbox" 
                               checked={commForm.adherent_ids.includes(adh.id)} 
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setCommForm({ ...commForm, adherent_ids: [...commForm.adherent_ids, adh.id] });
                                 } else {
                                   setCommForm({ ...commForm, adherent_ids: commForm.adherent_ids.filter(id => id !== adh.id) });
                                 }
                               }} />
                        <span style={{ fontSize: 13 }}>{adh.nom || adh.raison_sociale} ({adh.reference})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contenu *</label>
                <textarea required value={commForm.contenu} onChange={e => setCommForm({ ...commForm, contenu: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Votre message..." />
              </div>

              {commForm.canal === 'Email' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pièce jointe (Optionnel)</label>
                  <input 
                    type="file" 
                    onChange={e => setCommForm({ ...commForm, file: e.target.files ? e.target.files[0] : null })} 
                    style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', fontSize: 13, background: 'var(--surface-2)' }} 
                  />
                  {commForm.file && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, fontWeight: 600 }}>📎 {commForm.file.name} prêt à être envoyé</div>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCommModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"><i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CENTRE D'ENVOI WHATSAPP */}
      {showWhatsappModal && (
        <div className="modal-backdrop animation-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content animation-slide-up" style={{ background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e8f5e9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#25D366', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', fontSize: 20 }}>
                  <i className="fab fa-whatsapp"></i>
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#1b5e20' }}>Centre d'envoi WhatsApp</h2>
                  <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>{sentWhatsappIds.length} / {whatsappQueue.length} envoyés</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowWhatsappModal(false)} style={{ background: 'transparent', border: 'none', color: '#2e7d32', fontSize: 20, cursor: 'pointer' }}><i className="fas fa-times"></i></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 380, overflowY: 'auto' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Pour garantir la réception sans frais d'API, cliquez sur <strong>Envoyer</strong> pour chaque adhérent afin d'ouvrir le message pré-rempli dans WhatsApp Web :
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whatsappQueue.map((item: any, idx: number) => {
                  const isSent = sentWhatsappIds.includes(item.telephone);
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: isSent ? '#f1fdf5' : 'white', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: isSent ? '#2e7d32' : 'var(--text)' }}>{item.nom}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.telephone}</span>
                      </div>
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => {
                          if (!isSent) {
                            setSentWhatsappIds([...sentWhatsappIds, item.telephone]);
                          }
                        }}
                        className="btn"
                        style={{ 
                          padding: '6px 14px', 
                          borderRadius: 8, 
                          background: isSent ? '#e8f5e9' : '#25D366', 
                          color: isSent ? '#2e7d32' : 'white', 
                          fontWeight: 600, 
                          fontSize: 13,
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          textDecoration: 'none',
                          boxShadow: isSent ? 'none' : '0 2px 4px rgba(37, 211, 102, 0.2)'
                        }}
                      >
                        {isSent ? (
                          <>
                            <i className="fas fa-check"></i>
                            Relancer
                          </>
                        ) : (
                          <>
                            <i className="fab fa-whatsapp"></i>
                            Envoyer
                          </>
                        )}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
              <button className="btn btn-primary" onClick={() => setShowWhatsappModal(false)} style={{ background: '#2e7d32', borderColor: '#2e7d32' }}>Terminer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÉLÉVERSER DOCUMENT */}
      {showDocModal && (
        <div className="modal-backdrop animation-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content animation-slide-up" style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 450, boxShadow: '0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Téléverser un document</h2>
              <button className="icon-btn" onClick={() => setShowDocModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleDocumentSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nom du document *</label>
                <input type="text" required value={docForm.nom_fichier} onChange={e => setDocForm({ ...docForm, nom_fichier: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }} placeholder="Ex: Règlement intérieur 2026.pdf" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Catégorie *</label>
                <select required value={docForm.categorie} onChange={e => setDocForm({ ...docForm, categorie: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)' }}>
                  <option value="Règlements">Règlements</option>
                  <option value="Formulaires">Formulaires</option>
                  <option value="Comptes-rendus">Comptes-rendus</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Fichier *</label>
                <input type="file" required onChange={e => setDocForm({ ...docForm, file: e.target.files ? e.target.files[0] : null })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDocModal(false)} disabled={uploadingDoc}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  {uploadingDoc ? 'Téléversement...' : <><i className="fas fa-upload" style={{ marginRight: 6 }}></i>Téléverser</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ÉVÉNEMENT */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Ajouter un événement</h3>
              <button onClick={() => setShowEventModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>

            <form onSubmit={handleEventSubmit}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Titre</label>
                  <input type="text" required value={eventForm.titre} onChange={e => setEventForm({ ...eventForm, titre: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Date</label>
                  <input type="date" required value={eventForm.date_evenement} onChange={e => setEventForm({ ...eventForm, date_evenement: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Heure début</label>
                    <input type="time" value={eventForm.heure_debut} onChange={e => setEventForm({ ...eventForm, heure_debut: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Heure fin</label>
                    <input type="time" value={eventForm.heure_fin} onChange={e => setEventForm({ ...eventForm, heure_fin: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Catégorie</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={eventForm.categorie} onChange={e => setEventForm({ ...eventForm, categorie: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                      <option value="Séminaire">Séminaire</option>
                      <option value="Journée d'information">Journée d'information</option>
                      <option value="Salon">Salon</option>
                      <option value="Conférence">Conférence</option>
                      {eventForm.categorie && !['Séminaire', "Journée d'information", 'Salon', 'Conférence'].includes(eventForm.categorie) && (
                        <option value={eventForm.categorie}>{eventForm.categorie}</option>
                      )}
                    </select>
                    <button type="button" onClick={() => {
                      const newCat = prompt("Entrez la nouvelle catégorie :");
                      if (newCat) setEventForm({ ...eventForm, categorie: newCat });
                    }} style={{ padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Lieu</label>
                  <input type="text" value={eventForm.lieu} onChange={e => setEventForm({ ...eventForm, lieu: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Description</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, minHeight: '60px' }}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Places limitées</label>
                  <input type="number" value={eventForm.places_limitees} onChange={e => setEventForm({ ...eventForm, places_limitees: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEventModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer l'événement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER ÉVÉNEMENT */}
      {editingEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Modifier l'événement</h3>
              <button onClick={() => setEditingEvent(null)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>

            <form onSubmit={handleEditEventSubmit}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Titre</label>
                  <input type="text" required value={editingEvent.titre} onChange={e => setEditingEvent({ ...editingEvent, titre: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Date</label>
                  <input type="date" required value={editingEvent.date_evenement} onChange={e => setEditingEvent({ ...editingEvent, date_evenement: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Heure début</label>
                    <input type="time" value={editingEvent.heure_debut || ''} onChange={e => setEditingEvent({ ...editingEvent, heure_debut: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Heure fin</label>
                    <input type="time" value={editingEvent.heure_fin || ''} onChange={e => setEditingEvent({ ...editingEvent, heure_fin: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Catégorie</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={editingEvent.categorie || 'Conférence'} onChange={e => setEditingEvent({ ...editingEvent, categorie: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                      <option value="Séminaire">Séminaire</option>
                      <option value="Journée d'information">Journée d'information</option>
                      <option value="Salon">Salon</option>
                      <option value="Conférence">Conférence</option>
                      {editingEvent.categorie && !['Séminaire', "Journée d'information", 'Salon', 'Conférence'].includes(editingEvent.categorie) && (
                        <option value={editingEvent.categorie}>{editingEvent.categorie}</option>
                      )}
                    </select>
                    <button type="button" onClick={() => {
                      const newCat = prompt("Entrez la nouvelle catégorie :");
                      if (newCat) setEditingEvent({ ...editingEvent, categorie: newCat });
                    }} style={{ padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Lieu</label>
                  <input type="text" value={editingEvent.lieu || ''} onChange={e => setEditingEvent({ ...editingEvent, lieu: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Description</label>
                  <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, minHeight: '60px' }}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Places limitées</label>
                  <input type="number" value={editingEvent.places_limitees || ''} onChange={e => setEditingEvent({ ...editingEvent, places_limitees: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingEvent(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}


      <datalist id="categories-list">
      <option value="Séminaire" />
      <option value="Journée d'information" />
      <option value="Salon" />
      <option value="Conférence" />
      {Array.from(new Set(evenements.map(e => e.categorie).filter(Boolean))).map(cat => (
        <option key={cat} value={cat} />
      ))}
    </datalist>
  </>
);
}

// Helpers styles
const thStyle = { padding: '14px 18px', textAlign: 'left' as const, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' };
const tdStyle = { padding: '14px 18px', fontSize: 14, verticalAlign: 'middle' as const };
const inactiveTabStyle = { padding: '9px 18px', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, borderWidth: '1.5px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 };
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

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DemandeInscriptionResponse(BaseModel):
    id: int
    nom_contact: str
    prenom_contact: str
    email_contact: str
    telephone_contact: Optional[str] = None
    raison_sociale_entreprise: Optional[str] = None
    statut: str
    date_demande: datetime
    documents: Optional[str] = None

    class Config:
        from_attributes = True

class NouvelleInscriptionRequest(BaseModel):
    # --- Informations de base (Bloc 1) ---
    nom_contact: str
    prenom_contact: str
    email_contact: str
    telephone_contact: Optional[str] = None
    tel_fixe: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    activite_principale: Optional[str] = None
    activite_secondaire: Optional[str] = None

    # --- Forme juridique ---
    forme_juridique: Optional[str] = None

    # --- Informations Personne Morale (Bloc 2) ---
    raison_sociale_entreprise: Optional[str] = None
    abreviation: Optional[str] = None
    site_web: Optional[str] = None
    facebook_entreprise: Optional[str] = None
    date_creation: Optional[str] = None
    ice: Optional[str] = None
    rc: Optional[str] = None
    capital: Optional[str] = None
    chiffre_affaires: Optional[str] = None
    effectif: Optional[str] = None
    pourcentage_etrangers: Optional[str] = None
    nationalite: Optional[str] = None

    # --- Dirigeant ---
    nom_dirigeant: Optional[str] = None
    fonction_dirigeant: Optional[str] = None
    gsm_dirigeant: Optional[str] = None
    email_dirigeant: Optional[str] = None
    linkedin_dirigeant: Optional[str] = None
    facebook_dirigeant: Optional[str] = None

    # --- International & Distribution ---
    pays_importation: Optional[str] = None
    pays_exportation: Optional[str] = None
    marques_representees: Optional[str] = None
    franchises: Optional[str] = None

    # --- Personne Physique ---
    cin: Optional[str] = None
    date_naissance: Optional[str] = None
    profession: Optional[str] = None
    numero_patente: Optional[str] = None

    # --- Services demandés ---
    services_demandes: Optional[List[str]] = None

    # --- Événements sélectionnés ---
    evenement_ids: Optional[List[int]] = None

    # --- Documents ---
    documents: Optional[str] = None


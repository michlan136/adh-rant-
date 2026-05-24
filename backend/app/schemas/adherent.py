from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AdherentBase(BaseModel):
    reference: str
    nom: str
    sub_nom: Optional[str] = None
    type_adherent: str
    email: str
    telephone: Optional[str] = None
    statut: str
    date_adhesion: date

class AdherentCreate(AdherentBase):
    pass

class AdherentUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    raison_sociale: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    ice: Optional[str] = None
    statut: Optional[str] = None # Actif / En attente
    type_adherent: Optional[str] = None # Moral / Physique
    adresse: Optional[str] = None
    cin: Optional[str] = None
    date_naissance: Optional[date] = None
    profession: Optional[str] = None
    numero_patente: Optional[str] = None
    tax_professionnelle: Optional[str] = None
    description_activite: Optional[str] = None
    photo_url: Optional[str] = None
    donnees_extra: Optional[dict] = None

class AdherentResponse(AdherentBase):
    id: int
    date_creation: datetime
    documents: Optional[List[dict]] = []
    adresse: Optional[str] = None
    cin: Optional[str] = None
    date_naissance: Optional[date] = None
    profession: Optional[str] = None
    numero_patente: Optional[str] = None
    tax_professionnelle: Optional[str] = None
    description_activite: Optional[str] = None
    ice: Optional[str] = None
    mot_de_passe: Optional[str] = None
    photo_url: Optional[str] = None
    donnees_extra: Optional[dict] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_adherents: int
    inscriptions_attente: int
    cartes_generees: int
    renouvellements: int
    activites_recentes: List[dict] # Simple dict for now {name, desc, time, type}

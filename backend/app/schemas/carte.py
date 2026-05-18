from pydantic import BaseModel
from typing import Optional
from datetime import date

class CarteAdherentResponse(BaseModel):
    id: int
    numero_carte: Optional[str]
    date_emission: Optional[date]
    date_expiration: Optional[date]
    statut: Optional[str]
    entreprise_id: Optional[int]
    nom_adherent: Optional[str]   # raison_sociale or "NOM Prenom"
    type_adherent: Optional[str]  # "Moral" or "Physique"
    # Extra fields from entreprise table for the card visual
    nom: Optional[str] = None
    prenom: Optional[str] = None
    profession: Optional[str] = None
    numero_patente: Optional[str] = None
    rc: Optional[str] = None           # tax_professionnelle used as RC
    annee_validite: Optional[str] = None  # e.g. "2027"
    photo_path: Optional[str] = None
    
    class Config:
        from_attributes = True

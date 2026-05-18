from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.finance import Fournisseur, Depense
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Schemas
class FournisseurBase(BaseModel):
    nom: str
    contact_nom: str = None
    email: str = None
    telephone: str = None
    adresse: str = None
    type_service: str = None

class FournisseurResponse(FournisseurBase):
    id: int
    class Config:
        from_attributes = True

class DepenseBase(BaseModel):
    titre: str
    montant: float
    categorie: str = None
    mode_paiement: str = None
    statut: str = "paye"
    fournisseur_id: int = None
    commentaire: str = None

class DepenseResponse(DepenseBase):
    id: int
    date_depense: datetime
    class Config:
        from_attributes = True

# Endpoints Fournisseurs
@router.get("/fournisseurs", response_model=List[FournisseurResponse])
def get_fournisseurs(db: Session = Depends(get_db)):
    return db.query(Fournisseur).all()

@router.post("/fournisseurs", response_model=FournisseurResponse)
def create_fournisseur(f: FournisseurBase, db: Session = Depends(get_db)):
    db_f = Fournisseur(**f.dict())
    db.add(db_f)
    db.commit()
    db.refresh(db_f)
    return db_f

# Endpoints Depenses
@router.get("/depenses", response_model=List[DepenseResponse])
def get_depenses(db: Session = Depends(get_db)):
    return db.query(Depense).all()

@router.post("/depenses", response_model=DepenseResponse)
def create_depense(d: DepenseBase, db: Session = Depends(get_db)):
    db_d = Depense(**d.dict())
    db.add(db_d)
    db.commit()
    db.refresh(db_d)
    return db_d

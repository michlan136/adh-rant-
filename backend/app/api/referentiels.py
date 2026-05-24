from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.session import get_db

from ..models.ville import Ville
from ..models.pays import Pays
from ..models.forme_juridique import FormeJuridique
from ..models.effectif import Effectif
from ..models.ca import CA
from ..models.fonction import Fonction
from ..models.activite import Activite
from ..models.famille import Famille
from ..models.cibles import Formation, Publication, Prospection, AssistanceTPE, Guichet, LocationSalles

router = APIRouter()

@router.get("/villes")
def get_villes(db: Session = Depends(get_db)):
    return db.query(Ville).all()

@router.get("/pays")
def get_pays(db: Session = Depends(get_db)):
    return db.query(Pays).all()

@router.get("/formes-juridiques")
def get_formes_juridiques(db: Session = Depends(get_db)):
    return db.query(FormeJuridique).all()

@router.get("/effectifs")
def get_effectifs(db: Session = Depends(get_db)):
    return db.query(Effectif).order_by(Effectif.id).all()

@router.get("/chiffres-affaires")
def get_ca(db: Session = Depends(get_db)):
    return db.query(CA).order_by(CA.id).all()

@router.get("/fonctions")
def get_fonctions(db: Session = Depends(get_db)):
    return db.query(Fonction).all()

@router.get("/activites")
def get_activites(db: Session = Depends(get_db)):
    return db.query(Activite).all()

@router.get("/familles")
def get_familles(db: Session = Depends(get_db)):
    return db.query(Famille).all()

@router.get("/services")
def get_services(db: Session = Depends(get_db)):
    """Retourne la liste complète des services configurables (cibles)"""
    return {
        "Formation": db.query(Formation).all(),
        "Publication": db.query(Publication).all(),
        "Prospection": db.query(Prospection).all(),
        "Assistance TPE": db.query(AssistanceTPE).all(),
        "Guichet": db.query(Guichet).all(),
        "Location salles": db.query(LocationSalles).all()
    }

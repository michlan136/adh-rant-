from sqlalchemy import Column, String, Integer, Date, DateTime
from datetime import datetime
from ..db.session import Base

class Adherent(Base):
    __tablename__ = "adherents"
    
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False) # e.g. ADH001, 2026-PP-001284
    nom = Column(String, nullable=False) # Nom ou Raison Sociale
    sub_nom = Column(String, nullable=True) # Pour afficher un sous-titre si besoin (ex: Raison sociale)
    type_adherent = Column(String, nullable=False, default="Physique") # Physique ou Moral
    email = Column(String, unique=True, index=True, nullable=False)
    telephone = Column(String, nullable=True)
    statut = Column(String, default="En attente") # En attente, Actif, Refusé
    date_adhesion = Column(Date, nullable=False) # Date de l'adhésion (ou date formatée string)
    date_creation = Column(DateTime, default=datetime.utcnow)
    photo_url = Column(String, nullable=True)

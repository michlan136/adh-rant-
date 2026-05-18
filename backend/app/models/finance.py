from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..db.session import Base
from datetime import datetime

class Fournisseur(Base):
    __tablename__ = "fournisseurs"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    contact_nom = Column(String(100))
    email = Column(String(100))
    telephone = Column(String(50))
    adresse = Column(Text)
    type_service = Column(String(100)) # ex: Impression, Location, Traiteur
    date_creation = Column(DateTime, default=datetime.utcnow)

    depenses = relationship("Depense", back_populates="fournisseur")

class Depense(Base):
    __tablename__ = "depenses"
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(200), nullable=False)
    montant = Column(Float, nullable=False)
    date_depense = Column(DateTime, default=datetime.utcnow)
    categorie = Column(String(100)) # ex: Evenement, Administratif, Marketing
    mode_paiement = Column(String(50)) # ex: Virement, Cheque, Especes
    statut = Column(String(50), default="paye") # paye, en attente
    fournisseur_id = Column(Integer, ForeignKey("fournisseurs.id"))
    commentaire = Column(Text)

    fournisseur = relationship("Fournisseur", back_populates="depenses")

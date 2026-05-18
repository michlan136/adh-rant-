from sqlalchemy import Column, String, Integer, DateTime, Text
from datetime import datetime
from ..db.session import Base

class DemandeInscription(Base):
    __tablename__ = "demande_inscription"
    
    id = Column(Integer, primary_key=True, index=True)
    nom_contact = Column(String, nullable=False)
    prenom_contact = Column(String, nullable=False)
    email_contact = Column(String, unique=True, index=True, nullable=False)
    telephone_contact = Column(String, nullable=True)
    mot_de_passe = Column(String, nullable=False)
    raison_sociale_entreprise = Column(String, nullable=True)
    statut = Column(String, default="en attente") # Note: lowercase "en attente" as per user description
    date_demande = Column(DateTime, default=datetime.utcnow)
    entreprise_creee_id = Column(Integer, nullable=True)
    login_cree_id = Column(Integer, nullable=True)
    documents = Column(String, nullable=True) # JSON string to store imported docs
    services_demandes = Column(Text, nullable=True) # JSON list of requested services

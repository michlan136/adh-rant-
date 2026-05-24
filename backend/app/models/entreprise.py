from sqlalchemy import Column, String, Integer, Date, Boolean, Text, DateTime
from datetime import datetime
from ..db.session import Base

class Entreprise(Base):
    __tablename__ = "entreprise"
    
    id = Column(Integer, primary_key=True, index=True)
    raison_sociale = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    documents = Column(String, nullable=True)  # JSON string storing imported document metadata
    nom = Column(String, nullable=True)
    prenom = Column(String, nullable=True)
    adresse = Column(Text, nullable=True)
    date_creation = Column(Date, nullable=True)
    effetive = Column(String, nullable=True) # Assuming string from schema dump
    ice = Column(String, nullable=True)
    tax_professionnelle = Column(String, nullable=True)
    description_activite = Column(Text, nullable=True)
    donnees_extra = Column(Text, nullable=True)
    effectif_id = Column(Integer, nullable=True)
    ca_id = Column(Integer, nullable=True)
    forme_juridique_id = Column(Integer, nullable=True)
    marque_id = Column(Integer, nullable=True)
    ville_id = Column(Integer, nullable=True)
    est_valide = Column(Boolean, default=False)
    derniere_connexion_activite = Column(DateTime, nullable=True)
    cin = Column(String, nullable=True)
    date_naissance = Column(Date, nullable=True)
    profession = Column(String, nullable=True)
    numero_patente = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

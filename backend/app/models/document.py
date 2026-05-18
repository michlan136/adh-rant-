from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from datetime import datetime
from ..db.session import Base

class Document(Base):
    __tablename__ = "document"
    
    id = Column(Integer, primary_key=True, index=True)
    nom_fichier = Column(String, nullable=False)
    chemin_fichier = Column(String, nullable=False)
    type_document = Column(String, nullable=True) # Ex: 'CIN', 'Statut', 'RC'
    date_importation = Column(DateTime, default=datetime.utcnow)
    
    # Champs spécifiques aux documents globaux
    categorie = Column(String, nullable=True)
    taille = Column(String, nullable=True)
    ajoute_par = Column(String, nullable=True)
    
    # Relations optionnelles (un document peut être lié à une demande en cours ou une entreprise validée)
    demande_inscription_id = Column(Integer, ForeignKey("demande_inscription.id"), nullable=True)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)
    renouvellement_id = Column(Integer, ForeignKey("renouvellement.id"), nullable=True)

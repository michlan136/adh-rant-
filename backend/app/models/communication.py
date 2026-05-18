from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from datetime import datetime
from ..db.session import Base

class Communication(Base):
    __tablename__ = "communication"
    
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String, nullable=False)
    canal = Column(String, nullable=True)  # Email, SMS, Notification
    contenu = Column(Text, nullable=True)
    date_envoi = Column(DateTime, default=datetime.utcnow)
    evenement_id = Column(Integer, ForeignKey("evenement.id"), nullable=True)
    destinataires_ids = Column(Text, nullable=True)  # JSON list of IDs
    nombre_destinataires = Column(Integer, default=0)
    statut_ou_metrique = Column(String, nullable=True)  # Ex: "Taux ouverture: 68%"

"""
Modèles de communication — schéma réel de gestion_adherent.

- Communication : historique d'un envoi (pas de destinataires_ids)
- EnvoiCommunication : table de liaison communication ↔ entreprise (par destinataire)
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from datetime import datetime
from ..db.session import Base


class Communication(Base):
    __tablename__ = "communication"

    id                   = Column(Integer, primary_key=True, index=True)
    titre                = Column(String, nullable=False)
    canal                = Column(String, nullable=True)    # WhatsApp | Email | SMS | Notification
    contenu              = Column(Text, nullable=True)
    date_envoi           = Column(DateTime, default=datetime.utcnow)
    evenement_id         = Column(Integer, ForeignKey("evenement.id"), nullable=True)
    nombre_destinataires = Column(Integer, default=0)
    statut_ou_metrique   = Column(String, nullable=True)    # Ex: "Envoyé à 15 destinataires"
    piece_jointe_nom     = Column(String, nullable=True)    # Nom de la pièce jointe


class EnvoiCommunication(Base):
    """Table de liaison : un enregistrement par destinataire pour chaque communication."""
    __tablename__ = "envoi_communication"

    id               = Column(Integer, primary_key=True, index=True)
    communication_id = Column(Integer, ForeignKey("communication.id"), nullable=False)
    entreprise_id    = Column(Integer, ForeignKey("entreprise.id"),    nullable=False)
    telephone        = Column(String, nullable=True)
    statut_envoi     = Column(String, default="en_attente")  # en_attente | envoye | echec | invalide
    date_envoi_reel  = Column(DateTime, nullable=True)
    code_erreur      = Column(String, nullable=True)

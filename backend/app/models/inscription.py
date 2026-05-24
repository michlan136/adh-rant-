"""
Modèle DemandeInscription — schéma réel de gestion_adherent.
Colonnes réelles : id, nom_contact, prenom_contact, email_contact, telephone_contact,
                   raison_sociale_entreprise, forme_juridique, mot_de_passe, statut,
                   date_demande, services_demandes, entreprise_creee_id, login_cree_id.
Note : pas de champ 'documents' dans la nouvelle table.
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from datetime import datetime
from ..db.session import Base


class DemandeInscription(Base):
    __tablename__ = "demande_inscription"

    id                          = Column(Integer, primary_key=True, index=True)
    nom_contact                 = Column(String, nullable=False)
    prenom_contact              = Column(String, nullable=False)
    email_contact               = Column(String, unique=True, index=True, nullable=False)
    telephone_contact           = Column(String, nullable=True)
    raison_sociale_entreprise   = Column(String, nullable=True)
    forme_juridique             = Column(String, nullable=True)
    mot_de_passe                = Column(String, nullable=False)
    statut                      = Column(String, default="en attente")   # en attente | validé | refusé
    date_demande                = Column(DateTime, default=datetime.utcnow)
    services_demandes           = Column(Text, nullable=True)            # JSON list
    entreprise_creee_id         = Column(Integer, ForeignKey("entreprise.id"), nullable=True)
    login_cree_id               = Column(Integer, ForeignKey("login.id"),      nullable=True)

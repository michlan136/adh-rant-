"""
Table Participation — schéma réel de gestion_adherent.

Colonnes réelles :
  PK  : id_participation
  FK  : id_adherent → entreprise.id
        id_evenement → evenement.id
        id_publication → publication.id
        id_formation → formation.id
        id_prospection → prospection.id
        id_assistance → assistance_tpe.id
        id_guichet → guichet.id
        id_salle → location_salles.id

Contrainte CHECK : exactement 1 FK activité non-NULL.
"""

from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime
from datetime import datetime
from ..db.session import Base


class Participation(Base):
    __tablename__ = "participation"

    id_participation = Column(Integer, primary_key=True, index=True)

    # Adhérent (référence principale via entreprise.id)
    id_adherent  = Column(Integer, ForeignKey("entreprise.id"),       nullable=False)

    # Relations vers les différentes tables d'activités
    id_evenement   = Column(Integer, ForeignKey("evenement.id"),       nullable=True)
    id_publication = Column(Integer, ForeignKey("publication.id"),     nullable=True)
    id_formation   = Column(Integer, ForeignKey("formation.id"),       nullable=True)
    id_prospection = Column(Integer, ForeignKey("prospection.id"),     nullable=True)
    id_assistance  = Column(Integer, ForeignKey("assistance_tpe.id"),  nullable=True)
    id_guichet     = Column(Integer, ForeignKey("guichet.id"),         nullable=True)
    id_salle       = Column(Integer, ForeignKey("location_salles.id"), nullable=True)

    # Informations de participation
    date_inscription = Column(Date, nullable=True)
    statut           = Column(String, default="inscrit")   # inscrit | present | annule
    notes            = Column(String, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    # ─── Compatibilité ascendante avec l'ancien code ────────────────────────
    @property
    def id(self):
        return self.id_participation

    @property
    def entreprise_id(self):
        return self.id_adherent

    @entreprise_id.setter
    def entreprise_id(self, value):
        self.id_adherent = value

    @property
    def evenement_id(self):
        return self.id_evenement

    @evenement_id.setter
    def evenement_id(self, value):
        self.id_evenement = value

    @property
    def formation_id(self):
        return self.id_formation

    @formation_id.setter
    def formation_id(self, value):
        self.id_formation = value

    @property
    def prospection_id(self):
        return self.id_prospection

    @prospection_id.setter
    def prospection_id(self, value):
        self.id_prospection = value

    @property
    def publication_id(self):
        return self.id_publication

    @publication_id.setter
    def publication_id(self, value):
        self.id_publication = value

    @property
    def assistance_tpe_id(self):
        return self.id_assistance

    @assistance_tpe_id.setter
    def assistance_tpe_id(self, value):
        self.id_assistance = value

    @property
    def guichet_id(self):
        return self.id_guichet

    @guichet_id.setter
    def guichet_id(self, value):
        self.id_guichet = value

    @property
    def location_salles_id(self):
        return self.id_salle

    @location_salles_id.setter
    def location_salles_id(self, value):
        self.id_salle = value

    @property
    def date_creation(self):
        return self.created_at

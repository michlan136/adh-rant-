"""
Table Participation étendue — centralise TOUTES les participations des adhérents :
- événements
- formations (cycle court / cycle long)
- prospections
- publications
- assistance TPE
- guichet
- location de salles
"""

from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime
from datetime import datetime
from ..db.session import Base


class Participation(Base):
    __tablename__ = "participation"

    id = Column(Integer, primary_key=True, index=True)

    # Adhérent (référence principale via entreprise)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)

    # Type de participation (événement, formation, prospection, etc.)
    type_cible = Column(String, nullable=True)  # 'evenement' | 'formation' | 'prospection' | etc.

    # Relations vers les différentes tables de cibles
    evenement_id = Column(Integer, ForeignKey("evenement.id"), nullable=True)
    formation_id = Column(Integer, ForeignKey("formation.id"), nullable=True)
    prospection_id = Column(Integer, ForeignKey("prospection.id"), nullable=True)
    publication_id = Column(Integer, ForeignKey("publication.id"), nullable=True)
    assistance_tpe_id = Column(Integer, ForeignKey("assistance_tpe.id"), nullable=True)
    guichet_id = Column(Integer, ForeignKey("guichet.id"), nullable=True)
    location_salles_id = Column(Integer, ForeignKey("location_salles.id"), nullable=True)

    # Informations de participation
    date_inscription = Column(Date, nullable=True)
    statut = Column(String, default="inscrit")  # inscrit, present, annule
    date_creation = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)

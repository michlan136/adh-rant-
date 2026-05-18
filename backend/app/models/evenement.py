from sqlalchemy import Column, String, Integer, Date, Time, Text
from ..db.session import Base

class Evenement(Base):
    __tablename__ = "evenement"
    
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String, nullable=False)
    date_evenement = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=True)
    heure_fin = Column(Time, nullable=True)
    categorie = Column(String, nullable=True)
    lieu = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    places_limitees = Column(Integer, nullable=True)

from sqlalchemy import Column, String, Integer, Date, ForeignKey
from ..db.session import Base

class Participation(Base):
    __tablename__ = "participation"
    
    id = Column(Integer, primary_key=True, index=True)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=False)
    evenement_id = Column(Integer, ForeignKey("evenement.id"), nullable=False)
    date_inscription = Column(Date, nullable=True)
    statut = Column(String, default="inscrit")  # inscrit, present, annule

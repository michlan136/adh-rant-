from sqlalchemy import Column, String, Integer, Date, Float, ForeignKey
from ..db.session import Base

class Adhesion(Base):
    __tablename__ = "adhesion"
    
    id = Column(Integer, primary_key=True, index=True)
    num_bulletin = Column(String, nullable=True)
    date_adhesion = Column(Date, nullable=True)
    montant_paye = Column(Float, nullable=True)
    statut_adhesion = Column(String, default="en attente")  # actif, en attente, expire
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)

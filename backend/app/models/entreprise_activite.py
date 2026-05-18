from sqlalchemy import Column, Integer
from ..db.session import Base

class EntrepriseActivite(Base):
    __tablename__ = "entreprise_activite"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    activite_id = Column(Integer, nullable=False)
    entreprise_id = Column(Integer, nullable=False)

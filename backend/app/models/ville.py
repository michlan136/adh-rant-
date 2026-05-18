from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Ville(Base):
    __tablename__ = "ville"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    ville_nom = Column(String, nullable=False)

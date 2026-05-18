from sqlalchemy import Column, Integer, String
from ..db.session import Base

class FormeJuridique(Base):
    __tablename__ = "forme_juridique"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    libelle = Column(String, nullable=False)

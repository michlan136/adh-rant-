from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Pays(Base):
    __tablename__ = "pays"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)

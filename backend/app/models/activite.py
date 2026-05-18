from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Activite(Base):
    __tablename__ = "activite"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    libelle = Column(String, nullable=False)
    famille_id = Column(Integer, nullable=True)  # pas de ForeignKey pour éviter les conflits


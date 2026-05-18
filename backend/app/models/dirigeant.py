from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Dirigeant(Base):
    __tablename__ = "dirigeants"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=True)
    prenom = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    fonction_id = Column(Integer, nullable=True)  # pas de ForeignKey pour éviter les conflits de chargement


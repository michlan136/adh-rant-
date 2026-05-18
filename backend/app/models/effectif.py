from sqlalchemy import Column, String, Integer
from ..db.session import Base

class Effectif(Base):
    __tablename__ = "effectif"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_doc_membres = Column(Integer, nullable=True)

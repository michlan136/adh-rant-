from sqlalchemy import Column, Integer, ForeignKey
from ..db.session import Base

class Exportation(Base):
    __tablename__ = "exportation"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    pays_id = Column(Integer, ForeignKey("pays.id"), nullable=True)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)

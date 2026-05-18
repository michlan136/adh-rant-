from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Marque(Base):
    __tablename__ = "marque"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=True)

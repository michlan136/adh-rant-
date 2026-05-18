from sqlalchemy import Column, Integer, String
from ..db.session import Base

class Fonction(Base):
    __tablename__ = "fonction"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)

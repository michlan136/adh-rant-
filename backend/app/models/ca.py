from sqlalchemy import Column, Integer, Numeric
from ..db.session import Base

class CA(Base):
    __tablename__ = "ca"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    montant = Column(Numeric, nullable=True)

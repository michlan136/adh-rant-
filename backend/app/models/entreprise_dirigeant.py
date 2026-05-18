from sqlalchemy import Column, Integer
from ..db.session import Base

class EntrepriseDirigeant(Base):
    __tablename__ = "entreprise_dirigeant"
    __table_args__ = {'extend_existing': True}
    
    entreprise_dirigeant_id = Column(Integer, primary_key=True, index=True)
    entreprise_id = Column(Integer, nullable=False)
    dirigeants_id = Column(Integer, nullable=False)

from sqlalchemy import Column, String, Integer
from ..db.session import Base

class Login(Base):
    __tablename__ = "login"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe = Column(String, nullable=False)
    role = Column(String, default="member")
    entreprise_id = Column(Integer, nullable=True)

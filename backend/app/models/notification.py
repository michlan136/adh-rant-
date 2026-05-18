from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from datetime import datetime
from ..db.session import Base

class Notification(Base):
    __tablename__ = "notification"
    
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String, nullable=False)
    est_lu = Column(Boolean, default=False)
    message = Column(String, nullable=False)
    type_notif = Column(String, nullable=True)  # info, alerte, rappel
    date_creation = Column(DateTime, default=datetime.utcnow)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)

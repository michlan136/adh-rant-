from pydantic import BaseModel
from datetime import date, time
from typing import Optional

class EvenementBase(BaseModel):
    titre: str
    date_evenement: date
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    categorie: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    places_limitees: Optional[int] = None

class EvenementCreate(EvenementBase):
    pass

class EvenementUpdate(BaseModel):
    titre: Optional[str] = None
    date_evenement: Optional[date] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    categorie: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    places_limitees: Optional[int] = None

class EvenementResponse(EvenementBase):
    id: int

    class Config:
        from_attributes = True

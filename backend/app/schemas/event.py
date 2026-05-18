# backend/app/schemas/event.py

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

class EventBase(BaseModel):
    title: str = Field(..., example="Conférence Annuelle 2026")
    location: Optional[str] = Field(None, example="Paris, France")
    description: Optional[str] = Field(None, example="Description de la conférence")
    start_date: datetime = Field(..., example="2026-06-15T09:00:00")
    end_date: datetime = Field(..., example="2026-06-15T17:00:00")
    type: Optional[str] = Field("conference", example="conference")

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str]
    location: Optional[str]
    description: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    type: Optional[str]

class EventRead(EventBase):
    id: int
    documents: Optional[List[dict]] = None

    class Config:
        orm_mode = True

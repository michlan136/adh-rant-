# backend/app/routers/event.py
"""Event router providing CRUD endpoints for conference events.

Endpoints:
- GET / : List all events (optional query param `type`)
- GET /{event_id} : Retrieve single event with its documents
- POST / : Create a new event
- PUT /{event_id} : Update mutable fields of an event
- DELETE /{event_id} : Delete an event (and its documents)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..models.evenement import Evenement
from ..models.document import Document
from ..schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter()

def _event_to_schema(event: Evenement, docs: Optional[List[Document]] = None) -> EventRead:
    """Convert an Evenement instance plus optional documents to the Pydantic schema."""
    doc_list = []
    if docs:
        for d in docs:
            doc_list.append({
                "id": d.id,
                "nom_fichier": d.nom_fichier,
                "chemin_fichier": d.chemin_fichier,
                "type_document": d.type_document,
            })
            
    start_dt = datetime.combine(event.date_evenement, event.heure_debut) if event.heure_debut else datetime.combine(event.date_evenement, datetime.min.time())
    end_dt = datetime.combine(event.date_evenement, event.heure_fin) if event.heure_fin else datetime.combine(event.date_evenement, datetime.min.time())
    
    return EventRead(
        id=event.id,
        title=event.titre,
        location=event.lieu,
        description=event.description,
        start_date=start_dt,
        end_date=end_dt,
        type=event.categorie or "conference",
        documents=doc_list,
    )

@router.get("/", response_model=List[EventRead])
def list_events(type: Optional[str] = None, db: Session = Depends(get_db)):
    from datetime import date
    today = date.today()
    
    query = db.query(Evenement)
    if type:
        query = query.filter(Evenement.categorie == type)
    
    # Événements futurs (plus proches en premier)
    upcoming = query.filter(Evenement.date_evenement >= today).order_by(Evenement.date_evenement.asc()).all()
    # Événements passés (plus récents en premier)
    past = query.filter(Evenement.date_evenement < today).order_by(Evenement.date_evenement.desc()).all()
    
    events = upcoming + past
    result = []
    for ev in events:
        result.append(_event_to_schema(ev))
    return result

@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Evenement).filter(Evenement.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_to_schema(ev)

@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    new_event = Evenement(
        titre=payload.title,
        lieu=payload.location,
        description=payload.description,
        date_evenement=payload.start_date,
        categorie=payload.type,
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return _event_to_schema(new_event)

@router.put("/{event_id}", response_model=EventRead)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    ev = db.query(Evenement).filter(Evenement.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if payload.title is not None:
        ev.titre = payload.title
    if payload.location is not None:
        ev.lieu = payload.location
    if payload.description is not None:
        ev.description = payload.description
    if payload.start_date is not None:
        ev.date_evenement = payload.start_date
    if payload.end_date is not None:
        ev.date_evenement = payload.end_date
    if payload.type is not None:
        ev.categorie = payload.type
    db.commit()
    db.refresh(ev)
    docs = db.query(Document).filter(Document.event_id == ev.id).all()
    return _event_to_schema(ev, docs)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Evenement).filter(Evenement.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.query(Document).filter(Document.event_id == event_id).delete()
    db.delete(ev)
    db.commit()
    return None

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from datetime import date, datetime, timedelta
from ..db.session import get_db
from ..models.entreprise import Entreprise
from ..models.evenement import Evenement
from ..models.document import Document
from ..models.participation import Participation
from ..models.notification import Notification
from ..models.renouvellement import Renouvellement
from ..models.carte import CarteAdherent
from ..schemas.adherent import AdherentCreate, AdherentResponse, AdherentUpdate
from ..core.security import get_current_user
from ..core.email import send_renewal_request_email

router = APIRouter(prefix="/adherents", tags=["Adhérents"])

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "outakuanime845@gmail.com")


def _check_and_expire(ent: Entreprise, db: Session):
    """Vérifie si l'adhésion est expirée et met le statut à jour."""
    if not ent.est_valide:
        return

    # Priorité à la table carte_adherent pour la date d'expiration (carte active)
    carte = db.query(CarteAdherent).filter(
        CarteAdherent.entreprise_id == ent.id,
        CarteAdherent.statut.ilike("active")
    ).first()
    expiry = None

    if carte and carte.date_expiration:
        expiry = carte.date_expiration
    elif ent.date_creation:
        # Fallback : créer la carte si elle manque
        try:
            expiry = ent.date_creation.replace(year=ent.date_creation.year + 1)
        except ValueError:
            expiry = ent.date_creation + timedelta(days=365)
        
        # Créer physiquement la carte dans la base pour qu'elle y soit "affectée"
        type_adh = "PM" if ent.raison_sociale else "PP"
        nouvelle_carte = CarteAdherent(
            entreprise_id=ent.id,
            date_emission=ent.date_creation,
            date_expiration=expiry,
            numero_carte=f"{ent.date_creation.year}-{type_adh}-{ent.id:06d}-AUTO",
            statut="active"
        )
        db.add(nouvelle_carte)
        db.commit()
        db.refresh(ent)

    if expiry and expiry < date.today():
        ent.est_valide = False
        # Créer une notification d'alerte si elle n'existe pas déjà
        existing_notif = db.query(Notification).filter(
            Notification.entreprise_id == ent.id,
            Notification.titre == "Adhésion expirée"
        ).first()
        if not existing_notif:
            notif = Notification(
                titre="Adhésion expirée",
                message=f"Votre adhésion a expiré le {expiry.strftime('%d/%m/%Y')}. Veuillez effectuer un renouvellement.",
                type_notif="alerte",
                entreprise_id=ent.id
            )
            db.add(notif)
        db.commit()
        db.refresh(ent)


def map_entreprise_to_adherent(ent: Entreprise, db: Session) -> AdherentResponse:
    type_adh = "Moral" if ent.raison_sociale else "Physique"
    display_nom = ent.raison_sociale if ent.raison_sociale else f"{ent.prenom or ''} {ent.nom or ''}".strip()
    sub_nom = f"{ent.prenom or ''} {ent.nom or ''}".strip() if ent.raison_sociale else None

    # Chercher le numéro de carte réel dans la base
    carte = db.query(CarteAdherent).filter(
        CarteAdherent.entreprise_id == ent.id,
        CarteAdherent.statut.ilike("active")
    ).first()
    
    reference = carte.numero_carte if carte and carte.numero_carte else f"ENT-{ent.id:04d}"

    return AdherentResponse(
        id=ent.id,
        reference=reference,
        nom=display_nom,
        sub_nom=sub_nom,
        type_adherent=type_adh,
        email=ent.email or "",
        telephone=ent.telephone or "",
        statut="Actif" if ent.est_valide else "Inactif",
        date_adhesion=ent.date_adhesion if hasattr(ent, 'date_adhesion') and ent.date_adhesion else ent.date_creation or date.today(),
        date_creation=datetime.utcnow(),
        photo_url=ent.photo_url,
        adresse=ent.adresse,
        cin=ent.cin,
        date_naissance=ent.date_naissance,
        profession=ent.profession,
        numero_patente=ent.numero_patente,
        tax_professionnelle=ent.tax_professionnelle,
        description_activite=ent.description_activite,
        ice=ent.ice
    )


@router.get("/", response_model=list[AdherentResponse])
def get_adherents(db: Session = Depends(get_db)):
    entreprises = db.query(Entreprise).all()
    return [map_entreprise_to_adherent(ent, db) for ent in entreprises]


@router.get("/me", response_model=AdherentResponse)
def get_current_adherent(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    ent = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Profil adhérent non trouvé pour ce compte")

    _check_and_expire(ent, db)
    return map_entreprise_to_adherent(ent, db)


@router.get("/{adherent_id}", response_model=AdherentResponse)
def get_adherent(adherent_id: int, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Adhérent non trouvé")
    return map_entreprise_to_adherent(ent, db)


@router.post("/", response_model=AdherentResponse)
def create_adherent(adherent: AdherentCreate, db: Session = Depends(get_db)):
    data = adherent.model_dump()
    new_ent = Entreprise(
        raison_sociale=data.get("nom") if data.get("type_adherent") == "Moral" else None,
        nom=data.get("nom") if data.get("type_adherent") == "Physique" else None,
        email=data.get("email"),
        telephone=data.get("telephone"),
        est_valide=data.get("statut") == "Actif"
    )
    db.add(new_ent)
    db.commit()
    db.refresh(new_ent)
    return map_entreprise_to_adherent(new_ent, db)


@router.put("/{adherent_id}", response_model=AdherentResponse)
def update_adherent(adherent_id: int, adherent_update: AdherentUpdate, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Adhérent non trouvé")

    update_data = adherent_update.model_dump(exclude_unset=True)
    
    # Mettre à jour les champs
    for field, value in update_data.items():
        if field == "nom":
            if ent.raison_sociale:
                ent.raison_sociale = value
            else:
                ent.nom = value
        elif field == "statut":
            ent.est_valide = (value == "Actif")
        elif hasattr(ent, field):
            setattr(ent, field, value)

    db.commit()
    db.refresh(ent)
    return map_entreprise_to_adherent(ent, db)


@router.delete("/{adherent_id}")
def delete_adherent(adherent_id: int, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Adhérent non trouvé")
    db.delete(ent)
    db.commit()
    return {"message": "Adhérent supprimé avec succès"}


@router.post("/{adherent_id}/photo")
async def upload_adherent_photo(
    adherent_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Adhérent non trouvé")

    if current_user.get("role") != "admin":
        if ent.email != current_user.get("sub"):
            raise HTTPException(status_code=403, detail="Vous n'avez pas l'autorisation de modifier cette photo")

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"photo_{adherent_id}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_photo_url = f"/uploads/{unique_filename}"
    ent.photo_url = new_photo_url
    db.commit()
    db.refresh(ent)

    return {"photo_url": new_photo_url}


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me/dashboard")
def get_dashboard_data(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    ent = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Profil non trouvé")

    _check_and_expire(ent, db)

    docs_count = db.query(Document).filter(Document.entreprise_id == entreprise_id).count()
    events_count = db.query(Participation).filter(Participation.entreprise_id == entreprise_id).count()
    notif_count = db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id,
        Notification.est_lu == False
    ).count()

    upcoming_events = db.query(Evenement).filter(
        Evenement.date_evenement >= date.today()
    ).order_by(Evenement.date_evenement.asc()).limit(2).all()

    activities = []
    notifs = db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id
    ).order_by(Notification.date_creation.desc()).limit(5).all()

    for n in notifs:
        color_map = {"alerte": "orange", "rappel": "purple", "succes": "green"}
        activities.append({
            "color": color_map.get(n.type_notif, "blue"),
            "title": n.titre,
            "desc": n.message,
            "time": n.date_creation.strftime("%d %b %Y à %H:%M")
        })

    # Récupérer la carte active (elle a été générée/vérifiée par _check_and_expire)
    carte = db.query(CarteAdherent).filter(
        CarteAdherent.entreprise_id == entreprise_id,
        CarteAdherent.statut.ilike("active")
    ).first()
    
    exp = None
    if carte:
        exp = carte.date_expiration
        expiration_date = exp.strftime("%d %B %Y")
        days_until_expiry = (exp - date.today()).days
    else:
        expiration_date = "Non définie"
        days_until_expiry = None

    return {
        "stats": {
            "statut": "Actif" if ent and ent.est_valide else "Inactif",
            "expiration": expiration_date,
            "days_until_expiry": days_until_expiry,
            "events_count": events_count,
            "docs_count": docs_count,
            "messages_count": notif_count
        },
        "activities": activities,
        "upcoming_events": [
            {
                "title": ev.titre,
                "date": ev.date_evenement.strftime("%d %B %Y"),
                "time": f"{ev.heure_debut.strftime('%H:%M')} - {ev.heure_fin.strftime('%H:%M')}" if ev.heure_debut and ev.heure_fin else "09:00 - 18:00",
                "location": ev.lieu or "En ligne",
                "tag": ev.categorie or "Événement"
            } for ev in upcoming_events
        ]
    }


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me/notifications")
def get_my_notifications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    notifs = db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id
    ).order_by(Notification.date_creation.desc()).all()

    return [
        {
            "id": n.id,
            "titre": n.titre,
            "message": n.message,
            "type_notif": n.type_notif or "info",
            "date": n.date_creation.strftime("%d %B %Y à %H:%M"),
            "lu": n.est_lu
        } for n in notifs
    ]


@router.get("/me/notifications/count")
def get_notifications_count(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        return {"count": 0}
    count = db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id,
        Notification.est_lu == False
    ).count()
    return {"count": count}


@router.post("/me/notifications/mark-read")
def mark_all_read(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")
    db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id
    ).update({"est_lu": True})
    db.commit()
    return {"message": "Toutes les notifications marquées comme lues"}


# ─────────────────────────────────────────────────────────────────────────────
# ÉVÉNEMENTS (vue adhérent)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me/events")
def get_my_events(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    today = date.today()
    # Événements futurs (plus proches en premier)
    upcoming = db.query(Evenement).filter(Evenement.date_evenement >= today).order_by(Evenement.date_evenement.asc()).all()
    # Événements passés (plus récents en premier)
    past = db.query(Evenement).filter(Evenement.date_evenement < today).order_by(Evenement.date_evenement.desc()).all()
    events = upcoming + past
    
    my_participations = db.query(Participation).filter(
        Participation.entreprise_id == entreprise_id
    ).all()
    registered_ids = {p.evenement_id for p in my_participations}

    result = []
    for ev in events:
        is_past = ev.date_evenement < today
        participant_count = db.query(Participation).filter(
            Participation.evenement_id == ev.id
        ).count()
        places = ev.places_limitees or 0
        progress = round((participant_count / places * 100), 1) if places > 0 else 0
        is_full = (places > 0 and participant_count >= places)

        result.append({
            "id": ev.id,
            "titre": ev.titre,
            "description": ev.description or "",
            "date_evenement": str(ev.date_evenement),
            "heure_debut": str(ev.heure_debut) if ev.heure_debut else None,
            "heure_fin": str(ev.heure_fin) if ev.heure_fin else None,
            "lieu": ev.lieu or "Non spécifié",
            "categorie": ev.categorie or "Événement",
            "places_limitees": ev.places_limitees,
            "participants_count": participant_count,
            "progress": progress,
            "is_registered": ev.id in registered_ids,
            "is_past": is_past,
            "is_full": is_full,
            "statut": "Terminé" if is_past else ("Complet" if is_full else "Disponible")
        })
    return result


@router.post("/me/events/{event_id}/register")
def register_for_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    ev = db.query(Evenement).filter(Evenement.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Événement non trouvé")

    if ev.date_evenement < date.today():
        raise HTTPException(status_code=400, detail="Cet événement est déjà terminé")

    existing = db.query(Participation).filter(
        Participation.entreprise_id == entreprise_id,
        Participation.evenement_id == event_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vous êtes déjà inscrit à cet événement")

    if ev.places_limitees:
        count = db.query(Participation).filter(Participation.evenement_id == event_id).count()
        if count >= ev.places_limitees:
            raise HTTPException(status_code=400, detail="Plus de places disponibles pour cet événement")

    participation = Participation(
        entreprise_id=entreprise_id,
        evenement_id=event_id,
        date_inscription=date.today(),
        statut="inscrit"
    )
    db.add(participation)

    notif = Notification(
        titre="Inscription confirmée",
        message=f"Vous êtes inscrit à l'événement : {ev.titre} le {ev.date_evenement.strftime('%d/%m/%Y')}",
        type_notif="succes",
        entreprise_id=entreprise_id
    )
    db.add(notif)
    db.commit()

    return {"message": "Inscription réussie", "event": ev.titre}


@router.delete("/me/events/{event_id}/unregister")
def unregister_from_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entreprise_id = current_user.get("entreprise_id")
    p = db.query(Participation).filter(
        Participation.entreprise_id == entreprise_id,
        Participation.evenement_id == event_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    db.delete(p)
    db.commit()
    return {"message": "Désinscription réussie"}


# ─────────────────────────────────────────────────────────────────────────────
# HISTORIQUE
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me/historique")
def get_historique(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    items = []

    # Notifications (toutes)
    notifs = db.query(Notification).filter(
        Notification.entreprise_id == entreprise_id
    ).order_by(Notification.date_creation.desc()).all()
    for n in notifs:
        type_map = {"alerte": "Alertes", "succes": "Événements", "rappel": "Rappels", "info": "Emails"}
        color_map = {"alerte": "orange", "succes": "green", "rappel": "purple", "info": "blue"}
        items.append({
            "type": type_map.get(n.type_notif, "Emails"),
            "titre": n.titre,
            "description": n.message,
            "date": n.date_creation.strftime("%d %B %Y"),
            "heure": n.date_creation.strftime("%H:%M"),
            "icon_color": color_map.get(n.type_notif, "blue"),
            "timestamp": n.date_creation.timestamp()
        })

    # Participations aux événements
    parts = db.query(Participation, Evenement).join(
        Evenement, Participation.evenement_id == Evenement.id
    ).filter(Participation.entreprise_id == entreprise_id).all()
    for p, ev in parts:
        dt = datetime.combine(p.date_inscription, datetime.min.time()) if p.date_inscription else datetime.utcnow()
        items.append({
            "type": "Événements",
            "titre": "Inscription à un événement",
            "description": ev.titre,
            "date": p.date_inscription.strftime("%d %B %Y") if p.date_inscription else "Date inconnue",
            "heure": "",
            "icon_color": "purple",
            "timestamp": dt.timestamp()
        })

    # Renouvellements
    renewals = db.query(Renouvellement).filter(
        Renouvellement.entreprise_id == entreprise_id
    ).all()
    for r in renewals:
        dt = datetime.combine(r.date_paiement, datetime.min.time()) if r.date_paiement else datetime.utcnow()
        items.append({
            "id": r.id,
            "type": "Paiements",
            "titre": "Demande de renouvellement",
            "description": f"Renouvellement {r.annee or ''} — {r.mode_paiement or 'Non spécifié'} — Statut : {r.statut or 'En attente'}",
            "date": r.date_paiement.strftime("%d %B %Y") if r.date_paiement else "Date inconnue",
            "heure": "",
            "icon_color": "green",
            "timestamp": dt.timestamp(),
            "montant": r.montant,
            "annee": r.annee,
            "mode": r.mode_paiement,
            "ref": f"REC-{r.id:04d}-{uuid.uuid4().hex[:4].upper()}"
        })

    # Trier par timestamp décroissant
    items.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

    # Stats
    stats = {
        "emails": sum(1 for i in items if i["type"] == "Emails"),
        "evenements": sum(1 for i in items if i["type"] == "Événements"),
        "paiements": sum(1 for i in items if i["type"] == "Paiements"),
        "alertes": sum(1 for i in items if i["type"] in ("Alertes", "Rappels")),
    }

    return {"items": items, "stats": stats}


# ─────────────────────────────────────────────────────────────────────────────
# RENOUVELLEMENT
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me/renouvellement/check")
def check_renewal_eligibility(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Vérifie si l'adhérent est éligible au renouvellement."""
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    ent = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Profil non trouvé")

    # Priorité à la carte active pour la date d'expiration
    carte = db.query(CarteAdherent).filter(
        CarteAdherent.entreprise_id == entreprise_id,
        CarteAdherent.statut.ilike("active")
    ).first()
    expiry = None
    
    if carte:
        expiry = carte.date_expiration

    if not expiry:
        return {"eligible": True, "message": "Date d'expiration non définie", "days_remaining": None}

    days_remaining = (expiry - date.today()).days
    type_adherent = "Moral" if ent.raison_sociale else "Physique"

    # Vérifier s'il y a déjà une demande de renouvellement cette année
    existing_renouv = db.query(Renouvellement).filter(
        Renouvellement.entreprise_id == entreprise_id,
        Renouvellement.annee == date.today().year,
        Renouvellement.statut != "refusé"
    ).first()

    if existing_renouv:
        return {
            "eligible": False,
            "message": f"Une demande de renouvellement pour l'année {date.today().year} est déjà en cours ou validée (Statut: {existing_renouv.statut}).",
            "days_remaining": days_remaining,
            "expiry_date": str(expiry),
            "type_adherent": type_adherent,
            "active_renewal": {
                "id": existing_renouv.id,
                "statut": existing_renouv.statut,
                "statut_paiement": existing_renouv.statut_paiement
            }
        }

    if days_remaining > 30:
        return {
            "eligible": False,
            "message": f"Le renouvellement n'est possible qu'à moins de 30 jours de l'expiration. Il reste {days_remaining} jours.",
            "days_remaining": days_remaining,
            "expiry_date": str(expiry),
            "type_adherent": type_adherent
        }

    return {
        "eligible": True,
        "message": "Vous êtes éligible au renouvellement.",
        "days_remaining": days_remaining,
        "expiry_date": str(expiry),
        "type_adherent": type_adherent,
        "date_debut": str(date.today()),
        "date_fin": str(date.today().replace(year=date.today().year + 1))
    }


@router.post("/me/renouvellement")
async def submit_renouvellement(
    mode_paiement: str = Form(...),
    montant: float = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_identite: UploadFile = File(None),
    document_photo: UploadFile = File(None),
    document_rc: UploadFile = File(None),
    document_patente: UploadFile = File(None),
    preuve_paiement: UploadFile = File(None),
):
    """Soumet une demande de renouvellement d'adhésion."""
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    ent = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Profil non trouvé")

    today = date.today()

    # Créer le renouvellement
    renouvellement = Renouvellement(
        entreprise_id=entreprise_id,
        annee=today.year,
        annee_fiscale=today.year,
        montant=montant,
        date_paiement=today,
        mode_paiement=mode_paiement,
        statut="attente_docs",
        statut_paiement="en attente"
    )
    db.add(renouvellement)
    db.flush()

    # Sauvegarder les documents uploadés
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    docs_files = {
        "Identité": document_identite,
        "Photo": document_photo,
        "RC": document_rc,
        "Patente": document_patente,
    }
    for doc_name, doc_file in docs_files.items():
        if doc_file and doc_file.filename:
            ext = os.path.splitext(doc_file.filename)[1]
            fname = f"renouv_{entreprise_id}_{doc_name.lower()}_{uuid.uuid4().hex}{ext}"
            fpath = os.path.join(upload_dir, fname)
            with open(fpath, "wb") as buf:
                shutil.copyfileobj(doc_file.file, buf)
            new_doc = Document(
                nom_fichier=f"{doc_name} - Renouvellement {today.year}",
                chemin_fichier=f"/uploads/{fname}",
                type_document=doc_name,
                entreprise_id=entreprise_id,
                renouvellement_id=renouvellement.id,
                categorie="Renouvellement"
            )
            db.add(new_doc)

    # Sauvegarder la preuve de paiement si elle existe (Optionnelle au début si virement)
    if preuve_paiement and preuve_paiement.filename:
        ext = os.path.splitext(preuve_paiement.filename)[1]
        fname = f"preuve_{entreprise_id}_{uuid.uuid4().hex}{ext}"
        fpath = os.path.join(upload_dir, fname)
        with open(fpath, "wb") as buf:
            shutil.copyfileobj(preuve_paiement.file, buf)
        renouvellement.preuve_paiement = f"/uploads/{fname}"
        renouvellement.statut_paiement = "payé"

    # Notification pour l'adhérent
    notif = Notification(
        titre="Demande de renouvellement envoyée",
        message=f"Votre demande de renouvellement ({mode_paiement}) est en cours de traitement. L'administration vérifiera vos documents avant validation.",
        type_notif="info",
        entreprise_id=entreprise_id
    )
    db.add(notif)
    db.commit()

    # Email à l'admin
    nom = ent.raison_sociale or f"{ent.prenom or ''} {ent.nom or ''}".strip()
    send_renewal_request_email(ADMIN_EMAIL, nom, mode_paiement, montant)

    return {"message": "Demande de renouvellement soumise avec succès"}

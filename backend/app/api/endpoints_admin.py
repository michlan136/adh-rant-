from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import string
import random
import shutil
import os
import uuid
from datetime import datetime, date, timedelta

from ..core.whatsapp import send_whatsapp_message, format_moroccan_phone
from ..db.session import get_db
from ..models.adherent import Adherent
from ..models.login import Login
from ..models.inscription import DemandeInscription
from ..models.carte import CarteAdherent
from ..models.renouvellement import Renouvellement
from ..models.document import Document
from ..models.entreprise import Entreprise
from ..schemas.adherent import AdherentCreate, DashboardStats
from ..schemas.inscription import DemandeInscriptionResponse, NouvelleInscriptionRequest
from ..schemas.evenement import EvenementCreate, EvenementResponse, EvenementUpdate
from pydantic import BaseModel
from typing import Optional
from ..models.evenement import Evenement
from ..models.participation import Participation
from ..models.communication import Communication
from ..models.notification import Notification
from ..core.email import send_email

class CommunicationRequest(BaseModel):
    titre: str
    canal: str
    contenu: str
    cible: str
    evenement_id: Optional[int] = None
    adherent_ids: Optional[List[int]] = None

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Entreprise.id).filter(Entreprise.est_valide == True).count()
    en_attente = db.query(Entreprise).filter(Entreprise.est_valide == False).count()
    cartes = db.query(CarteAdherent).filter(CarteAdherent.statut.ilike("active")).count()
    renouvellements = db.query(Renouvellement).filter(
        Renouvellement.statut.in_(["en attente", "attente_docs", "docs_approuves"])
    ).count()

    # Activités récentes réelles depuis toutes les notifications
    recent_notifs = db.query(Notification, Entreprise)\
        .join(Entreprise, Notification.entreprise_id == Entreprise.id)\
        .order_by(Notification.date_creation.desc())\
        .limit(8).all()

    recent_activities = []
    for n, ent in recent_notifs:
        name = ent.raison_sociale if ent.raison_sociale else f"{ent.prenom or ''} {ent.nom or ''}".strip()
        recent_activities.append({
            "name": name or "Inconnu",
            "desc": n.titre,
            "time": n.date_creation.strftime("%d/%m/%Y %H:%M"),
            "type": n.type_notif or "info"
        })

    # Compléter avec les dernières demandes si peu de notifs
    if len(recent_activities) < 4:
        dernieres = db.query(Entreprise).filter(Entreprise.est_valide == False)\
            .order_by(Entreprise.date_creation.desc()).limit(4).all()
        for d in dernieres:
            nm = d.raison_sociale if d.raison_sociale else f"{d.prenom or ''} {d.nom or ''}".strip()
            recent_activities.append({
                "name": nm or "Inconnu",
                "desc": "Nouvelle demande d'inscription",
                "time": d.date_creation.strftime("%d/%m/%Y") if d.date_creation else "Récemment",
                "type": "inscription_nouvelle"
            })

    return {
        "total_adherents": total,
        "inscriptions_attente": en_attente,
        "cartes_generees": cartes,
        "renouvellements": renouvellements,
        "activites_recentes": recent_activities[:8]
    }


from ..schemas.adherent import AdherentResponse, AdherentCreate, AdherentUpdate, DashboardStats

@router.get("/adherents", response_model=List[AdherentResponse])
def get_adherents(db: Session = Depends(get_db)):
    results = db.query(Entreprise, Login)\
        .outerjoin(Login, Login.entreprise_id == Entreprise.id)\
        .all()
    
    # Fetch documents grouped by entreprise_id
    all_docs = db.query(Document).filter(Document.entreprise_id.isnot(None)).all()
    docs_by_ent = {}
    for doc in all_docs:
        if doc.entreprise_id not in docs_by_ent:
            docs_by_ent[doc.entreprise_id] = []
        docs_by_ent[doc.entreprise_id].append({
            "nom_fichier": doc.nom_fichier,
            "chemin_fichier": doc.chemin_fichier,
            "type_document": doc.type_document
        })
    
    adherents_list = []
    for ent, login in results:
        # Determine type
        type_adh = "Moral" if ent.raison_sociale else "Physique"
        
        # Display name
        display_nom = ent.raison_sociale if ent.raison_sociale else f"{ent.prenom or ''} {ent.nom or ''}".strip()
        sub_nom = f"{ent.prenom or ''} {ent.nom or ''}".strip() if ent.raison_sociale else None
        
        # Status from est_valide
        statut_display = "Actif" if ent.est_valide else "En attente"
            
        adherents_list.append(AdherentResponse(
            id=ent.id,
            reference=f"ENT-{ent.id:04d}",
            nom=display_nom or "Inconnu",
            sub_nom=sub_nom,
            type_adherent=type_adh,
            email=login.email if login else (ent.email or "Non renseigné"),
            telephone=ent.telephone,
            statut=statut_display,
            date_adhesion=ent.date_creation or datetime.utcnow().date(),
            date_creation=datetime.utcnow(),
            documents=docs_by_ent.get(ent.id, []),
            adresse=ent.adresse,
            cin=ent.cin,
            date_naissance=ent.date_naissance,
            profession=ent.profession,
            numero_patente=ent.numero_patente,
            tax_professionnelle=ent.tax_professionnelle,
            description_activite=ent.description_activite,
            ice=ent.ice,
            mot_de_passe=login.mot_de_passe if login else None
        ))
    return adherents_list

@router.put("/adherents/{adherent_id}")
def update_adherent(adherent_id: int, payload: AdherentUpdate, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
        
    if payload.nom is not None:
        if ent.raison_sociale: # Si c'est une personne morale, on met à jour la raison sociale
            ent.raison_sociale = payload.nom
        else: # Sinon on met à jour le nom
            ent.nom = payload.nom
    if payload.prenom is not None:
        ent.prenom = payload.prenom
    if payload.raison_sociale is not None:
        ent.raison_sociale = payload.raison_sociale
    if payload.telephone is not None:
        ent.telephone = payload.telephone
    if payload.ice is not None:
        ent.ice = payload.ice
    if payload.numero_patente is not None:
        ent.numero_patente = payload.numero_patente
    if payload.adresse is not None:
        ent.adresse = payload.adresse
    if payload.cin is not None:
        ent.cin = payload.cin
    if payload.date_naissance is not None:
        ent.date_naissance = payload.date_naissance
    if payload.profession is not None:
        ent.profession = payload.profession
    if payload.numero_patente is not None:
        ent.numero_patente = payload.numero_patente
    if payload.tax_professionnelle is not None:
        ent.tax_professionnelle = payload.tax_professionnelle
    if payload.description_activite is not None:
        ent.description_activite = payload.description_activite
    if payload.statut is not None:
        is_becoming_active = (payload.statut == "Actif" and not ent.est_valide)
        ent.est_valide = (payload.statut == "Actif")
        if is_becoming_active:
            ent.date_creation = datetime.utcnow().date()
            
    # Update login email if changed, or create one if activating
    target_email = payload.email if payload.email is not None else ent.email
    if target_email:
        login = db.query(Login).filter(Login.entreprise_id == ent.id).first()
        if login:
            login.email = target_email
        elif ent.est_valide:
            # Create login if it doesn't exist and we just activated
            login_by_email = db.query(Login).filter(Login.email == target_email).first()
            if login_by_email:
                login_by_email.entreprise_id = ent.id
            else:
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
                new_login = Login(
                    email=target_email,
                    mot_de_passe=password,
                    role="adherent",
                    entreprise_id=ent.id
                )
                db.add(new_login)
                
            # Génération automatique de la carte si on valide l'adhérent manuellement
            _generer_carte_pour_entreprise(ent, db)
                
    if payload.email is not None:
        ent.email = payload.email
        
    db.commit()
    return {"message": "Adhérent mis à jour"}

@router.delete("/adherents/{adherent_id}")
def delete_adherent(adherent_id: int, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == adherent_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    
    # Delete related rows from entreprise_activite to avoid ForeignKeyViolation
    db.execute(text("DELETE FROM entreprise_activite WHERE entreprise_id = :eid"), {"eid": ent.id})
    
    # Delete from Login
    login = db.query(Login).filter(Login.entreprise_id == ent.id).first()
    if login:
        db.delete(login)
        
    # Delete Entreprise
    db.delete(ent)
    db.commit()
    return {"message": "Adhérent supprimé"}

@router.get("/demandes")
def get_demandes(db: Session = Depends(get_db)):
    entreprises_en_attente = db.query(Entreprise).filter(Entreprise.est_valide == False).all()
    
    demandes = []
    for ent in entreprises_en_attente:
        login = db.query(Login).filter(Login.entreprise_id == ent.id).first()
        email = ent.email or (login.email if login else "Aucun email")
        
        demandes.append({
            "id": ent.id,
            "nom_contact": ent.nom or "",
            "prenom_contact": ent.prenom or "",
            "email_contact": email,
            "telephone_contact": ent.telephone or "",
            "raison_sociale_entreprise": ent.raison_sociale or "",
            "statut": "en attente",
            "date_demande": ent.date_creation or datetime.utcnow(),
            "cin": ent.cin or "",
            "date_naissance": str(ent.date_naissance) if ent.date_naissance else "",
            "profession": ent.profession or "",
            "numero_patente": ent.numero_patente or "",
            "documents": ent.documents
        })
    return demandes

@router.post("/demandes/{demande_id}/refuser")
def refuser_demande(demande_id: int, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == demande_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    # Delete related rows from entreprise_activite
    db.execute(text("DELETE FROM entreprise_activite WHERE entreprise_id = :eid"), {"eid": ent.id})
    
    db.delete(ent)
    
    login = db.query(Login).filter(Login.entreprise_id == demande_id).first()
    if login:
        db.delete(login)
        
    db.commit()
    return {"message": "Demande refusée"}

def _generer_carte_pour_entreprise(ent: Entreprise, db: Session):
    carte_existante = db.query(CarteAdherent).filter(CarteAdherent.entreprise_id == ent.id, CarteAdherent.statut == "active").first()
    if carte_existante:
        return
        
    today = datetime.utcnow().date()
    expiration = today.replace(year=today.year + 1)
    type_adh = "PM" if ent.raison_sociale else "PP"
    annee = today.year
    id_str = f"{ent.id:06d}"
    num_carte = f"{annee}-{type_adh}-{id_str}"
    
    nouvelle_carte = CarteAdherent(
        entreprise_id=ent.id,
        date_emission=today,
        date_expiration=expiration,
        numero_carte=num_carte,
        statut="active"
    )
    db.add(nouvelle_carte)

@router.post("/demandes/{demande_id}/valider")
def valider_demande(demande_id: int, db: Session = Depends(get_db)):
    ent = db.query(Entreprise).filter(Entreprise.id == demande_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    if ent.est_valide:
        raise HTTPException(status_code=400, detail="Demande déjà validée")
        
    ent.est_valide = True
    ent.date_creation = datetime.utcnow().date()
    
    email = ent.email
    if not email:
        raise HTTPException(status_code=400, detail="L'entreprise n'a pas d'email")
        
    login = db.query(Login).filter(Login.entreprise_id == ent.id).first()
    password = None
    if not login:
        login_by_email = db.query(Login).filter(Login.email == email).first()
        if login_by_email:
            login_by_email.entreprise_id = ent.id
        else:
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            new_login = Login(
                email=email,
                mot_de_passe=password,
                role="adherent",
                entreprise_id=ent.id
            )
            db.add(new_login)
            
    # Génération automatique de la carte
    _generer_carte_pour_entreprise(ent, db)
    
    # Créer une notification pour l'adhérent
    notif = Notification(
        titre="Inscription validée",
        message="Votre demande d'inscription a été validée. Bienvenue dans l'association !",
        type_notif="succes",
        entreprise_id=ent.id
    )
    db.add(notif)

    db.commit()

    # Envoi email réel
    from ..core.email import send_welcome_email
    nom = ent.raison_sociale or f"{ent.prenom or ''} {ent.nom or ''}".strip()
    if password:
        send_welcome_email(email, nom, password)

    return {"message": "Demande validée avec succès", "email": email, "password_genere": password}

@router.post("/inscriptions")
def creer_inscription(req: NouvelleInscriptionRequest, db: Session = Depends(get_db)):
    import json
    
    # 1. Vérifier que l'email n'est pas déjà utilisé
    if db.query(Entreprise).filter(Entreprise.email == req.email_contact).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # 2. Convertir la date de création si fournie
    date_creation_parsed = None
    if req.date_creation:
        try:
            from datetime import date
            date_creation_parsed = date.fromisoformat(req.date_creation)
        except Exception:
            date_creation_parsed = datetime.utcnow().date()

    date_naissance_parsed = None
    if req.date_naissance:
        try:
            from datetime import date
            date_naissance_parsed = date.fromisoformat(req.date_naissance)
        except Exception:
            pass

    # 3. Créer l'entreprise avec TOUS les champs du formulaire
    nouvelle_ent = Entreprise(
        nom=req.nom_contact,
        prenom=req.prenom_contact,
        email=req.email_contact,
        telephone=req.telephone_contact,
        adresse=req.adresse,
        raison_sociale=req.raison_sociale_entreprise,
        ice=req.ice,
        tax_professionnelle=req.rc,
        description_activite=req.activite_principale,
        date_creation=date_creation_parsed or datetime.utcnow().date(),
        est_valide=False,
        cin=req.cin,
        date_naissance=date_naissance_parsed,
        profession=req.profession,
        numero_patente=req.numero_patente,
        documents=req.documents,
    )
    db.add(nouvelle_ent)
    db.flush()  # Récupérer l'ID

    # 4. Créer le dirigeant si renseigné
    if req.nom_dirigeant:
        from ..models.dirigeant import Dirigeant
        from ..models.entreprise_dirigeant import EntrepriseDirigeant
        
        dirigeant = Dirigeant(
            nom=req.nom_dirigeant,
            prenom="",
            telephone=req.gsm_dirigeant,
            email=req.email_dirigeant,
            linkedin=req.linkedin_dirigeant,
            facebook=req.facebook_dirigeant,
        )
        db.add(dirigeant)
        db.flush()
        
        lien = EntrepriseDirigeant(
            dirigeants_id=dirigeant.id,
            entreprise_id=nouvelle_ent.id
        )
        db.add(lien)

    # 5. Créer une entrée dans demande_inscription pour garder la trace
    services_json = json.dumps(req.services_demandes) if req.services_demandes else None
    demande = DemandeInscription(
        nom_contact=req.nom_contact,
        prenom_contact=req.prenom_contact,
        email_contact=req.email_contact,
        telephone_contact=req.telephone_contact,
        raison_sociale_entreprise=req.raison_sociale_entreprise or f"{req.nom_contact} {req.prenom_contact}",
        mot_de_passe="",  # sera généré ci-dessous
        statut="en attente",
        documents=req.documents,
        services_demandes=services_json,
        entreprise_creee_id=nouvelle_ent.id,
    )
    db.add(demande)
    db.flush()

    # 5.bis Créer les enregistrements de Documents physiques
    if req.documents:
        try:
            docs_dict = json.loads(req.documents)
            if isinstance(docs_dict, dict):
                for doc_type, file_path in docs_dict.items():
                    # file_path format expected: /uploads/filename.ext
                    filename = file_path.split("/")[-1] if "/" in file_path else file_path
                    new_doc = Document(
                        nom_fichier=filename,
                        chemin_fichier=file_path,
                        type_document=doc_type,
                        entreprise_id=nouvelle_ent.id,
                        demande_inscription_id=demande.id,
                        ajoute_par=req.nom_contact + " " + req.prenom_contact,
                        categorie="Document d'inscription"
                    )
                    db.add(new_doc)
        except Exception:
            pass # Si le format n'est pas un JSON valide, on ignore

    # 6. Créer le compte Login avec mot de passe généré
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    new_login = Login(
        email=req.email_contact,
        mot_de_passe=password,
        role="adherent",
        entreprise_id=nouvelle_ent.id
    )
    db.add(new_login)
    db.flush()

    demande.mot_de_passe = password
    demande.login_cree_id = new_login.id
    db.add(demande)

    # 7. Créer les participations aux événements sélectionnés
    if req.evenement_ids:
        from datetime import date as date_type
        for eid in req.evenement_ids:
            # Vérifier que l'événement existe
            evt = db.query(Evenement).filter(Evenement.id == eid).first()
            if evt:
                participation = Participation(
                    entreprise_id=nouvelle_ent.id,
                    evenement_id=eid,
                    date_inscription=date_type.today(),
                    statut="inscrit"
                )
                db.add(participation)

    # Génération automatique de la carte
    _generer_carte_pour_entreprise(nouvelle_ent, db)

    db.commit()
    
    return {
        "message": "Inscription créée et validée avec succès",
        "email": req.email_contact,
        "password_genere": password,
        "entreprise_id": nouvelle_ent.id
    }

# Route optionnelle pour créer un adhérent de test facilement
@router.post("/adherents", response_model=AdherentResponse)
def create_adherent(adherent: AdherentCreate, db: Session = Depends(get_db)):
    db_adherent = Adherent(**adherent.dict())
    db.add(db_adherent)
    db.commit()
    db.refresh(db_adherent)
    return db_adherent

from ..schemas.carte import CarteAdherentResponse
from datetime import timedelta

@router.get("/cartes", response_model=List[CarteAdherentResponse])
def get_cartes(db: Session = Depends(get_db)):
    results = db.query(CarteAdherent, Entreprise)\
        .join(Entreprise, CarteAdherent.entreprise_id == Entreprise.id)\
        .all()
    
    cartes_list = []
    for carte, ent in results:
        type_adh = "Moral" if ent.raison_sociale else "Physique"
        display_nom = ent.raison_sociale if ent.raison_sociale else f"{ent.prenom or ''} {ent.nom or ''}".strip()
        annee_val = str(carte.date_expiration.year) if carte.date_expiration else None

        # Fetch photo from documents
        photo_doc = db.query(Document).filter(
            Document.entreprise_id == ent.id,
            Document.type_document.ilike("%photo%")
        ).first()
        photo_path = photo_doc.chemin_fichier if photo_doc else None

        cartes_list.append(CarteAdherentResponse(
            id=carte.id,
            numero_carte=carte.numero_carte,
            date_emission=carte.date_emission,
            date_expiration=carte.date_expiration,
            statut=carte.statut,
            entreprise_id=carte.entreprise_id,
            nom_adherent=display_nom or "Inconnu",
            type_adherent=type_adh,
            nom=ent.nom,
            prenom=ent.prenom,
            profession=ent.profession,
            numero_patente=ent.numero_patente,
            rc=ent.tax_professionnelle,
            annee_validite=annee_val,
            photo_path=photo_path,
        ))
    return cartes_list

@router.post("/cartes/generer")
def generer_cartes(db: Session = Depends(get_db)):
    # Récupérer les adhérents actifs sans carte active
    adherents_sans_carte = db.query(Entreprise).outerjoin(CarteAdherent, (CarteAdherent.entreprise_id == Entreprise.id) & (CarteAdherent.statut == 'active')).filter(Entreprise.est_valide == True, CarteAdherent.id == None).all()
    
    compteur = 0
    today = datetime.utcnow().date()
    expiration = today.replace(year=today.year + 1)
    
    for ent in adherents_sans_carte:
        type_adh = "PM" if ent.raison_sociale else "PP"
        # Générer un numéro de carte unique, ex: 2026-PP-001284
        annee = today.year
        id_str = f"{ent.id:06d}"
        num_carte = f"{annee}-{type_adh}-{id_str}"
        
        nouvelle_carte = CarteAdherent(
            entreprise_id=ent.id,
            date_emission=today,
            date_expiration=expiration,
            numero_carte=num_carte,
            statut="active"
        )
        db.add(nouvelle_carte)
        compteur += 1
        
    db.commit()
    return {"message": f"{compteur} carte(s) générée(s) avec succès."}

@router.post("/cartes/{carte_id}/renouveler")
def renouveler_carte(carte_id: int, db: Session = Depends(get_db)):
    carte = db.query(CarteAdherent).filter(CarteAdherent.id == carte_id).first()
    if not carte:
        raise HTTPException(status_code=404, detail="Carte introuvable")
        
    if carte.statut == "renouvelee":
        raise HTTPException(status_code=400, detail="Cette carte a déjà été renouvelée.")
        
    today = datetime.utcnow().date()
    if carte.date_expiration and (carte.date_expiration - today).days > 30:
        raise HTTPException(status_code=400, detail="Le renouvellement n'est possible qu'à moins de 30 jours de l'expiration.")
        
    # Marquer l'ancienne carte comme renouvelée
    carte.statut = "renouvelee"
    
    # Récupérer l'entreprise pour générer le bon type
    ent = db.query(Entreprise).filter(Entreprise.id == carte.entreprise_id).first()
    type_adh = "PM" if (ent and ent.raison_sociale) else "PP"
    
    # Créer la nouvelle carte
    annee = today.year
    expiration = today.replace(year=today.year + 1)
    
    # Générer un nouveau numéro de carte qui intègre l'année de renouvellement pour l'unicité
    id_str = f"{carte.entreprise_id:06d}"
    
    # Chercher combien de cartes existent déjà pour cette entreprise pour le suffixe
    compte_cartes = db.query(CarteAdherent).filter(CarteAdherent.entreprise_id == carte.entreprise_id).count()
    num_carte = f"{annee}-{type_adh}-{id_str}-R{compte_cartes}"
    
    nouvelle_carte = CarteAdherent(
        entreprise_id=carte.entreprise_id,
        date_emission=today,
        date_expiration=expiration,
        numero_carte=num_carte,
        statut="active"
    )
    db.add(nouvelle_carte)
    
    # Créer un renouvellement en attente pour la trace (facultatif si le renouvellement est "direct", mais le client veut tout direct)
    renouv = Renouvellement(
        entreprise_id=carte.entreprise_id,
        annee=today.year,
        annee_fiscale=today.year,
        montant=0.0,
        date_paiement=today,
        mode_paiement="Direct",
        statut="validé",
        statut_paiement="validé"
    )
    db.add(renouv)
    
    db.commit()
    return {"message": "Carte renouvelée avec succès. L'ancienne a été désactivée et une nouvelle a été générée."}


@router.get("/communications")
def get_communications(db: Session = Depends(get_db)):
    comms = db.query(Communication).order_by(Communication.date_envoi.desc()).all()
    return comms

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks

# ...

@router.post("/communications")
async def create_communication(
    background_tasks: BackgroundTasks,
    titre: str = Form(...),
    canal: str = Form(...),
    contenu: str = Form(...),
    cible: str = Form(...),
    evenement_id: Optional[int] = Form(None),
    adherent_ids: Optional[str] = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    import json
    
    # Parse adherent_ids if provided as JSON string
    parsed_adherent_ids = []
    if adherent_ids:
        try:
            parsed_adherent_ids = json.loads(adherent_ids)
        except:
            pass

    # 1. Determine targets
    target_ids = []
    if cible == "tous":
        entreprises = db.query(Entreprise).filter(Entreprise.est_valide == True).all()
        target_ids = [e.id for e in entreprises]
    elif cible == "partie":
        target_ids = parsed_adherent_ids
    elif cible == "evenement":
        if evenement_id:
            parts = db.query(Participation).filter(Participation.evenement_id == evenement_id).all()
            target_ids = [p.entreprise_id for p in parts if p.entreprise_id]
            
    # Remove duplicates
    target_ids = list(set(target_ids))
    
    # Handle attachment
    temp_file_path = None
    if file:
        temp_dir = "temp_attachments"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # 2. Add notifications if channel is notification
    if canal.lower() == "notification":
        for eid in target_ids:
            notif = Notification(
                titre=titre,
                message=contenu,
                type_notif="info",
                entreprise_id=eid
            )
            db.add(notif)
            
    # 2b. Envoyer les emails si le canal est email
    sent_count = 0
    if canal.lower() == "email":
        emails = []
        for eid in target_ids:
            ent = db.query(Entreprise).filter(Entreprise.id == eid).first()
            if ent and ent.email:
                emails.append(ent.email)
        
        print(f"DEBUG: Envoi d'email à {len(emails)} destinataires (Cible: {cible}, EventID: {evenement_id})")
        
        if emails:
            from ..core.email import send_bulk_emails
            sent_count = send_bulk_emails(emails, titre, contenu, attachment_path=temp_file_path, attachment_name=file.filename if file else None)
            print(f"DEBUG: {sent_count}/{len(emails)} emails envoyés avec succès.")
        else:
            print("DEBUG: Aucun email trouvé pour les cibles spécifiées.")

    # 2c. Envoyer les WhatsApp si le canal est whatsapp (watsp)
    whatsapp_links = []
    if canal.lower() in ["whatsapp", "watsp"]:
        phones_to_send = []
        for eid in target_ids:
            ent = db.query(Entreprise).filter(Entreprise.id == eid).first()
            if ent and ent.telephone:
                formatted = format_moroccan_phone(ent.telephone)
                
                # Vérification de l'existence et de la validité du numéro
                if not formatted or len(formatted) < 10:
                    print(f"DEBUG: Numéro invalide ou inexistant pour {ent.nom or ent.raison_sociale}, annulation.")
                    continue
                
                phones_to_send.append(ent.telephone)
                sent_count += 1
                # Nous ne générons plus les liens pour la modale, on les lance en arrière-plan automatiquement.
                
        if phones_to_send:
            def process_whatsapp_batch(phones, msg_content):
                import time
                print(f"DEBUG: Démarrage de l'envoi WhatsApp en arrière-plan pour {len(phones)} numéros.")
                for phone in phones:
                    try:
                        print(f"DEBUG: Envoi WhatsApp à {phone} en cours...")
                        send_whatsapp_message(phone, msg_content)
                        time.sleep(5) # Pause entre deux messages pour éviter d'être bloqué ou de saturer le navigateur
                    except Exception as e:
                        print(f"DEBUG: Erreur dans la boucle d'envoi WhatsApp: {e}")
                print("DEBUG: Fin de l'envoi WhatsApp en arrière-plan.")
                    
            background_tasks.add_task(process_whatsapp_batch, phones_to_send, contenu)
            
    # Clean up temp file
    if temp_file_path and os.path.exists(temp_file_path):
        try:
            os.remove(temp_file_path)
        except:
            pass

    # 3. Create Communication log
    metrique = ""
    if canal.lower() == "email":
        if len(target_ids) > 0 and sent_count == 0:
            metrique = "Erreur: Échec de l'envoi (vérifier SMTP)"
        else:
            metrique = f"Envoyé à {sent_count} destinataires"
    elif canal.lower() in ["whatsapp", "watsp"]:
        metrique = f"WhatsApp envoyé à {sent_count} destinataires"
    elif canal.lower() == "notification":
        metrique = "Distribué"
        
    comm = Communication(
        titre=titre,
        canal=canal,
        contenu=contenu,
        evenement_id=evenement_id,
        destinataires_ids=json.dumps(target_ids),
        nombre_destinataires=len(target_ids),
        statut_ou_metrique=metrique
    )
    db.add(comm)
    db.commit()
    
    return {
        "message": "Communication envoyée avec succès", 
        "destinataires": len(target_ids),
        "whatsapp_links": whatsapp_links
    }



@router.post("/upload-doc")
async def upload_document(file: UploadFile = File(...)):
    # Validate and save file
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"{uuid.uuid4().hex}.{file_ext}" if file_ext else f"{uuid.uuid4().hex}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": filename, "filepath": f"/uploads/{filename}", "original_name": file.filename}

@router.get("/documents")
def get_all_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.id.desc()).all()
    # Serialize nicely
    return [{
        "id": d.id,
        "nom_fichier": d.nom_fichier,
        "chemin_fichier": d.chemin_fichier,
        "categorie": d.categorie or "Non spécifiée",
        "taille": d.taille or "Inconnue",
        "date_importation": d.date_importation,
        "ajoute_par": d.ajoute_par or "Système"
    } for d in docs]

@router.post("/documents")
def create_global_document(
    nom_fichier: str = Form(...),
    chemin_fichier: str = Form(...),
    categorie: str = Form(...),
    taille: str = Form(...),
    ajoute_par: str = Form(default="Admin Système"),
    db: Session = Depends(get_db)
):
    doc = Document(
        nom_fichier=nom_fichier,
        chemin_fichier=chemin_fichier,
        categorie=categorie,
        taille=taille,
        ajoute_par=ajoute_par,
        type_document="Global"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    db.delete(doc)
    db.commit()
    return {"message": "Document supprimé"}

class EvenementResponseDebug(BaseModel):
    id: int
    titre: str
    date_evenement: str
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None
    categorie: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    places_limitees: Optional[int] = None

    class Config:
        from_attributes = True

@router.get("/evenements")
def get_evenements(db: Session = Depends(get_db)):
    today = date.today()
    # Événements futurs (plus proches en premier)
    upcoming = db.query(Evenement).filter(Evenement.date_evenement >= today).order_by(Evenement.date_evenement.asc()).all()
    # Événements passés (plus récents en premier)
    past = db.query(Evenement).filter(Evenement.date_evenement < today).order_by(Evenement.date_evenement.desc()).all()
    evts = upcoming + past
    result = []
    for e in evts:
        participant_count = db.query(Participation).filter(Participation.evenement_id == e.id).count()
        places = e.places_limitees or 0
        progress = round((participant_count / places * 100), 1) if places > 0 else 0
        result.append({
            "id": e.id,
            "titre": e.titre,
            "date_evenement": str(e.date_evenement),
            "heure_debut": str(e.heure_debut) if e.heure_debut else None,
            "heure_fin": str(e.heure_fin) if e.heure_fin else None,
            "categorie": e.categorie,
            "lieu": e.lieu,
            "description": e.description,
            "places_limitees": e.places_limitees,
            "participants_count": participant_count,
            "progress": progress,
            "is_past": e.date_evenement < today
        })
    return result


@router.get("/renouvellements")
def get_renouvellements(db: Session = Depends(get_db)):
    """Récupère toutes les demandes de renouvellement."""
    renewals = db.query(Renouvellement, Entreprise)\
        .join(Entreprise, Renouvellement.entreprise_id == Entreprise.id)\
        .order_by(Renouvellement.date_paiement.desc()).all()
    result = []
    for r, ent in renewals:
        nom = ent.raison_sociale or f"{ent.prenom or ''} {ent.nom or ''}".strip()
        
        # Récupérer les documents liés spécifiquement à ce renouvellement
        docs = db.query(Document).filter(Document.renouvellement_id == r.id).all()
        docs_list = [{
            "id": d.id,
            "nom": d.nom_fichier,
            "url": d.chemin_fichier,
            "type": d.type_document
        } for d in docs]

        result.append({
            "id": r.id,
            "entreprise_id": r.entreprise_id,
            "nom_adherent": nom,
            "email_adherent": ent.email or "",
            "annee": r.annee,
            "montant": r.montant,
            "mode_paiement": r.mode_paiement,
            "statut": r.statut,
            "statut_paiement": r.statut_paiement,
            "date_paiement": str(r.date_paiement) if r.date_paiement else None,
            "preuve_paiement": r.preuve_paiement,
            "documents": docs_list
        })
    return result


@router.post("/renouvellements/{renouv_id}/approuver")
def approuver_renouvellement(renouv_id: int, db: Session = Depends(get_db)):
    """Approuve une étape du renouvellement (Docs ou Paiement)."""
    r = db.query(Renouvellement).filter(Renouvellement.id == renouv_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Renouvellement introuvable")

    ent = db.query(Entreprise).filter(Entreprise.id == r.entreprise_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Adhérent introuvable")

    # SI ON APPROUVE LES DOCUMENTS (Première étape)
    if r.statut == "attente_docs" or r.statut == "en attente":
        r.statut = "docs_approuves"
        notif = Notification(
            titre="Documents approuvés !",
            message="Vos documents de renouvellement ont été validés. Vous pouvez maintenant procéder au virement bancaire et uploader la preuve.",
            type_notif="succes",
            entreprise_id=ent.id
        )
        db.add(notif)
        db.commit()
        return {"message": "Documents approuvés. L'adhérent a été notifié pour le paiement."}

    # SI ON VALIDE LE PAIEMENT (Deuxième étape)
    if r.statut == "docs_approuves" or r.statut_paiement == "payé":
        today = date.today()
        try:
            new_expiry = today.replace(year=today.year + 1)
        except ValueError:
            new_expiry = today + timedelta(days=365)

        r.statut = "validé"
        r.statut_paiement = "validé"
        ent.est_valide = True
        ent.date_creation = today

        # Renouveler la carte
        carte = db.query(CarteAdherent).filter(
            CarteAdherent.entreprise_id == ent.id,
            CarteAdherent.statut.ilike("active")
        ).first()
        if carte:
            carte.statut = "renouvelee"

        type_adh = "PM" if ent.raison_sociale else "PP"
        compte_cartes = db.query(CarteAdherent).filter(CarteAdherent.entreprise_id == ent.id).count()
        nouvelle_carte = CarteAdherent(
            entreprise_id=ent.id,
            date_emission=today,
            date_expiration=new_expiry,
            numero_carte=f"{today.year}-{type_adh}-{ent.id:06d}-R{compte_cartes}",
            statut="active"
        )
        db.add(nouvelle_carte)

        notif = Notification(
            titre="Renouvellement validé !",
            message=f"Votre renouvellement est complet. Votre adhésion est valide jusqu'au {new_expiry.strftime('%d/%m/%Y')}.",
            type_notif="succes",
            entreprise_id=ent.id
        )
        db.add(notif)
        db.commit()

        # Email de confirmation
        from ..core.email import send_renewal_approved_email
        nom = ent.raison_sociale or f"{ent.prenom or ''} {ent.nom or ''}".strip()
        if ent.email:
            send_renewal_approved_email(ent.email, nom, new_expiry.strftime("%d/%m/%Y"))

        return {"message": "Renouvellement validé avec succès"}

    return {"message": "Aucune action requise"}


@router.post("/renouvellements/{renouv_id}/refuser")
def refuser_renouvellement(renouv_id: int, db: Session = Depends(get_db)):
    """Refuse une demande de renouvellement."""
    r = db.query(Renouvellement).filter(Renouvellement.id == renouv_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Renouvellement introuvable")
    r.statut = "refusé"
    r.statut_paiement = "refusé"

    notif = Notification(
        titre="Renouvellement refusé",
        message="Votre demande de renouvellement a été refusée. Veuillez contacter l'administration.",
        type_notif="alerte",
        entreprise_id=r.entreprise_id
    )
    db.add(notif)
    db.commit()
    return {"message": "Renouvellement refusé"}

@router.post("/evenements", response_model=EvenementResponse)
def create_evenement(evenement: EvenementCreate, db: Session = Depends(get_db)):
    db_evenement = Evenement(**evenement.dict())
    db.add(db_evenement)
    db.commit()
    db.refresh(db_evenement)
    return db_evenement

@router.put("/evenements/{evenement_id}", response_model=EvenementResponse)
def update_evenement(evenement_id: int, payload: EvenementUpdate, db: Session = Depends(get_db)):
    print(f"--- UPDATE EVENEMENT ---")
    print(f"ID: {evenement_id}")
    print(f"Payload: {payload.dict(exclude_unset=True)}")
    print(f"------------------------")
    
    evt = db.query(Evenement).filter(Evenement.id == evenement_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Événement introuvable")
        
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(evt, key, value)
        
    db.commit()
    db.refresh(evt)
    return evt

@router.delete("/evenements/{evenement_id}")
def delete_evenement(evenement_id: int, db: Session = Depends(get_db)):
    evt = db.query(Evenement).filter(Evenement.id == evenement_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Événement introuvable")
    
    # Delete participations
    db.query(Participation).filter(Participation.evenement_id == evenement_id).delete()
    
    # Update communications to remove reference
    db.query(Communication).filter(Communication.evenement_id == evenement_id).update({"evenement_id": None})
    
    # Delete event
    db.delete(evt)
    db.commit()
    return {"message": "Événement supprimé avec succès"}

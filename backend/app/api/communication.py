"""
Route POST /api/communication/whatsapp

Améliorations :
  • Support de toutes les cibles : tous | partie | evenement | formation | prospection | publication | assistance_tpe | guichet | location_salles
  • Pièce jointe (image, PDF, document) — envoi via Ultramsg /api/sendFile
  • Multi-cibles : fusion des destinataires de plusieurs cibles
  • Validation stricte des numéros (format E.164)
  • Sauvegarde de l'historique dans la table `communication`
  • Envoi simultané via asyncio.gather
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.whatsapp import (
    WHATSAPP_FROM,
    format_moroccan_phone,
    is_valid_phone,
    send_whatsapp_batch,
)
from ..db.session import get_db
from ..models.communication import Communication
from ..models.entreprise import Entreprise
from ..models.participation import Participation

logger = logging.getLogger(__name__)
router = APIRouter()

# Map type_cible → nouvelle colonne FK dans participation
PARTICIPATION_FK_MAP = {
    "publication": "id_publication",
    "formation": "id_formation",
    "prospection": "id_prospection",
    "assistance_tpe": "id_assistance",
    "guichet": "id_guichet",
    "location_salles": "id_salle",
}


# ─────────────────────────────────────────────────────────────────────────────
# Tâche d'arrière-plan — envoi asynchrone groupé
# ─────────────────────────────────────────────────────────────────────────────

def _run_batch_in_background(
    phones: List[str],
    message: str,
    communication_id: int,
    attachment_path: Optional[str] = None,
    attachment_name: Optional[str] = None,
) -> None:
    try:
        success, failure = asyncio.run(
            send_whatsapp_batch(
                phones=phones,
                message=message,
                communication_id=communication_id,
                max_concurrent=10,
                attachment_path=attachment_path,
                attachment_name=attachment_name,
            )
        )
        logger.info(
            f"[BG][comm_id={communication_id}] "
            f"Batch terminé : {success} succès / {failure} échecs."
        )
    except Exception as exc:
        logger.error(
            f"[BG][comm_id={communication_id}] "
            f"Erreur fatale dans la tâche d'arrière-plan : {exc}",
            exc_info=True,
        )
    finally:
        # Nettoyer le fichier temporaire
        if attachment_path and os.path.exists(attachment_path):
            try:
                os.remove(attachment_path)
            except Exception:
                pass


def _resolve_target_ids(
    cible: str,
    evenement_id: Optional[int],
    adherent_ids: Optional[List[int]],
    db: Session,
) -> List[int]:
    """Résout les IDs des entreprises ciblées selon le type de cible."""
    from sqlalchemy import text as sql_text

    target_ids: List[int] = []

    if cible == "tous":
        rows = db.query(Entreprise.id).filter(Entreprise.est_valide == True).all()
        target_ids = [r.id for r in rows]

    elif cible == "partie":
        if not adherent_ids:
            raise HTTPException(
                status_code=422,
                detail="Le champ 'adherent_ids' est obligatoire quand cible='partie'.",
            )
        target_ids = list(set(adherent_ids))

    elif cible == "evenement":
        if not evenement_id:
            raise HTTPException(
                status_code=422,
                detail="Le champ 'evenement_id' est obligatoire quand cible='evenement'.",
            )
        rows = db.query(Participation.id_adherent).filter(
            Participation.id_evenement == evenement_id
        ).all()
        target_ids = [r.id_adherent for r in rows if r.id_adherent]

    elif cible in PARTICIPATION_FK_MAP:
        if not evenement_id:
            raise HTTPException(
                status_code=422,
                detail=f"Le champ 'evenement_id' (element_id) est obligatoire quand cible='{cible}'.",
            )
        fk_col = PARTICIPATION_FK_MAP[cible]
        rows = db.execute(
            sql_text(f"SELECT DISTINCT id_adherent FROM participation WHERE {fk_col} = :eid AND id_adherent IS NOT NULL"),
            {"eid": evenement_id}
        ).fetchall()
        target_ids = [row[0] for row in rows]

    return list(set(target_ids))


# ─────────────────────────────────────────────────────────────────────────────
# Route principale — multipart/form-data pour supporter la pièce jointe
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/whatsapp",
    status_code=202,
    summary="Envoi de messages WhatsApp en masse avec pièce jointe optionnelle",
)
async def send_whatsapp_broadcast(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    titre: str = Form(...),
    contenu: str = Form(...),
    cible: str = Form(...),
    evenement_id: Optional[int] = Form(None),
    adherent_ids: Optional[str] = Form(None),
    cibles_json: Optional[str] = Form(None),   # Multi-cibles: JSON [{type, element_id}]
    attachment: Optional[UploadFile] = File(None),
):
    import json as json_lib

    # Parser adherent_ids depuis JSON string si fourni
    parsed_adherent_ids: Optional[List[int]] = None
    if adherent_ids:
        try:
            parsed_adherent_ids = json_lib.loads(adherent_ids)
        except Exception:
            parsed_adherent_ids = None

    # ── 1. Résolution des IDs cibles ──────────────────────────────────────────
    target_ids: List[int] = []

    # Support multi-cibles
    if cibles_json:
        try:
            cibles_list = json_lib.loads(cibles_json)  # [{type, element_id}, ...]
            for cible_item in cibles_list:
                ids = _resolve_target_ids(
                    cible=cible_item.get("type", "tous"),
                    evenement_id=cible_item.get("element_id"),
                    adherent_ids=parsed_adherent_ids,
                    db=db,
                )
                target_ids.extend(ids)
        except Exception as e:
            logger.warning(f"Erreur parse cibles_json: {e}")
    else:
        target_ids = _resolve_target_ids(
            cible=cible,
            evenement_id=evenement_id,
            adherent_ids=parsed_adherent_ids,
            db=db,
        )

    target_ids = list(set(target_ids))

    if not target_ids:
        raise HTTPException(
            status_code=404,
            detail="Aucun destinataire trouvé pour la cible spécifiée.",
        )

    # ── 2. Validation des numéros ─────────────────────────────────────────────
    valid_phones: List[str] = []
    invalid_count: int = 0

    entreprises = (
        db.query(Entreprise.id, Entreprise.telephone, Entreprise.nom,
                 Entreprise.prenom, Entreprise.raison_sociale)
        .filter(Entreprise.id.in_(target_ids))
        .all()
    )

    for ent in entreprises:
        raw = ent.telephone or ""
        try:
            formatted = format_moroccan_phone(raw)
            if is_valid_phone(formatted):
                valid_phones.append(formatted)
            else:
                invalid_count += 1
                nom = ent.raison_sociale or f"{ent.prenom or ''} {ent.nom or ''}".strip()
                logger.warning(f"  ✗ Numéro invalide ({nom!r}, id={ent.id}): {raw!r}")
        except Exception as exc:
            invalid_count += 1
            logger.error(f"  ✗ Erreur formatage numéro id={ent.id}: {exc}")

    if not valid_phones:
        raise HTTPException(
            status_code=422,
            detail="Aucun numéro de téléphone valide trouvé parmi les destinataires.",
        )

    # ── 3. Gestion de la pièce jointe ─────────────────────────────────────────
    attachment_path: Optional[str] = None
    attachment_name: Optional[str] = None

    if attachment and attachment.filename:
        temp_dir = "temp_attachments"
        os.makedirs(temp_dir, exist_ok=True)
        ext = os.path.splitext(attachment.filename)[1]
        attachment_name = attachment.filename
        attachment_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}{ext}")
        with open(attachment_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)
        logger.info(f"[WhatsApp] Pièce jointe : {attachment_name} → {attachment_path}")

    # ── 4. Sauvegarde dans l'historique ────────────────────────────────────────────
    metrique = (
        f"Envoi simultané → {len(valid_phones)} numéro(s) valide(s)"
        + (f" | {invalid_count} ignoré(s)" if invalid_count else "")
    )
    comm = Communication(
        titre=titre,
        canal="WhatsApp",
        contenu=contenu,
        date_envoi=datetime.utcnow(),
        evenement_id=evenement_id,
        nombre_destinataires=len(target_ids),
        statut_ou_metrique=metrique,
        piece_jointe_nom=attachment_name,
    )
    db.add(comm)
    db.flush()  # Pour avoir comm.id avant les envoi_communication

    # Créer les enregistrements EnvoiCommunication par destinataire
    from ..models.communication import EnvoiCommunication
    for eid in target_ids:
        envoi = EnvoiCommunication(
            communication_id=comm.id,
            entreprise_id=eid,
            statut_envoi="en_attente"
        )
        db.add(envoi)

    db.commit()
    db.refresh(comm)

    logger.info(
        f"[WhatsApp] Communication #{comm.id} enregistrée. "
        f"{len(valid_phones)} valides / {invalid_count} invalides."
    )

    # ── 5. Lancement de l'envoi en arrière-plan ───────────────────────────────
    background_tasks.add_task(
        _run_batch_in_background,
        phones=valid_phones,
        message=contenu,
        communication_id=comm.id,
        attachment_path=attachment_path,
        attachment_name=attachment_name,
    )

    return {
        "message": f"Envoi WhatsApp lancé pour {len(valid_phones)} destinataire(s).",
        "communication_id": comm.id,
        "expediteur": WHATSAPP_FROM,
        "destinataires_total": len(target_ids),
        "numeros_valides": len(valid_phones),
        "numeros_invalides": invalid_count,
        "piece_jointe": attachment_name or None,
    }

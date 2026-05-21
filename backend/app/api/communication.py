"""
Route POST /api/communication/whatsapp

Architecture :
  • Résolution des destinataires depuis la DB (cible: tous / partie / evenement)
  • Validation stricte des numéros (format E.164)
  • Sauvegarde immédiate de l'historique dans la table `communication`
  • Lancement de l'envoi en masse SIMULTANÉ via asyncio.gather (BackgroundTasks)
  • Expéditeur fixe : whatsapp:+212713571887

Gestion des erreurs :
  • Chaque envoi individuel est isolé dans un try/except
  • Un numéro invalide n'interrompt jamais les autres envois
  • Les erreurs réseau/timeout sont catchées et loggées, jamais reraisées
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
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


# ─────────────────────────────────────────────────────────────────────────────
# Schémas Pydantic
# ─────────────────────────────────────────────────────────────────────────────

class WhatsAppBroadcastRequest(BaseModel):
    titre: str = Field(
        ..., min_length=1, max_length=255,
        description="Titre / objet de la communication (affiché dans l'historique)"
    )
    contenu: str = Field(
        ..., min_length=1, max_length=4096,
        description="Corps du message WhatsApp (max 4 096 caractères)"
    )
    cible: str = Field(
        ..., pattern="^(tous|partie|evenement)$",
        description="Cible : 'tous' | 'partie' | 'evenement'"
    )
    evenement_id: Optional[int] = Field(
        None,
        description="ID de l'événement (obligatoire si cible='evenement')"
    )
    adherent_ids: Optional[List[int]] = Field(
        None,
        description="IDs entreprise ciblés (obligatoire si cible='partie')"
    )


class WhatsAppBroadcastResponse(BaseModel):
    message: str
    communication_id: int
    expediteur: str
    destinataires_total: int
    numeros_valides: int
    numeros_invalides: int


# ─────────────────────────────────────────────────────────────────────────────
# Tâche d'arrière-plan — envoi asynchrone groupé
# ─────────────────────────────────────────────────────────────────────────────

def _run_batch_in_background(
    phones: List[str],
    message: str,
    communication_id: int,
) -> None:
    """
    Wrapper synchrone exécuté par FastAPI BackgroundTasks.
    Crée une nouvelle boucle asyncio pour lancer send_whatsapp_batch.

    Chaque appel HTTP est isolé (try/except dans send_whatsapp_batch).
    Un numéro KO ne fait jamais planter les autres.
    """
    try:
        success, failure = asyncio.run(
            send_whatsapp_batch(
                phones=phones,
                message=message,
                communication_id=communication_id,
                max_concurrent=10,  # 10 envois HTTP simultanés
            )
        )
        logger.info(
            f"[BG][comm_id={communication_id}] "
            f"Batch terminé : {success} succès / {failure} échecs."
        )
    except Exception as exc:
        # Bouclier final — ne jamais faire crasher le worker FastAPI
        logger.error(
            f"[BG][comm_id={communication_id}] "
            f"Erreur fatale dans la tâche d'arrière-plan : {exc}",
            exc_info=True,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Route principale
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/whatsapp",
    response_model=WhatsAppBroadcastResponse,
    status_code=202,  # Accepted — traitement asynchrone
    summary="Envoi de messages WhatsApp en masse (simultané)",
    description=(
        "Résout les destinataires, valide les numéros, enregistre l'historique "
        "et lance l'envoi simultané en arrière-plan via asyncio.gather."
    ),
)
async def send_whatsapp_broadcast(
    payload: WhatsAppBroadcastRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> WhatsAppBroadcastResponse:

    # ── 1. Résolution des IDs entreprise selon la cible ───────────────────────
    target_ids: List[int] = []

    if payload.cible == "tous":
        rows = (
            db.query(Entreprise.id)
            .filter(Entreprise.est_valide == True)
            .all()
        )
        target_ids = [r.id for r in rows]

    elif payload.cible == "partie":
        if not payload.adherent_ids:
            raise HTTPException(
                status_code=422,
                detail="Le champ 'adherent_ids' est obligatoire quand cible='partie'.",
            )
        target_ids = list(set(payload.adherent_ids))

    elif payload.cible == "evenement":
        if not payload.evenement_id:
            raise HTTPException(
                status_code=422,
                detail="Le champ 'evenement_id' est obligatoire quand cible='evenement'.",
            )
        rows = (
            db.query(Participation.entreprise_id)
            .filter(Participation.evenement_id == payload.evenement_id)
            .all()
        )
        target_ids = [r.entreprise_id for r in rows if r.entreprise_id]

    target_ids = list(set(target_ids))

    if not target_ids:
        raise HTTPException(
            status_code=404,
            detail=(
                "Aucun destinataire trouvé pour la cible spécifiée. "
                "Vérifiez que des adhérents validés existent."
            ),
        )

    # ── 2. Récupération et validation stricte des numéros ─────────────────────
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
                logger.debug(f"  ✓ id={ent.id} → {formatted}")
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
            detail=(
                "Aucun numéro de téléphone valide trouvé parmi les destinataires sélectionnés. "
                "Assurez-vous que les adhérents ont un numéro renseigné au format marocain."
            ),
        )

    # ── 3. Sauvegarde immédiate dans l'historique ─────────────────────────────
    metrique = (
        f"Envoi simultané en cours → {len(valid_phones)} numéro(s) valide(s)"
        + (f" | {invalid_count} ignoré(s)" if invalid_count else "")
    )
    comm = Communication(
        titre=payload.titre,
        canal="WhatsApp",
        contenu=payload.contenu,
        date_envoi=datetime.utcnow(),
        evenement_id=payload.evenement_id,
        destinataires_ids=json.dumps(target_ids),   # stocké au format JSONB
        nombre_destinataires=len(target_ids),
        statut_ou_metrique=metrique,
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)

    logger.info(
        f"[WhatsApp] Communication #{comm.id} enregistrée. "
        f"Expéditeur: {WHATSAPP_FROM} | "
        f"{len(valid_phones)} valides / {invalid_count} invalides."
    )

    # ── 4. Lancement de l'envoi simultané en arrière-plan ────────────────────
    # FastAPI BackgroundTasks exécute _run_batch_in_background dans le thread pool.
    # À l'intérieur, asyncio.run() crée sa propre boucle et lance asyncio.gather
    # pour envoyer tous les messages EN PARALLÈLE (max 10 simultanément).
    background_tasks.add_task(
        _run_batch_in_background,
        phones=valid_phones,
        message=payload.contenu,
        communication_id=comm.id,
    )

    return WhatsAppBroadcastResponse(
        message=(
            f"Envoi WhatsApp lancé en parallèle pour {len(valid_phones)} destinataire(s). "
            f"Expéditeur : {WHATSAPP_FROM}. "
            f"Suivez la progression dans les logs serveur."
        ),
        communication_id=comm.id,
        expediteur=WHATSAPP_FROM,
        destinataires_total=len(target_ids),
        numeros_valides=len(valid_phones),
        numeros_invalides=invalid_count,
    )

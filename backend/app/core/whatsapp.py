"""
Module WhatsApp — Envoi asynchrone en masse.

Expéditeur fixe : whatsapp:+212713571887
  Défini via TWILIO_WHATSAPP_FROM (variable d'environnement) ou comme valeur par défaut.

Priorité des fournisseurs :
  1. Twilio (avec Messaging Service pour le High Throughput)
  2. Meta Cloud API v19 (Tier upgrade pour limites journalières élevées)
  3. Gateway HTTP générique (Ultramsg, Green API…)
  4. Simulation locale (logs fichier — développement uniquement)

═══════════════════════════════════════════════════════════
  SCALING DES LIMITES JOURNALIÈRES
═══════════════════════════════════════════════════════════

  ── Twilio (recommandé pour la production) ──
  Par défaut : ~1 message/seconde (60/min) par numéro.
  Pour le High Throughput :
    • Créez un Messaging Service dans la console Twilio.
    • Attachez le numéro WhatsApp approuvé au Messaging Service.
    • Utilisez messaging_service_sid (TWILIO_MESSAGING_SERVICE_SID)
      au lieu de from_ dans client.messages.create().
    • Le Messaging Service permet le "sender pooling" :
      plusieurs numéros partagent la charge → débit x N numéros.
    • Demandez un "WhatsApp Sender Upgrade" dans la console Twilio
      pour passer à 250 000+ messages/jour.

  ── Meta Cloud API ──
  Tier 1 (défaut) : 1 000 contacts uniques / 24 h
  Tier 2           : 10 000 contacts uniques / 24 h
  Tier 3           : 100 000 contacts uniques / 24 h (illimité en pratique)
  Upgrade automatique si le taux de qualité reste "Vert" après 7 jours
  de volume soutenu (pas d'action manuelle requise).
  Doc : https://developers.facebook.com/docs/whatsapp/api/rate-limits

Variables d'environnement :
  TWILIO_ACCOUNT_SID           ex: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN            ex: your_auth_token
  TWILIO_WHATSAPP_FROM         ex: whatsapp:+212713571887   ← votre numéro fixe
  TWILIO_MESSAGING_SERVICE_SID ex: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (High Throughput)

  META_WHATSAPP_TOKEN          ex: EAAxxxxxxx...
  META_PHONE_NUMBER_ID         ex: 123456789012345

  WHATSAPP_API_URL             ex: https://api.ultramsg.com/instanceXXX/messages/chat
  WHATSAPP_API_TOKEN           ex: your_token
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from typing import Optional

import httpx  # client HTTP async (pip install httpx)

logger = logging.getLogger(__name__)

# ── Configuration expéditeur FIXE ─────────────────────────────────────────────
# Le numéro expéditeur est TOUJOURS whatsapp:+212713571887
WHATSAPP_FROM: str = os.environ.get(
    "TWILIO_WHATSAPP_FROM", "whatsapp:+212713571887"
)

# ── Twilio ─────────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID           = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN            = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_MESSAGING_SERVICE_SID = os.environ.get("TWILIO_MESSAGING_SERVICE_SID", "")  # High Throughput

# ── Meta Cloud API ─────────────────────────────────────────────────────────────
META_WHATSAPP_TOKEN  = os.environ.get("META_WHATSAPP_TOKEN", "")
META_PHONE_NUMBER_ID = os.environ.get("META_PHONE_NUMBER_ID", "")

# ── Gateway HTTP générique ─────────────────────────────────────────────────────
WHATSAPP_API_URL   = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")

# ── Paramètres de concurrence ─────────────────────────────────────────────────
# Limite les appels simultanés pour respecter les rate limits API
MAX_CONCURRENT_SENDS = int(os.environ.get("WA_MAX_CONCURRENT", "10"))


# ─────────────────────────────────────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────────────────────────────────────

def format_moroccan_phone(phone: str) -> str:
    """Normalise un numéro vers le format E.164 international (+212xxxxxxxxx)."""
    if not phone:
        return ""
    cleaned = "".join(filter(str.isdigit, phone))

    if cleaned.startswith("0") and len(cleaned) == 10:
        return f"+212{cleaned[1:]}"
    elif cleaned.startswith("212") and len(cleaned) == 12:
        return f"+{cleaned}"
    elif not cleaned.startswith("+"):
        return f"+{cleaned}"
    return cleaned


def is_valid_phone(phone: str) -> bool:
    """Valide qu'un numéro formaté est exploitable."""
    return bool(phone) and len(phone) >= 10 and phone.startswith("+")


# ─────────────────────────────────────────────────────────────────────────────
# Fournisseurs — fonctions asynchrones
# ─────────────────────────────────────────────────────────────────────────────

async def _send_twilio_async(to: str, message: str, client: httpx.AsyncClient) -> bool:
    """
    Envoie via l'API REST Twilio de façon asynchrone.
    Utilise le Messaging Service (High Throughput) si TWILIO_MESSAGING_SERVICE_SID est défini,
    sinon utilise le numéro fixe WHATSAPP_FROM.
    """
    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{TWILIO_ACCOUNT_SID}/Messages.json"
    )
    data: dict = {
        "To": f"whatsapp:{to}",
        "Body": message,
    }
    # High Throughput : Messaging Service
    if TWILIO_MESSAGING_SERVICE_SID:
        data["MessagingServiceSid"] = TWILIO_MESSAGING_SERVICE_SID
    else:
        # Expéditeur fixe
        data["From"] = WHATSAPP_FROM

    try:
        resp = await client.post(
            url,
            data=data,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            timeout=15.0,
        )
        if resp.status_code in (200, 201):
            sid = resp.json().get("sid", "?")
            logger.info(f"[Twilio] ✓ {to} — SID: {sid}")
            return True
        logger.error(f"[Twilio] ✗ {to} — {resp.status_code}: {resp.text[:200]}")
        return False
    except httpx.TimeoutException:
        logger.error(f"[Twilio] Timeout lors de l'envoi à {to}")
        return False
    except Exception as exc:
        logger.error(f"[Twilio] Exception → {to}: {exc}")
        return False


async def _send_meta_async(to: str, message: str, client: httpx.AsyncClient) -> bool:
    """
    Envoie via Meta Cloud API v19 de façon asynchrone.
    Les Tiers de débit (1k/10k/100k messages/jour) sont upgradés automatiquement
    par Meta après 7 jours de volume soutenu avec un taux de qualité Vert.
    """
    url = f"https://graph.facebook.com/v19.0/{META_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": message},
    }
    try:
        resp = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {META_WHATSAPP_TOKEN}"},
            timeout=15.0,
        )
        if resp.status_code in (200, 201):
            logger.info(f"[Meta] ✓ {to}")
            return True
        logger.error(f"[Meta] ✗ {to} — {resp.status_code}: {resp.text[:200]}")
        return False
    except httpx.TimeoutException:
        logger.error(f"[Meta] Timeout → {to}")
        return False
    except Exception as exc:
        logger.error(f"[Meta] Exception → {to}: {exc}")
        return False


async def _send_gateway_async(to: str, message: str, client: httpx.AsyncClient) -> bool:
    """Envoie via gateway HTTP générique (Ultramsg, Green API, etc.)."""
    try:
        resp = await client.post(
            WHATSAPP_API_URL,
            data={"token": WHATSAPP_API_TOKEN, "to": to, "body": message},
            headers={"content-type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
        if resp.is_success:
            logger.info(f"[Gateway] ✓ {to}")
            return True
        logger.error(f"[Gateway] ✗ {to} — {resp.status_code}: {resp.text[:200]}")
        return False
    except Exception as exc:
        logger.error(f"[Gateway] Exception → {to}: {exc}")
        return False


async def _simulate_async(to: str, message: str) -> bool:
    """Mode développement : log dans un fichier texte."""
    log_dir = "temp_attachments"
    os.makedirs(log_dir, exist_ok=True)
    entry = (
        f"[{datetime.now().isoformat()}] FROM {WHATSAPP_FROM} → {to}\n"
        f"{message}\n{'─' * 60}\n"
    )
    try:
        with open(os.path.join(log_dir, "whatsapp_logs.txt"), "a", encoding="utf-8") as f:
            f.write(entry)
        logger.info(f"[Simulation] Message pour {to} enregistré.")
        return True
    except Exception as exc:
        logger.error(f"[Simulation] Erreur écriture log: {exc}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée unique — envoi asynchrone d'un seul message
# ─────────────────────────────────────────────────────────────────────────────

async def send_whatsapp_async(
    to_phone: str,
    message: str,
    client: Optional[httpx.AsyncClient] = None,
) -> bool:
    """
    Envoie un message WhatsApp depuis l'expéditeur fixe (WHATSAPP_FROM).
    Sélectionne automatiquement le fournisseur disponible.

    Args:
        to_phone : Numéro destinataire brut ou formaté.
        message  : Corps du message.
        client   : Client httpx partagé (optionnel — en crée un si absent).

    Returns:
        True si envoi réussi, False sinon (ne lève jamais d'exception).
    """
    formatted = format_moroccan_phone(to_phone)
    if not is_valid_phone(formatted):
        logger.warning(f"Numéro invalide ignoré: '{to_phone}'")
        return False

    _own_client = client is None
    if _own_client:
        client = httpx.AsyncClient()

    try:
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            return await _send_twilio_async(formatted, message, client)

        if META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID:
            return await _send_meta_async(formatted, message, client)

        if WHATSAPP_API_URL and WHATSAPP_API_TOKEN:
            return await _send_gateway_async(formatted, message, client)

        logger.warning("Aucune API configurée — mode simulation.")
        return await _simulate_async(formatted, message)

    finally:
        if _own_client:
            await client.aclose()


# ─────────────────────────────────────────────────────────────────────────────
# Envoi en masse simultané avec asyncio.gather + sémaphore
# ─────────────────────────────────────────────────────────────────────────────

async def send_whatsapp_batch(
    phones: list[str],
    message: str,
    communication_id: int,
    max_concurrent: int = MAX_CONCURRENT_SENDS,
    attachment_path: Optional[str] = None,
    attachment_name: Optional[str] = None,
) -> tuple[int, int]:
    """
    Envoie le même message (+ pièce jointe optionnelle) à tous les numéros de façon SIMULTANÉE.

    Args:
        phones           : Liste de numéros bruts.
        message          : Corps du message.
        communication_id : ID pour les logs de traçabilité.
        max_concurrent   : Nombre max d'envois parallèles (défaut: 10).
        attachment_path  : Chemin local du fichier à envoyer (optionnel).
        attachment_name  : Nom original du fichier (optionnel).

    Returns:
        Tuple (succès, échecs).
    """
    logger.info(
        f"[Batch][comm_id={communication_id}] Démarrage — "
        f"{len(phones)} destinataires, {max_concurrent} envois simultanés max."
        + (f" | PJ: {attachment_name}" if attachment_name else "")
    )

    semaphore = asyncio.Semaphore(max_concurrent)

    async def _guarded_send(phone: str, client: httpx.AsyncClient) -> bool:
        async with semaphore:
            try:
                # Si pièce jointe et gateway Ultramsg configurée → sendFile
                if attachment_path and os.path.exists(attachment_path) and WHATSAPP_API_URL and WHATSAPP_API_TOKEN:
                    # Construire l'URL d'envoi de fichier Ultramsg
                    file_url = WHATSAPP_API_URL.replace("/messages/chat", "/messages/document")
                    if "/messages/" not in file_url:
                        file_url = WHATSAPP_API_URL.rstrip("/") + "/../messages/document"
                    # Lire et envoyer le fichier comme base64 ou URL
                    # Ultramsg accepte le chemin en tant que document via URL publique ou base64
                    text_ok = await send_whatsapp_async(phone, message, client)
                    # Envoi du fichier via Ultramsg sendFile endpoint
                    with open(attachment_path, "rb") as f:
                        import base64
                        file_b64 = base64.b64encode(f.read()).decode("utf-8")
                    
                    data = {
                        "token": WHATSAPP_API_TOKEN,
                        "to": phone,
                        "document": file_b64,
                        "filename": attachment_name or os.path.basename(attachment_path)
                    }
                    
                    try:
                        resp = await client.post(
                            file_url,
                            data=data,
                            headers={"content-type": "application/x-www-form-urlencoded"},
                            timeout=60.0,
                        )
                        if resp.status_code in (200, 201):
                            logger.info(f"[Batch] Pièce jointe envoyée avec succès pour {phone}")
                        else:
                            logger.error(f"[Batch] Échec envoi PJ pour {phone} — {resp.status_code}: {resp.text[:200]}")
                    except Exception as e:
                        logger.error(f"[Batch] Erreur lors de l'envoi de la PJ pour {phone}: {e}")
                    
                    return text_ok
                else:
                    return await send_whatsapp_async(phone, message, client)
            except Exception as exc:
                logger.error(
                    f"[Batch][comm_id={communication_id}] "
                    f"Erreur inattendue pour {phone}: {exc}"
                )
                return False

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[_guarded_send(phone, client) for phone in phones],
            return_exceptions=False,
        )

    success = sum(1 for r in results if r is True)
    failure = len(results) - success

    logger.info(
        f"[Batch][comm_id={communication_id}] Terminé — "
        f"{success} succès / {failure} échecs."
    )
    return success, failure


# ─────────────────────────────────────────────────────────────────────────────
# Compat synchrone (conservé pour les BackgroundTasks FastAPI)
# ─────────────────────────────────────────────────────────────────────────────

def send_whatsapp_message(to_phone: str, message: str) -> bool:
    """Wrapper synchrone autour de send_whatsapp_async (appelle asyncio.run)."""
    try:
        return asyncio.run(send_whatsapp_async(to_phone, message))
    except RuntimeError:
        # Boucle d'événement déjà active (ex: Jupyter, tests)
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(send_whatsapp_async(to_phone, message))

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

# CONFIGURATION SMTP
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "outakuanime845@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "ttyecwtxhyrzklpc")

def send_email(to_email: str, subject: str, content: str, html_content: str = None, attachment_path: str = None, attachment_name: str = None):
    """Envoie un email réel en utilisant SMTP avec support HTML et pièce jointe."""
    if not SMTP_PASSWORD or not SMTP_USER:
        print(f"--- [SIMULATION EMAIL] ---")
        print(f"Pour: {to_email}")
        print(f"Sujet: {subject}")
        print(f"Contenu: {content}")
        print(f"--------------------------")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        # Partie texte brut
        part1 = MIMEText(content, 'plain', 'utf-8')
        msg.attach(part1)

        # Partie HTML si fournie
        if html_content:
            part2 = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part2)

        # Pièce jointe si fournie
        if attachment_path and os.path.exists(attachment_path):
            try:
                with open(attachment_path, "rb") as f:
                    part3 = MIMEBase('application', 'octet-stream')
                    part3.set_payload(f.read())
                    encoders.encode_base64(part3)
                    part3.add_header('Content-Disposition', f'attachment; filename="{attachment_name or os.path.basename(attachment_path)}"')
                    msg.attach(part3)
            except Exception as e:
                print(f"Erreur attachement: {e}")

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"[OK] Email envoyé avec succès à {to_email}")
        return True
    except Exception as e:
        print(f"[ERREUR] Erreur lors de l'envoi de l'email à {to_email}: {e}")
        return False


def send_welcome_email(to_email: str, nom: str, password: str):
    """Email de bienvenue lors de la validation d'inscription."""
    subject = "Bienvenue dans l'Association - Vos identifiants de connexion"
    content = f"""Bonjour {nom},

Votre inscription a été validée avec succès !

Vos identifiants de connexion :
Email : {to_email}
Mot de passe : {password}

Connectez-vous sur notre plateforme pour accéder à votre espace adhérent.

Cordialement,
L'équipe de l'Association
"""
    html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue dans l'Association !</h1>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #374151;">Bonjour <strong>{nom}</strong>,</p>
      <p style="color: #6b7280;">Votre inscription a été <strong style="color: #10b981;">validée avec succès</strong> !</p>
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px; color: #0369a1;">Vos identifiants de connexion</h3>
        <p style="margin: 6px 0; color: #374151;"><strong>Email :</strong> {to_email}</p>
        <p style="margin: 6px 0; color: #374151;"><strong>Mot de passe :</strong> <code style="background: #fef3c7; padding: 2px 8px; border-radius: 4px;">{password}</code></p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">⚠️ Conservez ces informations en lieu sûr.</p>
    </div>
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Association CCS — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
"""
    return send_email(to_email, subject, content, html_content)


def send_renewal_request_email(admin_email: str, nom_adherent: str, mode_paiement: str, montant: float):
    """Email envoyé à l'admin lors d'une demande de renouvellement."""
    subject = f"Nouvelle demande de renouvellement — {nom_adherent}"
    content = f"""Nouvelle demande de renouvellement reçue.

Adhérent : {nom_adherent}
Mode de paiement : {mode_paiement}
Montant : {montant} MAD

Veuillez vous connecter à l'interface administrateur pour valider cette demande.

Cordialement,
Système de gestion
"""
    html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Demande de Renouvellement</h1>
    </div>
    <div style="padding: 32px;">
      <p>Une nouvelle demande de renouvellement a été soumise :</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Adhérent</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">{nom_adherent}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Mode de paiement</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">{mode_paiement}</td></tr>
        <tr><td style="padding: 10px; color: #6b7280;">Montant</td><td style="padding: 10px; font-weight: 600; color: #10b981;">{montant} MAD</td></tr>
      </table>
      <a href="http://localhost:3000" style="display: block; margin: 24px 0; background: #4f46e5; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 700;">Accéder à l'interface Admin</a>
    </div>
  </div>
</body>
</html>
"""
    return send_email(admin_email, subject, content, html_content)


def send_renewal_approved_email(to_email: str, nom: str, date_fin: str):
    """Email de confirmation de renouvellement approuvé."""
    subject = "Renouvellement d'adhésion approuvé !"
    content = f"""Bonjour {nom},

Votre demande de renouvellement d'adhésion a été approuvée.
Votre adhésion est valide jusqu'au : {date_fin}

Cordialement,
L'équipe de l'Association
"""
    html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">✅ Renouvellement Approuvé !</h1>
    </div>
    <div style="padding: 32px;">
      <p>Bonjour <strong>{nom}</strong>,</p>
      <p>Votre renouvellement d'adhésion a été <strong style="color: #10b981;">approuvé</strong>.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: #374151;">Adhésion valide jusqu'au</p>
        <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: #10b981;">{date_fin}</p>
      </div>
    </div>
  </div>
</body>
</html>
"""
    return send_email(to_email, subject, content, html_content)

def send_bulk_emails(recipients: list, subject: str, content: str, attachment_path: str = None, attachment_name: str = None):
    """Envoie le même email à plusieurs destinataires via une seule connexion SMTP, avec pièce jointe optionnelle."""
    if not SMTP_PASSWORD or not SMTP_USER:
        print(f"--- [SIMULATION BULK EMAIL] ---")
        print(f"Pour: {len(recipients)} personnes")
        print(f"Sujet: {subject}")
        print(f"-------------------------------")
        return 0

    success_count = 0
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)

        for email in recipients:
            try:
                msg = MIMEMultipart('alternative')
                msg['From'] = SMTP_USER
                msg['To'] = email
                msg['Subject'] = subject

                part1 = MIMEText(content, 'plain', 'utf-8')
                msg.attach(part1)

                # Pièce jointe
                if attachment_path and os.path.exists(attachment_path):
                    with open(attachment_path, "rb") as f:
                        part_file = MIMEBase('application', 'octet-stream')
                        part_file.set_payload(f.read())
                        encoders.encode_base64(part_file)
                        part_file.add_header('Content-Disposition', f'attachment; filename="{attachment_name or os.path.basename(attachment_path)}"')
                        msg.attach(part_file)

                server.send_message(msg)
                success_count += 1
                print(f"[OK] Bulk Email envoyé à {email}")
            except Exception as e:
                print(f"[ERREUR] Erreur bulk pour {email}: {e}")

        server.quit()
    except Exception as e:
        print(f"[ERREUR] Erreur connexion SMTP bulk: {e}")

    return success_count

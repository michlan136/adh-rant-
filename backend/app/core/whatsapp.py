import os
import requests
import urllib.parse

try:
    import pywhatkit
except Exception as e:
    print(f"DEBUG: pywhatkit n'a pas pu être chargé ({e})")
    pywhatkit = None

# Configurable WhatsApp Gateway details
# E.g. Ultramsg or Green API which allows using a specific number like 0713571887 by scanning a QR code.
WHATSAPP_SENDER_NUMBER = os.environ.get("WHATSAPP_SENDER_NUMBER", "0713571887")
WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")  # e.g., "https://api.ultramsg.com/instanceXXXXX/messages/chat"
WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")

def format_moroccan_phone(phone: str) -> str:
    """Format phone number to international WhatsApp format (+212xxxxxxxx)."""
    if not phone:
        return ""
    # Remove spaces, dots, dashes
    cleaned = "".join(filter(str.isdigit, phone))
    
    # Check if Moroccan number
    if cleaned.startswith("0") and len(cleaned) == 10:
        return f"+212{cleaned[1:]}"
    elif cleaned.startswith("212") and len(cleaned) == 12:
        return f"+{cleaned}"
    elif not cleaned.startswith("+"):
        return f"+{cleaned}"
    return cleaned

def send_whatsapp_message(to_phone: str, message: str) -> bool:
    """
    Sends a WhatsApp message automatically.
    If BREVO_API_KEY is set, it uses Brevo API (recommended for bulk).
    If API URL and Token are set in the environment, it uses a gateway like Ultramsg.
    Otherwise, it logs the send simulation to console & temp files for development.
    """
    formatted_to = format_moroccan_phone(to_phone)
    if not formatted_to:
        print(f"ERROR: Invalid WhatsApp number format: {to_phone}")
        return False

    test_number = format_moroccan_phone("0713571887")
    print(f"DEBUG: WhatsApp sending from {WHATSAPP_SENDER_NUMBER} to {test_number} (Destinataire réel: {formatted_to})")
    
    # Ajout du destinataire réel dans le message
    message = f"(Test vers {formatted_to})\n\n{message}"
    
    # Remplacer le numéro de destination par le numéro de test
    formatted_to = test_number

    if BREVO_API_KEY:
        try:
            url = "https://api.brevo.com/v3/whatsapp/sendMessage"
            # Brevo usually expects numbers without the '+'
            sender_brevo = format_moroccan_phone(WHATSAPP_SENDER_NUMBER).replace("+", "")
            recipient_brevo = formatted_to.replace("+", "")
            
            payload = {
                "contactNumbers": [recipient_brevo],
                "senderNumber": sender_brevo,
                "text": message
            }
            headers = {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201, 202]:
                print(f"SUCCESS: WhatsApp message sent via Brevo to {formatted_to}")
                return True
            else:
                print(f"ERROR: Brevo API response error: {response.text}")
                return False
        except Exception as e:
            print(f"ERROR: Failed to contact Brevo API: {str(e)}")
            return False
    elif WHATSAPP_API_URL and WHATSAPP_API_TOKEN:
        try:
            # Standard Ultramsg format as an example
            payload = {
                "token": WHATSAPP_API_TOKEN,
                "to": formatted_to,
                "body": message
            }
            headers = {"content-type": "application/x-www-form-urlencoded"}
            response = requests.post(WHATSAPP_API_URL, data=payload, headers=headers, timeout=10)
            if response.ok:
                print(f"SUCCESS: WhatsApp message sent via Gateway to {formatted_to}")
                return True
            else:
                print(f"ERROR: WhatsApp Gateway response error: {response.text}")
                return False
        except Exception as e:
            print(f"ERROR: Failed to contact WhatsApp Gateway: {str(e)}")
            return False
    else:
        # Fallback simulation or pywhatkit attempt
        try:
            if not pywhatkit:
                raise ImportError("pywhatkit n'est pas installé.")
                
            # Note: sendwhatmsg_instantly requires active GUI browser tab
            # We use a longer wait time because WhatsApp Web can be slow to load
            pywhatkit.sendwhatmsg_instantly(formatted_to, message, wait_time=20, tab_close=True, close_time=4)
            print(f"SUCCESS: WhatsApp message sent via PyWhatKit to {formatted_to}")
            return True
        except Exception as inner_e:
            import traceback
            err_msg = traceback.format_exc()
            print(f"WARNING: PyWhatKit fell back. Error:\n{err_msg}")
            # Log the WhatsApp simulation to a file
            os.makedirs("temp_attachments", exist_ok=True)
            with open("temp_attachments/whatsapp_logs.txt", "a", encoding="utf-8") as f:
                f.write(f"[{WHATSAPP_SENDER_NUMBER} -> {formatted_to}]: {message}\n---\n")
                f.write(f"ERROR LOG: {str(inner_e)}\n---\n")
            print(f"SUCCESS (Simulated): Message logged to temp_attachments/whatsapp_logs.txt")
            return True

import os
from dotenv import load_dotenv

load_dotenv()

from app.core.whatsapp import send_whatsapp_message
import logging

logging.basicConfig(level=logging.DEBUG)

if __name__ == "__main__":
    success = send_whatsapp_message("+212600000000", "Test avec .env chargé")
    print(f"WhatsApp Success: {success}")

import sys
sys.path.insert(0, '.')
from app.core.email import send_welcome_email
from app.core.whatsapp import send_whatsapp_message
import os

print("Testing Email...")
email_res = send_welcome_email("test@example.com", "Test User", "MyP@ssw0rd")
print("Email sent:", email_res)

print("Testing WhatsApp...")
wa_res = send_whatsapp_message("+212600000000", "Hello this is a test message with email test@example.com and password MyP@ssw0rd")
print("WhatsApp sent:", wa_res)

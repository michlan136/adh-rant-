import re

with open(r"C:\stage_projet\backend\app\core\whatsapp.py", "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the document logic in send_whatsapp_batch to handle images properly
new_logic = """
                if attachment_path and os.path.exists(attachment_path) and WHATSAPP_API_URL and WHATSAPP_API_TOKEN:
                    is_image = attachment_name and attachment_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
                    
                    if is_image:
                        file_url = WHATSAPP_API_URL.replace("/messages/chat", "/messages/image")
                        if "/messages/" not in file_url:
                            file_url = WHATSAPP_API_URL.rstrip("/") + "/../messages/image"
                        file_key = "image"
                    else:
                        file_url = WHATSAPP_API_URL.replace("/messages/chat", "/messages/document")
                        if "/messages/" not in file_url:
                            file_url = WHATSAPP_API_URL.rstrip("/") + "/../messages/document"
                        file_key = "document"

                    text_ok = await send_whatsapp_async(phone, message, client)
                    
                    with open(attachment_path, "rb") as f:
                        import base64
                        file_b64 = base64.b64encode(f.read()).decode("utf-8")
                    
                    data = {
                        "token": WHATSAPP_API_TOKEN,
                        "to": phone,
                        file_key: file_b64,
                    }
                    if not is_image:
                        data["filename"] = attachment_name or os.path.basename(attachment_path)
"""

# I need to find the block to replace
block_to_replace = r"""                if attachment_path and os.path.exists\(attachment_path\) and WHATSAPP_API_URL and WHATSAPP_API_TOKEN:
                    # Construire l'URL d'envoi de fichier Ultramsg
                    file_url = WHATSAPP_API_URL\.replace\("/messages/chat", "/messages/document"\)
                    if "/messages/" not in file_url:
                        file_url = WHATSAPP_API_URL\.rstrip\("/"\) \+ "/\.\./messages/document"
                    # Lire et envoyer le fichier comme base64 ou URL
                    # Ultramsg accepte le chemin en tant que document via URL publique ou base64
                    text_ok = await send_whatsapp_async\(phone, message, client\)
                    # Envoi du fichier via Ultramsg sendFile endpoint
                    with open\(attachment_path, "rb"\) as f:
                        import base64
                        file_b64 = base64\.b64encode\(f\.read\(\)\)\.decode\("utf-8"\)
                    
                    data = \{
                        "token": WHATSAPP_API_TOKEN,
                        "to": phone,
                        "document": file_b64,
                        "filename": attachment_name or os\.path\.basename\(attachment_path\)
                    \}"""

# Replace it
content = re.sub(block_to_replace, new_logic.strip(), content)

with open(r"C:\stage_projet\backend\app\core\whatsapp.py", "w", encoding="utf-8") as f:
    f.write(content)

print("WhatsApp logic updated for images.")

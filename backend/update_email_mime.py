import re

with open(r"C:\stage_projet\backend\app\core\email.py", "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the attachment logic in send_bulk_emails
new_logic = """
                # Pièce jointe
                if attachment_path and os.path.exists(attachment_path):
                    import mimetypes
                    ctype, encoding = mimetypes.guess_type(attachment_path)
                    if ctype is None or encoding is not None:
                        ctype = 'application/octet-stream'
                    maintype, subtype = ctype.split('/', 1)

                    with open(attachment_path, "rb") as f:
                        if maintype == 'image':
                            from email.mime.image import MIMEImage
                            part_file = MIMEImage(f.read(), _subtype=subtype)
                        else:
                            part_file = MIMEBase(maintype, subtype)
                            part_file.set_payload(f.read())
                            encoders.encode_base64(part_file)
                            
                        part_file.add_header('Content-Disposition', f'attachment; filename="{attachment_name or os.path.basename(attachment_path)}"')
                        msg.attach(part_file)
"""

block_to_replace = r"""                # Pièce jointe
                if attachment_path and os\.path\.exists\(attachment_path\):
                    with open\(attachment_path, "rb"\) as f:
                        part_file = MIMEBase\('application', 'octet-stream'\)
                        part_file\.set_payload\(f\.read\(\)\)
                        encoders\.encode_base64\(part_file\)
                        part_file\.add_header\('Content-Disposition', f'attachment; filename="\{attachment_name or os\.path\.basename\(attachment_path\)\}"'\)
                        msg\.attach\(part_file\)"""

content = re.sub(block_to_replace, new_logic.strip(), content)

with open(r"C:\stage_projet\backend\app\core\email.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Email logic updated for images.")

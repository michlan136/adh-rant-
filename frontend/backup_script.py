import re

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will just write a new file completely to avoid messy replacements.
# Let's inspect the file first.
with open(r"C:\stage_projet\frontend\InscriptionForm_backup.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Backed up.")

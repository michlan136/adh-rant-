import re

# 1. Patch entreprise.py
with open(r"C:\stage_projet\backend\app\models\entreprise.py", "r", encoding="utf-8") as f:
    content = f.read()
if "rc = Column(String" not in content:
    content = content.replace("numero_patente = Column(String, nullable=True)", "numero_patente = Column(String, nullable=True)\n    rc = Column(String, nullable=True)")
    with open(r"C:\stage_projet\backend\app\models\entreprise.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("entreprise.py patched")

# 2. Patch inscription.py (schema)
with open(r"C:\stage_projet\backend\app\schemas\inscription.py", "r", encoding="utf-8") as f:
    content = f.read()

fields_to_add = """
    cin: Optional[str] = None
    date_naissance: Optional[date] = None
    profession: Optional[str] = None
    numero_patente: Optional[str] = None
    ice: Optional[str] = None
    rc: Optional[str] = None
"""
if "rc: Optional[str]" not in content:
    content = content.replace("services_demandes: Dict[str, List[int]]", f"services_demandes: Dict[str, List[int]]{fields_to_add}")
    with open(r"C:\stage_projet\backend\app\schemas\inscription.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("inscription.py patched")

# 3. Patch endpoints_admin.py (creation logic)
with open(r"C:\stage_projet\backend\app\api\endpoints_admin.py", "r", encoding="utf-8") as f:
    content = f.read()

assign_fields = """
        ville_id=inscription_data.ville_id,
        cin=inscription_data.cin,
        date_naissance=inscription_data.date_naissance,
        profession=inscription_data.profession,
        numero_patente=inscription_data.numero_patente,
        ice=inscription_data.ice,
        rc=inscription_data.rc,
"""
if "rc=inscription_data.rc," not in content:
    content = content.replace("ville_id=inscription_data.ville_id,", assign_fields)
    with open(r"C:\stage_projet\backend\app\api\endpoints_admin.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("endpoints_admin.py patched")

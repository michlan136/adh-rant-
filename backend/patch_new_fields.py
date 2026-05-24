import re

# 1. Update models/entreprise.py
with open(r"C:\stage_projet\backend\app\models\entreprise.py", "r", encoding="utf-8") as f:
    content = f.read()

model_fields = """    rc = Column(String, nullable=True)
    secteur_activite = Column(String, nullable=True)
    numero_registre = Column(String, nullable=True)
    numero_auto_entrepreneur = Column(String, nullable=True)
    objet_association = Column(Text, nullable=True)
    nom_president = Column(String, nullable=True)
    liste_membres_bureau = Column(Text, nullable=True)"""

if "secteur_activite = Column" not in content:
    content = content.replace("    rc = Column(String, nullable=True)", model_fields)
    with open(r"C:\stage_projet\backend\app\models\entreprise.py", "w", encoding="utf-8") as f:
        f.write(content)

# 2. Update schemas/inscription.py
with open(r"C:\stage_projet\backend\app\schemas\inscription.py", "r", encoding="utf-8") as f:
    content = f.read()

schema_fields = """    rc: Optional[str] = None
    secteur_activite: Optional[str] = None
    numero_registre: Optional[str] = None
    numero_auto_entrepreneur: Optional[str] = None
    objet_association: Optional[str] = None
    nom_president: Optional[str] = None
    liste_membres_bureau: Optional[str] = None"""

if "secteur_activite: Optional[str]" not in content:
    content = content.replace("    rc: Optional[str] = None", schema_fields)
    with open(r"C:\stage_projet\backend\app\schemas\inscription.py", "w", encoding="utf-8") as f:
        f.write(content)

# 3. Update endpoints_admin.py
with open(r"C:\stage_projet\backend\app\api\endpoints_admin.py", "r", encoding="utf-8") as f:
    content = f.read()

assign_fields = """        rc=req.rc,
        secteur_activite=req.secteur_activite,
        numero_registre=req.numero_registre,
        numero_auto_entrepreneur=req.numero_auto_entrepreneur,
        objet_association=req.objet_association,
        nom_president=req.nom_president,
        liste_membres_bureau=req.liste_membres_bureau,"""

if "secteur_activite=req.secteur_activite" not in content:
    content = content.replace("        rc=req.rc,", assign_fields)
    with open(r"C:\stage_projet\backend\app\api\endpoints_admin.py", "w", encoding="utf-8") as f:
        f.write(content)

print("Backend files patched for new fields.")

import re

with open(r"C:\stage_projet\backend\app\models\cibles.py", "r", encoding="utf-8") as f:
    content = f.read()

# We only want to remove `description = Column(Text, nullable=True)` inside the SousType classes
# Let's match each SousType class and remove that line.

classes = ["SousTypePublication", "SousTypeFormation", "SousTypeProspection", "SousTypeAssistance", "SousTypeGuichet", "SousTypeLocation"]

for cls in classes:
    pattern = rf"(class {cls}\(Base\):.*?libelle\s*=\s*Column\(String, nullable=False\)\n)\s*description\s*=\s*Column\(Text, nullable=True\)\n"
    content = re.sub(pattern, r"\1", content, flags=re.DOTALL)

with open(r"C:\stage_projet\backend\app\models\cibles.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Modèles SousType corrigés.")

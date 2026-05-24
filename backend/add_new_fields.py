from app.db.session import engine
from sqlalchemy import text

new_columns = [
    "secteur_activite VARCHAR(255)",
    "numero_registre VARCHAR(255)",
    "numero_auto_entrepreneur VARCHAR(255)",
    "objet_association TEXT",
    "nom_president VARCHAR(255)",
    "liste_membres_bureau TEXT"
]

with engine.begin() as conn:
    for col in new_columns:
        try:
            conn.execute(text(f"ALTER TABLE entreprise ADD COLUMN {col};"))
            print(f"Added {col}")
        except Exception as e:
            print(f"Skipped {col} - probably exists")

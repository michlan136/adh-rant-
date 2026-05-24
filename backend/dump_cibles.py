from app.db.session import SessionLocal
from app.models.cibles import SousTypePublication, Publication, SousTypeFormation, Formation

db = SessionLocal()

print("--- SousTypePublication ---")
for s in db.query(SousTypePublication).all():
    print(s.id, s.libelle)

print("\n--- Publication ---")
for p in db.query(Publication).all():
    print(p.id, p.titre, p.sous_type_id)

print("\n--- SousTypeFormation ---")
for s in db.query(SousTypeFormation).all():
    print(s.id, s.libelle)

print("\n--- Formation ---")
for f in db.query(Formation).all():
    print(f.id, f.titre, f.sous_type_id)

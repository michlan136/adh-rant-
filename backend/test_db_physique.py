from app.db.session import SessionLocal
from app.models.entreprise import Entreprise

db = SessionLocal()
ent = db.query(Entreprise).filter(Entreprise.email == "test_physique@example.com").first()

if ent:
    print(f"CIN: {ent.cin}")
    print(f"Date de naissance: {ent.date_naissance}")
    print(f"Profession: {ent.profession}")
    print(f"Patente: {ent.numero_patente}")
    print(f"ICE: {ent.ice}")
    print(f"RC: {ent.rc}")
else:
    print("Entreprise not found")

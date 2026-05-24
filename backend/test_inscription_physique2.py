import httpx
import asyncio

async def test_inscription():
    payload = {
        "nom_contact": "TestNom",
        "prenom_contact": "TestPrenom",
        "email_contact": "test_physique2@example.com",
        "cin": "AB123456",
        "date_naissance": "1990-01-01",
        "profession": "Consultant",
        "numero_patente": "PAT123",
        "ice": "ICE123456789",
        "rc": "RC987654",
        "forme_juridique_id": 1,
        "services_demandes": {}
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post("http://127.0.0.1:8000/api/admin/inscriptions", json=payload)
        if res.status_code == 200:
            from app.db.session import SessionLocal
            from app.models.entreprise import Entreprise

            db = SessionLocal()
            ent = db.query(Entreprise).filter(Entreprise.email == "test_physique2@example.com").first()

            if ent:
                print(f"CIN: {ent.cin}")
                print(f"Date de naissance: {ent.date_naissance}")
                print(f"Profession: {ent.profession}")
                print(f"Patente: {ent.numero_patente}")
                print(f"ICE: {ent.ice}")
                print(f"RC: {ent.rc}")
            else:
                print("Entreprise not found")

asyncio.run(test_inscription())

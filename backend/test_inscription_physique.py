import httpx
import asyncio

async def test_inscription():
    payload = {
        "nom_contact": "TestNom",
        "prenom_contact": "TestPrenom",
        "email_contact": "test_physique@example.com",
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
        print("Status:", res.status_code)
        print("Response:", res.json())
        
        if res.status_code == 200:
            print("Successfully created. Now let's fetch the DB to verify fields.")

asyncio.run(test_inscription())

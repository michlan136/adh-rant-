import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

payload = {
    "nom_contact": "TestNom",
    "prenom_contact": "TestPrenom",
    "email_contact": "test_endpoint_error_001@example.com",
    "telephone_contact": "0600000000",
    "forme_juridique": "Société",
    "raison_sociale_entreprise": "TestSociete",
    "documents": "{}"
}

response = client.post("/api/admin/inscriptions", json=payload)
print("STATUS CODE:", response.status_code)
print("RESPONSE:", response.json())

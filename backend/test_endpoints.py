"""
Test complet des endpoints API via TestClient FastAPI.
Vérifie que tous les routes admin fonctionnent correctement avec la nouvelle BD.
"""
import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== TEST DES ENDPOINTS API ===\n")
errors = []

endpoints = [
    ("GET", "/api/admin/stats", None),
    ("GET", "/api/admin/adherents", None),
    ("GET", "/api/admin/demandes", None),
    ("GET", "/api/admin/cartes", None),
    ("GET", "/api/admin/communications", None),
    ("GET", "/api/admin/evenements", None),
    ("GET", "/api/admin/renouvellements", None),
    ("GET", "/api/admin/documents", None),
    ("GET", "/api/admin/cibles", None),
    ("GET", "/api/finance/fournisseurs", None),
    ("GET", "/api/finance/depenses", None),
]

for method, endpoint, body in endpoints:
    try:
        if method == "GET":
            resp = client.get(endpoint)
        elif method == "POST":
            resp = client.post(endpoint, json=body)
        
        if resp.status_code in (200, 201):
            print(f"  [OK] {method} {endpoint} -> {resp.status_code}")
        else:
            print(f"  [ERREUR {resp.status_code}] {method} {endpoint} -> {resp.text[:200]}")
            errors.append((endpoint, resp.status_code, resp.text[:200]))
    except Exception as e:
        print(f"  [EXCEPTION] {method} {endpoint} -> {e}")
        errors.append((endpoint, "EXCEPTION", str(e)))

print(f"\n=== RESULTATS: {len(endpoints) - len(errors)}/{len(endpoints)} OK ===")
if errors:
    print("\nERREURS:")
    for ep, code, msg in errors:
        print(f"  - {ep} [{code}]: {msg}")
else:
    print("Tous les endpoints fonctionnent correctement!")

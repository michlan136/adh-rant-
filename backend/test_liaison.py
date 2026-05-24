"""
Script de test de liaison complète backend ↔ base de données nouvelle.
Teste les modèles SQLAlchemy contre les vraies tables de gestion_adherent.
"""
import sys, traceback
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.models.entreprise import Entreprise
from app.models.login import Login
from app.models.inscription import DemandeInscription
from app.models.carte import CarteAdherent
from app.models.renouvellement import Renouvellement
from app.models.evenement import Evenement
from app.models.participation import Participation
from app.models.communication import Communication, EnvoiCommunication
from app.models.notification import Notification
from app.models.adhesion import Adhesion
from app.models.document import Document
from app.models.finance import Fournisseur, Depense
from app.models.dirigeant import Dirigeant
from app.models.cibles import Formation, Publication, Prospection, AssistanceTPE, Guichet, LocationSalles

db = SessionLocal()
errors = []

tests = [
    ("Entreprise", lambda: db.query(Entreprise).first()),
    ("Login", lambda: db.query(Login).first()),
    ("DemandeInscription", lambda: db.query(DemandeInscription).first()),
    ("CarteAdherent", lambda: db.query(CarteAdherent).first()),
    ("Renouvellement", lambda: db.query(Renouvellement).first()),
    ("Evenement", lambda: db.query(Evenement).first()),
    ("Participation", lambda: db.query(Participation).first()),
    ("Communication", lambda: db.query(Communication).first()),
    ("EnvoiCommunication", lambda: db.query(EnvoiCommunication).first()),
    ("Notification", lambda: db.query(Notification).first()),
    ("Adhesion", lambda: db.query(Adhesion).first()),
    ("Document", lambda: db.query(Document).first()),
    ("Fournisseur", lambda: db.query(Fournisseur).first()),
    ("Depense", lambda: db.query(Depense).first()),
    ("Dirigeant", lambda: db.query(Dirigeant).first()),
    ("Formation", lambda: db.query(Formation).first()),
    ("Publication", lambda: db.query(Publication).first()),
    ("Prospection", lambda: db.query(Prospection).first()),
    ("AssistanceTPE", lambda: db.query(AssistanceTPE).first()),
    ("Guichet", lambda: db.query(Guichet).first()),
    ("LocationSalles", lambda: db.query(LocationSalles).first()),
]

print("=== TEST DE LIAISON BACKEND <-> BASE DE DONNEES ===\n")
for name, fn in tests:
    try:
        fn()
        print(f"  [OK] {name}")
    except Exception as e:
        print(f"  [ERREUR] {name}: {e}")
        errors.append((name, str(e)))

print(f"\n=== RESULTATS: {len(tests) - len(errors)}/{len(tests)} OK ===")
if errors:
    print("\nERREURS DETECTEES:")
    for name, err in errors:
        print(f"  - {name}: {err}")
else:
    print("Tous les modeles sont correctement lies a la base de donnees!")

db.close()

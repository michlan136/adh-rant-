"""Test direct de la logique de creation d'inscription"""
import sys
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.entreprise import Entreprise
from app.models.login import Login
from app.models.inscription import DemandeInscription
from datetime import datetime
import random
import string
import traceback

db = SessionLocal()

try:
    print("Test 1: Creation Entreprise...")
    ent = Entreprise(
        nom="Test",
        prenom="User",
        email="testunique999@test.ma",
        telephone="0600000000",
        adresse="123 rue test",
        raison_sociale="TestSA",
        ice="ICE123",
        tax_professionnelle="TP123",
        description_activite="Info",
        date_creation=datetime.utcnow().date(),
        est_valide=True,
    )
    db.add(ent)
    db.flush()
    print(f"  -> Entreprise ID: {ent.id}")

    print("Test 2: Creation Login...")
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    login = Login(
        email="testunique999@test.ma",
        mot_de_passe=password,
        role="adherent",
        entreprise_id=ent.id
    )
    db.add(login)
    db.flush()
    print(f"  -> Login ID: {login.id}")

    print("Test 3: Creation DemandeInscription...")
    demande = DemandeInscription(
        nom_contact="Test",
        prenom_contact="User",
        email_contact="testunique999@test.ma",
        telephone_contact="0600000000",
        raison_sociale_entreprise="TestSA",
        mot_de_passe=password,
        statut="valide",
        documents=None,
        entreprise_creee_id=ent.id,
        login_cree_id=login.id,
    )
    db.add(demande)
    db.flush()
    print(f"  -> Demande ID: {demande.id}")

    db.rollback()  # On annule pour ne pas polluer la base
    print("\nTOUS LES TESTS REUSSIS !")
    
except Exception as e:
    db.rollback()
    print(f"\nERREUR: {e}")
    traceback.print_exc()
finally:
    db.close()

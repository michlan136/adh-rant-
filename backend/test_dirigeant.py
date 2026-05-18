"""Test du modele Dirigeant"""
import sys
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.dirigeant import Dirigeant
from app.models.entreprise_dirigeant import EntrepriseDirigeant
import traceback

db = SessionLocal()

try:
    print("Test: Creation Dirigeant...")
    d = Dirigeant(
        nom="Ben Ali",
        prenom="",
        telephone="0611223344",
        email="dir@test.ma",
        linkedin="linkedin.com/test",
        facebook="fb.com/test",
    )
    db.add(d)
    db.flush()
    print(f"  -> Dirigeant ID: {d.id}")
    
    print("Test: Lien EntrepriseDirigeant...")
    lien = EntrepriseDirigeant(dirigeant_id=d.id, entreprise_id=1)
    db.add(lien)
    db.flush()
    print(f"  -> Lien cree")
    
    db.rollback()
    print("REUSSI!")
    
except Exception as e:
    db.rollback()
    print(f"ERREUR: {e}")
    traceback.print_exc()
finally:
    db.close()

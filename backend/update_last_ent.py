from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(r"C:\stage_projet\backend")
from app.db.session import SessionLocal
from app.models.entreprise import Entreprise

db = SessionLocal()
try:
    # Find the most recently created Entreprise
    last_ent = db.query(Entreprise).order_by(Entreprise.id.desc()).first()
    if last_ent and last_ent.est_valide == True:
        last_ent.est_valide = False
        db.commit()
        print(f"Updated Entreprise {last_ent.id} to est_valide=False")
    else:
        print("Last entreprise is already est_valide=False or not found.")
finally:
    db.close()

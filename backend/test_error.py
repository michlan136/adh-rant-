import traceback
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.carte import CarteAdherent
from app.models.entreprise import Entreprise
from app.models.renouvellement import Renouvellement

def simulate_renouveler(carte_id):
    db = SessionLocal()
    try:
        carte = db.query(CarteAdherent).filter(CarteAdherent.id == carte_id).first()
        if not carte:
            print("Carte not found")
            return
            
        today = datetime.utcnow().date()
        if carte.date_expiration and (carte.date_expiration - today).days > 30:
            print("Exp > 30 days")
            # Usually raises HTTPException
            pass
            
        carte.statut = "inactive"
        ent = db.query(Entreprise).filter(Entreprise.id == carte.entreprise_id).first()
        type_adh = "PM" if (ent and ent.raison_sociale) else "PP"
        
        annee = today.year
        expiration = today.replace(year=today.year + 1)
        id_str = f"{carte.entreprise_id:06d}"
        compte_cartes = db.query(CarteAdherent).filter(CarteAdherent.entreprise_id == carte.entreprise_id).count()
        num_carte = f"{annee}-{type_adh}-{id_str}-R{compte_cartes}"
        
        nouvelle_carte = CarteAdherent(
            entreprise_id=carte.entreprise_id,
            date_emission=today,
            date_expiration=expiration,
            numero_carte=num_carte,
            statut="active"
        )
        db.add(nouvelle_carte)
        
        renouv = Renouvellement(
            entreprise_id=carte.entreprise_id,
            annee=today.year,
            montant=0.0,
            statut="validé",
            statut_paiement="validé"
        )
        db.add(renouv)
        db.flush() # simulate commit
        print("Success!")
    except Exception as e:
        print("Error encountered:")
        traceback.print_exc()
    finally:
        db.rollback()
        db.close()

if __name__ == "__main__":
    # Let's test with the carte shown in the screenshot. It has ID "CARTE-2026-002" or similar.
    # We can just fetch the first active carte to test.
    db = SessionLocal()
    carte = db.query(CarteAdherent).first()
    if carte:
        print(f"Testing with carte ID {carte.id}")
        db.close()
        simulate_renouveler(carte.id)
    else:
        print("No cartes found.")
        db.close()

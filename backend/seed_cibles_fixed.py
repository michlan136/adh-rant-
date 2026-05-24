from app.db.session import SessionLocal
from app.models.cibles import (
    Publication, SousTypePublication,
    Formation, SousTypeFormation,
    Prospection, SousTypeProspection,
    AssistanceTPE, SousTypeAssistance,
    Guichet, SousTypeGuichet,
    LocationSalles, SousTypeLocation
)

db = SessionLocal()

SERVICES_CATEGORIES = {
  'Publication': (Publication, SousTypePublication, ['Flash info', 'Enconews', 'Massa Souss Iktissad', 'Annuaire pro']),
  'Formation': (Formation, SousTypeFormation, ['Cycle court', 'Cycle long']),
  'Prospection': (Prospection, SousTypeProspection, ['BtoB', 'Délégation étrangère', 'Calendrier foires', 'Opportunité', 'Mission à l\'étranger']),
  'Assistance TPE': (AssistanceTPE, SousTypeAssistance, ['Aide au montage', 'Aide démarrage', 'Diagnostic']),
  'Guichet': (Guichet, SousTypeGuichet, ['ASMEX', 'Maroc PME', 'Dar Al Moukawil', 'OMPIC', 'ISM', 'Centre de médiation']),
}

for cat_name, (Model, SousTypeModel, items) in SERVICES_CATEGORIES.items():
    # 1. Ensure at least one SousType exists
    st = db.query(SousTypeModel).first()
    if not st:
        st = SousTypeModel(libelle="Général")
        db.add(st)
        db.commit()
        db.refresh(st)
    
    # 2. Insert items
    for item in items:
        if not db.query(Model).filter_by(titre=item).first():
            db.add(Model(titre=item, sous_type_id=st.id, actif=True))

# Location salles uses nom_salle instead of titre
st_loc = db.query(SousTypeLocation).first()
if not st_loc:
    st_loc = SousTypeLocation(libelle="Général")
    db.add(st_loc)
    db.commit()
    db.refresh(st_loc)

for item in ['Amphithéâtre', 'Salle polyvalente', 'Salle conférence', 'Salle formation', 'Salle exposition']:
    if not db.query(LocationSalles).filter_by(nom_salle=item).first():
        db.add(LocationSalles(nom_salle=item, sous_type_id=st_loc.id, actif=True))

db.commit()
print("Base de données mise à jour avec succès avec les cibles par défaut !")

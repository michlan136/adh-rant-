from app.db.session import SessionLocal
from app.models.cibles import Publication, Formation, Prospection, AssistanceTPE, Guichet, LocationSalles

db = SessionLocal()

SERVICES_CATEGORIES = {
  'Publication': ['Flash info', 'Enconews', 'Massa Souss Iktissad', 'Annuaire pro'],
  'Formation': ['Cycle court', 'Cycle long'],
  'Prospection': ['BtoB', 'Délégation étrangère', 'Calendrier foires', 'Opportunité', 'Mission à l\'étranger'],
  'Assistance TPE': ['Aide au montage', 'Aide démarrage', 'Diagnostic'],
  'Guichet': ['ASMEX', 'Maroc PME', 'Dar Al Moukawil', 'OMPIC', 'ISM', 'Centre de médiation'],
  'Location salles': ['Amphithéâtre', 'Salle polyvalente', 'Salle conférence', 'Salle formation', 'Salle exposition'],
}

models_map = {
    'Publication': Publication,
    'Formation': Formation,
    'Prospection': Prospection,
    'Assistance TPE': AssistanceTPE,
    'Guichet': Guichet,
}

for category, items in SERVICES_CATEGORIES.items():
    if category == 'Location salles':
        for item in items:
            if not db.query(LocationSalles).filter_by(nom_salle=item).first():
                db.add(LocationSalles(nom_salle=item, actif=True))
    else:
        model = models_map[category]
        for item in items:
            if not db.query(model).filter_by(titre=item).first():
                db.add(model(titre=item, actif=True))

db.commit()
print("Base de données mise à jour avec succès avec les cibles par défaut !")

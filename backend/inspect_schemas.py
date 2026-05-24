import sys
sys.path.insert(0, '.')
from sqlalchemy import create_engine, inspect as sqlinspect
from app.db.session import DATABASE_URL

engine = create_engine(DATABASE_URL)
insp = sqlinspect(engine)

tables_to_check = [
    'entreprise', 'dirigeants', 'demande_inscription', 'renouvellement',
    'carte_adherent', 'participation', 'evenement', 'communication',
    'document', 'adhesion', 'fournisseurs', 'depenses', 'notification',
    'envoi_communication'
]

for t in tables_to_check:
    try:
        cols = insp.get_columns(t)
        print(f"\n--- {t} ---")
        for c in cols:
            print(f"  {c['name']}: {c['type']}")
    except Exception as e:
        print(f"\n{t}: ERROR {e}")

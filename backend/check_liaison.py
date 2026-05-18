from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    for table in ['entreprise_dirigeant', 'entreprise_activite', 'exportation', 'importation']:
        r = conn.execute(text(
            f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position"
        ))
        print(f"{table}: {[x[0] for x in r]}")

from app.db.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    for table in ['entreprise', 'demande_inscription', 'dirigeants']:
        result = conn.execute(text(
            f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position"
        ))
        cols = [r[0] for r in result]
        print(f"{table}: {cols}")

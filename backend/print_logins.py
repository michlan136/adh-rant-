from sqlalchemy import create_engine, text
import sys
import os

sys.path.append(os.getcwd())

from app.db.session import DATABASE_URL

engine = create_engine(DATABASE_URL)

def print_logins():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM login;"))
        rows = result.fetchall()
        print(f"Contenu de la table login ({len(rows)} lignes) :")
        for row in rows:
            print(row)

if __name__ == "__main__":
    print_logins()

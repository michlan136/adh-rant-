from app.db.session import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE document ADD COLUMN categorie VARCHAR;"))
            print("Added categorie")
        except Exception as e:
            print(f"categorie already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE document ADD COLUMN taille VARCHAR;"))
            print("Added taille")
        except Exception as e:
            print(f"taille already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE document ADD COLUMN ajoute_par VARCHAR;"))
            print("Added ajoute_par")
        except Exception as e:
            print(f"ajoute_par already exists or error: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    add_columns()

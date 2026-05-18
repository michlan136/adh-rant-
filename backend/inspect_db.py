from sqlalchemy import create_engine, text
import sys
import os

sys.path.append(os.getcwd())

from app.db.session import DATABASE_URL

engine = create_engine(DATABASE_URL)

def list_tables_and_rows():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';"))
        tables = [row[0] for row in result]
        print(f"Tables en base : {tables}")
        for table in tables:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"Table {table} : {count} lignes")
            if count > 0:
                rows = conn.execute(text(f"SELECT * FROM {table} LIMIT 2")).fetchall()
                print(f"Exemple de données pour {table}: {rows}")

if __name__ == "__main__":
    list_tables_and_rows()

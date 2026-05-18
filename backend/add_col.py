from sqlalchemy import create_engine, text
from app.db.session import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE demande_inscription ADD COLUMN documents VARCHAR;"))
        print("Column 'documents' added successfully.")
    except Exception as e:
        print(f"Error (maybe column already exists): {e}")

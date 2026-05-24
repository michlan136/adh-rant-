from app.db.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE entreprise ADD COLUMN rc VARCHAR(255);"))
        print("Column added successfully")
    except Exception as e:
        if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
            print("Column already exists")
        else:
            print(f"Error: {e}")

import os
from sqlalchemy import create_engine, text

fallback_url = "postgresql://postgres.ommmxnuntsithzzmcenp:E6%40ZFb%21Ra.e3JYb@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", fallback_url)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE entreprise ADD COLUMN donnees_extra TEXT;"))
        conn.commit()
        print("Column donnees_extra added to entreprise table.")
    except Exception as e:
        print(f"Error (maybe already exists?): {e}")

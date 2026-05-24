import os
from sqlalchemy import create_engine, text

fallback_url = "postgresql://postgres.ommmxnuntsithzzmcenp:E6%40ZFb%21Ra.e3JYb@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", fallback_url)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE participation ALTER COLUMN evenement_id DROP NOT NULL;"))
        conn.commit()
        print("Dropped NOT NULL constraint on evenement_id in participation table.")
    except Exception as e:
        print(f"Error: {e}")

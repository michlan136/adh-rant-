from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ==========================================
# CONFIGURATION DE LA BASE DE DONNÉES
# ==========================================
DATABASE_URL = "postgresql://postgres.xkrutionxnzqkthowair:E6@ZFb!Ra.e3JYb@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency pour obtenir la session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# ==========================================
# CONFIGURATION DE LA BASE DE DONNÉES
# ==========================================
# 1. On a remplacé le '@' du mot de passe par '%40'
# 2. On utilise os.getenv pour lire la variable de Render en priorité
fallback_url = "postgresql://postgres.xkrutionxnzqkthowair:E6%40ZFb!Ra.e3JYb@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", fallback_url)

# Correction de sécurité au cas où Render injecterait postgres:// au lieu de postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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

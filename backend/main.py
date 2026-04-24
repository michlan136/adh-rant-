from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

import jwt
from datetime import datetime, timedelta

# ==========================================
# 1. CONFIGURATION DE LA BASE DE DONNÉES
# ==========================================
# ⚠️ À MODIFIER : Mets ton vrai mot de passe et le vrai nom de ta base de données à la fin
DATABASE_URL = "postgresql://postgres:michlan@localhost:5432/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modèle de la table dans PostgreSQL
# Modèle de la table dans PostgreSQL
class Login(Base):
    __tablename__ = "login" # Vérifie bien que ta table s'appelle 'login' dans pgAdmin et pas 'utilisateurs'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe = Column(String, nullable=False) # CHANGÉ : mot_de_passe au lieu de password
    role = Column(String, default="member")
    entreprise_id = Column(Integer, nullable=True) # AJOUTÉ pour correspondre à ta base

# Cette ligne demande à SQLAlchemy de créer la table dans pgAdmin si elle n'existe pas encore
Base.metadata.create_all(bind=engine)

# ==========================================
# 2. INITIALISATION DE FASTAPI
# ==========================================
app = FastAPI()

# Configuration CORS pour autoriser Next.js (sur le port 3000) à parler à FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fonction pour ouvrir et fermer proprement la connexion à la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 3. LA ROUTE API : /login
# ==========================================
SECRET_KEY = "cle_secrete_archonec_2026" # Clé pour signer les tokens (à garder secrète)

# Ce que l'API s'attend à recevoir de Next.js
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. On cherche l'utilisateur par son email dans la table Login
    user = db.query(Login).filter(Login.email == request.email).first()
    
    # Si l'email n'existe pas dans la table
    if not user:
        raise HTTPException(status_code=401, detail="Email incorrect")

    # 2. On compare DIRECTEMENT le mot de passe tapé avec celui de la base
    if user.mot_de_passe != request.password:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # 3. Si c'est bon, on crée le jeton d'accès (Token JWT)
    expiration = datetime.utcnow() + timedelta(hours=2)
    token_data = {
        "sub": user.email,
        "role": user.role,
        "exp": expiration
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")

    # 4. On renvoie la réponse au frontend React
    return {
        "ok": True,
        "token": token,
        "user": {
            "email": user.email,
            "role": user.role
        }
    }
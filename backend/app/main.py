from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db.session import engine, Base, get_db
from .models.login import Login
from .schemas.login import LoginRequest
from .core.security import create_access_token

# Création des tables dans la base de données
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ADH-RANT API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API ADH-RANT is running"}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Email incorrect")

    if user.mot_de_passe != request.password:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # Création du token
    token_data = {
        "sub": user.email,
        "role": user.role,
    }
    token = create_access_token(data=token_data)

    return {
        "ok": True,
        "token": token,
        "user": {
            "email": user.email,
            "role": user.role
        }
    }

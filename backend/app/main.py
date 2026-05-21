from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import traceback
import os
from dotenv import load_dotenv

load_dotenv(override=True)

from .db.session import engine, Base, get_db
from .models.login import Login
from .models.document import Document
from .models.entreprise import Entreprise
from .models.inscription import DemandeInscription
from .models.adherent import Adherent
from .models.carte import CarteAdherent
from .models.renouvellement import Renouvellement
# Nouveaux modèles (tables déjà existantes en DB)
from .models.famille import Famille
from .models.activite import Activite
from .models.effectif import Effectif
from .models.ca import CA
from .models.forme_juridique import FormeJuridique
from .models.marque import Marque
from .models.ville import Ville
from .models.pays import Pays
from .models.exportation import Exportation
from .models.importation import Importation
from .models.fonction import Fonction
from .models.dirigeant import Dirigeant
from .models.entreprise_activite import EntrepriseActivite
from .models.entreprise_dirigeant import EntrepriseDirigeant
# Nouvelles tables à créer
from .models.evenement import Evenement
from .models.participation import Participation
from .models.notification import Notification
from .models.adhesion import Adhesion
from .models.communication import Communication
from .models.finance import Fournisseur, Depense
from .schemas.login import LoginRequest
from .core.security import create_access_token

from .api import endpoints_admin, finance, communication as communication_api

# Création des tables dans la base de données
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ADH-RANT API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    os.makedirs("temp_attachments", exist_ok=True)
    with open("temp_attachments/last_error.log", "w", encoding="utf-8") as f:
        traceback.print_exception(type(exc), exc, exc.__traceback__, file=f)
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )


# Configuration des fichiers statiques pour les documents uploadés
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import event as event_router
from .routers import adherent as adherent_router
from .routers import document as document_router

app.include_router(event_router.router, prefix="/api/events", tags=["Events"])
app.include_router(adherent_router.router, prefix="/api", tags=["Adhérents"])
app.include_router(document_router.router, prefix="/api", tags=["Documents"])
app.include_router(endpoints_admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(communication_api.router, prefix="/api/communication", tags=["Communication"])

@app.get("/")
def read_root():
    return {"message": "API ADH-RANT is running"}

@app.post("/api/login")
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
        "entreprise_id": user.entreprise_id,
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

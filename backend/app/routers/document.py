from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import shutil
import os
import uuid
from ..db.session import get_db
from ..models.document import Document
from ..schemas.document import DocumentResponse
from ..core.security import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/me", response_model=List[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        return []
        
    documents = db.query(Document).filter(Document.entreprise_id == entreprise_id).all()
    
    # Mapping vers DocumentResponse attendu par le frontend
    return [
        DocumentResponse(
            id=doc.id,
            name=doc.nom_fichier,
            category=doc.categorie or "Général",
            type=doc.type_document or "N/A",
            size=doc.taille,
            url=doc.chemin_fichier,
            created_at=doc.date_importation
        ) for doc in documents
    ]

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    name: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")

    # Ensure uploads directory exists
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Calculate size
    file_size = os.path.getsize(file_path)
    size_str = f"{file_size / (1024*1024):.1f} MB" if file_size > 1024*1024 else f"{file_size / 1024:.1f} KB"

    # Create DB record using current model columns
    new_doc = Document(
        entreprise_id=entreprise_id,
        nom_fichier=name,
        categorie=category,
        type_document=file_ext.replace('.', '').upper(),
        taille=size_str,
        chemin_fichier=f"/uploads/{unique_filename}",
        date_importation=datetime.utcnow()
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return DocumentResponse(
        id=new_doc.id,
        name=new_doc.nom_fichier,
        category=new_doc.categorie,
        type=new_doc.type_document,
        size=new_doc.taille,
        url=new_doc.chemin_fichier,
        created_at=new_doc.date_importation
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    entreprise_id = current_user.get("entreprise_id")
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Compte non lié à une entreprise")
        
    doc = db.query(Document).filter(Document.id == document_id, Document.entreprise_id == entreprise_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé ou accès refusé")
    
    try:
        file_path = doc.chemin_fichier.replace('/uploads/', 'uploads/')
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")

    db.delete(doc)
    db.commit()
    
    return {"message": "Document supprimé"}

from sqlalchemy import Column, String, Integer, Date, Float, ForeignKey
from ..db.session import Base

class Renouvellement(Base):
    __tablename__ = "renouvellement"
    
    id = Column(Integer, primary_key=True, index=True)
    annee = Column(Integer, nullable=True)             # Nouvelle colonne (diagramme final)
    annee_fiscale = Column(Integer, nullable=True)     # Gardée pour compatibilité ascendante
    date_paiement = Column(Date, nullable=True)
    montant = Column(Float, nullable=True)
    mode_paiement = Column(String, nullable=True)      # virement, chèque, espèces
    statut = Column(String, default="attente_docs")      # attente_docs, docs_approuves, refuser
    statut_paiement = Column(String, default="en attente")  # en attente, payé, validé
    preuve_paiement = Column(String, nullable=True)        # Chemin vers le reçu (virement/chèque)
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)
    type_adherent = Column(String, nullable=True)          # "Physique" ou "Moral"

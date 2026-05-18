from sqlalchemy import Column, String, Integer, Date, Float, ForeignKey
from ..db.session import Base

class CarteAdherent(Base):
    __tablename__ = "carte_adherent"
    
    id = Column(Integer, primary_key=True, index=True)
    date_expiration = Column(Date, nullable=True)
    date_emission = Column(Date, nullable=True)
    numero_carte = Column(String, unique=True, index=True, nullable=True)
    statut_paiement = Column(String, nullable=True)    # payé, en attente
    statut = Column(String, default="active")          # active, expiré, perdu
    mode_paiement = Column(String, nullable=True)      # virement, chèque, espèces
    numero_relance = Column(Integer, default=0)        # Nombre de relances envoyées
    entreprise_id = Column(Integer, ForeignKey("entreprise.id"), nullable=True)
    montant_paye = Column(Float, nullable=True)
    renouvellement_id = Column(Integer, ForeignKey("renouvellement.id"), nullable=True)

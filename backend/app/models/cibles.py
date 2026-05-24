"""
Modèles pour les cibles de communication — schéma réel de gestion_adherent.
Colonnes réelles : id (PK), titre, sous_type_id (NOT NULL), actif, created_at
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DateTime, Text, Date, Float
from datetime import datetime
from ..db.session import Base


# ─── Tables sous-types ────────────────────────────────────────────────────────

class SousTypePublication(Base):
    __tablename__ = "sous_type_publication"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)

class SousTypeFormation(Base):
    __tablename__ = "sous_type_formation"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)

class SousTypeProspection(Base):
    __tablename__ = "sous_type_prospection"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)

class SousTypeAssistance(Base):
    __tablename__ = "sous_type_assistance"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)

class SousTypeGuichet(Base):
    __tablename__ = "sous_type_guichet"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)

class SousTypeLocation(Base):
    __tablename__ = "sous_type_location"
    id          = Column(Integer, primary_key=True, index=True)
    libelle     = Column(String, nullable=False)


# ─── Tables principales de cibles ────────────────────────────────────────────

class Publication(Base):
    __tablename__ = "publication"

    id           = Column(Integer, primary_key=True, index=True)
    titre        = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_publication.id"), nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    # Compatibilité avec l'ancien code qui utilise .nom
    @property
    def nom(self):
        return self.titre

    @nom.setter
    def nom(self, value):
        self.titre = value


class Formation(Base):
    __tablename__ = "formation"

    id           = Column(Integer, primary_key=True, index=True)
    titre        = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_formation.id"), nullable=True)
    date_debut   = Column(Date, nullable=True)
    date_fin     = Column(Date, nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    @property
    def nom(self):
        return self.titre

    @nom.setter
    def nom(self, value):
        self.titre = value


class Prospection(Base):
    __tablename__ = "prospection"

    id           = Column(Integer, primary_key=True, index=True)
    titre        = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    lieu         = Column(String, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_prospection.id"), nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    @property
    def nom(self):
        return self.titre

    @nom.setter
    def nom(self, value):
        self.titre = value


class AssistanceTPE(Base):
    __tablename__ = "assistance_tpe"

    id           = Column(Integer, primary_key=True, index=True)
    titre        = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_assistance.id"), nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    @property
    def nom(self):
        return self.titre

    @nom.setter
    def nom(self, value):
        self.titre = value


class Guichet(Base):
    __tablename__ = "guichet"

    id           = Column(Integer, primary_key=True, index=True)
    titre        = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_guichet.id"), nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    @property
    def nom(self):
        return self.titre

    @nom.setter
    def nom(self, value):
        self.titre = value


class LocationSalles(Base):
    __tablename__ = "location_salles"

    id           = Column(Integer, primary_key=True, index=True)
    nom_salle    = Column(String, nullable=False)   # nom réel dans la DB
    description  = Column(Text, nullable=True)
    capacite     = Column(Integer, nullable=True)
    localisation = Column(String, nullable=True)
    sous_type_id = Column(Integer, ForeignKey("sous_type_location.id"), nullable=True)
    actif        = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    # Compatibilité : l'ancien code utilise .nom et la colonne titre
    @property
    def nom(self):
        return self.nom_salle

    @nom.setter
    def nom(self, value):
        self.nom_salle = value

    @property
    def titre(self):
        return self.nom_salle

    @titre.setter
    def titre(self, value):
        self.nom_salle = value

"""
Modèles pour les cibles de communication :
- Publication, Formation, Prospection, AssistanceTPE, Guichet, LocationSalles
Chaque table principale contient des éléments (sous-catégories).
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DateTime
from datetime import datetime
from ..db.session import Base


class Publication(Base):
    __tablename__ = "publication"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)


class Formation(Base):
    __tablename__ = "formation"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)


class Prospection(Base):
    __tablename__ = "prospection"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)


class AssistanceTPE(Base):
    __tablename__ = "assistance_tpe"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)


class Guichet(Base):
    __tablename__ = "guichet"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)


class LocationSalles(Base):
    __tablename__ = "location_salles"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    capacite = Column(Integer, nullable=True)
    actif = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

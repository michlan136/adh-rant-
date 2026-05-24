# -*- coding: utf-8 -*-
"""
Script de migration pour :
1. Creer les nouvelles tables (publication, formation, prospection, assistance_tpe, guichet, location_salles)
2. Etendre la table participation avec les nouvelles colonnes FK
3. Inserer les donnees de reference dans chaque table

Usage : cd backend && python migrate_cibles.py
"""

import sys
import os
import io

# Force UTF-8 sur la console Windows (evite UnicodeEncodeError)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import engine, Base, get_db

# Import ALL models so Base.metadata is aware of them
from app.models.login import Login
from app.models.document import Document
from app.models.entreprise import Entreprise
from app.models.inscription import DemandeInscription
from app.models.adherent import Adherent
from app.models.carte import CarteAdherent
from app.models.renouvellement import Renouvellement
from app.models.famille import Famille
from app.models.activite import Activite
from app.models.effectif import Effectif
from app.models.ca import CA
from app.models.forme_juridique import FormeJuridique
from app.models.marque import Marque
from app.models.ville import Ville
from app.models.pays import Pays
from app.models.exportation import Exportation
from app.models.importation import Importation
from app.models.fonction import Fonction
from app.models.dirigeant import Dirigeant
from app.models.entreprise_activite import EntrepriseActivite
from app.models.entreprise_dirigeant import EntrepriseDirigeant
from app.models.evenement import Evenement
from app.models.notification import Notification
from app.models.adhesion import Adhesion
from app.models.communication import Communication
from app.models.finance import Fournisseur, Depense
# Nouveaux modeles cibles
from app.models.cibles import Publication, Formation, Prospection, AssistanceTPE, Guichet, LocationSalles
# Participation (etendue)
from app.models.participation import Participation


def run_migration():
    print("=== Migration des tables cibles ===")

    with engine.connect() as conn:
        # -- Etape 1 : Creer les nouvelles tables cibles
        print("\n[1/3] Creation des nouvelles tables...")
        Base.metadata.create_all(bind=engine)
        print("  OK Tables creees (publication, formation, prospection, assistance_tpe, guichet, location_salles)")

        # -- Etape 2 : Ajouter les colonnes manquantes a la table participation
        print("\n[2/3] Extension de la table participation...")
        new_columns = [
            ("formation_id", "INTEGER REFERENCES formation(id) ON DELETE SET NULL"),
            ("prospection_id", "INTEGER REFERENCES prospection(id) ON DELETE SET NULL"),
            ("publication_id", "INTEGER REFERENCES publication(id) ON DELETE SET NULL"),
            ("assistance_tpe_id", "INTEGER REFERENCES assistance_tpe(id) ON DELETE SET NULL"),
            ("guichet_id", "INTEGER REFERENCES guichet(id) ON DELETE SET NULL"),
            ("location_salles_id", "INTEGER REFERENCES location_salles(id) ON DELETE SET NULL"),
            ("type_cible", "VARCHAR"),
            ("date_creation", "TIMESTAMP DEFAULT NOW()"),
            ("notes", "VARCHAR"),
        ]
        for col_name, col_def in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE participation ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
                print(f"  OK Colonne '{col_name}' ajoutee (ou deja presente)")
            except Exception as e:
                print(f"  WARN Colonne '{col_name}' : {e}")

        conn.commit()
        print("  OK Table participation etendue")

        # -- Etape 3 : Inserer les donnees de reference
        print("\n[3/3] Insertion des donnees de reference...")

        data = {
            "publication": [
                "Flash info",
                "Enconews",
                "Massa Souss Iktissad",
                "Annuaire pro",
            ],
            "formation": [
                "Cycle court",
                "Cycle long",
            ],
            "prospection": [
                "BtoB",
                "Delegation etrangere",
                "Calendrier foires",
                "Opportunite",
                "Mission a l'etranger",
            ],
            "assistance_tpe": [
                "Aide au montage",
                "Aide demarrage",
                "Diagnostic",
            ],
            "guichet": [
                "ASMEX",
                "Maroc PME",
                "Dar Al Moukawil",
                "OMPIC",
                "ISM",
                "Centre de mediation",
            ],
            "location_salles": [
                "Amphitheatre",
                "Salle polyvalente",
                "Salle conference",
                "Salle formation",
                "Salle exposition",
            ],
        }

        for table_name, elements in data.items():
            for nom in elements:
                try:
                    conn.execute(
                        text(f"INSERT INTO {table_name} (nom, actif) VALUES (:nom, true) ON CONFLICT (nom) DO NOTHING"),
                        {"nom": nom}
                    )
                    print(f"  OK [{table_name}] '{nom}'")
                except Exception as e:
                    print(f"  WARN [{table_name}] '{nom}' : {e}")

        conn.commit()
        print("\n=== Migration terminee avec succes ===")


if __name__ == "__main__":
    run_migration()

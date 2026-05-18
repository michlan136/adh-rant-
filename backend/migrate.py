"""
Script de migration : ajoute les colonnes/tables manquantes sans toucher aux données existantes.
"""
from app.db.session import engine
from sqlalchemy import text

migrations = [
    # 1. Ajouter colonne services_demandes dans demande_inscription
    """
    DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='demande_inscription' AND column_name='services_demandes'
        ) THEN
            ALTER TABLE demande_inscription ADD COLUMN services_demandes TEXT;
            RAISE NOTICE 'Colonne services_demandes ajoutee';
        ELSE
            RAISE NOTICE 'Colonne services_demandes existe deja';
        END IF;
    END $$;
    """,
    
    # 2. Créer table evenement si elle n'existe pas
    """
    CREATE TABLE IF NOT EXISTS evenement (
        id SERIAL PRIMARY KEY,
        titre VARCHAR NOT NULL,
        date_evenement DATE NOT NULL,
        heure_debut TIME,
        heure_fin TIME,
        categorie VARCHAR,
        lieu VARCHAR,
        description TEXT,
        places_limitees INTEGER
    );
    """,
    
    # 3. Créer table communication si elle n'existe pas
    """
    CREATE TABLE IF NOT EXISTS communication (
        id SERIAL PRIMARY KEY,
        titre VARCHAR NOT NULL,
        canal VARCHAR,
        contenu TEXT,
        date_envoi TIMESTAMP DEFAULT NOW(),
        evenement_id INTEGER REFERENCES evenement(id),
        destinataires_ids TEXT,
        nombre_destinataires INTEGER DEFAULT 0,
        statut_ou_metrique VARCHAR
    );
    """,
    
    # 4. Créer table notification si elle n'existe pas
    """
    CREATE TABLE IF NOT EXISTS notification (
        id SERIAL PRIMARY KEY,
        titre VARCHAR NOT NULL,
        est_lu BOOLEAN DEFAULT FALSE,
        message VARCHAR NOT NULL,
        type_notif VARCHAR,
        date_creation TIMESTAMP DEFAULT NOW(),
        entreprise_id INTEGER REFERENCES entreprise(id)
    );
    """,
    
    # 5. Créer table participation si elle n'existe pas
    """
    CREATE TABLE IF NOT EXISTS participation (
        id SERIAL PRIMARY KEY,
        entreprise_id INTEGER NOT NULL REFERENCES entreprise(id),
        evenement_id INTEGER NOT NULL REFERENCES evenement(id),
        date_inscription DATE,
        statut VARCHAR DEFAULT 'inscrit'
    );
    """,
]

with engine.connect() as conn:
    for i, sql in enumerate(migrations, 1):
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"Migration {i} OK")
        except Exception as e:
            conn.rollback()
            print(f"Migration {i} ERREUR: {e}")

print("\nMigration terminee.")

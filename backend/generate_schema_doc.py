import os
import sys
from sqlalchemy import create_engine, text

# Get database connection
fallback_url = "postgresql://postgres.xkrutionxnzqkthowair:E6%40ZFb!Ra.e3JYb@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", fallback_url)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def generate_markdown_schema():
    query_tables = """
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
    """
    
    query_columns = """
    SELECT 
        c.column_name, 
        c.data_type, 
        c.is_nullable,
        c.column_default,
        (SELECT tc.constraint_type 
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu 
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         WHERE tc.table_name = c.table_name 
           AND kcu.column_name = c.column_name
           AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
         LIMIT 1) as constraint_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = :table_name
    ORDER BY c.ordinal_position;
    """

    markdown = "# Schéma Complet de la Base de Données (Production)\n\n"
    markdown += "Ce document contient la structure détaillée de toutes les tables de la base de données PostgreSQL.\n\n"

    with engine.connect() as conn:
        tables = [row[0] for row in conn.execute(text(query_tables))]
        
        for table in tables:
            markdown += f"## Table : `{table}`\n\n"
            markdown += "| Colonne | Type de données | Nullable | Valeur par défaut | Contrainte |\n"
            markdown += "| --- | --- | --- | --- | --- |\n"
            
            columns = conn.execute(text(query_columns), {"table_name": table}).fetchall()
            for col in columns:
                col_name, data_type, nullable, default, constraint = col
                default_val = default if default else "Aucune"
                constraint_val = f"**{constraint}**" if constraint else "Aucune"
                markdown += f"| `{col_name}` | {data_type} | {nullable} | `{default_val}` | {constraint_val} |\n"
            
            markdown += "\n---\n\n"

    # Save to artifacts directory
    artifact_path = r"C:\Users\soula\.gemini\antigravity\brain\d9e7fc20-08e8-4b03-9dd6-f79cf727a047\database_schema.md"
    with open(artifact_path, "w", encoding="utf-8") as f:
        f.write(markdown)
    
    print(f"Schema markdown generated at: {artifact_path}")

if __name__ == "__main__":
    generate_markdown_schema()

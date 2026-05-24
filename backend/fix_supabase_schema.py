import psycopg2
from app.db.session import Base
from app.models.entreprise import Entreprise
from app.models.renouvellement import Renouvellement
from app.models.evenement import Evenement
from app.models.communication import Communication
from app.models.demande_inscription import DemandeInscription
from app.models.login import Login
from app.models.carte import CarteAdherent
from sqlalchemy import create_engine, inspect

try:
    print("Connecting to Supabase to check schema differences...")
    engine = create_engine("postgresql://postgres.ommmxnuntsithzzmcenp:E6%40ZFb%21Ra.e3JYb@aws-1-eu-central-1.pooler.supabase.com:6543/postgres")
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        for model in [Entreprise, Renouvellement, Evenement, Communication, DemandeInscription, Login, CarteAdherent]:
            table_name = model.__tablename__
            print(f"\nChecking table: {table_name}")
            
            # Get columns in DB
            db_cols = {c['name']: c['type'] for c in inspector.get_columns(table_name)}
            
            # Get columns in Model
            model_cols = model.__table__.columns
            
            for col in model_cols:
                col_name = col.name
                if col_name not in db_cols:
                    print(f"  [MISSING] Column {col_name} ({col.type}) is missing in DB table {table_name}")
                    # Attempt to add the column automatically
                    col_type_str = "VARCHAR(255)"
                    if str(col.type).startswith("VARCHAR"):
                        col_type_str = str(col.type)
                    elif str(col.type) == "INTEGER":
                        col_type_str = "INTEGER"
                    elif str(col.type) == "FLOAT":
                        col_type_str = "FLOAT"
                    elif str(col.type) == "DATE":
                        col_type_str = "DATE"
                    elif str(col.type) == "BOOLEAN":
                        col_type_str = "BOOLEAN"
                    elif str(col.type) == "TEXT":
                        col_type_str = "TEXT"
                        
                    alter_query = f'ALTER TABLE "{table_name}" ADD COLUMN "{col_name}" {col_type_str};'
                    print(f"  Running: {alter_query}")
                    try:
                        conn.execute(psycopg2.sql.SQL(alter_query) if hasattr(psycopg2, 'sql') else alter_query)
                        conn.commit()
                        print("  [SUCCESS] Column added!")
                    except Exception as err:
                        print(f"  [FAILED] to add column: {err}")
                else:
                    print(f"  [OK] Column {col_name} exists")
                    
except Exception as e:
    print("Error:", e)

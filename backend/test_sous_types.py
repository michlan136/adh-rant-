import psycopg2

conn = psycopg2.connect("dbname=gestion_adherent user=postgres password=root host=localhost")
cur = conn.cursor()

tables = [
    "sous_type_publication", 
    "sous_type_formation", 
    "sous_type_prospection", 
    "sous_type_assistance", 
    "sous_type_guichet", 
    "sous_type_location"
]

for table in tables:
    print(f"\n--- {table} ---")
    cur.execute(f"SELECT id, libelle FROM {table}")
    rows = cur.fetchall()
    for r in rows:
        print(r)

conn.close()

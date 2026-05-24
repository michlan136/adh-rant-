import psycopg2

conn = psycopg2.connect("dbname=gestion_adherent user=postgres password=root host=localhost")
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE entreprise ADD COLUMN rc VARCHAR(255);")
    conn.commit()
    print("Column added")
except Exception as e:
    print(e)
finally:
    conn.close()

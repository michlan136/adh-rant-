
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE document ADD COLUMN renouvellement_id INTEGER'))
        conn.commit()
        print('Column renouvellement_id added to document table.')
    except Exception as e:
        print(f'Error or column already exists: {e}')

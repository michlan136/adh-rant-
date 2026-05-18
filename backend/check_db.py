
from app.db.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)

print("--- Table: renouvellement ---")
columns = inspector.get_columns("renouvellement")
for col in columns:
    print(f"Column: {col['name']} ({col['type']})")

print("\n--- Table: document ---")
columns = inspector.get_columns("document")
for col in columns:
    print(f"Column: {col['name']} ({col['type']})")

import sys
sys.path.append(r"C:\stage_projet\backend")

from app.db.session import SessionLocal
from app.api.endpoints_admin import get_dashboard_stats

db = SessionLocal()
try:
    stats = get_dashboard_stats(db)
    print("Success:", stats)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()

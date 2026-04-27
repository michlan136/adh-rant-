from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:Hecd1106@localhost:5000/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Login(Base):
    __tablename__ = "login"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe = Column(String, nullable=False)
    role = Column(String, default="member")

def check_users():
    db = SessionLocal()
    users = db.query(Login).all()
    print(f"Nombre d'utilisateurs: {len(users)}")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, Pass: {user.mot_de_passe}")
    db.close()

if __name__ == "__main__":
    try:
        check_users()
    except Exception as e:
        print(f"Erreur: {e}")

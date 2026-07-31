from auth import pwd_context
from database import SessionLocal
from models import User

DEMO_EMAIL = "engineer@intellifra.com"
DEMO_PASSWORD = "demo123"
DEMO_NAME = "Engineer"


def seed_demo_user() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        hashed = pwd_context.hash(DEMO_PASSWORD)
        if user:
            user.name = DEMO_NAME
            user.password = hashed
        else:
            db.add(User(name=DEMO_NAME, email=DEMO_EMAIL, password=hashed))
        db.commit()
    finally:
        db.close()

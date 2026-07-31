from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import Base, engine
from routes.auth_routes import router as auth_router
from routes.fra_routes import router as fra_router
from seed import seed_demo_user

Base.metadata.create_all(bind=engine)
seed_demo_user()
with engine.begin() as conn:
    cols = [r[1] for r in conn.execute(text("PRAGMA table_info(fra_results)")).fetchall()]
    if "created_at" not in cols:
        conn.execute(text("ALTER TABLE fra_results ADD COLUMN created_at DATETIME"))

app = FastAPI(title="IntelliFRA API", version="0.1.0")

# React dev server (Vite) default:
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(fra_router, prefix="/fra", tags=["fra"])


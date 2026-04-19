"""
main.py — TIV-HE (Trustless Identity Verification using Homomorphic Encryption)
FastAPI application entry point.

Startup sequence:
  1. Create all DB tables (SQLAlchemy).
  2. Seed default users.
  3. Register routes.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import Base, engine, SessionLocal, ensure_db_schema
from routes import auth, admin, issuer, holder, verifier
from services.seed_service import seed_database


# ── Lifespan: runs on startup / shutdown ───────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist yet
    # Base.metadata.drop_all(bind=engine) #Comment this line
    Base.metadata.create_all(bind=engine)
    ensure_db_schema(engine)
    print("[startup] Database tables created / verified")

    # Seed default users
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    print("[startup] TIV-HE backend ready")
    yield
    # (shutdown logic goes here if needed)


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "TIV-HE — Trustless Identity Verification",
    description = "Privacy-preserving identity verification using encryption & simulated blockchain.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# Allow origins from environment configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins     = CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Register routers ───────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(admin.router, prefix="/api/v1", tags=["Admin"])
app.include_router(issuer.router, prefix="/api/v1", tags=["Issuer"])
app.include_router(holder.router, prefix="/api/v1", tags=["Holder"])
app.include_router(verifier.router, prefix="/api/v1", tags=["Verifier"])


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "project": "TIV-HE"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

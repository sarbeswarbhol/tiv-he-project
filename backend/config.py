"""
config.py — Load all runtime configuration from environment variables.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env from same directory as config.py
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=env_path)

# ── Security (required) ─────────────────
JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
TOKEN_SIGNING_SECRET = os.environ["TOKEN_SIGNING_SECRET"]
FERNET_KEY = os.environ["FERNET_KEY"]

# ── Database ────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")

PGHOST = os.getenv("PGHOST")
PGUSER = os.getenv("PGUSER")
PGPASSWORD = os.getenv("PGPASSWORD")
PGDATABASE = os.getenv("PGDATABASE")

# ── App Config ──────────────────────────
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

# ── Validation ──────────────────────────
if not DATABASE_URL and not all([PGHOST, PGUSER, PGPASSWORD, PGDATABASE]):
    raise RuntimeError(
        "Either DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE must be set"
    )
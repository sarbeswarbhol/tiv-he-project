"""
database.py — SQLAlchemy engine + session setup for Neon PostgreSQL (SSL required).
"""

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import DATABASE_URL as CONFIG_DATABASE_URL, PGHOST, PGUSER, PGPASSWORD, PGDATABASE

# ── Connection config ──────────────────────────────────────────────────────────
DATABASE_URL = CONFIG_DATABASE_URL
if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql+psycopg2://{PGUSER}:{PGPASSWORD}"
        f"@{PGHOST}/{PGDATABASE}"
        f"?sslmode=require"
    )

# ── Engine (connection pool + SSL) ─────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # detect stale connections
    pool_size=5,
    max_overflow=10,
    echo=False,           # set True to log SQL for debugging
)

# ── Session factory ────────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base class for all models ──────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


def ensure_db_schema(engine):
    """Repair existing tables by adding any missing columns required by the ORM."""
    inspector = inspect(engine)

    if inspector.has_table("users"):
        user_columns = {col["name"] for col in inspector.get_columns("users")}
        if "created_at" not in user_columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP"
                    )
                )

    _normalize_userrole_enum(engine)
    _repair_manual_id_column(engine)


def _normalize_userrole_enum(engine):
    """Keep the existing userrole enum labels lowercase for app compatibility."""
    lower_values = {
        "ADMIN": "admin",
        "ISSUER": "issuer",
        "HOLDER": "holder",
        "VERIFIER": "verifier",
    }

    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_type WHERE typname = 'userrole'")
        ).scalar()
        if not exists:
            return

        current_labels = [
            row[0]
            for row in conn.execute(
                text(
                    "SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid "
                    "WHERE t.typname = 'userrole' ORDER BY e.enumsortorder"
                )
            )
        ]

        for old_label, new_label in lower_values.items():
            if old_label in current_labels and new_label not in current_labels:
                conn.execute(
                    text(
                        f"ALTER TYPE userrole RENAME VALUE '{old_label}' TO '{new_label}'"
                    )
                )
                current_labels.remove(old_label)
                current_labels.append(new_label)


def _repair_manual_id_column(engine):
    """Ensure credential manual_id can hold seeded values like TIV-EXPIRED."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                "SELECT character_maximum_length FROM information_schema.columns "
                "WHERE table_name = 'credentials' AND column_name = 'manual_id'"
            )
        ).fetchone()
        if not row:
            return

        max_len = row[0]
        if max_len is not None and max_len < 20:
            conn.execute(
                text(
                    "ALTER TABLE credentials ALTER COLUMN manual_id TYPE VARCHAR(20)"
                )
            )

def drop_all_tables():
    """⚠️ Drops ALL tables (data + structure). Use only in dev."""
    from models import Base  # import here to avoid circulars
    Base.metadata.drop_all(bind=engine)


def create_all_tables():
    """Recreate all tables from ORM models."""
    from models import Base
    Base.metadata.create_all(bind=engine)


def truncate_all_tables():
    """
    ⚠️ Deletes ALL rows but keeps table structure.
    Resets identity (auto-increment).
    Works for PostgreSQL.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE "
                "verification_logs, credentials, users "
                "RESTART IDENTITY CASCADE"
            )
        )

# ── FastAPI dependency ─────────────────────────────────────────────────────────
def get_db():
    """Yield a DB session; always close it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
services/seed_service.py — Insert default users and blockchain state on startup
+ print & persist access tokens for dev usage
"""

from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime

from models import User, AdminLog
from services import blockchain_service
from utils.id_generator import generate_role_id
from utils.jwt import create_access_token   # ✅ NEW

_pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# 📄 File to store tokens
TOKENS_FILE = Path("seed_tokens.txt")


# ── Seed users ─────────────────────────────────────────

_SEED_USERS = [
    {"name": "Admin",    "username": "admin",    "email": "admin@test.com",    "password": "admin123",    "role": "admin",    "is_approved": True},
    {"name": "Issuer",   "username": "issuer",   "email": "issuer@test.com",   "password": "issuer123",   "role": "issuer",   "is_approved": True},
    {"name": "Holder",   "username": "holder",   "email": "holder@test.com",   "password": "holder123",   "role": "holder",   "is_approved": True},
    {"name": "Verifier", "username": "verifier", "email": "verifier@test.com", "password": "verifier123", "role": "verifier", "is_approved": True},

    {"name": "Admin NA",    "username": "admin_na",    "email": "admin_na@test.com",    "password": "admin123",    "role": "admin",    "is_approved": False},
    {"name": "Issuer NA",   "username": "issuer_na",   "email": "issuer_na@test.com",   "password": "issuer123",   "role": "issuer",   "is_approved": False},
    {"name": "Holder NA",   "username": "holder_na",   "email": "holder_na@test.com",   "password": "holder123",   "role": "holder",   "is_approved": False},
    {"name": "Verifier NA", "username": "verifier_na", "email": "verifier_na@test.com", "password": "verifier123", "role": "verifier", "is_approved": False},
]


# ── Seed Function ───────────────────────────────────────

def seed_database(db: Session) -> None:

    # ✅ Start new run section
    with TOKENS_FILE.open("a", encoding="utf-8") as f:
        f.write("\n" + "=" * 60 + "\n")
        f.write(f"SEED RUN @ {datetime.now()}\n")
        f.write("=" * 60 + "\n")

    for data in _SEED_USERS:
        user = db.query(User).filter(User.email == data["email"]).first()

        if not user:
            is_approved = data.get("is_approved", True)
            status_value = "approved" if is_approved else "pending"

            user = User(
                public_id=generate_role_id(data["role"]),
                name=data["name"],
                username=data["username"],
                email=data["email"],
                password_hash=_pwd.hash(data["password"]),
                role=data["role"],
                is_approved=is_approved,
                status=status_value,
            )

            db.add(user)
            db.flush()

            # ✅ Generate access token
            access_token = create_access_token({
                "sub": str(user.id),
                "role": user.role
            })

            # ✅ Console output
            print("\n[seed] User Created:")
            print(f"  email: {data['email']}")
            print(f"  password: {data['password']}")
            print(f"  role: {user.role}")
            print(f"  access_token: {access_token}\n")

            # ✅ Save to file
            with TOKENS_FILE.open("a", encoding="utf-8") as f:
                f.write(
                    f"email: {data['email']}\n"
                    f"password: {data['password']}\n"
                    f"role: {user.role}\n"
                    f"access_token: {access_token}\n"
                    f"{'-'*40}\n"
                )

            # ✅ Logs
            db.add(AdminLog(
                action="USER_REGISTERED",
                target_user_id=user.id,
                performed_by=user.id,
                details=f"{user.role} seeded"
            ))

            if user.status == "approved":
                db.add(AdminLog(
                    action="USER_APPROVED",
                    target_user_id=user.id,
                    performed_by=user.id,
                    details=f"{user.role} auto-approved (seed)"
                ))

        else:
            print(f"[seed] Already exists: {data['email']}")

    db.commit()

    # ── Blockchain seeding ───────────────────────────────

    issuer_user = db.query(User).filter(
        User.email == "issuer@test.com",
        User.status == "approved"
    ).first()

    if issuer_user:
        blockchain_service.add_issuer(issuer_user.id)

        db.add(AdminLog(
            action="ISSUER_ADDED",
            target_user_id=issuer_user.id,
            performed_by=issuer_user.id,
            details="Seeded issuer added to blockchain"
        ))

        db.commit()

        print(f"[seed] Blockchain: issuer id={issuer_user.id} marked as trusted")
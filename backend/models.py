"""
models.py — SQLAlchemy ORM models for TIV-HE.

Tables:
  - users
  - credentials
  - verification_tokens
  - verification_logs
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, JSON, String, text
)
from sqlalchemy.orm import relationship

from utils.id_generator import generate_credential_id
from database import Base


# ── Helpers ─────────────────────────────────────────────────────────────

def utcnow():
    return datetime.now(timezone.utc)


# ── User ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(String(20), nullable=False)  # admin / issuer / holder / verifier
    is_approved = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    profile_picture = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    issued_credentials = relationship(
        "Credential",
        foreign_keys="Credential.issuer_id",
        back_populates="issuer"
    )

    received_credentials = relationship(
        "Credential",
        foreign_keys="Credential.holder_id",
        back_populates="holder"
    )

    verification_logs = relationship(
        "VerificationLog",
        foreign_keys="VerificationLog.verifier_id",
        back_populates="verifier"
    )


# ── Credential ──────────────────────────────────────────────────────────

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    credential_id = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        default=generate_credential_id
    )
    hash_id = Column(String(64), unique=True, nullable=False, index=True)
    holder_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    issuer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    credential_type = Column(String(50), default="identity", nullable=False)
    encrypted_data = Column(JSON, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    holder = relationship(
        "User",
        foreign_keys=[holder_id],
        back_populates="received_credentials",
        lazy="joined"
    )

    issuer = relationship(
        "User",
        foreign_keys=[issuer_id],
        back_populates="issued_credentials",
        lazy="joined"
    )

    logs = relationship(
        "VerificationLog",
        back_populates="credential",
        cascade="all, delete-orphan",
        lazy="joined"
    )

    tokens = relationship(
        "VerificationToken",
        back_populates="credential",
        cascade="all, delete-orphan",
        lazy="joined"
    )


# ── Verification Token ─────────────────────────────────────────────────

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)

    credential_id = Column(
        Integer,
        ForeignKey("credentials.id"),
        nullable=False,
        index=True
    )

    manual_id = Column(String(6), unique=True, nullable=False, index=True)

    secure_token_hash = Column(String(255), nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    expires_at = Column(DateTime(timezone=True), nullable=False)

    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)

    status = Column(String(20), default="active", index=True)
    # active | expired | used

    # Relationship
    credential = relationship(
        "Credential",
        back_populates="tokens"
    )


# ── Verification Log ───────────────────────────────────────────────────

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)

    holder_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    verifier_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    credential_id = Column(
        Integer,
        ForeignKey("credentials.id"),
        nullable=False,
        index=True
    )

    manual_id = Column(String(6), nullable=False)

    condition = Column(String(500), nullable=True)

    result = Column(Boolean, nullable=False)

    timestamp = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    credential = relationship(
        "Credential",
        back_populates="logs"
    )

    verifier = relationship(
        "User",
        foreign_keys=[verifier_id],
        back_populates="verification_logs"
    )

    holder = relationship(
        "User",
        foreign_keys=[holder_id]
    )
    
    
    
class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    details = Column(String(255), nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    admin = relationship("User", foreign_keys=[performed_by])
    target_user = relationship("User", foreign_keys=[target_user_id])
    
class IssuerActionLog(Base):
    __tablename__ = "issuer_action_logs"

    id = Column(Integer, primary_key=True, index=True)

    issuer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    holder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credential_id = Column(Integer, ForeignKey("credentials.id"), nullable=False)

    action = Column(String(20), nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    issuer = relationship("User", foreign_keys=[issuer_id])
    holder = relationship("User", foreign_keys=[holder_id])
    credential = relationship("Credential")
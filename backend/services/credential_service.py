# services/credential_service.py

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Tuple

from sqlalchemy.orm import Session

from models import Credential, User, VerificationToken
from schemas import IssueCredentialRequest
from services.encryption_service import prepare_credential_data
from services import blockchain_service
from utils.id_generator import generate_credential_id, generate_manual_id
from utils.token_utils import create_secure_token


# Token validity
_TOKEN_LIFETIME_MINUTES = 3


# ── Helpers ───────────────────────────────────────────────────────────

def _unique_manual_id(db: Session, attempts: int = 10) -> str:
    for _ in range(attempts):
        mid = generate_manual_id()
        if not db.query(VerificationToken).filter(
            VerificationToken.manual_id == mid
        ).first():
            return mid
    raise RuntimeError("Failed to generate unique manual_id")


# ── Issue Credential ───────────────────────────────────────────────────

def issue_credential(
    db: Session,
    issuer: User,
    request: IssueCredentialRequest,
) -> Credential:

    if not issuer.is_approved:
        raise ValueError("Issuer is not approved")

    if not blockchain_service.is_trusted_issuer(issuer.id):
        raise ValueError("Issuer is not trusted on blockchain")

    holder_id = int(request.holder_id)

    holder = db.query(User).filter(
        User.id == holder_id,
        User.role == "holder",
        User.is_approved == True,
    ).first()

    if not holder:
        raise ValueError("Invalid holder")

    encrypted = prepare_credential_data(
        basic=request.basic.model_dump(),
        attributes=request.attributes.model_dump(),
        identifiers=request.identifiers.model_dump(),
    )

    credential_id = generate_credential_id()
    hash_id = hashlib.sha256(credential_id.encode()).hexdigest()

    cred = Credential(
        credential_id=credential_id,
        hash_id=hash_id,
        holder_id=holder.id,
        issuer_id=issuer.id,
        credential_type=request.credential_type,
        encrypted_data=encrypted,
        revoked=False,
        expires_at=datetime.now(timezone.utc) + timedelta(days=365),
    )

    db.add(cred)
    db.commit()
    db.refresh(cred)
    
    blockchain_service.anchor_credential(cred.hash_id)

    return cred

# ── Refresh Token ──────────────────────────────────────────────────────

def refresh_credential_token(
    db: Session,
    credential_id: str,
    holder: User,
) -> Tuple[Credential, str]:

    cred = db.query(Credential).filter(
        Credential.credential_id == credential_id,
        Credential.holder_id == holder.id,
        Credential.revoked == False,
    ).first()

    if not cred:
        raise ValueError("Credential not found")

    # Create NEW token
    manual_id = _unique_manual_id(db)

    secure_token = create_secure_token(cred.credential_id)
    token_hash = hashlib.sha256(secure_token.encode()).hexdigest()

    token = VerificationToken(
        credential_id=cred.id,
        manual_id=manual_id,
        secure_token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=_TOKEN_LIFETIME_MINUTES),
        is_used=False,
        attempt_count=0,
        max_attempts=3,
        status="active",
    )

    db.add(token)
    db.commit()
    db.refresh(token)

    return cred, secure_token


# ── Revoke Credential ──────────────────────────────────────────────────

def revoke_credential(db: Session, credential_id: str, issuer: User):

    cred = db.query(Credential).filter(
        Credential.credential_id == credential_id,
        Credential.issuer_id == issuer.id,
    ).first()

    if not cred:
        raise ValueError("Credential not found")

    cred.revoked = True

    # ✅ FIX: use hash_id instead of credential_id
    blockchain_service.revoke_credential(cred.hash_id)

    db.commit()
    return cred


# ── Fetch Helpers ──────────────────────────────────────────────────────

def get_holder_credentials(db: Session, holder_id: int):
    return db.query(Credential).filter(
        Credential.holder_id == holder_id
    ).all()


def get_issuer_credentials(db: Session, issuer_id: int):
    return db.query(Credential).filter(
        Credential.issuer_id == issuer_id
    ).all()
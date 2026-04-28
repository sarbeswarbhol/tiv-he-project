from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import Credential, User, VerificationLog, VerificationToken
from schemas import (
    CredentialSummary,
    HolderLogOut,
    UserOut,
    ShareLinkRequest,
    CredentialList,
    DefaultShareFieldsUpdate
)
from utils.id_generator import mask_identifier
from services.encryption_service import decrypt_dict, decrypt_value
from services import credential_service

router = APIRouter(prefix="/holder", tags=["Holder"])

_holder = Depends(require_role("holder"))


# ── My profile ─────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def my_profile(holder: User = _holder):
    return holder


# ── DEFAULT SHARE FIELDS (NEW FEATURE) ─────────────────

@router.get("/default-fields")
def get_default_fields(holder: User = _holder):
    return {
        "fields": holder.default_share_fields or []
    }


@router.put("/default-fields")
def update_default_fields(
    body: DefaultShareFieldsUpdate,
    db: Session = Depends(get_db),
    holder: User = _holder
):
    holder.default_share_fields = body.fields
    db.commit()
    db.refresh(holder)

    return {
        "message": "Default share fields updated",
        "fields": holder.default_share_fields
    }


# ── List credentials ───────────────────────────────────

@router.get("/credentials", response_model=list[CredentialList])
def list_credentials(db: Session = Depends(get_db), holder: User = _holder):

    creds = credential_service.get_holder_credentials(db, holder.id)
    return [
        {
            "credential_id": c.credential_id,
            "hash_id": c.hash_id,
            "credential_type": c.credential_type,
            "holder_id": holder.public_id,
            "issuer_id": c.issuer.public_id,
            "expires_at": c.expires_at,
            "created_at": c.created_at,
            "revoked": c.revoked,
        }
        for c in creds
    ]


# ── Single credential ──────────────────────────────────

@router.get("/credentials/{credential_id}", response_model=CredentialSummary)
def get_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    holder: User = _holder
):

    cred = db.query(Credential).filter(
        Credential.credential_id == credential_id,
        Credential.holder_id == holder.id
    ).first()

    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    data = decrypt_dict(cred.encrypted_data)

    print("Decrypted credential data:", data)
    masked_identifiers = {
        k: mask_identifier(k, decrypt_value(v))
        for k, v in data.get("identifiers", {}).items()
        if v is not None
    }

    return {
        "credential_id": cred.credential_id,
        "hash_id": cred.hash_id,
        "credential_type": cred.credential_type,
        "holder_id": holder.public_id,
        "issuer_id": cred.issuer.public_id,
        "expires_at": cred.expires_at,
        "created_at": cred.created_at,
        "revoked": cred.revoked,
        "masked_identifiers": masked_identifiers,
        "basic": data.get("basic", {}),
        "attributes": data.get("attributes", {}),
    }


# ── Refresh secure_token ───────────────────────────────

@router.post("/credentials/{credential_id}/refresh")
def refresh_token(
    credential_id: str,
    db: Session = Depends(get_db),
    holder: User = _holder
):
    try:
        cred, secure_token = credential_service.refresh_credential_token(
            db, credential_id, holder
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = (
        db.query(VerificationToken)
        .filter(VerificationToken.credential_id == cred.id)
        .order_by(VerificationToken.created_at.desc())
        .first()
    )

    return {
        "manual_id": token.manual_id,
        "secure_token": secure_token,
        "expires_at": token.expires_at,
    }


# ── CREATE SHARE LINK (UPDATED LOGIC) ─────────────────

@router.post("/credentials/{credential_id}/share-link")
def create_share_link(
    credential_id: str,
    body: ShareLinkRequest,
    db: Session = Depends(get_db),
    holder: User = _holder,
):
    # 1. Validate ownership
    cred = db.query(Credential).filter(
        Credential.credential_id == credential_id,
        Credential.holder_id == holder.id
    ).first()

    if not cred:
        raise HTTPException(404, "Credential not found")

    # 2. Decide fields (🔥 NEW LOGIC)
    if body.fields:
        fields = body.fields
    elif holder.default_share_fields:
        fields = holder.default_share_fields
    else:
        fields = ["full_name"]  # safe fallback

    # 3. Generate token
    cred, secure_token = credential_service.refresh_credential_token(
        db, credential_id, holder
    )

    token = (
        db.query(VerificationToken)
        .filter(VerificationToken.credential_id == cred.id)
        .order_by(VerificationToken.created_at.desc())
        .first()
    )

    # 4. Encode payload
    import json, base64

    payload = {
        "fields": fields,
        "conditions": body.conditions
    }

    encoded = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).decode()

    # 5. Create link
    link = f"/verifier/verify-link?token={secure_token}&data={encoded}"

    return {
        "verification_link": link,
        "expires_at": token.expires_at,
        "shared_fields": fields,
        "conditions": body.conditions
    }


# ── Verification history ───────────────────────────────

@router.get("/logs", response_model=list[HolderLogOut])
def my_verification_logs(db: Session = Depends(get_db), holder: User = _holder):

    logs = db.query(VerificationLog).filter(
        VerificationLog.holder_id == holder.id
    ).order_by(VerificationLog.timestamp.desc()).all()

    return [
        {
            "credential_id": log.credential.credential_id,
            "verified_by": log.verifier.public_id,
            "condition": log.condition,
            "result": log.result,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User, Credential, IssuerActionLog
from schemas import (
    CredentialIssued,
    CredentialSummary,
    IssueCredentialRequest,
    CredentialList,
    IssuerLogOut
)
from services import credential_service
from utils.db_helpers import get_user_by_public_id


router = APIRouter(prefix="/issuer", tags=["Issuer"])
_issuer = Depends(require_role("issuer"))


# ── Issue credential ─────────────────────────────

@router.post("/issue", response_model=CredentialIssued, status_code=status.HTTP_201_CREATED)
def issue_credential(
    body: IssueCredentialRequest,
    db: Session = Depends(get_db),
    issuer: User = _issuer,
):
    holder = get_user_by_public_id(db, body.holder_id)
    if not holder:
        raise HTTPException(status_code=400, detail="Invalid holder public_id")

    body.holder_id = holder.id
    cred = credential_service.issue_credential(db, issuer, body)

    # ✅ LOG ISSUE
    log = IssuerActionLog(
        issuer_id=issuer.id,
        holder_id=holder.id,
        credential_id=cred.id,
        action="issued",
    )
    db.add(log)
    db.commit()

    return CredentialIssued(
        credential_id=cred.credential_id,
        hash_id=cred.hash_id,
        credential_type=cred.credential_type,
        holder_id=holder.public_id,
        expires_at=cred.expires_at,
    )


# ── List issued credentials ─────────────────────

@router.get("/credentials", response_model=list[CredentialSummary])
def list_issued(db: Session = Depends(get_db), issuer: User = _issuer):
    creds = credential_service.get_issuer_credentials(db, issuer.id)

    return [
        {
            "credential_id": c.credential_id,
            "hash_id": c.hash_id,
            "credential_type": c.credential_type,
            "revoked": c.revoked,
            "expires_at": c.expires_at,
            "created_at": c.created_at,
            "issuer_id": issuer.public_id,
            "holder_id": c.holder.public_id,
        }
        for c in creds
    ]


# ── Revoke credential ───────────────────────────

@router.post("/revoke/{credential_id}")
def revoke(credential_id: str, db: Session = Depends(get_db), issuer: User = _issuer):
    try:
        cred = credential_service.revoke_credential(db, credential_id, issuer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # ✅ LOG REVOKE
    log = IssuerActionLog(
        issuer_id=issuer.id,
        holder_id=cred.holder_id,
        credential_id=cred.id,
        action="revoked",
    )
    db.add(log)
    db.commit()

    return {"message": f"Credential {cred.credential_id} revoked successfully"}


# ── Get single credential ───────────────────────

@router.get("/credentials/{credential_id}", response_model=CredentialList)
def get_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    issuer: User = _issuer,
):
    cred = (
        db.query(Credential)
        .filter(
            Credential.credential_id == credential_id,
            Credential.issuer_id == issuer.id,
        )
        .first()
    )

    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    return {
        "credential_id": cred.credential_id,
        "hash_id": cred.hash_id,
        "credential_type": cred.credential_type,
        "revoked": cred.revoked,
        "expires_at": cred.expires_at,
        "created_at": cred.created_at,
        "issuer_id": issuer.public_id,
        "holder_id": cred.holder.public_id,
    }


# ── List holders ────────────────────────────────

@router.get("/holders")
def list_holders(db: Session = Depends(get_db), issuer: User = _issuer):
    holders = (
        db.query(User)
        .filter(User.role == "holder", User.status == "approved")
        .all()
    )

    return [
        {"public_id": h.public_id, "name": h.name, "email": h.email}
        for h in holders
    ]


# ── Issuer Logs (ONLY issue + revoke) ───────────
@router.get("/logs", response_model=list[IssuerLogOut])
def issuer_logs(db: Session = Depends(get_db), issuer: User = _issuer):

    logs = (
        db.query(IssuerActionLog)
        .filter(IssuerActionLog.issuer_id == issuer.id)
        .order_by(IssuerActionLog.timestamp.desc())
        .all()
    )

    return [
        IssuerLogOut(
            credential_id=log.credential.credential_id,
            holder_id=log.holder.public_id,
            action=log.action,
            timestamp=log.timestamp,
        )
        for log in logs
    ]
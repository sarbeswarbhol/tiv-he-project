"""
routes/verifier.py — Verifier-facing verification endpoint.

POST /verifier/verify   → verify a credential by token or manual_id
GET  /verifier/logs     → view this verifier's verification history
"""
"""
routes/verifier.py — Verifier-facing verification endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User, VerificationLog
from schemas import VerifierLogOut, VerifyRequest, VerifyResponse
from services import verification_service

router = APIRouter(prefix="/verifier", tags=["Verifier"])

_verifier = Depends(require_role("verifier"))


# ── Verify (standard API) ──────────────────────────────

@router.post("/verify", response_model=VerifyResponse)
def verify(
    body: VerifyRequest,
    db: Session = Depends(get_db),
    verifier: User = _verifier,
):
    try:
        result = verification_service.verify_credential(db, body, verifier)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Verify via shareable link ──────────────────────────
@router.get("/verify-link", response_model=VerifyResponse)
def verify_via_link(
    token: str = Query(..., description="Secure token shared by holder"),
    data: str | None = Query(None, description="Encoded selective data"),
    db: Session = Depends(get_db),
    verifier: User = _verifier,
):
    import base64, json

    token = token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token cannot be empty")

    decoded = {}

    if data:
        try:
            decoded = json.loads(
                base64.urlsafe_b64decode(data.encode()).decode()
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid data payload")

    try:
        request = VerifyRequest(
            secure_token=token,
            conditions=decoded.get("conditions") 
        )

        result = verification_service.verify_credential(db, request, verifier)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Verification history ───────────────────────────────
@router.get("/logs", response_model=list[VerifierLogOut])
def my_logs(db: Session = Depends(get_db), verifier: User = _verifier):

    logs = db.query(VerificationLog).filter(
        VerificationLog.verifier_id == verifier.id
    ).order_by(VerificationLog.timestamp.desc()).all()

    return [
        {
            "credential_id": log.credential.credential_id,
            "holder_id": log.credential.holder.public_id,
            "condition": log.condition,
            "result": log.result,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
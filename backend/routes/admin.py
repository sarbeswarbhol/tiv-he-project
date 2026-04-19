from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User, AdminLog
from schemas import UserOut, AdminLogOut
from services import blockchain_service
from utils.db_helpers import get_user_by_public_id

router = APIRouter(prefix="/admin", tags=["Admin"])
_admin = Depends(require_role("admin"))


# ── List users ─────────────────────────────────────────


@router.get("/users", response_model=list[UserOut])
def list_users(
    status: str | None = None,
    role: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = _admin,
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if status:
        query = query.filter(User.status == status)

    return query.offset(skip).limit(limit).all()

@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), _: User = _admin):

    total_users = db.query(User).count()

    total_pending = db.query(User).filter(User.status == "pending").count()
    total_approved = db.query(User).filter(User.status == "approved").count()
    total_rejected = db.query(User).filter(User.status == "rejected").count()

    total_admins = db.query(User).filter(User.role == "admin").count()
    total_issuers = db.query(User).filter(User.role == "issuer").count()
    total_holders = db.query(User).filter(User.role == "holder").count()
    total_verifiers = db.query(User).filter(User.role == "verifier").count()

    return {
        "users": {
            "total": total_users,
            "pending": total_pending,
            "approved": total_approved,
            "rejected": total_rejected,
        },
        "roles": {
            "admins": total_admins,
            "issuers": total_issuers,
            "holders": total_holders,
            "verifiers": total_verifiers,
        }
    }

@router.get("/admins", response_model=list[UserOut])
def list_admins(
    db: Session = Depends(get_db),
    _: User = _admin,
):
    return db.query(User).filter(User.role == "admin").all()


# ── Approve ────────────────────────────────────────────
@router.post("/approve/{public_id}")
def approve_user(public_id: str, db: Session = Depends(get_db), _: User = _admin):

    user = get_user_by_public_id(db, public_id)
    if not user:
        raise HTTPException(404, "User not found")

    # 🚫 prevent self-modification
    if user.id == _.id:
        raise HTTPException(400, "You cannot modify your own account")

    # if user.role == "admin":
    #     raise HTTPException(400, "Admins cannot modify other admins")

    if user.status == "rejected":
        raise HTTPException(400, "Rejected users cannot be approved")

    if user.is_approved:
        return {"message": f"User {user.email} already approved"}

    user.is_approved = True
    user.status = "approved"

    db.add(AdminLog(
        action="USER_APPROVED",
        target_user_id=user.id,
        performed_by=_.id,
        details=f"{user.role} approved"
    ))

    if user.role == "issuer":
        blockchain_service.add_issuer(user.id)

    db.commit()
    db.refresh(user)

    return {"message": f"User {user.public_id} approved successfully"}



# ── Reject ────────────────────────────────────────────

@router.post("/reject/{public_id}")
def reject_user(public_id: str, db: Session = Depends(get_db), _: User = _admin):

    user = get_user_by_public_id(db, public_id)
    if not user:
        raise HTTPException(404, "User not found")

    # 🚫 Prevent self-rejection
    if user.id == _.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot reject your own account"
        )

    # 🚫 Prevent rejecting another admin (optional but recommended)
    if user.role == "admin":
        raise HTTPException(
            status_code=400,
            detail="Admins cannot reject other admins"
        )

    if user.status == "approved":
        raise HTTPException(400, "Cannot reject approved user")

    if user.status == "rejected":
        return {"message": "User already rejected"}

    user.status = "rejected"
    user.is_approved = False

    db.add(AdminLog(
        action="USER_REJECTED",
        target_user_id=user.id,
        performed_by=_.id,
        details="User rejected permanently"
    ))

    db.commit()

    return {"message": f"User {user.public_id} rejected successfully"}



# ── Unapprove ─────────────────────────────────────────

@router.post("/unapprove/{public_id}")
def unapprove_user(public_id: str, db: Session = Depends(get_db), _: User = _admin):

    user = get_user_by_public_id(db, public_id)
    if not user:
        raise HTTPException(404, "User not found")

    if user.status == "rejected":
        raise HTTPException(400, "Rejected user cannot be unapproved")

    if not user.is_approved:
        raise HTTPException(400, "User already unapproved")

    user.is_approved = False
    user.status = "pending"

    db.add(AdminLog(
        action="USER_UNAPPROVED",
        target_user_id=user.id,
        performed_by=_.id,
        details="User moved back to pending"
    ))

    if user.role == "issuer":
        blockchain_service.remove_issuer(user.id)

    db.commit()
    db.refresh(user)

    return {"message": f"User {user.public_id} unapproved"}

# ── Blockchain state ───────────────────────────────────

@router.get("/blockchain")
def blockchain_state(_: User = _admin):
    return {
        "trusted_issuers": blockchain_service.get_all_trusted_issuers(),
        "issued_hashes": blockchain_service.get_all_issued_hashes(),
        "revoked_hashes": blockchain_service.get_all_revoked_hashes(),
    }


# ── Add issuer ─────────────────────────────────────────

@router.post("/blockchain/add-issuer/{public_id}")
def add_issuer(public_id: str, db: Session = Depends(get_db), _: User = _admin):

    user = get_user_by_public_id(db, public_id)
    if not user:
        raise HTTPException(404, "User not found")

    if user.role != "issuer":
        raise HTTPException(400, "User is not an issuer")

    blockchain_service.add_issuer(user.id)

    # ✅ Log action
    db.add(AdminLog(
        action="ISSUER_ADDED",
        target_user_id=user.id,
        performed_by=_.id,
        details="Added to blockchain"
    ))

    db.commit()

    return {"message": f"Issuer {user.public_id} added"}


# ── Remove issuer ──────────────────────────────────────

@router.post("/blockchain/remove-issuer/{public_id}")
def remove_issuer(public_id: str, db: Session = Depends(get_db), _: User = _admin):

    user = get_user_by_public_id(db, public_id)
    if not user:
        raise HTTPException(404, "User not found")

    if user.role != "issuer":
        raise HTTPException(400, "User is not an issuer")

    blockchain_service.remove_issuer(user.id)

    # ✅ Log action
    db.add(AdminLog(
        action="ISSUER_REMOVED",
        target_user_id=user.id,
        performed_by=_.id,
        details="Removed from blockchain"
    ))

    db.commit()

    return {"message": f"Issuer {user.public_id} removed"}


# ── Admin Logs ─────────────────────────────────────────

@router.get("/logs", response_model=list[AdminLogOut])
def admin_logs(db: Session = Depends(get_db), _: User = _admin):

    logs = db.query(AdminLog).order_by(AdminLog.timestamp.desc()).all()

    return [
        {
            "action": log.action,
            "target_user": log.target_user.public_id if log.target_user else None,
            "performed_by": log.admin.public_id,
            "details": log.details,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
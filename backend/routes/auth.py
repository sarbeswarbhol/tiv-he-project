"""
routes/auth.py — Registration and login endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, AdminLog
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut, RegisterResponse
from utils.jwt import create_access_token

from auth import get_current_user
from utils.id_generator import generate_unique_role_id


router = APIRouter(prefix="/auth", tags=["Auth"])

# ✅ Stronger bcrypt config
_pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)



# ── Helper ─────────────────────────────────────────────

def serialize_user(user: User) -> UserOut:
    return UserOut.model_validate(user)


def normalize(value: str) -> str:
    return value.lower().strip()


# ── Register ───────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):

    email = normalize(body.email)
    username = normalize(body.username)

    existing = db.query(User).filter(
        (User.email == email) | (User.username == username)
    ).all()

    email_exists = any(u.email == email for u in existing)
    username_exists = any(u.username == username for u in existing)

    if email_exists and username_exists:
        raise HTTPException(
            status_code=409,
            detail="Both email and username already exist"
        )

    if email_exists:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    if username_exists:
        raise HTTPException(
            status_code=409,
            detail="Username already taken"
        )

    user = User(
        public_id=generate_unique_role_id(db, body.role),
        name=body.name,
        username=username,
        email=email,
        password_hash=_pwd.hash(body.password),
        role=body.role,
        is_approved=False,
        status="pending"
    )

    db.add(user)
    db.flush()
    db.add(AdminLog(
        action="USER_REGISTERED",
        target_user_id=user.id,
        performed_by=user.id,
        details=f"{user.role} registered"
    ))
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        message="Application submitted. Await admin approval.",
        public_id=user.public_id
    )


# ── Login (email OR username) ──────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):

    user = None

    if body.email:
        identifier = normalize(body.email)
        user = db.query(User).filter(User.email == identifier).first()

    elif body.username:
        identifier = normalize(body.username)
        user = db.query(User).filter(User.username == identifier).first()

    else:
        raise HTTPException(
            status_code=400,
            detail="Email or username required"
        )

    # Optional timing protection
    if not user:
        _pwd.verify(body.password, _pwd.hash("dummy_password"))

    if not user or not _pwd.verify(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval",
        )
        
    if user.status == "rejected":
        raise HTTPException(
            status_code=403,
            detail="Account rejected by admin"
        )
        
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "type": "access",
    })

    return TokenResponse(
        access_token=token,
        user=serialize_user(user)
    )


# ── Get current user (/me) ─────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)
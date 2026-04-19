"""
utils/jwt.py — JWT creation and verification helpers.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

from config import JWT_SECRET_KEY, ACCESS_TOKEN_EXPIRE_HOURS

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = ACCESS_TOKEN_EXPIRE_HOURS


# ── Create ─────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Return a signed JWT containing `data` payload."""
    payload = data.copy()
    payload["type"] = "access"
    expire  = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=TOKEN_EXPIRE_HOURS))
    payload["exp"] = expire
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


# ── Decode ─────────────────────────────────────────────────────────────────────

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT.
    Returns the payload dict on success, None on failure.
    """
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

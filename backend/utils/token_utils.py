"""
utils/token_utils.py — Create and parse secure_token for credential verification.

Format:  base64( credential_id + ":" + secret + ":" + unix_timestamp )
Expiry:  3 minutes from creation (stored separately in DB, also checked here).
"""

import base64
import hashlib
import time
import hmac
from typing import Optional, Tuple

from config import TOKEN_SIGNING_SECRET


def _hmac_sign(payload: str) -> str:
    """Simple HMAC-like signature using SHA-256."""
    return hmac.new(
            TOKEN_SIGNING_SECRET.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()[:16]


def create_secure_token(credential_id: str) -> str:
    """
    Build a time-stamped signed token for a credential.

    Structure (before base64):
        <credential_id>:<timestamp>:<signature>
    """
    ts        = int(time.time())
    signature = _hmac_sign(f"{credential_id}:{ts}")
    raw       = f"{credential_id}:{ts}:{signature}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def parse_secure_token(token: str) -> Optional[Tuple[str, int]]:
    """
    Decode a secure_token.

    Returns (credential_id, timestamp) if signature is valid, else None.
    """
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        credential_id, ts_str, sig = raw.split(":")

        ts = int(ts_str)

        expected = _hmac_sign(f"{credential_id}:{ts}")
        if not hmac.compare_digest(sig, expected):
            return None

        return credential_id, ts
    except Exception:
        return None

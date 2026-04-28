import hashlib
import re
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy.orm import Session

from models import Credential, User, VerificationLog, VerificationToken
from schemas import VerifyRequest, VerifyResponse, ConditionResult
from services import blockchain_service
from services.encryption_service import get_attribute


def verify_credential(
    db: Session,
    request: VerifyRequest,
    verifier: User,
    fields: Optional[List[str]] = None   # ✅ NEW
):
    now = datetime.now(timezone.utc)
    token = None

    # ── Mode 1: secure_token ─────────────────────
    if request.secure_token:
        token_hash = hashlib.sha256(request.secure_token.encode()).hexdigest()

        token = db.query(VerificationToken).filter(
            VerificationToken.secure_token_hash == token_hash
        ).first()

        if not token:
            raise ValueError("Invalid secure_token")

    # ── Mode 2: manual_id ────────────────────────
    elif request.manual_id:
        token = db.query(VerificationToken).filter_by(
            manual_id=request.manual_id
        ).first()

        if not token:
            raise ValueError("Invalid manual_id")

    if not token:
        raise ValueError("Provide manual_id or secure_token")

    # ── Consistency check ────────────────────────
    if request.manual_id and request.secure_token:
        if token.manual_id != request.manual_id:
            raise ValueError("manual_id does not match secure_token")

    cred = token.credential

    # ── Expiry check ─────────────────────────────
    if token.expires_at < now:
        token.status = "expired"
        db.commit()
        raise ValueError("Token expired")

    # ── Used check ───────────────────────────────
    if token.is_used:
        raise ValueError("Token already used")

    # ── Attempt tracking ─────────────────────────
    token.attempt_count += 1
    if token.attempt_count > token.max_attempts:
        db.commit()
        raise ValueError("Too many attempts")

    # ── Credential checks ────────────────────────
    if cred.revoked:
        raise ValueError("Credential revoked")

    if cred.expires_at < now:
        raise ValueError("Credential expired")

    # ── Blockchain check ────────────────────────
    trusted = blockchain_service.is_trusted_issuer(cred.issuer_id)
    issued = blockchain_service.is_issued(cred.hash_id)
    on_chain_revoked = blockchain_service.is_revoked(cred.hash_id)

    if not issued:
        raise ValueError("Credential not found on blockchain")

    blockchain_ok = trusted and issued and not on_chain_revoked

    # ── MULTI-CONDITION SUPPORT ─────────────────
    results: List[ConditionResult] = []

    if request.conditions:
        for cond in request.conditions:
            res = _evaluate_condition(cred, cond, fields)  # ✅ PASS fields
            results.append(ConditionResult(condition=cond, result=res))

    # ── Final result ─────────────────────────────
    overall = blockchain_ok

    if results:
        overall = overall and all(r.result for r in results)

    # ── Logging ─────────────────────────────────
    combined_condition = None
    if request.conditions:
        combined_condition = ", ".join(request.conditions)

    _log(db, cred, verifier, token.manual_id, combined_condition, overall)

    # ── Mark token as used ──────────────────────
    token.is_used = True
    token.used_at = now
    token.status = "used"

    db.commit()

    return VerifyResponse(
        manual_id=token.manual_id,
        hash_id=cred.hash_id,
        blockchain_trusted=blockchain_ok,
        results=results,
        overall_result=overall,
        timestamp=now,
    )


# ── Condition Evaluation ─────────────────────────────

OPERATOR_ALIASES = {
    "gte": ">=",
    "gt": ">",
    "lte": "<=",
    "lt": "<",
    "eq": "==",
    "ne": "!=",
}


def _evaluate_condition(
    cred: Credential,
    condition: str,
    allowed_fields: Optional[List[str]] = None  # ✅ NEW
) -> bool:
    condition = condition.strip().lower()

    field = op = raw_value = None

    if "_" in condition and len(condition.split()) == 1:
        parts = condition.split("_")
        if len(parts) >= 3:
            field = parts[0]
            op = OPERATOR_ALIASES.get(parts[1])
            raw_value = "_".join(parts[2:])

    if field is None:
        match = re.match(r"^\s*(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*$", condition)
        if match:
            field, op, raw_value = match.groups()

    if field is None:
        parts = condition.split()
        if len(parts) == 3:
            f, op_word, val = parts
            if op_word in OPERATOR_ALIASES:
                field = f
                op = OPERATOR_ALIASES[op_word]
                raw_value = val

    if field is None or op is None:
        raise ValueError(f"Invalid condition format: {condition}")

    # 🔒 CRITICAL SECURITY CHECK
    if allowed_fields is not None and field not in allowed_fields:
        raise ValueError(f"Access to field '{field}' is not allowed")

    actual = get_attribute(cred.encrypted_data, field)
    if actual is None:
        raise ValueError(f"Field '{field}' not found")

    actual, expected = _coerce(actual, raw_value)

    ops = {
        "==": lambda a, b: a == b,
        "!=": lambda a, b: a != b,
        ">=": lambda a, b: a >= b,
        "<=": lambda a, b: a <= b,
        ">": lambda a, b: a > b,
        "<": lambda a, b: a < b,
    }

    return ops[op](actual, expected)


def _coerce(actual, raw_value: str):
    if isinstance(actual, bool):
        return actual, raw_value.lower() in ("true", "1")

    if isinstance(actual, (int, float)):
        return actual, type(actual)(raw_value)

    return str(actual).lower(), raw_value.lower()


# ── Logging ────────────────────────────────────────

def _log(
    db: Session,
    cred: Credential,
    verifier: User,
    manual_id: str,
    condition: Optional[str],
    result: bool,
):
    log = VerificationLog(
        holder_id=cred.holder_id,
        verifier_id=verifier.id,
        credential_id=cred.id,
        manual_id=manual_id,
        condition=condition,
        result=result,
    )
    db.add(log)
    db.flush()
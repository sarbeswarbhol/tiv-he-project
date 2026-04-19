"""
utils/id_generator.py — Generate short unique human-readable IDs.

manual_id: 6 uppercase alphanumeric characters (digits + A-Z, no O/0/I/1 for clarity).
"""

import random
import string

ROLE_PREFIX = {
    "admin": "ADM",
    "issuer": "ISS",
    "holder": "HLD",
    "verifier": "VER",
}

def generate_credential_id():
    return "cred-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def generate_manual_id():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=4))

def generate_role_id(role: str, length: int = 6) -> str:
    prefix = ROLE_PREFIX.get(role.lower(), "USR")
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=length))
    return f"{prefix}-{code}"

def generate_unique_role_id(db, role):
    from models import User

    for _ in range(10):
        pid = generate_role_id(role)
        exists = db.query(User).filter(User.public_id == pid).first()
        if not exists:
            return pid

    raise Exception("Failed to generate unique public_id")

def mask_identifier(key: str, value: str) -> str:
    if not value:
        return value

    # Aadhaar: 12 digits → 4-4-4
    if key == "aadhaar_number" and len(value) == 12:
        return value[:4] + "****" + value[-4:]

    # PAN: ABCDE1234F → keep first 5 + last 1
    if key == "pan_number" and len(value) >= 10:
        return value[:5] + "*****" + value[-1]

    # Driving License: flexible → keep first 4 + last 4
    if key == "driving_license":
        return value[:4] + "*" * (len(value) - 8) + value[-4:]

    # Passport: keep first 1 + last 2
    if key == "passport_number":
        return value[0] + "*" * (len(value) - 3) + value[-2:]

    # Ration Card: keep first 4 + last 4
    if key == "ration_card_number":
        return value[:4] + "*" * (len(value) - 8) + value[-4:]

    # fallback
    return value[:4] + "*" * (len(value) - 8) + value[-4:]
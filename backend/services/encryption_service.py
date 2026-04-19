"""
services/encryption_service.py — Fernet symmetric encryption for identity fields.

All sensitive identifiers (Aadhaar, PAN, Voter ID, Driving License) are encrypted
before being stored in the database and decrypted only during verification.

IMPORTANT: The Fernet key must be stored securely (env var in production).
"""

import json
from typing import Any, Dict
from cryptography.fernet import Fernet

from config import FERNET_KEY

_FERNET_KEY = FERNET_KEY.encode()
_fernet = Fernet(_FERNET_KEY)




def encrypt_value(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(cipher_text: str) -> str:
    return _fernet.decrypt(cipher_text.encode()).decode()


def encrypt_dict(data: Dict[str, Any]) -> str:
    return _fernet.encrypt(json.dumps(data).encode()).decode()


def decrypt_dict(cipher_text: str) -> Dict[str, Any]:
    try:
        return json.loads(_fernet.decrypt(cipher_text.encode()).decode())
    except Exception:
        raise ValueError("Decryption failed")


def prepare_credential_data(basic: dict, attributes: dict, identifiers: dict) -> str:

    encrypted_identifiers = {
        k: encrypt_value(v)
        for k, v in identifiers.items()
        if v is not None
    }

    payload = {
        "basic": basic,
        "attributes": attributes,
        "identifiers": encrypted_identifiers,
    }

    return encrypt_dict(payload)


def get_attribute(credential_encrypted_data: str, field: str) -> Any:
    data = decrypt_dict(credential_encrypted_data)

    for section in ("basic", "attributes"):
        if field in data.get(section, {}):
            return data[section][field]

    if field in data.get("identifiers", {}):
        return decrypt_value(data["identifiers"][field])

    raise ValueError(f"Field '{field}' not found")
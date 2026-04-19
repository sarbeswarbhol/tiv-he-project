"""
services/blockchain_service.py — Simulated blockchain for TIV-HE.

In a real system this would talk to an Ethereum / Hyperledger node.
Here we simulate it with an in-memory store (lost on restart — intentional for dev).

Features:
  - trusted_issuers list
  - revoked_credentials list (stored by credential hash)
"""

import hashlib
from typing import Set

# ⚠️ DEV ONLY — resets on restart
_trusted_issuers: Set[int] = set()
_revoked_credentials: Set[str] = set()
_issued_credentials: Set[str] = set() 


# ── Issuer management ─────────────────────────────────

def add_issuer(issuer_id: int) -> None:
    _trusted_issuers.add(issuer_id)


def remove_issuer(issuer_id: int) -> None:
    _trusted_issuers.discard(issuer_id)


def is_trusted_issuer(issuer_id: int) -> bool:
    return issuer_id in _trusted_issuers


def get_all_trusted_issuers() -> list:
    return list(_trusted_issuers)


# ── Credential revocation ─────────────────────────────

def revoke_credential(hash_id: str) -> None:
    _issued_credentials.discard(hash_id)
    _revoked_credentials.add(hash_id)


def unrevoke_credential(hash_id: str) -> None:
    _revoked_credentials.discard(hash_id)
    _issued_credentials.add(hash_id)


def is_revoked(hash_id: str) -> bool:
    return hash_id in _revoked_credentials


def get_all_revoked_hashes() -> list:
    return list(_revoked_credentials)


# ── Credential anchoring (NEW) ─────────────────────────

def anchor_credential(hash_id: str):
    if hash_id in _issued_credentials:
        return 
    _issued_credentials.add(hash_id)


def is_issued(hash_id: str) -> bool:
    """Check if credential exists on blockchain."""
    return hash_id in _issued_credentials


def get_all_issued_hashes() -> list:
    return list(_issued_credentials)
"""
schemas.py — Pydantic v2 request / response schemas for TIV-HE.

SECURITY: Raw identity fields are NEVER returned in responses.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# ── Shared helpers ─────────────────────────────────────

VALID_ROLES = {"admin", "issuer", "holder", "verifier"}


# ═══════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    role: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v):
        if not v.strip():
            raise ValueError("username cannot be empty")
        if len(v) < 3:
            raise ValueError("username must be at least 3 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v):
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError("password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str

    @model_validator(mode="after")
    def validate_identity(self):
        if not self.email and not self.username:
            raise ValueError("Either email or username must be provided")
        return self


class RegisterResponse(BaseModel):
    message: str
    public_id: str
    
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ═══════════════════════════════════════════════════════
# USER
# ═══════════════════════════════════════════════════════

class UserOut(BaseModel):
    id: int
    public_id: str
    name: str
    username: str
    email: EmailStr
    role: str
    is_approved: bool
    status: str
    profile_picture: Optional[str] = None
    created_at: datetime
    default_share_fields: Optional[List[str]] = None

    model_config = {"from_attributes": True}



# ═══════════════════════════════════════════════════════
# CREDENTIAL ISSUANCE
# ═══════════════════════════════════════════════════════

VALID_GENDERS = {"male", "female", "other"}

class BasicInfo(BaseModel):
    full_name: str
    gender: str
    state: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("full_name cannot be empty")
        return v

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v):
        v = v.lower()
        if v not in VALID_GENDERS:
            raise ValueError(f"gender must be one of {VALID_GENDERS}")
        return v

    @field_validator("state")
    @classmethod
    def state_not_empty(cls, v):
        if not v.strip():
            raise ValueError("state cannot be empty")
        return v


VALID_CITIZENSHIP = {"citizen", "non-citizen", "permanent resident"}
VALID_EDUCATION = {"high school", "bachelor", "master", "phd"}
VALID_MARITAL = {"single", "married", "divorced", "widowed"}


class Attributes(BaseModel):
    age: int
    citizenship_status: str
    education_level: str
    marital_status: str
    license_validity: bool
    tax_compliance: bool

    @field_validator("age")
    @classmethod
    def age_valid(cls, v):
        if v < 0 or v > 150:
            raise ValueError("age must be between 0 and 150")
        return v

    @field_validator("citizenship_status")
    @classmethod
    def citizenship_valid(cls, v):
        v = v.lower().strip()
        if v not in VALID_CITIZENSHIP:
            raise ValueError(f"citizenship_status must be one of {VALID_CITIZENSHIP}")
        return v

    @field_validator("education_level")
    @classmethod
    def education_valid(cls, v):
        v = v.lower().strip()
        if v not in VALID_EDUCATION:
            raise ValueError(f"education_level must be one of {VALID_EDUCATION}")
        return v

    @field_validator("marital_status")
    @classmethod
    def marital_valid(cls, v):
        v = v.lower().strip()
        if v not in VALID_MARITAL:
            raise ValueError(f"marital_status must be one of {VALID_MARITAL}")
        return v


class Identifiers(BaseModel):
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    voter_id: Optional[str] = None
    driving_license: Optional[str] = None
    passport_number: Optional[str] = None
    ration_card_number: Optional[str] = None

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v):
        if v is None:
            return v
        v = v.replace(" ", "")
        if not re.fullmatch(r"\d{12}", v):
            raise ValueError("aadhaar_number must be 12 digits")
        return v


class CredentialType(str, Enum):
    identity = "identity"
    kyc = "kyc"
    financial = "financial"


class IssueCredentialRequest(BaseModel):
    holder_id: str
    credential_type: CredentialType = CredentialType.identity
    basic: BasicInfo
    attributes: Attributes
    identifiers: Identifiers

    @field_validator("holder_id")
    @classmethod
    def holder_valid(cls, v):
        if not v.strip():
            raise ValueError("holder_id cannot be empty")
        return v


# ═══════════════════════════════════════════════════════
# TOKEN (ONLY SHARE FLOW)
# ═══════════════════════════════════════════════════════

class VerificationTokenOut(BaseModel):
    manual_id: str
    secure_token: str
    expires_at: datetime


# ═══════════════════════════════════════════════════════
# CREDENTIAL RESPONSES
# ═══════════════════════════════════════════════════════

class CredentialIssued(BaseModel):
    credential_id: str
    hash_id: str
    credential_type: CredentialType
    holder_id: str
    expires_at: datetime


class CredentialSummary(BaseModel):
    credential_id: str
    hash_id: str
    credential_type: CredentialType
    revoked: bool
    expires_at: datetime
    created_at: datetime
    issuer_id: str
    holder_id: Optional[str] = None
    masked_identifiers: dict[str, str] = {}

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════
# HOLDER SETTINGS
# ═══════════════════════════════════════════════════════

ALLOWED_SHARE_FIELDS = {
    "full_name", "gender", "state",
    "age", "education_level",
    "marital_status", "citizenship_status"
}

class DefaultShareFieldsUpdate(BaseModel):
    fields: List[str]

    @field_validator("fields")
    @classmethod
    def validate_fields(cls, v):
        if not v:
            raise ValueError("fields list cannot be empty")

        cleaned = set()
        for field in v:
            field = field.strip().lower()
            if field not in ALLOWED_SHARE_FIELDS:
                raise ValueError(f"Invalid field: {field}")
            cleaned.add(field)

        return list(cleaned)


# ═══════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════

class VerifyRequest(BaseModel):
    manual_id: Optional[str] = None
    secure_token: Optional[str] = None
    conditions: Optional[List[str]] = None

    @model_validator(mode="after")
    def validate_input(self):
        if not self.manual_id and not self.secure_token:
            raise ValueError("Provide manual_id or secure_token")
        return self

    @field_validator("manual_id", "secure_token")
    @classmethod
    def not_empty(cls, v):
        if v is None:
            return v
        if not v.strip():
            raise ValueError("manual_id/secure_token cannot be empty")
        return v

    @field_validator("conditions")
    @classmethod
    def validate_conditions(cls, v):
        if v is None:
            return v

        pattern = r"^(age|tax_compliance|license_validity|citizenship_status)\s*(==|=|>=|<=|>|<)\s*(\d+|true|false|[a-z_]+)$"

        cleaned = []
        for cond in v:
            cond = cond.strip().lower()
            if not re.fullmatch(pattern, cond):
                raise ValueError(f"Invalid condition: {cond}")
            cleaned.append(cond)

        return cleaned
    
    
class ConditionResult(BaseModel):
    condition: str
    result: bool


class VerifyResponse(BaseModel):
    manual_id: str
    hash_id: Optional[str]
    blockchain_trusted: bool
    results: List[ConditionResult]
    overall_result: bool
    timestamp: datetime
    credential_id: Optional[str] = None  

# ═══════════════════════════════════════════════════════
# VERIFICATION LOG
# ═══════════════════════════════════════════════════════

class HolderLogOut(BaseModel):
    credential_id: str
    verified_by: str
    condition: Optional[str] = None
    result: bool
    timestamp: datetime


class VerifierLogOut(BaseModel):
    credential_id: str
    holder_id: str
    result: bool
    condition: Optional[str]
    timestamp: datetime


class IssuerLogOut(BaseModel):
    credential_id: str
    holder_id: str
    action: str 
    timestamp: datetime


class AdminLogOut(BaseModel):
    action: str
    target_user: Optional[str] = None
    performed_by: str
    details: Optional[str] = None
    timestamp: datetime


# ═══════════════════════════════════════════════════════
# SHARE LINK
# ═══════════════════════════════════════════════════════
class ShareLinkRequest(BaseModel):
    fields: Optional[List[str]] = None
    conditions: Optional[List[str]] = None

    @field_validator("fields")
    @classmethod
    def normalize_fields(cls, v):
        if v is None:
            return v

        cleaned = []
        for f in v:
            f = f.strip().lower()
            if f not in ALLOWED_SHARE_FIELDS:
                raise ValueError(f"Invalid field: {f}")
            cleaned.append(f)

        return cleaned

    @field_validator("conditions")
    @classmethod
    def normalize_conditions(cls, v):
        if v is None:
            return v

        if isinstance(v, str):
            v = [v]

        cleaned = []
        for cond in v:
            cond = cond.strip().lower()
            cleaned.append(cond)

        return cleaned 
    
    
class CredentialList(BaseModel):
    credential_id: str
    hash_id: str
    credential_type: str
    holder_id: str
    issuer_id: str
    expires_at: datetime
    created_at: datetime
    revoked: bool
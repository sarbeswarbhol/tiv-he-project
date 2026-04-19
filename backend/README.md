# TIV-HE — Trustless Identity Verification using Homomorphic Encryption

Privacy-preserving identity verification backend built with FastAPI, PostgreSQL (Neon), Fernet encryption, and a simulated blockchain.

---

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs available at: http://localhost:8000/docs

---

## Architecture

```
backend/
├── main.py                      # App entry point, startup hooks
├── database.py                  # SQLAlchemy engine + session (Neon/PostgreSQL)
├── models.py                    # ORM models: User, Credential, VerificationLog
├── schemas.py                   # Pydantic v2 request/response schemas
├── auth.py                      # JWT dependency + role enforcement
│
├── routes/
│   ├── auth.py                  # POST /register, POST /login
│   ├── admin.py                 # GET/POST /admin/*
│   ├── issuer.py                # POST /issuer/issue, revoke, list
│   ├── holder.py                # GET /holder/credentials, refresh, logs
│   └── verifier.py              # POST /verifier/verify, GET /verifier/logs
│
├── services/
│   ├── credential_service.py    # Issue, revoke, refresh credentials
│   ├── verification_service.py  # Full verify pipeline + condition evaluator
│   ├── encryption_service.py    # Fernet encrypt/decrypt helpers
│   ├── blockchain_service.py    # Simulated blockchain (in-memory)
│   └── seed_service.py          # Insert default users on startup
│
└── utils/
    ├── jwt.py                   # create/decode access tokens
    ├── id_generator.py          # 6-char alphanumeric manual_id generator
    └── token_utils.py           # secure_token creation + parsing
```

---

## Default Accounts (seeded on startup)

| Email               | Password    | Role     |
|---------------------|-------------|----------|
| admin@test.com      | admin123    | admin    |
| issuer@test.com     | issuer123   | issuer   |
| holder@test.com     | holder123   | holder   |
| verifier@test.com   | verifier123 | verifier |

All seed accounts are pre-approved.

---

## API Reference

### Auth
| Method | Path                        | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | /api/v1/auth/register       | Apply for account            |
| POST   | /api/v1/auth/login          | Get JWT token                |

### Admin (requires admin JWT)
| Method | Path                                    | Description                   |
|--------|-----------------------------------------|-------------------------------|
| GET    | /admin/users                            | List all users                |
| POST   | /admin/approve/{id}                     | Approve a pending user        |
| POST   | /admin/reject/{id}                      | Reject a pending user         |
| GET    | /admin/blockchain                       | View blockchain state         |
| POST   | /admin/blockchain/add-issuer/{user_id}  | Trust an issuer on blockchain |

### Issuer (requires issuer JWT)
| Method | Path                            | Description                          |
|--------|---------------------------------|--------------------------------------|
| POST   | /issuer/issue                   | Issue credential to a holder         |
| GET    | /issuer/credentials             | List credentials I've issued         |
| GET    | /issuer/credentials/{manual_id} | Inspect one credential               |
| POST   | /issuer/revoke/{manual_id}      | Revoke a credential                  |

### Holder (requires holder JWT)
| Method | Path                                      | Description                    |
|--------|-------------------------------------------|--------------------------------|
| GET    | /holder/me                                | My profile                     |
| GET    | /holder/credentials                       | My credentials (safe summary)  |
| GET    | /holder/credentials/{manual_id}           | One credential summary         |
| POST   | /holder/credentials/{manual_id}/refresh   | Refresh secure_token (3 min)   |
| GET    | /holder/logs                              | My verification history        |

### Verifier (requires verifier JWT)
| Method | Path             | Description                          |
|--------|------------------|--------------------------------------|
| POST   | /verifier/verify | Verify a credential                  |
| GET    | /verifier/logs   | My verification history              |

---

## Verification Request Example

```json
POST /verifier/verify
{
  "secure_token": "<token from holder>",
  "condition": "age >= 18"
}
```

Or with manual_id:
```json
{
  "manual_id": "A3BX7K",
  "condition": "citizenship_status == Indian"
}
```

### Supported condition operators
`==`  `!=`  `>=`  `<=`  `>`  `<`

### Available condition fields
**Basic:** `full_name`, `gender`, `state`  
**Attributes:** `age`, `citizenship_status`, `education_level`, `marital_status`, `license_validity`, `tax_compliance`

> Identifier fields (`aadhaar_number`, `pan_number`, etc.) are double-encrypted and never directly exposed.

---

## Verification Response

```json
{
  "blockchain_trusted": true,
  "condition_result": true,
  "overall_result": true,
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

## Security Design

| Concern                        | How it's handled                                           |
|--------------------------------|------------------------------------------------------------|
| Password storage               | bcrypt hash, never stored plaintext                        |
| Identity fields                | Fernet-encrypted individually + entire blob encrypted      |
| Credential IDs                 | Internal UUIDs never exposed in API responses              |
| Token expiry                   | 3-minute window enforced at DB and token level             |
| Issuer trust                   | Blockchain registry checked on every verification          |
| Revocation                     | DB flag + blockchain hash checked on every verification    |
| Holder privacy                 | Issuers cannot list or browse holders                      |
| Role enforcement               | JWT role claim checked on every protected route            |

---

## Environment Variables (Production)

```env
FERNET_KEY=<your-fernet-key>        # generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
SECRET_KEY=<your-jwt-secret>
DATABASE_URL=<override-connection-string>
```

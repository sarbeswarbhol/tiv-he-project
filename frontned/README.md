# TIV-HE Frontend — Trustless Identity Verification using Homomorphic Encryption

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Demo Credentials

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Admin    | admin@test.com      | admin123    |
| Issuer   | issuer@test.com     | issuer123   |
| Holder   | holder@test.com     | holder123   |
| Verifier | verifier@test.com   | verifier123 |

## API Base URL

Set in `src/api/axios.js` — defaults to `http://localhost:8000/api/v1`

## Project Structure

```
src/
├── api/
│   └── axios.js              # Axios instance with JWT interceptor
├── context/
│   └── AuthContext.jsx       # Auth state & login/logout
├── components/
│   ├── layout/
│   │   └── DashboardLayout.jsx  # Sidebar + topbar layout
│   └── ui/
│       ├── index.jsx            # Spinner, Badge, StatCard, ResultIndicator, etc.
│       ├── QRModal.jsx          # QR token generator with 3-min countdown timer
│       └── ScannerModal.jsx     # Camera QR scanner with manual fallback
├── pages/
│   ├── LoginPage.jsx            # Login with demo credential autofill
│   ├── admin/AdminDashboard.jsx # User approval panel
│   ├── issuer/IssuerDashboard.jsx # Issue credentials + view list
│   ├── holder/HolderDashboard.jsx # View credentials + history + QR
│   └── verifier/VerifierDashboard.jsx # 3-step verify flow + history
└── App.jsx                       # Routes & role-based guards
```

## Tech Stack
- React 18 + Vite
- TailwindCSS 3
- React Router v6
- Axios (JWT auth)
- react-hot-toast (blockchain-themed toasts)
- react-icons/fi
- qrcode (QR generation)
- html5-qrcode (camera scanner)

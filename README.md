# AYUREG — AYUSH Registration & Compliance Portal

A full-stack portal that guides AYUSH (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy)
startups to the right licence pathway, helps them prepare documents with AI pre-verification, and
routes every application to a human government officer for the final decision. **AI screens; a
human officer always approves or rejects.**

## Stack

- **Backend:** Node.js / Express, PostgreSQL (raw SQL via `pg`), JWT + mocked OTP auth, Tesseract.js OCR
- **Frontend:** React (Vite), React Router, Tailwind CSS, lucide-react icons, Zustand, React Hook Form
- **AI services:** stubbed/rule-based by default (`backend/src/services/aiEligibility.js`,
  `documentVerification.js`, `complianceAssistant.js`) — each exposes a documented JSON contract so a
  real LLM can be swapped in later without touching controllers or routes.

## Prerequisites

- Node.js 18+
- Docker (for Postgres) — or your own Postgres instance

## Setup

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev        # http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:4000`, so just open http://localhost:5173.

## Seeded accounts

| Role      | Email                      | Password       |
|-----------|-----------------------------|-----------------|
| Admin     | admin@ayureg.gov.in         | Admin@123       |
| Officer   | officer@ayureg.gov.in       | Officer@123     |
| Applicant | founder@example.com         | Applicant@123   |

Login is a two-step flow (password, then OTP). Since SMS/email delivery is mocked, the OTP is
printed to the backend console **and** returned in the login response as `devOtp` for convenience
during local development — remove that field before shipping to production.

## Project structure

```
/backend
  /src
    /routes        # thin Express routers
    /controllers    # request handling + orchestration
    /services       # aiEligibility.js, documentVerification.js, complianceAssistant.js, storage.js
    /middleware     # auth (JWT), roleGuard, errorHandler, upload (multer)
    /db             # schema.sql, migrate.js, seed.js
  server.js
/frontend
  /src
    /pages          # Landing, Login, Dashboard, NewApplication, OfficerQueue, Admin...
    /components     # Navbar, Footer, StatusTimeline, DocumentUploader, ProtectedRoute
    /context        # Zustand auth store
    /api            # fetch client wrapper
```

## Swapping in a real LLM / OCR provider

- `backend/src/services/aiEligibility.js` — pathway identification + checklist generation. Replace
  the rule-based logic with a call to your LLM of choice, keeping the same function signatures.
- `backend/src/services/documentVerification.js` — OCR via Tesseract.js today; swap `runOcr` for a
  cloud OCR API if you need higher accuracy, and/or feed OCR text to an LLM for `evaluateOcrText`.
- `backend/src/services/complianceAssistant.js` — multilingual Q&A, currently canned responses.
- `backend/src/services/storage.js` — local disk today; swap for an S3-compatible client.

None of these changes require touching routes, controllers, or the frontend.

## Design principle: AI never approves

Every application — regardless of AI pre-verification outcome — moves to `manual_verification` and
must be approved, rejected, or sent back for correction by a human officer
(`PUT /api/officer/applications/:id/decision`, which requires a mandatory reason). Certificates are
only issued after both an `approved` decision and a completed payment.

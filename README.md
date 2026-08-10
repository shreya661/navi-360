<div align="center">

# NAVI 360

**Turn confusing government notices into plain-language guidance — in your own language.**

[![License: Unlicensed](https://img.shields.io/badge/license-unlicensed-lightgrey.svg)](#license)
[![Backend: FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React + Vite](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![Deploy on Render](https://img.shields.io/badge/deploy-Render-46E3B7.svg)](https://render.com/deploy)



</div>

---

## What it does

Government notices — tax letters, welfare eligibility forms, court summons, utility disconnection notices — are often dense, jargon-heavy, and stressful to read. **NAVI 360** takes a photo, PDF, screenshot, or pasted block of text and returns:

- A **plain-language explanation** of what the notice actually says
- A **checklist** of what you need to do next
- A **timeline** of relevant dates and deadlines
- The **official next step**, sourced only from a vetted catalog of government links
- Optional **audio playback** in your selected language

> ⚠️ NAVI 360 is an explanation and navigation aid. It does not determine eligibility, provide legal advice, or replace the official government portal.

## Features

| | |
|---|---|
| 📄 **Multi-format input** | JPG, PNG, WEBP, PDF, TXT, Markdown, or pasted text |
| 🌐 **5 languages** | English, Hindi, Telugu, Tamil, Bengali |
| 🔍 **Evidence-aware** | Separates confirmed document facts from details that still need verification |
| ✅ **Actionable output** | Document checklist, evidence record, and timeline — not just a summary |
| 🔗 **Trusted sources only** | Official links come from a curated catalog; the app never generates government URLs on the fly |
| 🔊 **Text-to-speech** | Optional Bhashini voice output, with browser-voice fallback |
| 🔒 **Privacy-first** | Uploaded files, pasted text, extracted text, previews, and audio are never stored — only analysis metadata |

## Tech stack

- **Frontend:** React + Vite
- **Backend:** Python, FastAPI, Pydantic, Uvicorn
- **AI:** [NVIDIA NIM](https://build.nvidia.com/) (optional — enables live extraction, plain-language rewriting, and claim tagging)
- **Voice:** [Bhashini](https://bhashini.gov.in/) (optional text-to-speech)
- **Storage:** SQLite (metadata only)
- **Deployment:** Docker, Docker Compose, Railway, Render

## Project structure

```text
navi-360/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Extraction, AI, storage, TTS, and safety logic
│   │   └── models/          # Request/response schemas
│   └── requirements.txt
├── frontend/
│   └── src/                 # React interface and components
├── data/
│   └── official_sources.json
├── .env.example             # Safe environment-variable template
├── docker-compose.yml
├── Dockerfile                # Single-service production image
└── DEPLOYMENT.md
```

## Quick start

### Prerequisites

- Python 3.13+
- Node.js 24+ and npm
- An NVIDIA API key for live AI responses (optional — the app runs in demo fallback mode without one)

### 1. Configure your environment

```powershell
Copy-Item .env.example .env
```

Open `.env` and set `NVIDIA_API_KEY` to enable live extraction, plain-language rewriting, and claim tagging. Bhashini credentials are optional. **Never commit your `.env` file.**

### 2. Install and run the backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 3. Install and run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite address shown in the terminal — normally `http://localhost:5173`.

## Environment variables

Copy `.env.example` and change only what your environment needs.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated origins allowed to call the API. |
| `APP_ENV` | `development` | Set to `production` for deployed environments. |
| `EXPOSE_DOCS` | `true` | Enables FastAPI docs at `/docs`. Disable in public production deployments. |
| `REQUIRE_LIVE_AI` | `false` | When `true`, requests fail safely if NVIDIA AI is not configured. |
| `MAX_UPLOAD_MB` | `8` | Maximum size of one evidence file. |
| `MAX_TOTAL_UPLOAD_MB` | `16` | Maximum combined upload size per analysis. |
| `MAX_EVIDENCE_FILES` | `6` | Maximum uploaded evidence files per analysis. |
| `MAX_TEXT_CHARS` | `20000` | Maximum pasted-text length. |
| `ANALYSIS_DB_PATH` | `data/navi360.db` | SQLite database path. |
| `ANALYSIS_RETENTION_DAYS` | `30` | Retention period for saved analysis records. |
| `RATE_LIMIT_PER_MINUTE` | `20` | Per-client limit for analysis requests. |
| `NVIDIA_API_KEY` | — | Required for live NVIDIA NIM use. |
| `BHASHINI_TTS_URL` | — | Enables Bhashini text-to-speech. |
| `BHASHINI_API_KEY` / `BHASHINI_USER_ID` | — | Bhashini credentials. |

## API

When `EXPOSE_DOCS=true`, interactive API documentation is available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check. |
| `GET` | `/ready` | Returns whether the service is ready and live AI is configured. |
| `POST` | `/analyze` | Analyzes uploaded files and/or pasted notice text. |
| `GET` | `/analyses/{request_id}` | Fetches a saved analysis. |
| `DELETE` | `/analyses/{request_id}` | Permanently removes a saved analysis. |

`POST /analyze` accepts multipart form data:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `files` | file list | No* | Up to six supported files. |
| `text_input` | string | No* | Pasted notice text. |
| `language` | string | No | One of `en`, `hi`, `te`, `ta`, or `bn`; defaults to `te`. |

\* Provide at least one file or non-empty `text_input`.

## Deployment

NAVI 360 ships with Docker, Docker Compose, Railway, and Render configs. For step-by-step production guidance — including HTTPS/CORS setup, persistent storage, and a multi-replica database note — see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

**Fastest path to a live demo:**

1. Create a free [Render](https://render.com) account.
2. Deploy this repo as a Blueprint using the included [`render.yaml`](render.yaml).
3. Keep the **Free** instance type and create the service.
4. Open the supplied `onrender.com` URL once the build finishes.

The free tier sleeps after 15 minutes of inactivity (first request after sleep can take ~1 minute) and its filesystem is temporary, so saved analyses don't survive a restart. Add `NVIDIA_API_KEY` as a Render secret to enable live AI responses.

## Security and privacy

- Production requires explicit HTTPS origins; wildcard CORS is rejected.
- The API applies an in-process rate limit to analysis requests.
- Responses include hardening headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.).
- No original upload content, pasted text, extracted source text, previews, or generated audio is ever saved.
- Official links come only from [`data/official_sources.json`](data/official_sources.json) — review this catalog regularly.
- SQLite suits a single persistent replica. Migrate to PostgreSQL before scaling to multiple backend replicas.

## Roadmap / known limitations

- SQLite storage limits deployment to a single backend replica.
- No license file is currently included — add one before accepting external contributions.

## Contributing

Issues and pull requests are welcome. Please open an issue describing the change before submitting a large PR.

## License

No license file is currently included. Add a license before distributing or accepting external contributions.

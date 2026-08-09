# NAVI 360

NAVI 360 helps people understand government notices in plain language. Upload a notice, screenshot, PDF, message, or pasted text and receive an evidence-aware explanation, checklist, timeline, official next step, and optional audio in the language you select.

> NAVI 360 is an explanation and navigation aid. It does not determine eligibility, provide legal advice, or replace the official government portal.

## Highlights

- Accepts JPG, PNG, WEBP, PDF, TXT, Markdown, and pasted text.
- Supports English, Hindi, Telugu, Tamil, and Bengali.
- Identifies document facts, helpful interpretation, and details that still need confirmation.
- Produces a document checklist, evidence record, and evidence timeline.
- Uses a curated catalog of official sources; it never generates government URLs at runtime.
- Offers Bhashini text-to-speech when configured, with a browser-voice fallback where available.
- Lets users copy or download a privacy-safe summary.
- Stores completed analysis metadata in SQLite, but never retains uploaded file bytes, pasted text, extracted source text, previews, or audio.

## Built with

- Frontend: React and Vite
- Backend: Python, FastAPI, Pydantic, and Uvicorn
- AI services: NVIDIA NIM (optional for live extraction, rewriting, and claim tagging)
- Voice: Bhashini (optional)
- Storage: SQLite
- Deployment: Docker, Docker Compose, and Railway

## Project structure

```text
Navi 360/
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
- An NVIDIA API key for live AI responses (optional for local demo behavior)

### 1. Create and configure your environment

```powershell
Copy-Item .env.example .env
```

Open `.env` and set `NVIDIA_API_KEY` to enable live extraction, plain-language rewriting, and claim tagging. Bhashini credentials are optional. Do not commit your `.env` file.

### 2. Install backend dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

### 3. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

### 4. Start the API

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 5. Start the web app

In another terminal:

```powershell
cd frontend
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

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

## Docker

The Compose setup runs the API and frontend together. It persists SQLite data in a named Docker volume.

```powershell
Copy-Item .env.example .env
# Add NVIDIA_API_KEY and production settings to .env.
docker compose up --build -d
```

Open `http://localhost:8080`.

For full production guidance, including Railway deployment and a multi-replica database note, read [DEPLOYMENT.md](DEPLOYMENT.md).

## Free demo deployment (Render)

This repository includes a [`render.yaml`](render.yaml) Blueprint for a no-payment-method demo deployment. It builds the root `Dockerfile`, which serves the React frontend and FastAPI backend from one Render web service.

1. Create a free Render account and open [Render Blueprint deploy](https://render.com/deploy).
2. Choose this repository: `https://github.com/shreya661/navi-360`.
3. Keep the **Free** instance type and create the service.
4. Wait for the build to finish, then open the supplied `onrender.com` URL.

The free service sleeps after 15 minutes of inactivity, so the first request after sleeping can take about a minute. Its filesystem is temporary: saved SQLite analyses disappear after a restart or redeploy. The default configuration runs in demo fallback mode without an AI key. Add `NVIDIA_API_KEY` as a Render environment secret when you are ready to enable live AI responses.

## Security and privacy

- Production requires explicit HTTPS origins; wildcard CORS is rejected.
- The API applies an in-process rate limit to analysis requests.
- Responses include common hardening headers, including `X-Frame-Options` and `X-Content-Type-Options`.
- No original upload content, pasted text, extracted source text, previews, or generated audio is saved.
- Official links come only from [`data/official_sources.json`](data/official_sources.json). Review this catalog regularly.
- SQLite is appropriate for one persistent service replica. Use a shared database such as PostgreSQL before scaling to multiple backend replicas.

## Deployment checklist

Before making NAVI 360 public:

1. Set `APP_ENV=production` and `EXPOSE_DOCS=false`.
2. Set `REQUIRE_LIVE_AI=true` and configure `NVIDIA_API_KEY`.
3. Set `ALLOWED_ORIGINS` to the exact public HTTPS frontend origin.
4. Use persistent storage for the SQLite database, or migrate to PostgreSQL for multiple replicas.
5. Keep all provider credentials in your hosting platform’s encrypted environment variables.
6. Confirm `/health` and `/ready` after deployment.

## License

No license file is currently included. Add a license before distributing or accepting external contributions.

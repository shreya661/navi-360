Here's your complete README in a single markdown block — copy everything below and paste directly into `README.md`:

```markdown
<div align="center">
  <img src="https://via.placeholder.com/120x120/4F46E5/FFFFFF?text=N" alt="NAVI 360" width="120" />
  
  # NAVI 360
  
  **Government notices, decoded. In your language.**

  [![License](https://img.shields.io/badge/license-unlicensed-lightgrey)](#license)
  [![Backend: FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Frontend: React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)](https://react.dev/)
  [![AI: Claude](https://img.shields.io/badge/AI-Claude_%2B_NVIDIA_NIM-7B61FF)](https://anthropic.com)
  [![TTS: Bhashini](https://img.shields.io/badge/voice-Bhashini-FF6B35)](https://bhashini.gov.in)
  [![Deploy on Render](https://img.shields.io/badge/deploy-Render-46E3B7?logo=render)](https://render.com)
</div>

---

## The problem

A welfare eligibility letter. A tax notice. A court summons. A scholarship deadline.

Millions of Indians receive government notices they can't fully understand — dense legal language, unfamiliar formatting, and often in a language they don't read comfortably. Missing a deadline or misunderstanding a requirement can mean losing benefits, paying penalties, or worse.

## What NAVI 360 does

Snap a photo of any government notice and get:

| What you get | How it helps |
|:---|:---|
| Plain-language explanation | No jargon, no legalese — just what the notice actually says |
| Action checklist | Exactly what you need to do next, step by step |
| Timeline | All dates and deadlines, extracted and highlighted |
| Official source link | The real government URL — never AI-generated |
| Trust tagging | What's confirmed fact vs. what needs verification |
| Missing documents | What you still need to gather before applying |
| Audio playback | Listen to the explanation in your chosen language |

> NAVI 360 explains notices. It doesn't determine eligibility, offer legal advice, or replace official portals.

## Languages we speak

| Priority | Language | Status |
|:---|:---|:---|
| 1 | English | Live (most source documents are in English) |
| 2 | Hindi | Live (widest national coverage) |
| 3 | Telugu | Live (flagship demo language) |
| 4 | Tamil | Supported in UI, coming soon |
| 5 | Bengali | Supported in UI, coming soon |

## How it works (the smart way)

No single mega-prompt. No hallucinated government URLs. NAVI 360 uses a chained pipeline designed for accuracy and auditability:

```
Photo Upload → Vision Extraction → Trust Tagger → Missing Docs Check → Official Source Lookup → Natural Translation → TTS Audio → Streaming UI
```

### Why this matters:

- Each step is independent — if the translation fails, you still get the checklist
- Streaming output — results appear progressively, not behind a single spinner
- Trust tagging uses reasoning, not guesswork — every claim is categorized as fact, interpretation, or uncertain
- Government URLs are a lookup, not a generation — we maintain a curated catalog of 15+ verified source links; the AI only classifies which entry matches

## Architecture

```text
navi-360/
├── backend/                    # FastAPI + Python
│   ├── app/
│   │   ├── routes/
│   │   │   └── analyze.py          # POST /analyze endpoint
│   │   ├── services/
│   │   │   ├── vision_extract.py   # Image to structured text
│   │   │   ├── trust_tagger.py     # Fact/interpretation/uncertain labeling
│   │   │   ├── missing_info.py     # Document checklist logic
│   │   │   ├── official_source.py  # Curated catalog lookup
│   │   │   ├── translator.py       # Natural rendering (EN to TE/HI)
│   │   │   └── tts_service.py      # Bhashini TTS integration
│   │   ├── prompts/                # Versioned prompt files (.txt)
│   │   └── models/schemas.py       # Pydantic response schemas
│   └── requirements.txt
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── components/
│       │   ├── UploadPanel.jsx      # Drag/drop + camera capture
│       │   ├── AnalysisView.jsx     # Streaming result display
│       │   ├── TrustBadge.jsx       # Confidence tags (green/blue/yellow/red)
│       │   ├── MissingInfoList.jsx  # Document checklist
│       │   ├── SafeActionGate.jsx   # Verified action links only
│       │   └── LanguageToggle.jsx   # EN/HI/TE switch
│       └── hooks/
│           └── useAnalyzeDocument.js
│
├── data/
│   └── official_sources.json    # Curated whitelist: scheme to real URL
│
├── docker-compose.yml
├── Dockerfile
├── render.yaml                  # One-click Render deploy
├── DEPLOYMENT.md
└── .env.example
```

## Quick start

### Prerequisites

- Python 3.13+
- Node.js 24+ with npm
- Anthropic API key (for live AI — app runs in demo fallback mode without it)

### 1. Environment setup

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
# Bhashini credentials are optional for TTS
```

### 2. Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate.ps1    # Windows PowerShell

pip install --upgrade pip
pip install -r backend/requirements.txt

uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — you're ready to analyze your first notice.

## API at a glance

Full interactive docs at http://localhost:8000/docs (when EXPOSE_DOCS=true).

| Method | Endpoint | Purpose |
|:---|:---|:---|
| GET | /health | Liveness check |
| GET | /ready | Service readiness + AI status |
| POST | /analyze | Main analysis endpoint |
| GET | /analyses/{id} | Retrieve saved analysis |
| DELETE | /analyses/{id} | Delete saved analysis |

POST /analyze accepts multipart form data:

| Field | Type | Required | Notes |
|:---|:---|:---|:---|
| files | file list | No* | Up to 6 files (JPG, PNG, WEBP, PDF, TXT, MD) |
| text_input | string | No* | Pasted notice text (max 20,000 chars) |
| language | string | No | en, hi, te, ta, or bn (defaults to te) |

*At least one of files or text_input is required.

## Privacy and security

We take "don't make things worse" seriously:

- No file storage — uploaded images, PDFs, and pasted text are processed in memory only
- No audio storage — generated TTS is streamed, never saved
- Metadata only — only analysis IDs and timestamps persist in SQLite
- Curated links only — official URLs come from our vetted catalog, never generated by AI
- Rate limiting — 20 requests/minute per client
- Security headers — X-Frame-Options, X-Content-Type-Options, CSP
- CORS enforcement — wildcard origins rejected in production
- 30-day data retention — analysis metadata auto-expires

## Deployment

### Render (fastest, free tier)

1. Fork this repo
2. Create a Render account
3. Deploy as Blueprint using the included render.yaml
4. Add ANTHROPIC_API_KEY as an environment secret
5. Open your .onrender.com URL

Free tier note: Service sleeps after 15 min inactivity. Cold start takes about 1 minute.

### Docker

```bash
docker compose up --build
```

### Railway or bare metal

See DEPLOYMENT.md for production configuration including HTTPS/CORS setup, persistent storage migration (SQLite to PostgreSQL), and multi-replica considerations.

## Environment variables

| Variable | Default | Purpose |
|:---|:---|:---|
| ALLOWED_ORIGINS | http://localhost:5173 | Comma-separated CORS origins |
| APP_ENV | development | Set to production for deployed environments |
| EXPOSE_DOCS | true | Enables /docs (disable in public production) |
| REQUIRE_LIVE_AI | false | When true, fails if AI API is unavailable |
| MAX_UPLOAD_MB | 8 | Max single file size |
| MAX_TOTAL_UPLOAD_MB | 16 | Max combined upload per request |
| MAX_EVIDENCE_FILES | 6 | Max files per analysis |
| MAX_TEXT_CHARS | 20000 | Max pasted text length |
| ANALYSIS_DB_PATH | data/navi360.db | SQLite database location |
| ANALYSIS_RETENTION_DAYS | 30 | Auto-delete for old analyses |
| RATE_LIMIT_PER_MINUTE | 20 | Requests per client per minute |
| ANTHROPIC_API_KEY | — | Required for live AI responses |
| BHASHINI_TTS_URL | — | Bhashini TTS endpoint (optional) |
| BHASHINI_API_KEY | — | Bhashini API key (optional) |
| BHASHINI_USER_ID | — | Bhashini user ID (optional) |

## What's real vs. roadmap

### Built and working (hackathon slice)

- End-to-end pipeline: Image to Extraction to Trust Tagging to Checklist to Translation
- Telugu and Hindi natural-language explanations
- Missing document detector (3 notice types)
- Curated official source catalog (15 verified entries)
- TTS audio playback (Bhashini + browser fallback)
- Streaming progressive UI

### Roadmap (post-hackathon)

| Feature | Status |
|:---|:---|
| Case Memory — track your notices over time | Roadmap |
| Evidence Builder — multi-document timeline | Roadmap |
| NAVI Protect — manipulative UI/fraud detection | Roadmap |
| Eligibility Checker — benefit program matching | Roadmap |
| WhatsApp bot — analyze via forwarded messages | Roadmap |

## Contributing

Issues and PRs welcome. Please open an issue first to discuss significant changes.

```bash
git clone https://github.com/your-org/navi-360.git
cd navi-360
cp .env.example .env
# Follow Quick Start above
```

## Known limitations

- Single replica only — SQLite backend limits horizontal scaling (migrate to PostgreSQL for production)
- Curated catalog scope — official source lookup covers 15 notice types; expanding coverage is a priority
- No license file — add one before accepting external contributions or distributing

## License

No license currently specified. Add a license before distribution or external contribution.

---

<div align="center">

Built for clarity. Designed for trust. Speaking your language.

NAVI 360 — because understanding your rights shouldn't require a law degree.

</div>
```

This is your complete README in one single markdown block — just copy everything and paste into your `README.md` file.

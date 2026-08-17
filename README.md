<div align="center">

# 🛡️ NAVI 360

### Government notices, decoded. In your language.

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://www.nvidia.com/en-us/ai/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Bhashini](https://img.shields.io/badge/Bhashini_TTS-FF6F00?style=for-the-badge&logoColor=white)](https://bhashini.gov.in/)

<br/>

**Snap a government notice → Understand it → Know what to do → Act on time**

*Built for citizens who need clarity, not complexity.*

</div>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [What NAVI 360 Does](#-what-navi-360-does)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [Contributing](#-contributing)

---

## 🔍 The Problem

Government communication is written for administrators, not ordinary citizens.

A welfare eligibility letter. A tax notice. A scholarship announcement. A legal or administrative notice.

For millions of people, these documents are difficult to understand because of:

- 📜 Complex legal language
- 🏛️ Unfamiliar government terminology
- 📅 Multiple deadlines buried in long paragraphs
- 📄 Unclear document requirements
- 🌐 Language barriers
- ❓ No clear next steps

Missing a deadline or misunderstanding a requirement can result in **missed welfare benefits, rejected applications, penalties, or lost scholarship opportunities**.

**NAVI 360 turns complicated government notices into clear, actionable information.**

---

## 💡 What NAVI 360 Does

Upload or capture a photo of a government notice. NAVI 360 processes the document and produces a simple, structured explanation — in your preferred language.

```
📷 Upload Notice → 🤖 AI Extraction → 📋 Clear Explanation → ✅ Action Steps
```

---

## ✨ Features

### Core AI Analysis (NAVI Protect)
| Feature | Description |
|---|---|
| **Plain-language explanation** | Converts complex government language into easy-to-understand language |
| **Trust tagging** | Separates confirmed facts from information requiring verification |
| **Action checklist** | Shows exactly what the citizen needs to do next |
| **Timeline extraction** | Finds important dates, deadlines and time limits |
| **Document checklist** | Identifies required documents mentioned in the notice |
| **Official source linking** | Points users toward the verified government source |
| **Multilingual output** | Explains the notice in English, Hindi, Telugu, Tamil, or Bengali |
| **Audio playback** | Listen to the explanation via Bhashini TTS integration (falls back to native browser text-to-speech if unconfigured) |
| **Demo mode** | Works without an API key using intelligent text-based fallback extraction |

### Case Management
| Feature | Description |
|---|---|
| **Create & track cases** | Organize notices into named cases with priority and status |
| **Case search** | Search across case titles and descriptions |
| **Status tracking** | Mark cases as Open, In Progress, or Resolved |
| **Priority levels** | Assign High, Medium, or Low priority to each case |

### Evidence Vault
| Feature | Description |
|---|---|
| **Secure file upload** | Upload PDFs, images, and screenshots as evidence |
| **Text snippets** | Paste reference text or serial numbers directly |
| **Category organization** | Organize evidence into Documents, Screenshots, Receipts, Official Sources |
| **Category filtering** | Filter the vault by evidence category |

### Reminders & Deadlines
| Feature | Description |
|---|---|
| **Deadline tracking** | Create reminders with specific due dates |
| **Priority levels** | Set urgency (high, medium, low) per reminder |
| **Completion tracking** | Mark reminders as complete when done |
| **Overdue detection** | Visual indicators for overdue and upcoming deadlines |

### User System
| Feature | Description |
|---|---|
| **User authentication** | Secure registration and login with password hashing |
| **Profile management** | Edit name, email, and notification preferences |
| **API key management** | Users can provide their own NVIDIA API key for live AI |
| **Language preferences** | Set default language for analysis output |
| **Session management** | Secure token-based sessions with 30-day expiry |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NAVI 360 System                       │
│                                                         │
│  ┌──────────────┐         ┌──────────────────────────┐  │
│  │   React SPA  │  REST   │      FastAPI Backend     │  │
│  │              │◄───────►│                          │  │
│  │  • Sidebar   │  /api/* │  • Auth & Sessions       │  │
│  │  • NAVI      │         │  • Cases CRUD            │  │
│  │    Protect   │         │  • Evidence Vault CRUD   │  │
│  │  • Cases     │         │  • Reminders CRUD        │  │
│  │  • Evidence  │         │  • AI Analysis Pipeline  │  │
│  │  • Reminders │         │  • Rate Limiting         │  │
│  │  • Settings  │         │  • Security Headers      │  │
│  └──────────────┘         └───────────┬──────────────┘  │
│                                       │                 │
│                           ┌───────────┴──────────────┐  │
│                           │       SQLite DB          │  │
│                           │  users, sessions, cases  │  │
│                           │  evidence, reminders,    │  │
│                           │  analyses, settings      │  │
│                           └──────────────────────────┘  │
│                                       │                 │
│                           ┌───────────┴──────────────┐  │
│                           │    External Services     │  │
│                           │  • NVIDIA NIM (Vision)   │  │
│                           │  • Bhashini TTS (Voice)  │  │
│                           └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### AI Pipeline

NAVI 360 uses a structured pipeline — not a single AI prompt:

```
Document Upload → Vision Extraction → Entity Parsing → AI Reasoning → Trust Verification → Multilingual Output + Voice
```

1. **Vision Extraction** — NVIDIA NIM vision model reads document images and extracts raw text
2. **Text Extraction** — PDF text extraction via PyPDF for document files
3. **Structure Parsing** — Identifies entities: dates, issuers, requirements, deadlines
4. **AI Reasoning** — Generates plain-language explanation, action items, trust claims
5. **Source Verification** — Links to official government sources from curated catalog
6. **Multilingual Output** — Translates explanation into user's preferred language
7. **Audio Generation** — Bhashini TTS converts explanation to spoken audio

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Vanilla CSS |
| **Backend** | Python 3.13, FastAPI, Uvicorn |
| **Database** | SQLite with schema migrations |
| **AI/ML** | NVIDIA NIM API (Qwen Vision, DeepSeek Text) |
| **Voice** | Bhashini TTS API |
| **Auth** | PBKDF2-HMAC-SHA256 password hashing, token-based sessions |
| **Container** | Docker multi-stage build |
| **Deployment** | Render, Railway, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+ 
- Node.js 20+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/shreya661/navi-360.git
cd navi-360
```

### 2. Set up the backend

```bash
# Create environment file
cp .env.example .env
# Edit .env and optionally add your NVIDIA_API_KEY (app works in demo mode without it)

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the frontend

```bash
# In a new terminal
cd frontend
npm install

# Start the development server
npm run dev
```

### 4. Open the app

Navigate to **http://localhost:5173** — the frontend connects to the backend at `localhost:8000` automatically.

> **Note:** The app works in **demo mode** without any API keys. To enable live AI analysis, add your `NVIDIA_API_KEY` to the `.env` file or enter it in Settings within the app.

---

## 📁 Project Structure

```
navi-360/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, middleware, static serving
│   │   ├── routes/
│   │   │   ├── analyze.py          # POST /api/analyze — AI analysis pipeline
│   │   │   ├── auth.py             # Auth: register, login, logout, profile
│   │   │   ├── cases.py            # Cases CRUD
│   │   │   ├── evidence.py         # Evidence vault CRUD + file upload
│   │   │   ├── reminders.py        # Reminders CRUD
│   │   │   └── search.py           # GET /api/search — resource search
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic models for all data types
│   │   └── services/
│   │       ├── database.py         # SQLite init, migrations, helpers
│   │       ├── llm_client.py       # NVIDIA NIM API client
│   │       ├── vision_extract.py   # Document vision extraction
│   │       ├── text_pipeline.py    # Text analysis pipeline
│   │       ├── tts.py              # Bhashini TTS integration
│   │       ├── rate_limit.py       # In-memory rate limiter
│   │       ├── settings.py         # Pydantic settings from env
│   │       └── prompts/            # AI prompt templates
│   ├── tests/
│   │   └── test_api.py             # 7 integration tests
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app with routing & state
│   │   ├── components/
│   │   │   ├── NaviProtectView.jsx # Main AI analysis interface
│   │   │   ├── AnalysisView.jsx    # Analysis result display
│   │   │   ├── CasesView.jsx       # Case management UI
│   │   │   ├── EvidenceVaultView.jsx # Evidence storage UI
│   │   │   ├── RemindersView.jsx   # Deadline tracking UI
│   │   │   ├── SettingsView.jsx    # User settings & profile
│   │   │   ├── AuthModal.jsx       # Login/register modal
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   ├── SearchPanel.jsx     # Resource search
│   │   │   ├── UploadPanel.jsx     # File upload interface
│   │   │   └── ...                 # Other UI components
│   │   ├── hooks/
│   │   │   └── useAnalyzeDocument.js # Analysis state management
│   │   ├── lib/
│   │   │   └── api.js              # Centralized API client
│   │   └── styles.css              # Complete application styles
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                      # Multi-stage: Node build + Python runtime
├── docker-compose.yml              # Local Docker deployment
├── render.yaml                     # Render.com deployment config
├── railway.toml                    # Railway deployment config
├── DEPLOYMENT.md                   # Detailed deployment guide
├── .env.example                    # Environment variable template
└── .gitignore
```

---

## 📡 API Reference

All API endpoints are prefixed with `/api`.

### Health & Readiness
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/ready` | Readiness check (AI config status) |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Sign in and receive auth token |
| `POST` | `/api/auth/logout` | Invalidate current session |
| `GET` | `/api/auth/me` | Get current user profile |
| `PATCH` | `/api/auth/me` | Update profile and settings |

### AI Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload notice for AI analysis (multipart form) |

### Cases
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases` | List all cases (supports `?q=` search) |
| `POST` | `/api/cases` | Create a new case |
| `GET` | `/api/cases/:id` | Get case detail |
| `DELETE` | `/api/cases/:id` | Delete a case |

### Evidence Vault
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/evidence` | List evidence (supports `?category=` filter) |
| `POST` | `/api/evidence` | Upload evidence file or text (multipart form) |
| `DELETE` | `/api/evidence/:id` | Delete evidence item |

### Reminders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders` | List all reminders |
| `POST` | `/api/reminders` | Create a reminder |
| `PUT` | `/api/reminders/:id` | Update / mark as complete |
| `DELETE` | `/api/reminders/:id` | Delete a reminder |

### Search
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/search?q=` | Search government resources |

---

## 🌐 Deployment

### Option 1: Docker Compose (Local)

```bash
cp .env.example .env
# Edit .env — add NVIDIA_API_KEY for live AI (optional)
docker compose up --build -d
# Open http://localhost:8000
```

### Option 2: Render (Free Tier — Recommended)

1. Push the repo to GitHub
2. Connect the repo to [Render](https://render.com)
3. Render auto-detects `render.yaml` — confirm the settings
4. Set `ALLOWED_ORIGINS` to your Render service URL in the dashboard
5. Optionally set `NVIDIA_API_KEY` as a secret for live AI
6. Deploy — health check at `/api/health` confirms it's running

> [!WARNING]
> **SQLite Ephemeral Storage Warning (Render Free tier):**
> Render's Free tier does not persist files written to disk between restarts.
> As a result, the SQLite database (`data/navi360.db`) and uploaded files under `data/uploads/` will be reset whenever the service restarts (typically once a day or on redeployment).
> For a full production deployment requiring permanent persistence, configure a persistent disk mount on Render, or integrate PostgreSQL or external object storage (e.g. AWS S3) for uploads.

### Option 3: Railway

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Railway deployment instructions.

---

## ⚙️ Configuration

All configuration is via environment variables. See [`.env.example`](./.env.example) for the full list.

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Set to `production` for production mode |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `NVIDIA_API_KEY` | *(none)* | NVIDIA NIM API key for live AI |
| `EXPOSE_DOCS` | `true` | Show `/docs` Swagger UI |
| `RATE_LIMIT_PER_MINUTE` | `20` | Max analysis requests per minute per IP |
| `MAX_UPLOAD_MB` | `8` | Max single file upload size |
| `ANALYSIS_DB_PATH` | `data/navi360.db` | SQLite database path |
| `ANALYSIS_RETENTION_DAYS` | `30` | How long to keep analysis records |
| `BHASHINI_TTS_URL` | *(none)* | Bhashini TTS API endpoint |
| `BHASHINI_API_KEY` | *(none)* | Bhashini API key for voice output |

### Security Notes

- 🔐 Never commit your `.env` file — it's in `.gitignore`
- 🔐 Never set `ALLOWED_ORIGINS=*` in production
- 🔐 Passwords are hashed with PBKDF2-HMAC-SHA256
- 🔐 Sessions expire after 30 days
- 🔐 Security headers (HSTS, X-Frame-Options, CSP) are set in production

---

## 🧪 Testing

```bash
cd backend
python -m pytest tests -v
```

Current test coverage:
- ✅ Health & readiness endpoints
- ✅ User registration → login → profile flow
- ✅ Cases CRUD lifecycle
- ✅ Reminders CRUD lifecycle
- ✅ Analysis submission & validation
- ✅ Analysis storage & retrieval

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of the NAVI 360 initiative to make government communication accessible to all citizens.

---

<div align="center">

**Built with ❤️ for citizens who deserve clarity, not complexity.**

</div>

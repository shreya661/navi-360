# Deploy NAVI 360

## Before deployment

1. Create a `.env` file from `.env.example`; never commit it.
2. Set a real `NVIDIA_API_KEY` and use the exact model IDs shown by the NVIDIA API Catalog.
3. For a real public service, set these production values:

   ```env
   APP_ENV=production
   EXPOSE_DOCS=false
   REQUIRE_LIVE_AI=true
   ALLOWED_ORIGINS=https://your-domain.example
   ANALYSIS_RETENTION_DAYS=30
   RATE_LIMIT_PER_MINUTE=20
   ```

4. Use a domain with HTTPS. Never deploy the API with `ALLOWED_ORIGINS=*`.

## Docker deployment

The included Docker Compose configuration runs the API and frontend together. It stores the SQLite data in a named Docker volume so redeploying containers does not erase saved analyses.

```powershell
Copy-Item .env.example .env
# Edit .env and add NVIDIA_API_KEY, then set production values above.
docker compose up --build -d
```

Open `http://localhost:8080`. For an internet-facing deployment, put this stack behind your cloud provider's HTTPS load balancer or reverse proxy and set `ALLOWED_ORIGINS` to the public site URL.

## Recommended: Railway + SQLite

Railway is the simplest production host for the current application because it can deploy from GitHub and attach a persistent volume to the same service. NAVI includes a root `Dockerfile` and `railway.toml` that build the React frontend and FastAPI API into one web service.

1. Push this project to a new GitHub repository.
2. In Railway, choose **New Project** → **Deploy from GitHub Repo** and select the repository.
3. Add a Railway volume and mount it at `/data`.
4. Add these service variables:

   ```env
   APP_ENV=production
   EXPOSE_DOCS=false
   REQUIRE_LIVE_AI=true
   ANALYSIS_DB_PATH=/data/navi360.db
   ANALYSIS_RETENTION_DAYS=30
   NVIDIA_API_KEY=your_nvidia_key
   ```

5. Deploy. Railway provides an HTTPS domain; open it and confirm `/health` returns `ok`.

This SQLite setup must run as one service replica because a SQLite file cannot be shared safely by multiple application instances. Railway volumes persist across redeploys and can be backed up. If NAVI grows to multiple replicas, migrate the stored summaries to Postgres.

## Separate frontend and backend hosts

Build the frontend with the public API origin:

```powershell
cd frontend
$env:VITE_API_URL = "https://api.your-domain.example"
npm run build
```

Deploy `frontend/dist` to any static hosting provider. Deploy the backend container to a service that supports persistent disks; mount the disk at `/app/data`. Configure `ALLOWED_ORIGINS=https://your-domain.example` on the backend.

## Operational checklist

- Keep NVIDIA, Bhashini, and any provider credentials only in your platform's encrypted environment variables.
- Run only one backend replica while using SQLite. For multiple replicas, move `analysis_store.py` to managed PostgreSQL first.
- Use provider-level rate limiting/WAF in addition to the in-process limit.
- Review the official-source catalog regularly; it intentionally never searches the web or creates URLs at runtime.
- Monitor `/health` for liveness and `/ready` for whether live AI configuration is present.
- Results are retained for 30 days by default. NAVI deliberately does not store original uploads, pasted text, extracted source text, previews, or audio.

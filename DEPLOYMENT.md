# Deploy NAVI 360

## Before deployment

1. Create a `.env` file from `.env.example`; never commit it.
2. Optionally set `NVIDIA_API_KEY` for live AI (the app works in demo mode without it).
3. For a production deployment, set these values:

   ```env
   APP_ENV=production
   EXPOSE_DOCS=false
   ALLOWED_ORIGINS=https://your-domain.example
   ANALYSIS_RETENTION_DAYS=30
   RATE_LIMIT_PER_MINUTE=20
   ```

4. Use a domain with HTTPS. Never deploy the API with `ALLOWED_ORIGINS=*`.

## Docker deployment (Local)

The `docker-compose.yml` builds the entire stack (React frontend + FastAPI backend) into a single container using the root `Dockerfile`. Data is persisted in a named Docker volume.

```bash
cp .env.example .env
# Edit .env — optionally add NVIDIA_API_KEY for live AI
docker compose up --build -d
```

Open `http://localhost:8000`. The frontend and API are served from the same origin — no CORS issues.

For an internet-facing deployment, put this behind your cloud provider's HTTPS load balancer and set `ALLOWED_ORIGINS` to the public site URL.

## Render (Free Tier — Recommended)

Render is the simplest free deployment option. The included `render.yaml` configures everything automatically.

1. Push this project to GitHub.
2. In Render, choose **New → Web Service** and connect the GitHub repo.
3. Render auto-detects the `render.yaml` — confirm the settings.
4. In the Render dashboard, set these environment variables:
   - `ALLOWED_ORIGINS` = your Render service URL (e.g. `https://navi-360.onrender.com`)
   - `NVIDIA_API_KEY` = your NVIDIA NIM key *(optional, for live AI)*
5. Deploy. The health check at `/api/health` confirms the service is running.

## Railway

Railway can deploy from GitHub and attach a persistent volume.

1. Push this project to GitHub.
2. In Railway, choose **New Project → Deploy from GitHub Repo** and select the repository.
3. Add a Railway volume and mount it at `/data`.
4. Add these service variables:

   ```env
   APP_ENV=production
   EXPOSE_DOCS=false
   ANALYSIS_DB_PATH=/data/navi360.db
   ANALYSIS_RETENTION_DAYS=30
   ```

5. Optionally add `NVIDIA_API_KEY` for live AI.
6. Deploy. Railway provides an HTTPS domain; open it and confirm `/api/health` returns `ok`.

## Separate frontend and backend hosts

If you need the frontend and backend on different servers:

```bash
cd frontend
VITE_API_URL=https://api.your-domain.example npm run build
```

Deploy `frontend/dist` to any static hosting provider. Deploy the backend container to a service with persistent disks; mount the disk at `/app/data`. Set `ALLOWED_ORIGINS` on the backend to the frontend URL.

## Operational checklist

- Keep NVIDIA, Bhashini, and any provider credentials only in encrypted environment variables.
- Run only one backend replica while using SQLite. For multiple replicas, migrate to PostgreSQL.
- Use provider-level rate limiting / WAF in addition to the in-process limit.
- Monitor `/api/health` for liveness and `/api/ready` for AI configuration status.
- Sessions expire after 30 days automatically.
- Results are retained for 30 days by default (`ANALYSIS_RETENTION_DAYS`).
- NAVI 360 does not store original uploads permanently — only metadata and extracted text.

from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .routes.analyze import router as analyze_router
from .routes.auth import router as auth_router
from .routes.cases import router as cases_router
from .routes.evidence import router as evidence_router
from .routes.reminders import router as reminders_router
from .routes.search import router as search_router
from .services.database import init_db
from .services.rate_limit import RateLimiter
from .services.settings import get_settings


settings = get_settings()
if settings.is_production and "*" in settings.origins:
    raise RuntimeError("ALLOWED_ORIGINS must name explicit HTTPS origins in production.")

# Initialize SQLite database schema
init_db()

app = FastAPI(
    title="NAVI 360 API",
    version="1.0.0",
    docs_url="/docs" if settings.expose_docs else None,
    redoc_url=None,
)

limiter = RateLimiter(settings.rate_limit_per_minute)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(reminders_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(search_router, prefix="/api")

# Compatibility aliases without /api prefix
app.include_router(analyze_router, include_in_schema=False)
app.include_router(search_router, include_in_schema=False)


@app.middleware("http")
async def protect_api(request: Request, call_next):
    request_id = str(uuid4())
    if request.url.path in ("/analyze", "/api/analyze"):
        client_ip = request.client.host if request.client else "unknown"
        if not limiter.allow(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many analysis requests. Please wait a minute and try again."},
                headers={"Retry-After": "60", "X-Request-ID": request_id},
            )
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "navi-360-api"}


@app.get("/ready")
@app.get("/api/ready")
async def readiness() -> dict[str, Any]:
    return {
        "ready": True,
        "live_ai_configured": bool(settings.nvidia_api_key),
        "db_connected": True,
        "search_available": True,
    }


# Serve static uploads directory if requested
uploads_dir = Path.cwd() / "data" / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/data/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Serve React frontend dist bundle in production Docker environment
frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

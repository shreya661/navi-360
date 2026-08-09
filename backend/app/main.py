from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .routes.analyze import router as analyze_router
from .services.settings import get_settings
from .services.rate_limit import RateLimiter


settings = get_settings()
if settings.is_production and "*" in settings.origins:
    raise RuntimeError("ALLOWED_ORIGINS must name explicit HTTPS origins in production.")
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
    allow_credentials=False,
    allow_methods=["POST", "GET", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(analyze_router)


@app.middleware("http")
async def protect_api(request: Request, call_next):
    request_id = str(uuid4())
    if request.url.path == "/analyze":
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
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "navi-360-api"}


@app.get("/ready")
async def readiness() -> dict[str, bool]:
    return {"ready": True, "live_ai_configured": bool(settings.nvidia_api_key)}


# In the production image, the React bundle is copied to /app/frontend/dist.
frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

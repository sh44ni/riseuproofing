import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import engine
from app.core.redis import init_redis, close_redis, get_redis
from app.api.router import api_router
from app.api.docs_notes import DOCS_DESCRIPTION
from app.middlewares.telemetry import TelemetryMiddleware

STATIC_DEV_DIR = os.path.join(os.path.dirname(__file__), "static", "developer")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    print(f"[{settings.APP_ENV.upper()}] Starting Rise Up Roofing FastAPI backend & Developer Engine...")
    await init_redis()
    yield
    # ── Shutdown ──
    print("Shutting down Rise Up Roofing FastAPI backend...")
    await close_redis()
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    description=DOCS_DESCRIPTION,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS Middleware ──
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "https://riseuprac.com",
    "https://www.riseuprac.com",
    "https://crm.riseuprac.com",
    "https://backend.riseuprac.com",
    "https://development.riseuprac.com",
]
if hasattr(settings, "CORS_ORIGINS") and settings.CORS_ORIGINS:
    if isinstance(settings.CORS_ORIGINS, list):
        origins.extend(settings.CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Request-Id", "Content-Disposition"],
)

# ── Compression Middleware ──
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Telemetry & Live Request Ring Buffer Middleware ──
app.add_middleware(TelemetryMiddleware)

# ── Custom Error Handlers ──
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "error": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Invalid request data"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"ok": False, "error": first_error, "details": errors},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"ok": False, "error": str(exc), "traceback": traceback.format_exc()},
    )

# ── Mount Static Files ──
from fastapi.staticfiles import StaticFiles
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Mount Master API Router ──
app.include_router(api_router)

# ── Standalone Developer Dashboard UI ──
@app.get("/developer", response_class=HTMLResponse, tags=["Developer Dashboard"])
@app.get("/developer/{rest_of_path:path}", response_class=HTMLResponse, tags=["Developer Dashboard"])
@app.get("/developers", response_class=HTMLResponse, tags=["Developer Dashboard"])
@app.get("/developers/{rest_of_path:path}", response_class=HTMLResponse, tags=["Developer Dashboard"])
async def developer_dashboard():
    index_file = os.path.join(STATIC_DEV_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Developer Dashboard UI Not Found</h1>", status_code=404)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ── Root & Health Check ──
@app.get("/health", tags=["Health"])
@app.get("/", tags=["Health"])
async def health_check():
    db_ok = True
    redis_ok = True
    try:
        redis = await get_redis()
        await redis.ping()
    except Exception:
        redis_ok = False

    return {
        "status": "healthy" if (db_ok and redis_ok) else "degraded",
        "service": settings.APP_NAME,
        "env": settings.APP_ENV,
        "database": "connected" if db_ok else "unreachable",
        "redis": "connected" if redis_ok else "unreachable",
        "timestamp": time.time(),
    }

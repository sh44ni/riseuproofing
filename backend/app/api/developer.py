import time
import sys
import platform
import asyncio
import secrets
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, update, delete
import orjson

from app.core.config import settings
from app.core.database import get_db, engine
from app.core.redis import get_redis, cache_delete, cache_get, cache_set
from app.core.developer_auth import (
    verify_seedphrase,
    create_developer_session,
    revoke_developer_session,
    require_developer_session,
)
from app.models.api_key import ApiKey
from app.middlewares.telemetry import (
    in_memory_logs,
    in_memory_counters,
    in_memory_latencies,
    in_memory_rpm,
)

router = APIRouter(prefix="/api/developer", tags=["Developer Dashboard & Telemetry"])

# ── Pydantic Request Schemas ──
class DeveloperLoginRequest(BaseModel):
    seedphrase: str

class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    environment: str = Field(default="live", pattern="^(live|test)$")
    scopes: List[str] = Field(default_factory=lambda: ["*"])
    rate_limit_per_minute: int = Field(default=120, ge=10, le=10000)
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])

class ApiKeyUpdateRequest(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    scopes: Optional[List[str]] = None
    rate_limit_per_minute: Optional[int] = Field(None, ge=10, le=10000)
    allowed_origins: Optional[List[str]] = None

# ── 1. Developer Auth Endpoints ──

@router.post("/auth/login")
async def developer_login(payload: DeveloperLoginRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    is_valid = await verify_seedphrase(payload.seedphrase, client_ip)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid developer seedphrase. Access denied."
        )

    token = await create_developer_session(client_ip)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.DEVELOPER_COOKIE_NAME,
        value=token,
        max_age=settings.DEVELOPER_SESSION_HOURS * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )

    return {
        "ok": True,
        "token": token,
        "expires_in_hours": settings.DEVELOPER_SESSION_HOURS,
        "message": "Developer access granted."
    }

@router.post("/auth/logout")
async def developer_logout(request: Request, response: Response):
    token = request.cookies.get(settings.DEVELOPER_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1].strip()

    if token:
        await revoke_developer_session(token)

    response.delete_cookie(settings.DEVELOPER_COOKIE_NAME)
    return {"ok": True, "message": "Developer session revoked."}

@router.get("/auth/check")
async def developer_auth_check(request: Request):
    token = request.cookies.get(settings.DEVELOPER_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1].strip()

    if not token:
        return {"authenticated": False}

    data = await cache_get(f"dev_session:{token}")
    return {"authenticated": data is not None}

# ── 2. System Status & Vitals ──

@router.get("/status")
async def get_system_status(
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """Real-time server resource usage, Postgres pool metrics, Redis latency, and ARQ queue depth."""
    # 1. Process & OS Vitals
    cpu_pct = 0.0
    mem_info = {"rss_mb": 0.0, "total_mb": 0.0, "percent": 0.0}
    try:
        import psutil
        cpu_pct = psutil.cpu_percent(interval=None)
        vm = psutil.virtual_memory()
        proc = psutil.Process()
        mem_info = {
            "rss_mb": round(proc.memory_info().rss / (1024 * 1024), 2),
            "total_mb": round(vm.total / (1024 * 1024), 2),
            "percent": vm.percent,
        }
    except Exception:
        pass

    # 2. PostgreSQL Connection Pool Vitals
    db_status = "connected"
    db_ping_ms = 0.0
    pool_stats = {
        "size": getattr(engine.pool, "size", lambda: 20)(),
        "checked_in": getattr(engine.pool, "checkedin", lambda: 0)(),
        "checked_out": getattr(engine.pool, "checkedout", lambda: 0)(),
        "overflow": getattr(engine.pool, "overflow", lambda: 0)(),
    }

    try:
        t0 = time.perf_counter()
        await db.execute(text("SELECT 1"))
        db_ping_ms = round((time.perf_counter() - t0) * 1000, 2)
    except Exception as e:
        db_status = f"error: {str(e)}"

    # 3. Redis 7 Vitals
    redis_status = "connected"
    redis_ping_ms = 0.0
    redis_info = {}
    try:
        redis = await get_redis()
        t0 = time.perf_counter()
        await asyncio.wait_for(redis.ping(), timeout=0.25)
        redis_ping_ms = round((time.perf_counter() - t0) * 1000, 2)
        info = await asyncio.wait_for(redis.info(), timeout=0.25)
        redis_info = {
            "used_memory_human": info.get("used_memory_human", "N/A"),
            "connected_clients": info.get("connected_clients", 0),
            "total_commands_processed": info.get("total_commands_processed", 0),
            "uptime_in_days": info.get("uptime_in_days", 0),
        }
    except Exception:
        redis_status = "offline (degraded)"

    # 4. Storage (MinIO / S3) status
    storage_status = "operational" if settings.S3_ENDPOINT_URL else "unconfigured"

    return {
        "ok": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runtime": {
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "environment": settings.ENVIRONMENT,
            "cpu_percent": cpu_pct,
            "memory": mem_info,
        },
        "database": {
            "status": db_status,
            "ping_ms": db_ping_ms,
            "pool": pool_stats,
        },
        "redis": {
            "status": redis_status,
            "ping_ms": redis_ping_ms,
            "metrics": redis_info,
        },
        "storage": {
            "status": storage_status,
            "endpoint": settings.S3_ENDPOINT_URL,
            "media_bucket": settings.S3_BUCKET_MEDIA,
        }
    }

# ── 3. System Metrics & Telemetry ──

@router.get("/metrics")
async def get_system_metrics(
    token: str = Depends(require_developer_session)
):
    """Aggregate latency percentiles (p50, p95, p99), error rates, and RPM time-series."""
    redis_available = False
    curr_min = int(time.time() // 60)
    scores: List[float] = []
    rpm_series: List[Dict[str, Any]] = []

    try:
        redis = await get_redis()
        # 1. Status Code Breakdown
        pipe = redis.pipeline()
        pipe.get("telemetry:total_requests")
        pipe.get("telemetry:total_errors")
        pipe.get("telemetry:status:2xx")
        pipe.get("telemetry:status:3xx")
        pipe.get("telemetry:status:4xx")
        pipe.get("telemetry:status:5xx")
        results = await asyncio.wait_for(pipe.execute(), timeout=0.25)

        total_reqs = int(results[0] or 0)
        total_errs = int(results[1] or 0)
        status_2xx = int(results[2] or 0)
        status_3xx = int(results[3] or 0)
        status_4xx = int(results[4] or 0)
        status_5xx = int(results[5] or 0)

        # 2. Latency Percentiles from sorted set
        latencies = await asyncio.wait_for(
            redis.zrangebyscore("telemetry:latencies", "-inf", "+inf", withscores=True),
            timeout=0.25
        )
        scores = [score for _, score in latencies]

        # 3. RPM Time-Series (Last 30 minutes)
        pipe = redis.pipeline()
        minute_keys = [f"telemetry:rpm:{curr_min - i}" for i in range(29, -1, -1)]
        for k in minute_keys:
            pipe.get(k)
        rpm_vals = await asyncio.wait_for(pipe.execute(), timeout=0.25)

        for i, val in enumerate(rpm_vals):
            min_ts = (curr_min - 29 + i) * 60
            rpm_series.append({
                "time": datetime.fromtimestamp(min_ts, tz=timezone.utc).strftime("%H:%M"),
                "rpm": int(val or 0),
            })
        redis_available = True
    except Exception:
        # Fallback to in-memory telemetry structures when Redis is offline
        total_reqs = in_memory_counters["total_requests"]
        total_errs = in_memory_counters["total_errors"]
        status_2xx = in_memory_counters["2xx"]
        status_3xx = in_memory_counters["3xx"]
        status_4xx = in_memory_counters["4xx"]
        status_5xx = in_memory_counters["5xx"]
        scores = list(in_memory_latencies)

        for i in range(29, -1, -1):
            m = curr_min - i
            min_ts = m * 60
            rpm_series.append({
                "time": datetime.fromtimestamp(min_ts, tz=timezone.utc).strftime("%H:%M"),
                "rpm": in_memory_rpm.get(m, 0),
            })

    error_rate = round((total_errs / total_reqs * 100), 2) if total_reqs > 0 else 0.0

    scores.sort()
    p50, p90, p95, p99, avg_lat = 0.0, 0.0, 0.0, 0.0, 0.0
    if scores:
        n = len(scores)
        p50 = round(scores[int(n * 0.50)], 2)
        p90 = round(scores[int(n * 0.90)], 2)
        p95 = round(scores[int(n * 0.95)], 2)
        p99 = round(scores[min(int(n * 0.99), n - 1)], 2)
        avg_lat = round(sum(scores) / n, 2)

    return {
        "ok": True,
        "redis_connected": redis_available,
        "summary": {
            "total_requests": total_reqs,
            "total_errors": total_errs,
            "error_rate_pct": error_rate,
            "status_distribution": {
                "2xx": status_2xx,
                "3xx": status_3xx,
                "4xx": status_4xx,
                "5xx": status_5xx,
            }
        },
        "latencies_ms": {
            "p50": p50,
            "p90": p90,
            "p95": p95,
            "p99": p99,
            "avg": avg_lat,
            "sample_size": len(scores),
        },
        "throughput_series": rpm_series,
    }

# ── 4. Live Request Debugger & Traceback Explorer ──

@router.get("/logs")
async def get_debug_logs(
    status_filter: str = Query(default="all", regex="^(all|2xx|4xx|5xx|errors)$"),
    min_duration: float = Query(default=0.0, ge=0.0),
    path_search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=200),
    token: str = Depends(require_developer_session)
):
    """
    Returns the real-time sliding-window request ring buffer.
    Contains full request context and complete Python stack traces for 500 errors.
    """
    raw_entries = []
    try:
        redis = await get_redis()
        raw_entries = await asyncio.wait_for(
            redis.lrange("telemetry:recent_requests", 0, limit * 2),
            timeout=0.25
        )
    except Exception:
        pass

    logs = []
    # If Redis had entries, use those; otherwise use in-memory ring buffer
    candidate_items = []
    if raw_entries:
        for raw in raw_entries:
            try:
                candidate_items.append(orjson.loads(raw))
            except Exception:
                pass
    else:
        candidate_items = list(in_memory_logs)

    for item in candidate_items:
        try:
            status_code = item.get("status", 200)

            # Apply Status Filter
            if status_filter == "2xx" and not (200 <= status_code < 300):
                continue
            elif status_filter == "4xx" and not (400 <= status_code < 500):
                continue
            elif status_filter == "5xx" and status_code < 500:
                continue
            elif status_filter == "errors" and status_code < 400:
                continue

            # Apply Duration Filter
            if item.get("duration_ms", 0.0) < min_duration:
                continue

            # Apply Path Substring Search
            if path_search and path_search.lower() not in item.get("path", "").lower():
                continue

            logs.append(item)
            if len(logs) >= limit:
                break
        except Exception:
            continue

    return {
        "ok": True,
        "count": len(logs),
        "logs": logs,
    }

@router.post("/logs/clear")
async def clear_debug_logs(token: str = Depends(require_developer_session)):
    try:
        redis = await get_redis()
        await asyncio.wait_for(redis.delete("telemetry:recent_requests"), timeout=0.25)
    except Exception:
        pass
    in_memory_logs.clear()
    return {"ok": True, "message": "Telemetry log buffer cleared."}

# ── 5. Dynamic API Key Management ──

@router.get("/api-keys")
async def list_api_keys(
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """List all API keys with live hit counts and last used timestamps."""
    stmt = select(ApiKey).order_by(ApiKey.created_at.desc())
    res = await db.execute(stmt)
    keys = res.scalars().all()

    results = []
    for k in keys:
        d = k.to_dict()
        # Merge live hit stats from Redis if available
        try:
            redis = await get_redis()
            live_hits = await asyncio.wait_for(redis.get(f"apikey:stats:{k.id}:hits"), timeout=0.1)
            live_last = await asyncio.wait_for(redis.get(f"apikey:stats:{k.id}:last_used"), timeout=0.1)
            if live_hits:
                d["total_requests"] = k.total_requests + int(live_hits)
            if live_last:
                d["last_used_at"] = datetime.fromtimestamp(int(live_last), tz=timezone.utc).isoformat()
        except Exception:
            pass
        results.append(d)

    return {"ok": True, "api_keys": results}

@router.post("/api-keys")
async def create_api_key(
    payload: ApiKeyCreateRequest,
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new API key for any frontend.
    Returns the raw secret key ONCE. It is never displayed again.
    """
    prefix = settings.API_KEY_PREFIX_TEST if payload.environment == "test" else settings.API_KEY_PREFIX_LIVE
    secret = secrets.token_urlsafe(32)
    raw_key = f"{prefix}{secret}"

    key_prefix = raw_key[:12]
    last_four = raw_key[-4:]
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    new_key = ApiKey(
        name=payload.name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        last_four=last_four,
        environment=payload.environment,
        scopes=payload.scopes or ["*"],
        rate_limit_per_minute=payload.rate_limit_per_minute,
        allowed_origins=payload.allowed_origins or ["*"],
        is_active=True,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return {
        "ok": True,
        "message": "API key generated successfully. Store this secret key securely; it cannot be viewed again.",
        "api_key": {
            "id": new_key.id,
            "name": new_key.name,
            "raw_key": raw_key,  # Revealed once
            "key_prefix": new_key.key_prefix,
            "last_four": new_key.last_four,
            "environment": new_key.environment,
            "scopes": new_key.scopes,
            "rate_limit_per_minute": new_key.rate_limit_per_minute,
            "allowed_origins": new_key.allowed_origins,
            "created_at": new_key.created_at.isoformat(),
        }
    }

@router.patch("/api-keys/{key_id}")
async def update_api_key(
    key_id: int,
    payload: ApiKeyUpdateRequest,
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """Update API key properties and immediately invalidate Redis cache."""
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    res = await db.execute(stmt)
    key_obj = res.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API key not found")

    if payload.name is not None:
        key_obj.name = payload.name
    if payload.is_active is not None:
        key_obj.is_active = payload.is_active
    if payload.scopes is not None:
        key_obj.scopes = payload.scopes
    if payload.rate_limit_per_minute is not None:
        key_obj.rate_limit_per_minute = payload.rate_limit_per_minute
    if payload.allowed_origins is not None:
        key_obj.allowed_origins = payload.allowed_origins

    await db.commit()
    await db.refresh(key_obj)

    # Invalidate Redis cache
    await cache_delete(f"apikey:{key_obj.key_hash}")

    return {"ok": True, "api_key": key_obj.to_dict()}

@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: int,
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """Revoke and delete an API key permanently."""
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    res = await db.execute(stmt)
    key_obj = res.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API key not found")

    # Invalidate cache
    await cache_delete(f"apikey:{key_obj.key_hash}")

    await db.delete(key_obj)
    await db.commit()
    return {"ok": True, "message": f"API key '{key_obj.name}' deleted successfully."}

@router.post("/api-keys/{key_id}/roll")
async def roll_api_key(
    key_id: int,
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """Roll and regenerate the secret token for an existing API Key."""
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    res = await db.execute(stmt)
    key_obj = res.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API key not found")

    # Invalidate old cache
    await cache_delete(f"apikey:{key_obj.key_hash}")

    prefix = settings.API_KEY_PREFIX_TEST if key_obj.environment == "test" else settings.API_KEY_PREFIX_LIVE
    secret = secrets.token_urlsafe(32)
    raw_key = f"{prefix}{secret}"

    key_obj.key_prefix = raw_key[:12]
    key_obj.last_four = raw_key[-4:]
    key_obj.key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    await db.commit()
    await db.refresh(key_obj)

    return {
        "ok": True,
        "message": "API key rolled successfully. Old secret is immediately revoked.",
        "api_key": {
            "id": key_obj.id,
            "name": key_obj.name,
            "raw_key": raw_key,  # New secret revealed once
            "key_prefix": key_obj.key_prefix,
            "last_four": key_obj.last_four,
        }
    }

# ── 6. Diagnostic & Health Tools ──

@router.post("/tools/ping-db")
async def ping_database(
    token: str = Depends(require_developer_session),
    db: AsyncSession = Depends(get_db)
):
    """Executes 5 consecutive SQL queries to measure minimum, maximum, and average database latency."""
    pings = []
    for _ in range(5):
        t0 = time.perf_counter()
        await db.execute(text("SELECT 1"))
        pings.append(round((time.perf_counter() - t0) * 1000, 2))

    return {
        "ok": True,
        "pings_ms": pings,
        "avg_ms": round(sum(pings) / len(pings), 2),
        "min_ms": min(pings),
        "max_ms": max(pings),
    }

@router.post("/tools/flush-cache")
async def flush_application_cache(token: str = Depends(require_developer_session)):
    """Flushes API keys and route caches without evicting developer sessions."""
    redis = await get_redis()
    keys = await redis.keys("apikey:*")
    if keys:
        await redis.delete(*keys)
    return {"ok": True, "flushed_keys_count": len(keys)}

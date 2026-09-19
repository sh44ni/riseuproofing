from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Response, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, generate_session_token
from app.core.audit import record_audit_log
from app.core.permissions import get_user_effective_permissions
from app.middlewares.auth import (
    get_optional_current_user, require_auth, invalidate_session
)
from app.middlewares.rate_limit import rate_limit

router = APIRouter(prefix="/api/admin", tags=["Admin Auth"])

@router.get("/auth")
@router.get("/auth/me")
async def check_auth_session(user = Depends(get_optional_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"authenticated": True, "ok": True, "user": user.to_dict()}

@router.post("/auth", dependencies=[Depends(rate_limit("admin-login", 20, 300))])
@router.post("/auth/login", dependencies=[Depends(rate_limit("admin-login", 20, 300))])
async def login(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    authenticated_user = None

    # 1. Master password check (allows logging in as owner or requested user immediately)
    expected_pass = settings.ADMIN_PASSWORD
    is_master = bool(expected_pass and password == expected_pass)

    if is_master:
        if email and isinstance(email, str):
            sql = text("SELECT id, name, email, phone, role, status, avatar_url FROM users WHERE LOWER(email) = LOWER(:email)")
            row = (await db.execute(sql, {"email": email.strip()})).mappings().first()
            if row and row["status"] == "active":
                authenticated_user = dict(row)

        if not authenticated_user:
            # Fallback to the active owner
            owner_sql = text("SELECT id, name, email, phone, role, status, avatar_url FROM users WHERE role = 'owner' AND status = 'active' ORDER BY id ASC LIMIT 1")
            owner_row = (await db.execute(owner_sql)).mappings().first()
            if owner_row:
                authenticated_user = dict(owner_row)

    # 2. Standard user credentials check
    if not authenticated_user and email and isinstance(email, str):
        sql = text("""
            SELECT id, name, email, phone, role, status, avatar_url, password_hash, salt
            FROM users
            WHERE LOWER(email) = LOWER(:email)
        """)
        row = (await db.execute(sql, {"email": email.strip()})).mappings().first()
        if row and row["status"] == "active":
            if verify_password(password, row["password_hash"], row["salt"]):
                authenticated_user = dict(row)

    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")

    # Create session token
    token = generate_session_token()
    expires_at = datetime.now() + timedelta(hours=settings.SESSION_HOURS)

    await db.execute(text("""
        INSERT INTO admin_sessions (token, user_id, expires_at, created_at)
        VALUES (:token, :uid, :exp, NOW())
        ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at
    """), {"token": token, "uid": authenticated_user["id"], "exp": expires_at})

    # Update last login timestamp
    await db.execute(text("UPDATE users SET last_login_at = NOW() WHERE id = :id"), {"id": authenticated_user["id"]})
    await db.commit()

    # Set httpOnly cookie
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_HOURS * 3600,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/"
    )

    # Record login audit log
    try:
        await record_audit_log(
            db=db,
            action="auth.login",
            resource_type="user",
            resource_id=authenticated_user["id"],
            user_id=authenticated_user["id"],
            user_email=authenticated_user["email"],
            user_role=authenticated_user["role"],
            request=request
        )
        await db.commit()
    except Exception as e:
        print(f"[Auth Audit Error] {e}")

    # Resolve dynamic permissions
    perms, is_protected = await get_user_effective_permissions(db, authenticated_user["id"])
    if authenticated_user["role"] == "owner":
        is_protected = True
        perms["*"] = "all"

    return {
        "ok": True,
        "token": token,
        "user": {
            "id": authenticated_user["id"],
            "name": authenticated_user["name"],
            "email": authenticated_user["email"],
            "role": authenticated_user["role"],
            "phone": authenticated_user.get("phone"),
            "avatar_url": authenticated_user.get("avatar_url"),
            "permissions": perms,
            "is_protected_owner": is_protected,
        }
    }

@router.delete("/auth")
@router.post("/auth/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(settings.COOKIE_NAME)
    if token:
        await invalidate_session(token, db)

    response.delete_cookie(settings.COOKIE_NAME, path="/")
    return {"ok": True}

@router.get("/profile")
async def get_current_profile(user = Depends(require_auth)):
    return {"ok": True, "user": user.to_dict()}

from typing import Dict, List, Optional, Any, Set, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

PERMISSION_ALIASES: Dict[str, str] = {
    "finances.view_invoices": "finances.view",
    "finances.view_profit_ledger": "finances.view",
    "finances.create_invoices": "finances.edit",
    "finances.record_payment": "finances.edit",
    "jobs.view_jobs": "jobs.view",
    "clients.view_clients": "clients.view",
    "users.manage": "users.assign_roles",
    "users.edit": "users.assign_roles",
    "roles.manage": "roles.edit",
}

def normalize_permission_key(key: str) -> str:
    norm = key.replace(":", ".")
    return PERMISSION_ALIASES.get(norm, norm)

class AuthUser:
    def __init__(
        self,
        id: int,
        name: str,
        email: str,
        role: str,
        status: str = "active",
        phone: Optional[str] = None,
        avatar_url: Optional[str] = None,
        permissions: Optional[Dict[str, str]] = None,
        is_protected_owner: bool = False,
        is_api_key: bool = False,
        api_key_id: Optional[int] = None
    ):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.status = status
        self.phone = phone
        self.avatar_url = avatar_url
        self.permissions = permissions or {}
        self.is_protected_owner = is_protected_owner
        self.is_api_key = is_api_key
        self.api_key_id = api_key_id

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def get(self, item: str, default: Any = None) -> Any:
        return getattr(self, item, default)

    def __contains__(self, item: str) -> bool:
        return hasattr(self, item)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "permissions": self.permissions,
            "is_protected_owner": self.is_protected_owner,
            "is_api_key": self.is_api_key,
            "api_key_id": self.api_key_id,
        }

def has_permission(
    user: Optional[AuthUser],
    permission: str,
    required_scope: Optional[str] = None
) -> bool:
    if not user or user.status == "deactivated":
        return False

    norm_key = normalize_permission_key(permission)

    # Protected Owner check
    if user.role == "owner" or user.is_protected_owner:
        return True

    user_scope = user.permissions.get("*") or user.permissions.get(norm_key) or user.permissions.get(permission)
    if not user_scope:
        return False

    if not required_scope:
        return True

    if required_scope == "all":
        return user_scope == "all"
    if required_scope == "assigned":
        return user_scope in ("assigned", "all")
    if required_scope == "own":
        return user_scope in ("own", "assigned", "all")

    return True

def has_any_permission(user: Optional[AuthUser], permissions: List[str]) -> bool:
    return any(has_permission(user, p) for p in permissions)

def get_permission_scope(user: Optional[AuthUser], permission: str) -> Optional[str]:
    if not user or user.status == "deactivated":
        return None

    if user.role == "owner" or user.is_protected_owner:
        return "all"

    norm_key = normalize_permission_key(permission)
    if user.permissions.get("*"):
        return "all"

    return user.permissions.get(norm_key) or user.permissions.get(permission)

class ScopeFilterResult(dict):
    """Dict that also supports tuple unpacking: allowed, clause, params = build_scope_filter(...)"""
    def __iter__(self):
        yield self.get("allowed", False)
        yield self.get("clause", "1=0")
        params = self.get("params")
        if isinstance(params, dict):
            yield list(params.values())
        else:
            yield params or []

def build_scope_filter(
    user: Any,
    permission: Optional[str] = None,
    action: Optional[str] = None,
    creator_col: str = "created_by",
    assigned_col: str = "assigned_to_user_id",
    param_offset: int = 1,
    param_prefix: Optional[str] = None
) -> ScopeFilterResult:
    """
    Returns ScopeFilterResult with keys 'allowed', 'clause', 'params'.
    Compatible with both dictionary access (scope['allowed']) and tuple unpacking.
    """
    perm = permission or action or ""
    
    # Handle user whether AuthUser object or dict
    u_obj = user
    if isinstance(user, dict):
        u_obj = AuthUser(
            id=user.get("id", 0),
            name=user.get("name", ""),
            email=user.get("email", ""),
            role=user.get("role", ""),
            status=user.get("status", "active"),
            permissions=user.get("permissions", {}),
            is_protected_owner=user.get("is_protected_owner", user.get("role") == "owner"),
        )

    scope = get_permission_scope(u_obj, perm) if u_obj else None
    if not u_obj or not scope:
        return ScopeFilterResult({"allowed": False, "clause": "1=0", "params": {}})

    if scope == "all":
        return ScopeFilterResult({"allowed": True, "clause": "1=1", "params": {}})

    uid = getattr(u_obj, "id", None) or (user.get("id") if isinstance(user, dict) else None)

    if param_prefix is not None:
        p_name = f"{param_prefix}uid"
        if scope == "assigned":
            clause = f"({assigned_col} = :{p_name} OR {creator_col} = :{p_name})"
            return ScopeFilterResult({"allowed": True, "clause": clause, "params": {p_name: uid}})
        if scope == "own":
            clause = f"{creator_col} = :{p_name}"
            return ScopeFilterResult({"allowed": True, "clause": clause, "params": {p_name: uid}})
    else:
        if scope == "assigned":
            clause = f"({assigned_col} = ${param_offset} OR {creator_col} = ${param_offset})"
            return ScopeFilterResult({"allowed": True, "clause": clause, "params": [uid]})
        if scope == "own":
            clause = f"{creator_col} = ${param_offset}"
            return ScopeFilterResult({"allowed": True, "clause": clause, "params": [uid]})

    return ScopeFilterResult({"allowed": False, "clause": "1=0", "params": {}})

async def get_user_effective_permissions(db: AsyncSession, user_id: int) -> Tuple[Dict[str, str], bool]:
    """
    Resolves effective permissions union across all roles assigned to user.
    """
    sql = text("""
        SELECT 
            r.is_protected,
            p.key as permission_key,
            rp.scope
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = :user_id
    """)

    result = await db.execute(sql, {"user_id": user_id})
    rows = result.mappings().all()

    is_protected_owner = False
    permissions: Dict[str, str] = {}

    for r in rows:
        if r.get("is_protected"):
            is_protected_owner = True

        p_key = r.get("permission_key")
        scope = r.get("scope")
        if p_key and scope:
            existing = permissions.get(p_key)
            if not existing:
                permissions[p_key] = scope
            elif existing != "all":
                if scope == "all":
                    permissions[p_key] = "all"
                elif (existing == "own" and scope == "assigned") or (existing == "assigned" and scope == "own"):
                    permissions[p_key] = "assigned"

    if is_protected_owner:
        permissions["*"] = "all"

    return permissions, is_protected_owner

def require_permission(permission: str, required_scope: Optional[str] = None):
    from app.middlewares.auth import require_permission as _req_perm
    return _req_perm(permission, required_scope)

def require_any_permission(permissions: List[str]):
    from app.middlewares.auth import require_any_permission as _req_any
    return _req_any(permissions)

def require_auth_user():
    from app.middlewares.auth import require_auth
    return require_auth

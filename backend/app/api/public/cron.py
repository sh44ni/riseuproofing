from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.services.reviews import sync_google_reviews, sync_yelp_reviews

router = APIRouter(tags=["Cron"])

@router.get("/api/cron/sync-reviews")
async def cron_sync_reviews_endpoint(
    request: Request,
    secret: str = None,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    cron_secret = settings.CRON_SECRET
    if cron_secret:
        auth_token = None
        if authorization and authorization.startswith("Bearer "):
            auth_token = authorization.split(" ")[1].strip()
        
        is_authorized = (auth_token == cron_secret) or (secret == cron_secret)
        if not is_authorized:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid cron secret")

    google_res = await sync_google_reviews(db)
    yelp_res = await sync_yelp_reviews(db)

    return {
        "ok": bool(google_res.get("ok") or yelp_res.get("ok")),
        "google": google_res,
        "yelp": yelp_res,
        "timestamp": datetime.now().isoformat(),
    }

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Estimator"])

@router.get("/api/estimator/config")
async def get_estimator_config(db: AsyncSession = Depends(get_db)):
    services_sql = text("""
        SELECT id, slug, name, short_label, icon_key, badge_label, sort_order
        FROM estimator_services
        WHERE is_active = true
        ORDER BY sort_order ASC
    """)
    services = (await db.execute(services_sql)).mappings().all()

    rules_sql = text("""
        SELECT service_id, price_per_sqft_low, price_per_sqft_high, base_fee_low, base_fee_high,
               min_sqft, max_sqft, apr_available, financing_apr, financing_term_months
        FROM estimator_pricing_rules
    """)
    rules = (await db.execute(rules_sql)).mappings().all()

    presets_sql = text("""
        SELECT service_id, label, sqft_value, sort_order
        FROM estimator_size_presets
        ORDER BY sort_order ASC
    """)
    presets = (await db.execute(presets_sql)).mappings().all()

    return {
        "ok": True,
        "services": [dict(s) for s in services],
        "pricingRules": [dict(r) for r in rules],
        "presets": [dict(p) for p in presets],
    }

@router.post("/api/estimator/calculate")
async def calculate_estimator(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    service_slug = body.get("serviceSlug")
    sqft = int(body.get("sqft") or 0)
    source = body.get("source") or "custom"
    session_id = body.get("sessionId")

    if not service_slug or sqft <= 0:
        raise HTTPException(status_code=400, detail="Valid service slug and square footage are required")

    rule_sql = text("""
        SELECT s.id as service_id, s.name, r.price_per_sqft_low, r.price_per_sqft_high,
               r.base_fee_low, r.base_fee_high, r.financing_apr, r.financing_term_months
        FROM estimator_services s
        JOIN estimator_pricing_rules r ON s.id = r.service_id
        WHERE s.slug = :slug AND s.is_active = true
    """)
    res = (await db.execute(rule_sql, {"slug": service_slug})).mappings().first()
    if not res:
        raise HTTPException(status_code=404, detail="Service configuration not found")

    low = round(float(res["base_fee_low"]) + (sqft * float(res["price_per_sqft_low"])))
    high = round(float(res["base_fee_high"]) + (sqft * float(res["price_per_sqft_high"])))
    term_months = int(res["financing_term_months"] or 60)
    monthly_low = round(low / term_months)
    monthly_high = round(high / term_months)

    # Save to estimator_leads for marketing funnel analytics
    insert_sql = text("""
        INSERT INTO estimator_leads (
            service_id, sqft_entered, estimate_low, estimate_high, source, session_id, created_at
        ) VALUES (
            :sid, :sqft, :low, :high, :source, :sess, NOW()
        ) RETURNING id
    """)
    lead_id = (await db.execute(insert_sql, {
        "sid": res["service_id"],
        "sqft": sqft,
        "low": low,
        "high": high,
        "source": source,
        "sess": session_id,
    })).scalar_one()

    return {
        "ok": True,
        "id": lead_id,
        "service": res["name"],
        "sqft": sqft,
        "estimateLow": low,
        "estimateHigh": high,
        "monthlyLow": monthly_low,
        "monthlyHigh": monthly_high,
        "termMonths": term_months,
    }

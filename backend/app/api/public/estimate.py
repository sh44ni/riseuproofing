from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.middlewares.rate_limit import rate_limit
from app.services.sync import find_or_create_client
from app.services.scoring import calculate_lead_score

router = APIRouter(tags=["Public"])

@router.post("/api/estimate", dependencies=[Depends(rate_limit("estimate-form", 5, 600))])
async def submit_estimate_form(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()

    # Honeypot spam defense
    if body.get("honeypot") and str(body.get("honeypot")).strip():
        return {"ok": True}

    full_name = (body.get("fullName") or "").strip()
    phone = (body.get("phone") or "").strip()
    if not full_name or not phone:
        raise HTTPException(status_code=400, detail="Name and phone are required")

    address = body.get("address")
    city = body.get("city") or "San Diego"
    zip_code = body.get("zip")
    service_type = body.get("serviceType") or "Roof Replacement"
    notes = body.get("notes")
    email = body.get("email")
    form_type = body.get("formType") or "estimate"
    lead_source = body.get("leadSource") or "website"

    # Evaluate lead score & priority
    score, priority, factors = calculate_lead_score({
        "serviceType": service_type,
        "phone": phone,
        "email": email,
        "address": address,
        "zip": zip_code,
        "formType": form_type,
        "leadSource": lead_source,
    })

    referer = request.headers.get("referer", "/")
    source_page = referer.split("?")[0] if referer else "/"

    detail = "Website Free Estimate"
    if form_type in ("estimator_full", "calculator"):
        detail = "Instant Estimator"
    elif form_type == "storm_promo" or lead_source == "storm_promo_popup":
        detail = "Storm Season Alert"
    elif "/service-area/" in source_page:
        city_slug = source_page.replace("/service-area/", "").strip("/")
        detail = f"Website Landing ({city_slug})"

    client_id = await find_or_create_client(db, {
        "fullName": full_name,
        "phone": phone,
        "email": email,
        "address": address,
        "city": city,
        "zip": zip_code,
        "leadSource": lead_source or "website_estimate",
        "sourceType": "website",
        "leadSourceDetail": detail,
        "notes": notes,
    })

    insert_sql = text("""
        INSERT INTO leads (
            form_type, full_name, phone, email, address, city, zip, service_type,
            notes, source_page, status, priority, lead_score, lead_source, client_id,
            source_type, lead_source_detail, pipeline_stage, stage_entered_at, created_at
        ) VALUES (
            :form_type, :full_name, :phone, :email, :address, :city, :zip, :service_type,
            :notes, :source_page, 'new', :priority, :score, :lead_source, :client_id,
            'website', :detail, 'stage_1_lead_gen', NOW(), NOW()
        ) RETURNING id
    """)

    lead_id = (await db.execute(insert_sql, {
        "form_type": form_type,
        "full_name": full_name,
        "phone": phone,
        "email": email,
        "address": address,
        "city": city,
        "zip": zip_code,
        "service_type": service_type,
        "notes": notes,
        "source_page": source_page,
        "priority": priority,
        "score": score,
        "lead_source": lead_source,
        "client_id": client_id,
        "detail": detail,
    })).scalar_one()

    # Log activity
    title = "⚡ Storm Season Alert $1,000 Off Claimed" if form_type == "storm_promo" else "New Estimate Request"
    await db.execute(text("""
        INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by, created_at)
        VALUES ('lead', :lid, :cid, 'form_submission', :title, :desc, 'Website Visitor', NOW())
    """), {
        "lid": lead_id,
        "cid": client_id,
        "title": title,
        "desc": notes or f"Inquiry submitted through website portal ({detail})",
    })

    return {"ok": True, "leadId": lead_id}

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.middlewares.rate_limit import rate_limit
from app.services.sync import find_or_create_client

router = APIRouter(tags=["Public"])

@router.post("/api/contact", dependencies=[Depends(rate_limit("contact-form", 5, 600))])
async def submit_contact_form(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()

    # Honeypot spam defense
    if body.get("honeypot") and str(body.get("honeypot")).strip():
        return {"ok": True}

    full_name = body.get("fullName", "").strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Name is required")

    phone = body.get("phone")
    email = body.get("email")
    subject = body.get("subject")
    message = body.get("message") or ""

    referer = request.headers.get("referer", "/")
    source_page = referer.split("?")[0] if referer else "/"

    # Link or provision 360 client profile
    client_id = await find_or_create_client(db, {
        "fullName": full_name,
        "phone": phone,
        "email": email,
        "leadSource": "website_contact",
        "sourceType": "website",
        "leadSourceDetail": "Website Contact Form",
        "notes": f"Subject: {subject}" if subject else None,
    })

    # Insert lead record
    insert_sql = text("""
        INSERT INTO leads (
            form_type, full_name, phone, email, subject, message, source_page,
            status, client_id, source_type, lead_source, lead_source_detail, created_at
        ) VALUES (
            'contact', :full_name, :phone, :email, :subject, :message, :source_page,
            'new', :client_id, 'website', 'website_contact', 'Website Contact Form', NOW()
        ) RETURNING id
    """)

    lead_id = (await db.execute(insert_sql, {
        "full_name": full_name,
        "phone": phone,
        "email": email,
        "subject": subject,
        "message": message,
        "source_page": source_page,
        "client_id": client_id,
    })).scalar_one()

    # Log activity timeline entry
    await db.execute(text("""
        INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by, created_at)
        VALUES ('lead', :lid, :cid, 'system', 'Website Contact Form Received', :desc, 'Website Visitor', NOW())
    """), {
        "lid": lead_id,
        "cid": client_id,
        "desc": f"Subject: {subject or 'General Inquiry'}. Message: {message}",
    })

    return {"ok": True, "leadId": lead_id}

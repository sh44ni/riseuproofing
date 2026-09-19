import re
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits if len(digits) == 10 else (digits if digits else None)

def format_phone(phone: Optional[str]) -> str:
    norm = normalize_phone(phone)
    if norm and len(norm) == 10:
        return f"({norm[0:3]}) {norm[3:6]}-{norm[6:10]}"
    return phone or ""

async def find_or_create_client(db: AsyncSession, data: Dict[str, Any]) -> int:
    """
    Finds existing client by phone_normalized, email, or name+address,
    or creates a new client. Returns client.id.
    """
    full_name = (data.get("fullName") or data.get("full_name") or "").strip()
    raw_phone = data.get("phone")
    norm_phone = normalize_phone(raw_phone)
    email = (data.get("email") or "").strip().lower() or None
    address = (data.get("address") or "").strip() or None
    city = data.get("city")
    zip_code = data.get("zip")

    # 1. Try matching by phone or email
    existing_id = None
    if norm_phone or email:
        conditions = []
        params = {}
        if norm_phone:
            conditions.append("phone_normalized = :norm_phone")
            params["norm_phone"] = norm_phone
        if email:
            conditions.append("LOWER(email) = :email")
            params["email"] = email

        sql = f"SELECT id FROM clients WHERE {' OR '.join(conditions)} ORDER BY created_at ASC LIMIT 1"
        res = await db.execute(text(sql), params)
        row = res.first()
        if row:
            existing_id = row[0]

    # 2. Fallback: match by name and address
    if not existing_id and full_name and address:
        sql = "SELECT id FROM clients WHERE LOWER(full_name) = LOWER(:name) AND LOWER(COALESCE(address, '')) = LOWER(:addr) ORDER BY created_at ASC LIMIT 1"
        res = await db.execute(text(sql), {"name": full_name, "addr": address})
        row = res.first()
        if row:
            existing_id = row[0]

    # If existing client found, update any blank details
    if existing_id:
        update_clauses = []
        u_params = {"id": existing_id}

        if address:
            update_clauses.append("address = COALESCE(address, :address)")
            u_params["address"] = address
        if city:
            update_clauses.append("city = COALESCE(city, :city)")
            u_params["city"] = city
        if zip_code:
            update_clauses.append("zip = COALESCE(zip, :zip)")
            u_params["zip"] = zip_code
        if raw_phone and norm_phone:
            update_clauses.append("phone = COALESCE(phone, :phone)")
            update_clauses.append("phone_normalized = COALESCE(phone_normalized, :norm_phone)")
            u_params["phone"] = raw_phone
            u_params["norm_phone"] = norm_phone
        if email:
            update_clauses.append("email = COALESCE(email, :email)")
            u_params["email"] = email

        if update_clauses:
            update_sql = f"UPDATE clients SET {', '.join(update_clauses)}, updated_at = NOW() WHERE id = :id"
            await db.execute(text(update_sql), u_params)

        return existing_id

    # Otherwise insert new client record
    source_type = "team_member" if data.get("sourceType") == "team_member" or data.get("acquiredByUserId") else "website"
    source_detail = data.get("leadSourceDetail") or data.get("leadSource") or ("Team Member Attribution" if source_type == "team_member" else "Website Inbound")

    insert_sql = text("""
        INSERT INTO clients (
            full_name, phone, phone_normalized, email, address, city, zip,
            property_type, roof_type, roof_sqf, stories, hoa, status,
            client_category, tags, notes, source_type, lead_source_detail, client_since
        ) VALUES (
            :full_name, :phone, :phone_normalized, :email, :address, :city, :zip,
            :property_type, :roof_type, :roof_sqf, :stories, :hoa, 'lead',
            'lead', '{"New Lead"}', :notes, :source_type, :source_detail, NOW()
        ) RETURNING id
    """)

    res = await db.execute(
        insert_sql,
        {
            "full_name": full_name or "Homeowner",
            "phone": raw_phone,
            "phone_normalized": norm_phone,
            "email": email,
            "address": address,
            "city": city,
            "zip": zip_code,
            "property_type": data.get("propertyType") or "Single Family",
            "roof_type": data.get("roofType"),
            "roof_sqf": int(data.get("roofSqf")) if data.get("roofSqf") is not None else None,
            "stories": int(data.get("stories") or 1),
            "hoa": bool(data.get("hoa")),
            "notes": data.get("notes"),
            "source_type": source_type,
            "source_detail": source_detail,
        }
    )
    new_id = res.scalar_one()
    return new_id

async def recalculate_client_stats(db: AsyncSession, client_id: int) -> None:
    """
    Computes lifetime revenue, job counts, active state, and 4-tier category.
    """
    # 1. Total revenue from paid invoices or completed jobs
    rev_sql = text("""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM invoices
        WHERE (
            job_id IN (SELECT id FROM jobs WHERE client_id = :cid OR lead_id IN (SELECT id FROM leads WHERE client_id = :cid))
            OR estimate_id IN (SELECT id FROM estimates WHERE client_id = :cid)
            OR client_id = :cid
        ) AND status = 'paid'
    """)
    total_rev = float((await db.execute(rev_sql, {"cid": client_id})).scalar_one() or 0)

    if total_rev == 0:
        job_val_sql = text("""
            SELECT COALESCE(SUM(contract_value), 0) as total
            FROM jobs
            WHERE (client_id = :cid OR lead_id IN (SELECT id FROM leads WHERE client_id = :cid))
              AND status = 'complete'
        """)
        total_rev = float((await db.execute(job_val_sql, {"cid": client_id})).scalar_one() or 0)

    # 2. Count jobs
    job_res = (await db.execute(text("""
        SELECT 
            COUNT(*) as total_jobs,
            COUNT(CASE WHEN status NOT IN ('complete', 'cancelled') THEN 1 END) as active_jobs
        FROM jobs
        WHERE client_id = :cid OR lead_id IN (SELECT id FROM leads WHERE client_id = :cid)
    """), {"cid": client_id})).mappings().first()

    total_jobs = int(job_res["total_jobs"] or 0)
    has_active_job = int(job_res["active_jobs"] or 0) > 0

    # 3. Check for signed contract or won lead
    lead_res = (await db.execute(text("""
        SELECT 
            COUNT(CASE WHEN status = 'won' OR contract_signed_at IS NOT NULL OR pipeline_stage = 'stage_5_completion_followup' THEN 1 END) as won_leads,
            COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
            COUNT(CASE WHEN site_visit_scheduled_at IS NOT NULL OR status IN ('estimate_scheduled', 'inspected') OR pipeline_stage IN ('stage_2_site_visit', 'stage_3_estimate_drafting') THEN 1 END) as inspections_count,
            COUNT(CASE WHEN proposal_sent_at IS NOT NULL OR status IN ('estimate_sent', 'quoted') OR pipeline_stage = 'stage_4_proposal_review' THEN 1 END) as proposals_count
        FROM leads WHERE client_id = :cid
    """), {"cid": client_id})).mappings().first()

    has_won = int(lead_res["won_leads"] or 0) > 0
    has_lost = int(lead_res["lost_leads"] or 0) > 0
    has_engagement = (int(lead_res["inspections_count"] or 0) > 0) or (int(lead_res["proposals_count"] or 0) > 0)

    # 4. Resolve 4-tier category
    is_existing = has_active_job or total_jobs > 0 or total_rev > 0 or has_won

    if is_existing:
        category = "existing_client"
        status_val = "active_job" if has_active_job else ("repeat" if total_jobs > 1 else "completed")
    elif has_lost:
        category = "lost_lead"
        status_val = "lost"
    elif has_engagement:
        category = "new_client"
        status_val = "opportunity"
    else:
        category = "lead"
        status_val = "lead"

    await db.execute(text("""
        UPDATE clients
        SET total_revenue = :rev,
            total_jobs_count = :cnt,
            status = :status,
            client_category = :cat,
            updated_at = NOW()
        WHERE id = :cid
    """), {
        "rev": total_rev,
        "cnt": total_jobs,
        "status": status_val,
        "cat": category,
        "cid": client_id
    })

async def auto_heal_dataflow_sync(db: AsyncSession) -> Dict[str, Any]:
    """
    Automated system integrity scan and repair routine.
    """
    # 1. Link unlinked leads
    unlinked_leads = (await db.execute(text("""
        SELECT id, full_name, phone, email, address, city, zip, service_type, notes
        FROM leads WHERE client_id IS NULL AND (phone IS NOT NULL OR email IS NOT NULL)
    """))).mappings().all()

    leads_healed = 0
    for l in unlinked_leads:
        cid = await find_or_create_client(db, dict(l))
        await db.execute(text("UPDATE leads SET client_id = :cid WHERE id = :lid"), {"cid": cid, "lid": l["id"]})
        leads_healed += 1

    # 2. Link jobs client_id via lead_id
    await db.execute(text("""
        UPDATE jobs j
        SET client_id = l.client_id
        FROM leads l
        WHERE j.lead_id = l.id AND j.client_id IS NULL AND l.client_id IS NOT NULL
    """))

    # 3. Link estimates client_id
    await db.execute(text("""
        UPDATE estimates e
        SET client_id = COALESCE(
            (SELECT client_id FROM leads l WHERE l.id = e.lead_id),
            (SELECT client_id FROM jobs j WHERE j.estimate_id = e.id)
        )
        WHERE e.client_id IS NULL
    """))

    # 4. Link invoices client_id
    await db.execute(text("""
        UPDATE invoices i
        SET client_id = (SELECT client_id FROM jobs j WHERE j.id = i.job_id)
        WHERE i.client_id IS NULL AND i.job_id IS NOT NULL
    """))

    # 5. Link warranties client_id
    await db.execute(text("""
        UPDATE warranties w
        SET client_id = COALESCE(
            (SELECT client_id FROM jobs j WHERE j.id = w.job_id),
            (SELECT client_id FROM leads l WHERE l.id = w.lead_id)
        )
        WHERE w.client_id IS NULL
    """))

    # 6. Align pipeline stage 5 for completed jobs
    await db.execute(text("""
        UPDATE leads l
        SET pipeline_stage = 'stage_5_completion_followup',
            status = 'won',
            job_completed_at = COALESCE(l.job_completed_at, j.updated_at, NOW())
        FROM jobs j
        WHERE j.lead_id = l.id AND j.status = 'complete' AND (l.pipeline_stage != 'stage_5_completion_followup' OR l.status != 'won')
    """))

    # 7. Recalculate stats for all clients
    all_clients = (await db.execute(text("SELECT id FROM clients"))).scalars().all()
    for cid in all_clients:
        await recalculate_client_stats(db, cid)

    return {
        "leads_healed": leads_healed,
        "clients_recalculated": len(all_clients),
        "status": "healthy"
    }

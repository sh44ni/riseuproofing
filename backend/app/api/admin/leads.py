from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.middlewares.auth import require_auth, require_permission
from app.services.sync import find_or_create_client
from app.services.scoring import calculate_lead_score

router = APIRouter(prefix="/api/admin/leads", tags=["Leads"])

@router.get("", dependencies=[Depends(require_permission("leads:view"))])
async def list_leads(
    category: Optional[str] = None,
    tab: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    conditions = []
    params = {"limit": limit, "offset": offset}

    # Tab / Category arrangement
    raw_cat = category or tab
    if raw_cat:
        cat = raw_cat.strip().lower()
        if cat in ["lead", "leads"]:
            conditions.append("""(
                l.status NOT IN ('won', 'lost') AND 
                (c.client_category IS NULL OR c.client_category = 'lead' OR c.client_category = '') AND 
                (l.pipeline_stage IS NULL OR l.pipeline_stage NOT IN ('stage_4_closing', 'stage_5_completion_followup')) AND 
                l.lost_reason IS NULL
            )""")
        elif cat in ["new_client", "new_clients", "new"]:
            conditions.append("""(
                (l.status = 'won' OR c.client_category = 'new_client' OR l.pipeline_stage IN ('stage_4_closing', 'stage_5_completion_followup')) AND 
                (c.client_category != 'existing_client' OR c.client_category IS NULL)
            )""")
        elif cat in ["existing_client", "existing_clients", "existing"]:
            conditions.append("""(
                c.client_category = 'existing_client' OR c.status IN ('completed', 'repeat') OR COALESCE(c.total_jobs_count, 0) > 1
            )""")
        elif cat in ["lost_lead", "lost_leads", "lost"]:
            conditions.append("""(
                l.status = 'lost' OR c.client_category = 'lost_lead' OR l.lost_reason IS NOT NULL
            )""")

    if status and status != "all":
        conditions.append("l.status = :status")
        params["status"] = status
    if priority and priority != "all":
        conditions.append("l.priority = :priority")
        params["priority"] = priority

    if search and search.strip():
        conditions.append("""(
            LOWER(l.full_name) LIKE :q OR
            l.phone LIKE :q OR
            LOWER(COALESCE(l.email, '')) LIKE :q OR
            LOWER(COALESCE(l.address, '')) LIKE :q OR
            LOWER(COALESCE(l.city, '')) LIKE :q
        )""")
        params["q"] = f"%{search.strip().lower()}%"

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = text(f"""
        SELECT 
            l.*, 
            u.name as assigned_to_name,
            u_creator.name as created_by_name,
            c.client_category,
            c.status as client_status,
            c.total_jobs_count,
            c.total_revenue as client_total_revenue,
            CASE 
                WHEN l.status = 'lost' OR c.client_category = 'lost_lead' OR l.lost_reason IS NOT NULL THEN 'lost_lead'
                WHEN c.client_category = 'existing_client' OR c.status IN ('completed', 'repeat') OR COALESCE(c.total_jobs_count, 0) > 1 THEN 'existing_client'
                WHEN l.status = 'won' OR c.client_category = 'new_client' OR l.pipeline_stage IN ('stage_4_closing', 'stage_5_completion_followup') THEN 'new_client'
                ELSE 'lead'
            END as profile_category
        FROM leads l
        LEFT JOIN users u ON l.assigned_to_user_id = u.id
        LEFT JOIN users u_creator ON l.created_by_user_id = u_creator.id
        LEFT JOIN clients c ON l.client_id = c.id
        {where}
        ORDER BY l.created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    rows = (await db.execute(sql, params)).mappings().all()

    count_sql = text(f"""
        SELECT COUNT(*) 
        FROM leads l 
        LEFT JOIN clients c ON l.client_id = c.id
        {where}
    """)
    total = (await db.execute(count_sql, params)).scalar_one()

    # 5 Tab Counts: All Profiles, Leads, New Clients, Existing Clients, Lost Leads
    counts_sql = text("""
        SELECT 
            COUNT(*) as total_all,
            COUNT(CASE WHEN 
                (l.status NOT IN ('won', 'lost') AND (c.client_category IS NULL OR c.client_category = 'lead' OR c.client_category = '') AND (l.pipeline_stage IS NULL OR l.pipeline_stage NOT IN ('stage_4_closing', 'stage_5_completion_followup')) AND l.lost_reason IS NULL)
            THEN 1 END) as count_leads,
            COUNT(CASE WHEN 
                ((l.status = 'won' OR c.client_category = 'new_client' OR l.pipeline_stage IN ('stage_4_closing', 'stage_5_completion_followup')) AND (c.client_category != 'existing_client' OR c.client_category IS NULL))
            THEN 1 END) as count_new_clients,
            COUNT(CASE WHEN 
                (c.client_category = 'existing_client' OR c.status IN ('completed', 'repeat') OR COALESCE(c.total_jobs_count, 0) > 1)
            THEN 1 END) as count_existing_clients,
            COUNT(CASE WHEN 
                (l.status = 'lost' OR c.client_category = 'lost_lead' OR l.lost_reason IS NOT NULL)
            THEN 1 END) as count_lost_leads
        FROM leads l
        LEFT JOIN clients c ON l.client_id = c.id
    """)
    counts_row = (await db.execute(counts_sql)).mappings().first()

    counts = {
        "all": int(counts_row["total_all"] or 0) if counts_row else 0,
        "leads": int(counts_row["count_leads"] or 0) if counts_row else 0,
        "new_clients": int(counts_row["count_new_clients"] or 0) if counts_row else 0,
        "existing_clients": int(counts_row["count_existing_clients"] or 0) if counts_row else 0,
        "lost_leads": int(counts_row["count_lost_leads"] or 0) if counts_row else 0,
    }

    return {
        "leads": [dict(r) for r in rows], 
        "total": total,
        "counts": counts
    }

@router.post("", dependencies=[Depends(require_permission("leads:create"))])
async def create_lead(request: Request, db: AsyncSession = Depends(get_db), user = Depends(require_auth)):
    body = await request.json()
    full_name = (body.get("fullName") or body.get("full_name") or "").strip()
    phone = body.get("phone")
    email = body.get("email")
    address = body.get("address")
    city = body.get("city") or "San Diego"
    zip_code = body.get("zip")
    service_type = body.get("serviceType") or "Residential Roofing"
    notes = body.get("notes")
    creator_name = getattr(user, "name", None) or (user.email.split("@")[0] if getattr(user, "email", None) else "Owner")
    lead_source = "manual"
    source_type = "manual"
    lead_source_detail = creator_name

    if not full_name:
        raise HTTPException(status_code=400, detail="Name is required")

    score, priority, _ = calculate_lead_score({
        "serviceType": service_type,
        "phone": phone,
        "email": email,
        "address": address,
        "zip": zip_code,
        "leadSource": lead_source,
    })

    client_id = await find_or_create_client(db, {
        "fullName": full_name,
        "phone": phone,
        "email": email,
        "address": address,
        "city": city,
        "zip": zip_code,
        "leadSource": "manual",
        "sourceType": "manual",
        "leadSourceDetail": creator_name,
        "acquiredByUserId": user.id,
        "notes": notes,
    })

    insert_sql = text("""
        INSERT INTO leads (
            form_type, full_name, phone, email, address, city, zip, service_type,
            notes, status, priority, lead_score, lead_source, source_type,
            lead_source_detail, client_id, created_by_user_id, assigned_to_user_id,
            assigned_to, pipeline_stage, stage_entered_at, created_at, updated_at
        ) VALUES (
            'manual', :name, :phone, :email, :address, :city, :zip, :service,
            :notes, 'new', :priority, :score, 'manual', 'manual',
            :source_detail, :cid, :uid, :uid,
            :assigned_to, 'stage_1_lead_gen', NOW(), NOW(), NOW()
        ) RETURNING id, full_name, phone, email, status, pipeline_stage, client_id, lead_source, lead_source_detail, created_by_user_id, assigned_to_user_id
    """)
    new_lead = (await db.execute(insert_sql, {
        "name": full_name, "phone": phone, "email": email, "address": address,
        "city": city, "zip": zip_code, "service": service_type, "notes": notes,
        "priority": priority, "score": score, "source_detail": lead_source_detail,
        "assigned_to": creator_name, "cid": client_id, "uid": user.id
    })).mappings().first()

    await record_audit_log(db, "lead.create", "lead", new_lead["id"], user.id, user.email, user.role, body, request)
    return {"ok": True, "lead": dict(new_lead)}

@router.get("/{lead_id}", dependencies=[Depends(require_permission("leads:view"))])
async def get_lead_detail(lead_id: int, db: AsyncSession = Depends(get_db)):
    sql = text("""
        SELECT 
            l.*, 
            u.name as assigned_to_name, 
            u.avatar_url as assigned_to_avatar,
            c.client_category,
            c.status as client_status,
            c.total_jobs_count,
            CASE 
                WHEN l.status = 'lost' OR c.client_category = 'lost_lead' OR l.lost_reason IS NOT NULL THEN 'lost_lead'
                WHEN c.client_category = 'existing_client' OR c.status IN ('completed', 'repeat') OR COALESCE(c.total_jobs_count, 0) > 1 THEN 'existing_client'
                WHEN l.status = 'won' OR c.client_category = 'new_client' OR l.pipeline_stage IN ('stage_4_closing', 'stage_5_completion_followup') THEN 'new_client'
                ELSE 'lead'
            END as profile_category
        FROM leads l
        LEFT JOIN users u ON l.assigned_to_user_id = u.id
        LEFT JOIN clients c ON l.client_id = c.id
        WHERE l.id = :id
    """)
    row = (await db.execute(sql, {"id": lead_id})).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"lead": dict(row)}

@router.put("/{lead_id}", dependencies=[Depends(require_permission("leads:edit"))])
async def update_lead(lead_id: int, request: Request, db: AsyncSession = Depends(get_db), user = Depends(require_auth)):
    body = await request.json()
    updates = []
    params = {"id": lead_id}

    for k in ["full_name", "phone", "email", "address", "city", "zip", "service_type", "notes", "status", "priority", "pipeline_stage", "assigned_to_user_id", "lost_reason"]:
        if k in body:
            updates.append(f"{k} = :{k}")
            params[k] = body[k]

    if updates:
        sql = f"UPDATE leads SET {', '.join(updates)}, updated_at = NOW() WHERE id = :id RETURNING id, full_name, status, pipeline_stage, client_id, lost_reason"
        updated = (await db.execute(text(sql), params)).mappings().first()
        
        # Synchronize client category
        cid = updated.get("client_id") if updated else None
        if cid:
            new_cat = None
            if body.get("status") == "lost" or body.get("lost_reason"):
                new_cat = "lost_lead"
            elif body.get("status") == "won" or body.get("pipeline_stage") == "stage_4_closing":
                new_cat = "new_client"
            elif body.get("status") in ["new", "contacted", "site_visit_scheduled", "estimate_sent"]:
                new_cat = "lead"
            if "category" in body:
                cat_val = body["category"]
                if cat_val in ["lead", "new_client", "existing_client", "lost_lead"]:
                    new_cat = cat_val
            if new_cat:
                await db.execute(text("UPDATE clients SET client_category = :cat, updated_at = NOW() WHERE id = :cid"), {"cat": new_cat, "cid": cid})

        await record_audit_log(db, "lead.update", "lead", lead_id, user.id, user.email, user.role, body, request)
        return {"ok": True, "lead": dict(updated)}

    return {"ok": True}

@router.delete("/{lead_id}", dependencies=[Depends(require_permission("leads:delete"))])
async def delete_lead(lead_id: int, request: Request, db: AsyncSession = Depends(get_db), user = Depends(require_auth)):
    lead = (await db.execute(text("SELECT full_name FROM leads WHERE id = :id"), {"id": lead_id})).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.execute(text("DELETE FROM leads WHERE id = :id"), {"id": lead_id})
    await record_audit_log(db, "lead.delete", "lead", lead_id, user.id, user.email, user.role, {"deletedLead": lead}, request)
    return {"ok": True}

@router.get("/{lead_id}/activities", dependencies=[Depends(require_permission("leads:view"))])
async def get_lead_activities(lead_id: int, db: AsyncSession = Depends(get_db)):
    sql = text("SELECT * FROM activities WHERE entity_type = 'lead' AND entity_id = :lid ORDER BY created_at DESC")
    rows = (await db.execute(sql, {"lid": lead_id})).mappings().all()
    return {"activities": [dict(r) for r in rows]}

@router.post("/{lead_id}/activities", dependencies=[Depends(require_permission("leads:edit"))])
async def create_lead_activity(lead_id: int, request: Request, db: AsyncSession = Depends(get_db), user = Depends(require_auth)):
    body = await request.json()
    title = body.get("title", "Note Logged")
    desc = body.get("description")
    act_type = body.get("activityType", "note")
    
    author_name = body.get("authorName") or body.get("userName")
    if not author_name:
        author_name = body.get("authorName") or getattr(user, "name", None) or "Staff"

    author_role = body.get("authorRole") or getattr(user, "role", "Owner")
    if author_role:
        author_role = str(author_role).replace("_", " ").title()
    perf_by = f"{author_name} ({author_role})" if author_role else str(author_name)

    lead_cid = (await db.execute(text("SELECT client_id FROM leads WHERE id = :id"), {"id": lead_id})).scalar_one_or_none()

    insert_sql = text("""
        INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name, created_at)
        VALUES ('lead', :lid, :cid, :atype, :title, :desc, :pby, :uid, :uname, NOW())
        RETURNING *
    """)
    new_act = (await db.execute(insert_sql, {
        "lid": lead_id, "cid": lead_cid, "atype": act_type, "title": title, "desc": desc,
        "pby": perf_by, "uid": getattr(user, "id", None), "uname": author_name
    })).mappings().first()

    return {"ok": True, "activity": dict(new_act)}

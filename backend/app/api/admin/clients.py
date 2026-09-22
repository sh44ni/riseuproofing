from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import math

from app.core.database import get_db
from app.middlewares.auth import get_current_user
from app.core.permissions import require_permission
from app.services.sync import find_or_create_client, normalize_phone, recalculate_client_stats, auto_heal_dataflow_sync

router = APIRouter()

@router.get("/clients")
async def get_clients(
    request: Request,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    sort: Optional[str] = "recent",
    page: int = Query(1, ge=1),
    sync: bool = False,
    user: Dict[str, Any] = Depends(require_permission("clients:view")),
    db: AsyncSession = Depends(get_db)
):
    if sync:
        try:
            await auto_heal_dataflow_sync(db)
        except Exception as sync_err:
            pass

    limit = 20
    offset = (page - 1) * limit

    conditions: List[str] = []
    params: Dict[str, Any] = {}

    if category and category != "all":
        target_cat = category
        if target_cat == "leads": target_cat = "lead"
        elif target_cat == "new_clients": target_cat = "new_client"
        elif target_cat == "existing_clients": target_cat = "existing_client"
        elif target_cat == "lost_leads": target_cat = "lost_lead"

        params["target_cat"] = target_cat
        conditions.append("c.client_category = :target_cat")
    elif status and status != "all":
        if status == "lost":
            conditions.append("(c.client_category = 'lost_lead' OR c.status = 'lost')")
        else:
            params["status"] = status
            conditions.append("c.status = :status")
    else:
        conditions.append("(c.client_category IS NULL OR c.client_category != 'lost_lead')")

    if tag and tag != "all":
        params["tag"] = tag
        conditions.append(":tag = ANY(c.tags)")

    if search and search.strip():
        s = search.strip().lower()
        norm = normalize_phone(s)
        params["search"] = f"%{s}%"
        if norm and len(norm) >= 4:
            params["norm"] = f"%{norm}%"
            conditions.append("""(
                LOWER(c.full_name) LIKE :search OR
                LOWER(COALESCE(c.email, '')) LIKE :search OR
                LOWER(COALESCE(c.address, '')) LIKE :search OR
                LOWER(COALESCE(c.city, '')) LIKE :search OR
                c.phone_normalized LIKE :norm OR
                c.phone LIKE :search
            )""")
        else:
            conditions.append("""(
                LOWER(c.full_name) LIKE :search OR
                LOWER(COALESCE(c.email, '')) LIKE :search OR
                LOWER(COALESCE(c.address, '')) LIKE :search OR
                LOWER(COALESCE(c.city, '')) LIKE :search OR
                c.phone LIKE :search
            )""")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    order_by = "c.updated_at DESC"
    if sort == "ltv":
        order_by = "c.total_revenue DESC, c.updated_at DESC"
    elif sort == "name":
        order_by = "c.full_name ASC"
    elif sort == "jobs":
        order_by = "c.total_jobs_count DESC, c.updated_at DESC"
    elif sort == "created":
        order_by = "c.created_at DESC"

    clients_query = text(f"""
        SELECT 
            c.*, 
            u.name as assigned_to_name,
            u_acq.name as acquired_by_name,
            u_acq.role as acquired_by_role,
            u_acq.avatar_url as acquired_by_avatar,
            (
                SELECT lost_reason FROM leads 
                WHERE client_id = c.id AND status = 'lost' AND lost_reason IS NOT NULL 
                ORDER BY updated_at DESC LIMIT 1
            ) as lead_lost_reason,
            (
                SELECT total FROM estimates 
                WHERE client_id = c.id OR lead_id IN (SELECT id FROM leads WHERE client_id = c.id) 
                ORDER BY created_at DESC LIMIT 1
            ) as latest_estimate_total
        FROM clients c
        LEFT JOIN users u ON c.assigned_to_user_id = u.id
        LEFT JOIN users u_acq ON c.acquired_by_user_id = u_acq.id
        {where_clause}
        ORDER BY {order_by}
        LIMIT :limit OFFSET :offset
    """)

    count_query = text(f"SELECT COUNT(*) as count FROM clients c {where_clause}")
    summary_query = text("""
        SELECT 
            COUNT(CASE WHEN client_category != 'lost_lead' OR client_category IS NULL THEN 1 END) as total_clients,
            COUNT(CASE WHEN client_category = 'existing_client' OR status IN ('active_job', 'completed', 'repeat') THEN 1 END) as existing_clients_count,
            COUNT(CASE WHEN client_category = 'new_client' OR (client_category != 'existing_client' AND client_category != 'lost_lead' AND status = 'opportunity') THEN 1 END) as new_clients_count,
            COUNT(CASE WHEN client_category = 'lead' OR (client_category IS NULL AND status = 'lead') THEN 1 END) as leads_count,
            COUNT(CASE WHEN client_category = 'lost_lead' OR (client_category != 'existing_client' AND status = 'lost') THEN 1 END) as lost_leads_count,
            COUNT(CASE WHEN status = 'active_job' THEN 1 END) as active_jobs,
            COALESCE(SUM(CASE WHEN client_category != 'lost_lead' THEN total_revenue ELSE 0 END), 0) as total_ltv
        FROM clients
    """)

    params["limit"] = limit
    params["offset"] = offset

    clients_res = await db.execute(clients_query, params)
    clients_rows = [dict(r._mapping) for r in clients_res.fetchall()]

    count_res = await db.execute(count_query, params)
    total = count_res.scalar() or 0

    summary_res = await db.execute(summary_query)
    s_row = summary_res.first()

    summary = {
        "totalClients": int(s_row.total_clients or 0) if s_row else 0,
        "existingClientsCount": int(s_row.existing_clients_count or 0) if s_row else 0,
        "newClientsCount": int(s_row.new_clients_count or 0) if s_row else 0,
        "leadsCount": int(s_row.leads_count or 0) if s_row else 0,
        "lostLeadsCount": int(s_row.lost_leads_count or 0) if s_row else 0,
        "activeProjects": int(s_row.active_jobs or 0) if s_row else 0,
        "leadCount": int(s_row.leads_count or 0) if s_row else 0,
        "totalLtv": float(s_row.total_ltv or 0) if s_row else 0.0,
    }

    enriched = []
    for c in clients_rows:
        is_team = bool(c.get("acquired_by_user_id") or c.get("acquired_by_name"))
        c_dict = dict(c)
        c_dict["client_category"] = c_dict.get("client_category") or "lead"
        c_dict["lost_reason"] = c_dict.get("lost_reason") or c_dict.get("lead_lost_reason")
        c_dict["latest_estimate_total"] = float(c_dict["latest_estimate_total"]) if c_dict.get("latest_estimate_total") else None
        c_dict["source_type"] = "team_member" if is_team else "website"
        c_dict["lead_source_detail"] = c_dict.get("lead_source_detail") or ("Sales Rep Outreach" if is_team else "Website Inbound")
        enriched.append(c_dict)

    return {
        "ok": True,
        "clients": enriched,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if limit else 1,
        "summary": summary,
    }

@router.post("/clients")
async def create_client(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("clients:create")),
    db: AsyncSession = Depends(get_db)
):
    full_name = payload.get("fullName")
    phone = payload.get("phone")
    email = payload.get("email")

    if not full_name or (not phone and not email):
        raise HTTPException(status_code=400, detail="Client name and at least one contact method (phone or email) are required")

    source_type = "team_member" if payload.get("sourceType") == "team_member" else "website"
    acquired_by = None
    if source_type == "team_member":
        acquired_by = int(payload["acquiredByUserId"]) if payload.get("acquiredByUserId") else user["id"]
    source_detail = payload.get("leadSourceDetail") or ("Team Member Attribution" if source_type == "team_member" else "Manual Office Inbound")

    client = await find_or_create_client(
        db=db,
        full_name=full_name,
        phone=phone,
        email=email,
        secondary_phone=payload.get("secondaryPhone"),
        address=payload.get("address"),
        city=payload.get("city"),
        zip_code=payload.get("zip"),
        property_type=payload.get("propertyType"),
        roof_type=payload.get("roofType"),
        roof_sqf=int(payload["roofSqf"]) if payload.get("roofSqf") else None,
        roof_age=int(payload["roofAge"]) if payload.get("roofAge") else None,
        stories=int(payload["stories"]) if payload.get("stories") else 1,
        hoa=bool(payload.get("hoa")),
        lead_source="admin_manual",
        notes=payload.get("notes"),
        assigned_to_user_id=int(payload["assignedToUserId"]) if payload.get("assignedToUserId") else None,
        source_type=source_type,
        acquired_by_user_id=acquired_by,
        lead_source_detail=source_detail
    )

    try:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
                VALUES ('client', :cid, :cid, 'system', 'Client Profile Created', 'Manual client profile setup by staff', :performer)
            """),
            {"cid": client.id, "performer": user.get("name") or "Staff"}
        )
        await db.commit()
    except Exception:
        pass

    return {"ok": True, "client": {"id": client.id, "full_name": client.full_name}}

@router.get("/clients/{client_id}")
async def get_client_360(
    client_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:view")),
    db: AsyncSession = Depends(get_db)
):
    c_res = await db.execute(
        text("""
            SELECT 
                c.*, 
                u.name as assigned_to_name, 
                u.email as assigned_to_email,
                u_acq.name as acquired_by_name,
                u_acq.role as acquired_by_role,
                u_acq.avatar_url as acquired_by_avatar
            FROM clients c
            LEFT JOIN users u ON c.assigned_to_user_id = u.id
            LEFT JOIN users u_acq ON c.acquired_by_user_id = u_acq.id
            WHERE c.id = :id
        """),
        {"id": client_id}
    )
    client_row = c_res.first()
    if not client_row:
        raise HTTPException(status_code=404, detail="Client not found")

    client = dict(client_row._mapping)
    is_team = bool(client.get("acquired_by_user_id") or client.get("acquired_by_name"))
    client["source_type"] = "team_member" if is_team else "website"
    client["lead_source_detail"] = client.get("lead_source_detail") or ("Sales Rep Outreach" if is_team else "Website Inbound")

    clean_phone = client.get("phone") or "__NONE__"
    clean_norm = client.get("phone_normalized") or "__NONE__"
    clean_email = client.get("email").lower() if client.get("email") else "__NONE__"

    # Fetch related entities in parallel
    leads_res = await db.execute(text("""
        SELECT * FROM leads 
        WHERE client_id = :id 
           OR (phone IS NOT NULL AND :phone != '__NONE__' AND (phone = :phone OR phone = :norm))
           OR (email IS NOT NULL AND :email != '__NONE__' AND LOWER(email) = :email)
        ORDER BY created_at DESC
    """), {"id": client_id, "phone": clean_phone, "norm": clean_norm, "email": clean_email})
    leads = [dict(r._mapping) for r in leads_res.fetchall()]

    inspections_res = await db.execute(text("""
        SELECT ins.*, j.job_number 
        FROM inspections ins
        LEFT JOIN jobs j ON ins.job_id = j.id
        WHERE ins.client_id = :id 
           OR ins.lead_id IN (SELECT id FROM leads WHERE client_id = :id)
           OR ins.job_id IN (SELECT id FROM jobs WHERE client_id = :id)
        ORDER BY ins.inspection_date DESC, ins.created_at DESC
    """), {"id": client_id})
    inspections = [dict(r._mapping) for r in inspections_res.fetchall()]

    estimates_res = await db.execute(text("""
        SELECT e.*, l.status as lead_status
        FROM estimates e
        LEFT JOIN leads l ON e.lead_id = l.id
        WHERE e.client_id = :id 
           OR e.lead_id IN (SELECT id FROM leads WHERE client_id = :id)
        ORDER BY e.created_at DESC
    """), {"id": client_id})
    estimates = [dict(r._mapping) for r in estimates_res.fetchall()]

    jobs_res = await db.execute(text("""
        SELECT j.*, e.estimate_number, u1.name as pm_name, u2.name as foreman_name
        FROM jobs j
        LEFT JOIN estimates e ON j.estimate_id = e.id
        LEFT JOIN users u1 ON j.project_manager_id = u1.id
        LEFT JOIN users u2 ON j.foreman_id = u2.id
        WHERE j.client_id = :id 
           OR j.lead_id IN (SELECT id FROM leads WHERE client_id = :id)
        ORDER BY j.created_at DESC
    """), {"id": client_id})
    jobs = [dict(r._mapping) for r in jobs_res.fetchall()]

    invoices_res = await db.execute(text("""
        SELECT i.*, j.job_number, j.status as job_status
        FROM invoices i
        LEFT JOIN jobs j ON i.job_id = j.id
        WHERE i.client_id = :id 
           OR i.job_id IN (SELECT id FROM jobs WHERE client_id = :id)
           OR i.estimate_id IN (SELECT id FROM estimates WHERE client_id = :id)
        ORDER BY i.due_date ASC, i.created_at DESC
    """), {"id": client_id})
    invoices = [dict(r._mapping) for r in invoices_res.fetchall()]

    warranties_res = await db.execute(text("""
        SELECT w.*, j.job_number, j.service_type as job_service_type
        FROM warranties w
        LEFT JOIN jobs j ON w.job_id = j.id
        WHERE w.client_id = :id 
           OR w.job_id IN (SELECT id FROM jobs WHERE client_id = :id)
        ORDER BY w.created_at DESC
    """), {"id": client_id})
    warranties = [dict(r._mapping) for r in warranties_res.fetchall()]

    reviews_res = await db.execute(text("""
        SELECT r.*, j.job_number 
        FROM reviews r
        LEFT JOIN jobs j ON r.job_id = j.id
        WHERE r.client_id = :id 
           OR r.lead_id IN (SELECT id FROM leads WHERE client_id = :id)
           OR r.job_id IN (SELECT id FROM jobs WHERE client_id = :id)
        ORDER BY r.created_at DESC
    """), {"id": client_id})
    reviews = [dict(r._mapping) for r in reviews_res.fetchall()]

    activities_res = await db.execute(text("""
        SELECT DISTINCT ON (a.id) a.*
        FROM activities a
        WHERE a.client_id = :id
           OR (a.entity_type = 'client' AND a.entity_id = :id)
           OR (a.entity_type = 'lead' AND a.entity_id IN (SELECT id FROM leads WHERE client_id = :id))
           OR (a.entity_type = 'job' AND a.entity_id IN (SELECT id FROM jobs WHERE client_id = :id))
        ORDER BY a.id, a.created_at DESC
        LIMIT 100
    """), {"id": client_id})
    activities = [dict(r._mapping) for r in activities_res.fetchall()]
    activities.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)

    tasks_res = await db.execute(text("""
        SELECT DISTINCT ON (t.id) t.*
        FROM tasks t
        WHERE t.client_id = :id
           OR (t.entity_type = 'client' AND t.entity_id = :id)
           OR (t.entity_type = 'lead' AND t.entity_id IN (SELECT id FROM leads WHERE client_id = :id))
           OR (t.entity_type = 'job' AND t.entity_id IN (SELECT id FROM jobs WHERE client_id = :id))
        ORDER BY t.id, t.completed_at NULLS FIRST, t.due_at ASC
    """), {"id": client_id})
    tasks = [dict(r._mapping) for r in tasks_res.fetchall()]

    # Extract inspection & drone photos from inspections findings or attached data
    inspection_photos = []
    for ins in inspections:
        findings = ins.get("findings")
        if isinstance(findings, list):
            for item in findings:
                if isinstance(item, dict) and item.get("photo_url"):
                    inspection_photos.append({
                        "id": f"insp-{ins.get('id')}-{len(inspection_photos)}",
                        "title": item.get("title") or item.get("category") or "Inspection Photo",
                        "url": item.get("photo_url"),
                        "severity": item.get("status") or "Inspected",
                        "createdAt": str(ins.get("inspection_date") or ins.get("created_at") or "")
                    })
        if ins.get("photo_url"):
            inspection_photos.append({
                "id": f"insp-{ins.get('id')}",
                "title": f"Roof Health Score: {ins.get('roof_health_score', 85)}%",
                "url": ins.get("photo_url"),
                "severity": "Inspected",
                "createdAt": str(ins.get("inspection_date") or ins.get("created_at") or "")
            })

    # Fetch client documents
    docs_res = await db.execute(text("""
        SELECT * FROM client_documents WHERE client_id = :id ORDER BY created_at DESC
    """), {"id": client_id})
    documents = [dict(r._mapping) for r in docs_res.fetchall()]

    total_billed = sum(float(inv.get("amount") or 0) for inv in invoices)
    total_paid = sum(float(inv.get("amount") or 0) for inv in invoices if inv.get("status") == "paid")
    balance_due = max(0.0, total_billed - total_paid)

    client["balance_due"] = balance_due
    client["total_billed"] = total_billed
    client["total_paid"] = total_paid

    return {
        "ok": True,
        "client": client,
        "leads": leads,
        "inspections": inspections,
        "inspection_photos": inspection_photos,
        "documents": documents,
        "estimates": estimates,
        "jobs": jobs,
        "invoices": invoices,
        "warranties": warranties,
        "reviews": reviews,
        "activities": activities,
        "tasks": tasks,
    }

@router.patch("/clients/{client_id}")
async def update_client(
    client_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("clients:edit")),
    db: AsyncSession = Depends(get_db)
):
    allowed_fields = [
        "full_name", "phone", "email", "secondary_phone", "address", "city",
        "zip", "property_type", "roof_type", "roof_sqf", "roof_age", "stories",
        "hoa", "status", "tags", "notes", "assigned_to_user_id", "source_type",
        "acquired_by_user_id", "lead_source_detail", "client_since"
    ]

    int_fields = ["roof_sqf", "roof_age", "stories", "assigned_to_user_id", "acquired_by_user_id"]
    bool_fields = ["hoa"]

    updates = []
    params: Dict[str, Any] = {"id": client_id}

    for key in allowed_fields:
        if key in payload:
            val = payload[key]
            if key in int_fields:
                val = int(val) if val not in (None, "", "null") else None
            elif key in bool_fields:
                val = bool(val)
            elif isinstance(val, str) and val.strip() == "" and key in ["secondary_phone", "notes", "roof_type"]:
                val = None

            params[key] = val
            updates.append(f"{key} = :{key}")

            if key == "phone":
                norm = normalize_phone(val)
                params["norm_phone"] = norm
                updates.append("phone_normalized = :norm_phone")

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updates.append("updated_at = NOW()")

    stmt = text(f"UPDATE clients SET {', '.join(updates)} WHERE id = :id RETURNING *")
    res = await db.execute(stmt, params)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")

    try:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
                VALUES ('client', :id, :id, 'note', 'Client Profile Updated', :desc, :performer)
            """),
            {
                "id": client_id,
                "desc": f"Updated: {', '.join(payload.keys())}",
                "performer": user.get("name") or "Staff"
            }
        )
        await recalculate_client_stats(db, client_id)
        await db.commit()
    except Exception:
        pass

    return {"ok": True, "client": dict(row._mapping)}

@router.delete("/clients/{client_id}")
async def archive_client(
    client_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:delete")),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        text("UPDATE clients SET status = 'inactive', updated_at = NOW() WHERE id = :id"),
        {"id": client_id}
    )
    await db.execute(
        text("""
            INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
            VALUES ('client', :id, :id, 'system', 'Client Archived', 'Client marked as inactive', :performer)
        """),
        {"id": client_id, "performer": user.get("name") or "Staff"}
    )
    await db.commit()
    return {"ok": True, "message": "Client archived"}

@router.post("/clients/{client_id}/activities")
async def add_client_activity(
    client_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("clients:edit")),
    db: AsyncSession = Depends(get_db)
):
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Activity title is required")

    activity_type = payload.get("activityType", "note")
    desc = payload.get("description")
    call_dur = int(payload["callDuration"]) if payload.get("callDuration") else None

    stmt = text("""
        INSERT INTO activities (
            entity_type, entity_id, client_id, activity_type, title, description,
            performed_by, user_id, user_name, call_duration, metadata
        ) VALUES (
            'client', :id, :id, :atype, :title, :desc,
            :pby, :uid, :uname, :dur, :meta
        ) RETURNING *
    """)
    res = await db.execute(stmt, {
        "id": client_id,
        "atype": activity_type,
        "title": title,
        "desc": desc,
        "pby": user.get("name") or "Staff",
        "uid": user["id"],
        "uname": user.get("name") or "Staff",
        "dur": call_dur,
        "meta": None
    })
    row = res.first()
    await db.execute(text("UPDATE clients SET updated_at = NOW() WHERE id = :id"), {"id": client_id})
    await db.commit()

    return {"ok": True, "activity": dict(row._mapping) if row else None}

@router.get("/clients/{client_id}/tasks")
async def get_client_tasks(
    client_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:view")),
    db: AsyncSession = Depends(get_db)
):
    stmt = text("""
        SELECT t.*, u.name as assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        WHERE t.client_id = :id
           OR (t.entity_type = 'client' AND t.entity_id = :id)
           OR (t.entity_type = 'lead' AND t.entity_id IN (SELECT id FROM leads WHERE client_id = :id))
        ORDER BY t.completed_at NULLS FIRST, t.due_at ASC
    """)
    res = await db.execute(stmt, {"id": client_id})
    tasks = [dict(r._mapping) for r in res.fetchall()]
    return {"ok": True, "tasks": tasks}

@router.post("/clients/{client_id}/tasks")
async def create_client_task(
    client_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("clients:edit")),
    db: AsyncSession = Depends(get_db)
):
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required")

    due_at_raw = payload.get("dueAt") or payload.get("dueDate")
    if due_at_raw:
        if isinstance(due_at_raw, datetime):
            due_at = due_at_raw
        else:
            try:
                due_at = datetime.fromisoformat(str(due_at_raw).replace("Z", "+00:00"))
            except Exception:
                due_at = datetime.now(timezone.utc)
    else:
        due_at = datetime.now(timezone.utc)

    priority = payload.get("priority", "normal")
    desc = payload.get("description", "")
    assigned_to_uid = int(payload["assignedToUserId"]) if payload.get("assignedToUserId") else user["id"]
    assigned_name = payload.get("assignedTo") or user.get("name") or "Staff"

    stmt = text("""
        INSERT INTO tasks (
            client_id, entity_type, entity_id, title, description,
            assigned_to, assigned_to_user_id, created_by_user_id,
            event_type, due_at, priority, created_at
        ) VALUES (
            :cid, 'client', :cid, :title, :desc,
            :assigned_name, :assigned_uid, :uid,
            'task', :due_at, :priority, NOW()
        ) RETURNING *
    """)
    res = await db.execute(stmt, {
        "cid": client_id,
        "title": title,
        "desc": desc,
        "assigned_name": assigned_name,
        "assigned_uid": assigned_to_uid,
        "uid": user["id"],
        "due_at": due_at,
        "priority": priority,
    })
    row = res.first()
    await db.commit()
    return {"ok": True, "task": dict(row._mapping) if row else None}

@router.put("/clients/{client_id}/tasks/{task_id}")
async def toggle_client_task(
    client_id: int,
    task_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:edit")),
    db: AsyncSession = Depends(get_db)
):
    stmt = text("""
        UPDATE tasks
        SET completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE NULL END
        WHERE id = :task_id AND (client_id = :cid OR entity_id = :cid)
        RETURNING *
    """)
    res = await db.execute(stmt, {"task_id": task_id, "cid": client_id})
    row = res.first()
    if not row:
        res = await db.execute(text("""
            UPDATE tasks
            SET completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE NULL END
            WHERE id = :task_id
            RETURNING *
        """), {"task_id": task_id})
        row = res.first()
    await db.commit()
    return {"ok": True, "task": dict(row._mapping) if row else None}

@router.get("/clients/{client_id}/documents")
async def get_client_documents(
    client_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:view")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("""
        SELECT * FROM client_documents WHERE client_id = :id ORDER BY created_at DESC
    """), {"id": client_id})
    docs = [dict(r._mapping) for r in res.fetchall()]
    return {"ok": True, "documents": docs}

@router.post("/clients/{client_id}/documents")
async def add_client_document(
    client_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("clients:edit")),
    db: AsyncSession = Depends(get_db)
):
    name = payload.get("name") or "Document"
    file_url = payload.get("fileUrl") or payload.get("url")
    if not file_url:
        raise HTTPException(status_code=400, detail="File URL is required")

    file_type = payload.get("fileType", "document")
    raw_size = payload.get("fileSize") or payload.get("file_size") or ""
    file_size = str(raw_size)

    stmt = text("""
        INSERT INTO client_documents (client_id, name, file_url, file_type, file_size, uploaded_by, created_at)
        VALUES (:cid, :name, :url, :ftype, :fsize, :upby, NOW())
        RETURNING *
    """)
    res = await db.execute(stmt, {
        "cid": client_id,
        "name": name,
        "url": file_url,
        "ftype": file_type,
        "fsize": file_size,
        "upby": user.get("name") or "Staff"
    })
    row = res.first()
    await db.commit()
    return {"ok": True, "document": dict(row._mapping) if row else None}

@router.delete("/clients/{client_id}/documents/{document_id}")
async def delete_client_document(
    client_id: int,
    document_id: int,
    user: Dict[str, Any] = Depends(require_permission("clients:delete")),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(text("DELETE FROM client_documents WHERE id = :did AND client_id = :cid"), {
        "did": document_id,
        "cid": client_id
    })
    await db.commit()
    return {"ok": True, "message": "Document deleted"}


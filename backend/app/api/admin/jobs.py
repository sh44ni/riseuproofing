from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.permissions import require_permission, require_any_permission, build_scope_filter
from app.services.sync import find_or_create_client, recalculate_client_stats

router = APIRouter()

JOB_STAGES = [
    "permit_pending",
    "material_order",
    "scheduled",
    "in_progress",
    "punch_list",
    "final_inspection",
    "complete",
]

@router.get("/jobs")
async def get_jobs(
    request: Request,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: Dict[str, Any] = Depends(require_permission("jobs:view")),
    db: AsyncSession = Depends(get_db)
):
    conditions: List[str] = []
    params: Dict[str, Any] = {}

    scope = build_scope_filter(
        user=user,
        action="jobs.view",
        creator_col="COALESCE(jobs.created_by, (SELECT created_by_user_id FROM leads WHERE leads.id = jobs.lead_id))",
        assigned_col="(SELECT assigned_to_user_id FROM leads WHERE leads.id = jobs.lead_id)",
        param_prefix="scope_"
    )

    if not scope["allowed"]:
        raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions to view jobs")

    if scope["clause"] != "1=1":
        conditions.append(scope["clause"])
        params.update(scope["params"])

    if status and status != "all":
        params["status"] = status
        conditions.append("status = :status")

    if search and search.strip():
        s = search.strip().lower()
        params["search"] = f"%{s}%"
        conditions.append("""(
            LOWER(customer_name) LIKE :search OR
            LOWER(job_number) LIKE :search OR
            LOWER(COALESCE(address, '')) LIKE :search OR
            LOWER(COALESCE(city, '')) LIKE :search
        )""")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    jobs_query = text(f"SELECT * FROM jobs {where_clause} ORDER BY created_at DESC")
    stats_query = text("""
        SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN status != 'complete' THEN 1 END) as active_count,
            COALESCE(SUM(contract_value), 0) as total_value,
            COALESCE(SUM(CASE WHEN status != 'complete' THEN contract_value ELSE 0 END), 0) as active_value
        FROM jobs
    """)

    res = await db.execute(jobs_query, params)
    jobs_rows = [dict(r._mapping) for r in res.fetchall()]

    stats_res = await db.execute(stats_query)
    s_row = stats_res.first()

    kanban: Dict[str, List[Dict[str, Any]]] = {stage: [] for stage in JOB_STAGES}
    for j in jobs_rows:
        st = j.get("status")
        if st in kanban:
            kanban[st].append(j)
        else:
            kanban["permit_pending"].append(j)

    summary = {
        "totalCount": int(s_row.total_count or 0) if s_row else 0,
        "activeCount": int(s_row.active_count or 0) if s_row else 0,
        "totalValue": float(s_row.total_value or 0) if s_row else 0.0,
        "activeValue": float(s_row.active_value or 0) if s_row else 0.0,
    }

    return {
        "jobs": jobs_rows,
        "kanban": kanban,
        "summary": summary
    }

@router.post("/jobs")
async def create_job(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_any_permission(["jobs:change_stage", "estimates:create"])),
    db: AsyncSession = Depends(get_db)
):
    lead_id = payload.get("leadId")
    if not lead_id:
        raise HTTPException(
            status_code=400,
            detail="A valid sales pipeline lead is required to create a job. Please select an existing lead."
        )

    parsed_lead_id = int(lead_id)
    l_res = await db.execute(text("SELECT * FROM leads WHERE id = :id"), {"id": parsed_lead_id})
    lead_row = l_res.first()
    if not lead_row:
        raise HTTPException(status_code=404, detail="Selected lead not found in sales pipeline")
    lead = dict(lead_row._mapping)

    final_name = payload.get("customerName") or lead.get("full_name")
    if not final_name:
        raise HTTPException(status_code=400, detail="Customer name is required")

    client_id = int(lead["client_id"]) if lead.get("client_id") else None
    if not client_id:
        c = await find_or_create_client(
            db=db,
            full_name=final_name,
            phone=payload.get("customerPhone") or lead.get("phone"),
            email=payload.get("customerEmail") or lead.get("email"),
            address=payload.get("address") or lead.get("address"),
            city=payload.get("city") or lead.get("city"),
            zip_code=payload.get("zip") or lead.get("zip"),
            lead_source=lead.get("lead_source") or "job_creation"
        )
        client_id = c.id
        await db.execute(text("UPDATE leads SET client_id = :cid WHERE id = :id"), {"cid": client_id, "id": parsed_lead_id})

    # Find estimate to link if exists
    est_res = await db.execute(
        text("SELECT id, total FROM estimates WHERE lead_id = :lid OR (client_id = :cid AND client_id IS NOT NULL) ORDER BY created_at DESC LIMIT 1"),
        {"lid": parsed_lead_id, "cid": client_id}
    )
    est_row = est_res.first()
    estimate_id = int(est_row.id) if est_row else None

    job_created_by = lead.get("created_by") or lead.get("created_by_user_id")
    job_role_snapshot = lead.get("created_by_role_snapshot")
    if not job_created_by:
        job_created_by = user["id"]
        job_role_snapshot = ", ".join([r["name"] for r in user.get("roles", [])]) if user.get("roles") else user.get("role", "Staff")

    year = datetime.now(timezone.utc).year
    count_res = await db.execute(text("SELECT COUNT(*) FROM jobs"))
    seq = str(int(count_res.scalar() or 0) + 1).zfill(4)
    job_number = f"JOB-{year}-{seq}"

    final_contract_val = float(payload.get("contractValue") or 0)
    if not final_contract_val and est_row and est_row.total:
        final_contract_val = float(est_row.total)

    insert_stmt = text("""
        INSERT INTO jobs (
            lead_id, client_id, estimate_id, job_number, status, customer_name, customer_phone, customer_email,
            address, city, zip, service_type, contract_value, scheduled_start,
            estimated_days, crew_lead, notes,
            created_by, created_by_role_snapshot
        ) VALUES (
            :lead_id, :client_id, :est_id, :job_num, 'permit_pending', :c_name, :c_phone, :c_email,
            :addr, :city, :zip, :svc_type, :c_val, :sched_start,
            :est_days, :crew_lead, :notes,
            :creator, :role_snap
        ) RETURNING *
    """)

    res = await db.execute(insert_stmt, {
        "lead_id": parsed_lead_id,
        "client_id": client_id,
        "est_id": estimate_id,
        "job_num": job_number,
        "c_name": final_name,
        "c_phone": payload.get("customerPhone") or lead.get("phone"),
        "c_email": payload.get("customerEmail") or lead.get("email"),
        "addr": payload.get("address") or lead.get("address"),
        "city": payload.get("city") or lead.get("city"),
        "zip": payload.get("zip") or lead.get("zip"),
        "svc_type": payload.get("serviceType") or lead.get("service_type") or "Residential Roofing",
        "c_val": final_contract_val,
        "sched_start": payload.get("scheduledStart"),
        "est_days": int(payload.get("estimatedDays") or 3),
        "crew_lead": payload.get("crewLead"),
        "notes": payload.get("notes"),
        "creator": job_created_by,
        "role_snap": job_role_snapshot,
    })
    new_job = dict(res.first()._mapping)

    # Automatically transition lead to Stage 5 and mark won
    await db.execute(
        text("""
            UPDATE leads 
            SET pipeline_stage = 'stage_5_completion_followup',
                stage_entered_at = CASE WHEN pipeline_stage != 'stage_5_completion_followup' THEN NOW() ELSE stage_entered_at END,
                status = 'won',
                contract_signed_at = COALESCE(contract_signed_at, NOW()),
                estimated_value = GREATEST(COALESCE(estimated_value, 0), :val),
                updated_at = NOW()
            WHERE id = :id
        """),
        {"val": final_contract_val, "id": parsed_lead_id}
    )

    if estimate_id:
        await db.execute(
            text("UPDATE estimates SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()), client_id = COALESCE(client_id, :cid) WHERE id = :id"),
            {"cid": client_id, "id": estimate_id}
        )

    if client_id:
        await recalculate_client_stats(db, client_id)

    # Activity timelines
    await db.execute(
        text("""
            INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
            VALUES ('lead', :lid, :cid, 'status_change', :title, :desc, :pby)
        """),
        {
            "lid": parsed_lead_id,
            "cid": client_id,
            "title": f"Job Dispatched: {job_number}",
            "desc": f"Moved to Stage 5 (Production / Permit Pending) with contract value ${final_contract_val:,.2f}",
            "pby": user.get("name") or "Staff"
        }
    )

    if client_id:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
                VALUES ('client', :cid, :cid, 'status_change', :title, :desc, :pby)
            """),
            {
                "cid": client_id,
                "title": f"New Project Started: {job_number}",
                "desc": f"Contract Value: ${final_contract_val:,.2f} ({new_job.get('service_type')})",
                "pby": user.get("name") or "Staff"
            }
        )

    await db.commit()
    return {"ok": True, "job": new_job}

@router.get("/jobs/{job_id}")
async def get_job(
    job_id: int,
    user: Dict[str, Any] = Depends(require_permission("jobs:view")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("SELECT * FROM jobs WHERE id = :id"), {"id": job_id})
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    job = dict(row._mapping)
    estimate = None
    if job.get("estimate_id"):
        est_res = await db.execute(text("SELECT * FROM estimates WHERE id = :id"), {"id": job["estimate_id"]})
        est_row = est_res.first()
        if est_row:
            estimate = dict(est_row._mapping)

    return {"job": job, "estimate": estimate}

@router.patch("/jobs/{job_id}")
async def update_job(
    job_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_any_permission(["jobs:change_stage", "jobs:manage_permits"])),
    db: AsyncSession = Depends(get_db)
):
    allowed = [
        "status", "customer_name", "customer_phone", "customer_email",
        "address", "city", "zip", "service_type", "contract_value",
        "permit_status", "permit_number", "permit_filed_at", "permit_approved_at",
        "material_status", "material_ordered_at", "material_delivered_at",
        "crew_lead", "crew_members", "scheduled_start", "estimated_days",
        "actual_start", "actual_end", "weather_delays", "notes"
    ]

    updates = []
    params: Dict[str, Any] = {"id": job_id}

    for f in allowed:
        if f in payload:
            params[f] = payload[f]
            updates.append(f"{f} = :{f}")

    if not updates:
        return {"ok": True}

    updates.append("updated_at = NOW()")

    stmt = text(f"UPDATE jobs SET {', '.join(updates)} WHERE id = :id RETURNING *")
    res = await db.execute(stmt, params)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    updated_job = dict(row._mapping)

    if payload.get("status") == "complete" and updated_job.get("lead_id"):
        await db.execute(
            text("UPDATE leads SET job_completed_at = NOW(), status = 'won', updated_at = NOW() WHERE id = :id"),
            {"id": updated_job["lead_id"]}
        )

    if updated_job.get("client_id"):
        await recalculate_client_stats(db, int(updated_job["client_id"]))

    await db.commit()
    return {"ok": True, "job": updated_job}

@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    user: Dict[str, Any] = Depends(require_permission("jobs:delete")),
    db: AsyncSession = Depends(get_db)
):
    ex = await db.execute(text("SELECT client_id FROM jobs WHERE id = :id"), {"id": job_id})
    ex_row = ex.first()
    client_id = int(ex_row.client_id) if ex_row and ex_row.client_id else None

    await db.execute(text("DELETE FROM jobs WHERE id = :id"), {"id": job_id})
    if client_id:
        await recalculate_client_stats(db, client_id)

    await db.commit()
    return {"ok": True}

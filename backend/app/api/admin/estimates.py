from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, Dict, Any, List
import secrets
import os
import uuid
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.permissions import require_permission, require_any_permission, has_permission, build_scope_filter
from app.services.calculator import calculate_roof_estimate
from app.services.sync import find_or_create_client, recalculate_client_stats
from app.services.pdf_generator import generate_estimate_proposal_pdf, save_estimate_pdf_file
from app.services.email_service import send_estimate_proposal_email
import orjson

router = APIRouter()

@router.get("/estimates")
async def get_estimates(
    request: Request,
    status: Optional[str] = None,
    lead_id: Optional[int] = None,
    user: Dict[str, Any] = Depends(require_permission("estimates:view")),
    db: AsyncSession = Depends(get_db)
):
    can_view_margins = has_permission(user, "estimates:view_margins")

    conditions: List[str] = []
    params: Dict[str, Any] = {}

    scope = build_scope_filter(
        user=user,
        action="estimates.view",
        creator_col="COALESCE(estimates.created_by, (SELECT created_by_user_id FROM leads WHERE leads.id = estimates.lead_id))",
        assigned_col="(SELECT assigned_to_user_id FROM leads WHERE leads.id = estimates.lead_id)",
        param_prefix="scope_"
    )

    if not scope["allowed"]:
        raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions to view estimates")

    if scope["clause"] != "1=1":
        conditions.append(scope["clause"])
        params.update(scope["params"])

    if status and status != "all":
        params["status"] = status
        conditions.append("status = :status")

    if lead_id:
        params["lead_id"] = lead_id
        conditions.append("lead_id = :lead_id")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    estimates_query = text(f"SELECT * FROM estimates {where_clause} ORDER BY created_at DESC")
    stats_query = text("""
        SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(total), 0) as pipeline_value,
            COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
            COALESCE(SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END), 0) as accepted_value
        FROM estimates
    """)

    res = await db.execute(estimates_query, params)
    estimates_rows = [dict(r._mapping) for r in res.fetchall()]

    stats_res = await db.execute(stats_query)
    s_row = stats_res.first()

    summary = {
        "totalCount": int(s_row.total_count or 0) if s_row else 0,
        "pipelineValue": float(s_row.pipeline_value or 0) if s_row else 0.0,
        "acceptedCount": int(s_row.accepted_count or 0) if s_row else 0,
        "acceptedValue": float(s_row.accepted_value or 0) if s_row else 0.0,
    }

    sanitized = []
    for e in estimates_rows:
        e_dict = dict(e)
        if not can_view_margins:
            e_dict.pop("material_cost", None)
            e_dict.pop("labor_cost", None)
            e_dict.pop("margin_pct", None)
        sanitized.append(e_dict)

    return {"estimates": sanitized, "summary": summary}

@router.post("/estimates")
async def create_estimate(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
    db: AsyncSession = Depends(get_db)
):
    customer_name = payload.get("customerName")
    if not customer_name:
        raise HTTPException(status_code=400, detail="Customer name is required")

    lead_id = int(payload["leadId"]) if payload.get("leadId") else None
    client_id = int(payload["clientId"]) if payload.get("clientId") else None
    service_type = payload.get("serviceType", "Residential Roofing")
    roof_squares = float(payload.get("roofSquares", 25))
    roof_pitch = payload.get("roofPitch", "4:12")
    stories = int(payload.get("stories", 1))
    tearoff_layers = int(payload.get("tearoffLayers", 1))
    material_id = payload.get("materialId", "oc_duration")
    addons = payload.get("addons") or []
    margin_pct = float(payload.get("marginPct", 30))
    financing_months = int(payload.get("financingMonths", 60))
    valid_days = int(payload.get("validDays", 30))
    notes = payload.get("notes")
    template_key = payload.get("templateKey") or payload.get("template_key", "multi_option_proposal")
    proposal_data = payload.get("proposalData") or payload.get("proposal_data")
    pdf_url = payload.get("pdfUrl") or payload.get("pdf_url")

    customer_phone = payload.get("customerPhone")
    customer_email = payload.get("customerEmail")
    customer_address = payload.get("customerAddress")
    customer_city = payload.get("customerCity")
    customer_zip = payload.get("customerZip")

    calc = calculate_roof_estimate(
        roof_squares=roof_squares,
        pitch=roof_pitch,
        stories=stories,
        tearoff_layers=tearoff_layers,
        material_id=material_id,
        addons=addons,
        margin_pct=margin_pct,
        financing_months=financing_months,
    )

    custom_total = payload.get("total")
    final_total = float(custom_total) if custom_total is not None else calc["total_price"]

    final_client_id = client_id
    if not final_client_id and lead_id:
        l_res = await db.execute(text("SELECT client_id FROM leads WHERE id = :id"), {"id": lead_id})
        l_row = l_res.first()
        if l_row and l_row[0]:
            final_client_id = int(l_row[0])

    if not final_client_id and (customer_phone or customer_email):
        try:
            c = await find_or_create_client(
                db=db,
                full_name=customer_name,
                phone=customer_phone,
                email=customer_email,
                address=customer_address,
                city=customer_city,
                zip_code=customer_zip,
                lead_source="estimate_generator",
            )
            final_client_id = c.id
        except Exception:
            pass

    estimate_created_by = user["id"]
    estimate_role_snapshot = ", ".join([r["name"] for r in user.get("roles", [])]) if user.get("roles") else user.get("role", "Staff")

    if lead_id:
        try:
            lead_attr = await db.execute(
                text("SELECT created_by, created_by_user_id, created_by_role_snapshot FROM leads WHERE id = :id"),
                {"id": lead_id}
            )
            l_row = lead_attr.first()
            if l_row:
                if l_row.created_by or l_row.created_by_user_id:
                    estimate_created_by = int(l_row.created_by or l_row.created_by_user_id)
                if l_row.created_by_role_snapshot:
                    estimate_role_snapshot = l_row.created_by_role_snapshot
        except Exception:
            pass

    year = datetime.now(timezone.utc).year
    count_res = await db.execute(text("SELECT COUNT(*) FROM estimates"))
    seq = str(int(count_res.scalar() or 0) + 1).zfill(4)
    estimate_number = f"EST-{year}-{seq}"

    valid_until = (datetime.now(timezone.utc) + timedelta(days=valid_days)).date()
    access_token = secrets.token_hex(16)

    insert_stmt = text("""
        INSERT INTO estimates (
            lead_id, client_id, estimate_number, status, customer_name, customer_phone, customer_email,
            customer_address, customer_city, customer_zip, service_type,
            roof_squares, roof_pitch, stories, tearoff_layers, material_type,
            material_cost, labor_cost, addons, subtotal, margin_pct, total,
            financing_months, monthly_payment, valid_until, notes, access_token,
            created_by, created_by_role_snapshot,
            template_key, proposal_data, pdf_url
        ) VALUES (
            :lead_id, :client_id, :est_num, 'draft', :c_name, :c_phone, :c_email,
            :c_addr, :c_city, :c_zip, :svc_type,
            :squares, :pitch, :stories, :tearoff, :mat_name,
            :mat_cost, :labor_cost, CAST(:addons AS jsonb), :subtotal, :margin, :total,
            :fin_months, :mo_payment, :valid_until, :notes, :token,
            :creator, :role_snap,
            :template_key, CAST(:proposal_data AS jsonb), :pdf_url
        ) RETURNING *
    """)

    addons_json = orjson.dumps(calc["addons_detail"]).decode("utf-8")
    prop_data_json = orjson.dumps(proposal_data).decode("utf-8") if proposal_data else None

    res = await db.execute(insert_stmt, {
        "lead_id": lead_id,
        "client_id": final_client_id,
        "est_num": estimate_number,
        "c_name": customer_name,
        "c_phone": customer_phone,
        "c_email": customer_email,
        "c_addr": customer_address,
        "c_city": customer_city,
        "c_zip": customer_zip,
        "svc_type": service_type,
        "squares": calc["squares"],
        "pitch": roof_pitch,
        "stories": stories,
        "tearoff": tearoff_layers,
        "mat_name": calc["material"]["name"],
        "mat_cost": calc["material_subtotal"],
        "labor_cost": calc["labor_subtotal"] + calc["tearoff_subtotal"],
        "addons": addons_json,
        "subtotal": calc["cost_subtotal"],
        "margin": calc["margin_pct"],
        "total": final_total,
        "fin_months": financing_months,
        "mo_payment": calc["monthly_payment"],
        "valid_until": valid_until,
        "notes": notes,
        "token": access_token,
        "creator": estimate_created_by,
        "role_snap": estimate_role_snapshot,
        "template_key": template_key,
        "proposal_data": prop_data_json,
        "pdf_url": pdf_url,
    })
    new_estimate = dict(res.first()._mapping)

    if lead_id:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
                VALUES ('lead', :lid, 'note', :title, :desc, 'Staff', :cid)
            """),
            {
                "lid": lead_id,
                "title": f"Estimate Created: {estimate_number}",
                "desc": f"Total: ${calc['total_price']:,.2f} ({calc['squares']} sq, {calc['material']['name']})",
                "cid": final_client_id,
            }
        )
        await db.execute(
            text("UPDATE leads SET status = 'quoted' WHERE id = :id AND status IN ('new', 'contacted', 'inspected')"),
            {"id": lead_id}
        )

    if final_client_id:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
                VALUES ('client', :cid, 'quote_sent', :title, :desc, 'Staff', :cid)
            """),
            {
                "cid": final_client_id,
                "title": f"Estimate Created: {estimate_number}",
                "desc": f"Total: ${calc['total_price']:,.2f} ({calc['squares']} sq, {calc['material']['name']})",
            }
        )
        await recalculate_client_stats(db, final_client_id)

    await db.commit()
    return {"ok": True, "estimate": new_estimate}

@router.get("/estimates/{estimate_id}")
async def get_estimate(
    estimate_id: int,
    user: Dict[str, Any] = Depends(require_permission("estimates:view")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("SELECT * FROM estimates WHERE id = :id"), {"id": estimate_id})
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Estimate not found")

    est = dict(row._mapping)
    if not has_permission(user, "estimates:view_margins"):
        est.pop("material_cost", None)
        est.pop("labor_cost", None)
        est.pop("margin_pct", None)

    return {"estimate": est}

@router.patch("/estimates/{estimate_id}")
async def update_estimate(
    estimate_id: int,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
    db: AsyncSession = Depends(get_db)
):
    allowed = [
        "status", "customer_name", "customer_phone", "customer_email",
        "customer_address", "customer_city", "customer_zip", "service_type",
        "roof_squares", "roof_pitch", "stories", "tearoff_layers", "material_type",
        "material_cost", "labor_cost", "addons", "subtotal", "margin_pct", "total",
        "financing_months", "monthly_payment", "valid_until", "notes", "sent_at",
        "template_key", "proposal_data", "pdf_url"
    ]

    updates = []
    params: Dict[str, Any] = {"id": estimate_id}

    for f in allowed:
        if f in payload:
            val = payload[f]
            if f in ("addons", "proposal_data") and isinstance(val, (list, dict)):
                val = orjson.dumps(val).decode("utf-8")
            params[f] = val
            if f in ("addons", "proposal_data"):
                updates.append(f"{f} = CAST(:{f} AS jsonb)")
            else:
                updates.append(f"{f} = :{f}")

    if payload.get("status") == "sent" and not payload.get("sent_at"):
        updates.append("sent_at = NOW()")

    updates.append("updated_at = NOW()")

    stmt = text(f"UPDATE estimates SET {', '.join(updates)} WHERE id = :id RETURNING *")
    res = await db.execute(stmt, params)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Estimate not found")

    est = dict(row._mapping)

    # If estimate was sent, advance lead to Stage 4 (Closing)
    if payload.get("status") == "sent" and est.get("lead_id"):
        lead_id = est["lead_id"]
        total_val = float(est.get("total") or 0)
        await db.execute(
            text("""
                UPDATE leads
                SET 
                    pipeline_stage = 'stage_4_closing',
                    stage_entered_at = CASE WHEN pipeline_stage != 'stage_4_closing' THEN NOW() ELSE stage_entered_at END,
                    proposal_sent_at = NOW(),
                    status = 'proposal',
                    estimated_value = GREATEST(COALESCE(estimated_value, 0), :total),
                    updated_at = NOW()
                WHERE id = :lid
            """),
            {"total": total_val, "lid": lead_id}
        )
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
                VALUES ('lead', :lid, 'proposal_sent', 'Proposal Sent to Homeowner', :desc, :pby)
            """),
            {
                "lid": lead_id,
                "desc": f"{user.get('name')} sent official estimate {est.get('estimate_number')} (${total_val:,.2f}) to customer. Card advanced to Stage 4 (Closing).",
                "pby": user.get("name") or "Staff"
            }
        )

    await db.commit()
    return {"ok": True, "estimate": est}

@router.delete("/estimates/{estimate_id}")
async def delete_estimate(
    estimate_id: int,
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(text("DELETE FROM estimates WHERE id = :id"), {"id": estimate_id})
    await db.commit()
    return {"ok": True}

@router.post("/estimates/{estimate_id}/convert")
async def convert_estimate_to_job(
    estimate_id: int,
    user: Dict[str, Any] = Depends(require_any_permission(["jobs:change_stage", "estimates:create"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("SELECT * FROM estimates WHERE id = :id"), {"id": estimate_id})
    est_row = res.first()
    if not est_row:
        raise HTTPException(status_code=404, detail="Estimate not found")

    est = dict(est_row._mapping)

    # Check if already converted
    existing = await db.execute(text("SELECT id, job_number FROM jobs WHERE estimate_id = :id"), {"id": estimate_id})
    ex_row = existing.first()
    if ex_row:
        return {"ok": True, "alreadyConverted": True, "job": dict(ex_row._mapping)}

    client_id = est.get("client_id")
    if not client_id and est.get("lead_id"):
        l_res = await db.execute(text("SELECT client_id FROM leads WHERE id = :id"), {"id": est["lead_id"]})
        l_row = l_res.first()
        if l_row and l_row[0]:
            client_id = int(l_row[0])

    if not client_id and (est.get("customer_phone") or est.get("customer_email")):
        try:
            c = await find_or_create_client(
                db=db,
                full_name=est["customer_name"],
                phone=est.get("customer_phone"),
                email=est.get("customer_email"),
                address=est.get("customer_address"),
                city=est.get("customer_city"),
                zip_code=est.get("customer_zip"),
                lead_source="estimate_conversion",
            )
            client_id = c.id
            await db.execute(text("UPDATE estimates SET client_id = :cid WHERE id = :eid"), {"cid": client_id, "eid": estimate_id})
        except Exception:
            pass

    job_created_by = est.get("created_by")
    job_role_snapshot = est.get("created_by_role_snapshot")

    if not job_created_by and est.get("lead_id"):
        l_res = await db.execute(
            text("SELECT created_by, created_by_user_id, created_by_role_snapshot FROM leads WHERE id = :id"),
            {"id": est["lead_id"]}
        )
        l_row = l_res.first()
        if l_row:
            job_created_by = l_row.created_by or l_row.created_by_user_id
            if l_row.created_by_role_snapshot:
                job_role_snapshot = l_row.created_by_role_snapshot

    if not job_created_by:
        job_created_by = user["id"]
        job_role_snapshot = ", ".join([r["name"] for r in user.get("roles", [])]) if user.get("roles") else user.get("role", "Staff")

    year = datetime.now(timezone.utc).year
    job_count_res = await db.execute(text("SELECT COUNT(*) FROM jobs"))
    seq = str(int(job_count_res.scalar() or 0) + 1).zfill(4)
    job_number = f"JOB-{year}-{seq}"

    insert_job = text("""
        INSERT INTO jobs (
            lead_id, estimate_id, client_id, job_number, status, customer_name, customer_phone,
            customer_email, address, city, zip, service_type, contract_value, notes,
            created_by, created_by_role_snapshot
        ) VALUES (
            :lead_id, :est_id, :client_id, :job_num, 'permit_pending', :c_name, :c_phone,
            :c_email, :addr, :city, :zip, :svc_type, :val, :notes,
            :creator, :role_snap
        ) RETURNING *
    """)

    job_res = await db.execute(insert_job, {
        "lead_id": est.get("lead_id"),
        "est_id": est["id"],
        "client_id": client_id,
        "job_num": job_number,
        "c_name": est["customer_name"],
        "c_phone": est.get("customer_phone"),
        "c_email": est.get("customer_email"),
        "addr": est.get("customer_address"),
        "city": est.get("customer_city"),
        "zip": est.get("customer_zip"),
        "svc_type": est.get("service_type") or "Residential Roofing",
        "val": est.get("total") or 0,
        "notes": est.get("notes"),
        "creator": job_created_by,
        "role_snap": job_role_snapshot,
    })
    job = dict(job_res.first()._mapping)

    await db.execute(
        text("UPDATE estimates SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()) WHERE id = :id"),
        {"id": estimate_id}
    )

    if est.get("lead_id"):
        lead_id = est["lead_id"]
        total_val = float(est.get("total") or 0)
        await db.execute(
            text("""
                UPDATE leads 
                SET status = 'won', 
                    pipeline_stage = 'stage_5_completion_followup',
                    stage_entered_at = NOW(),
                    contract_signed_at = COALESCE(contract_signed_at, NOW()),
                    estimated_value = GREATEST(COALESCE(estimated_value, 0), :val),
                    updated_at = NOW()
                WHERE id = :lid
            """),
            {"val": total_val, "lid": lead_id}
        )
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
                VALUES ('lead', :lid, 'status_change', :title, :desc, 'Admin', :cid)
            """),
            {
                "lid": lead_id,
                "title": f"Deal Won! Converted to {job_number}",
                "desc": f"Contract Value: ${total_val:,.2f} — Moved to Stage 5 (Job Completion & Follow-up)",
                "cid": client_id,
            }
        )

    if client_id:
        await db.execute(
            text("""
                INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
                VALUES ('client', :cid, 'status_change', :title, :desc, 'Admin', :cid)
            """),
            {
                "cid": client_id,
                "title": f"Active Job Created: {job_number}",
                "desc": f"Contract Value: ${float(est.get('total') or 0):,.2f} from {est.get('estimate_number')}",
            }
        )
        await recalculate_client_stats(db, client_id)

    await db.commit()
    return {"ok": True, "job": job}

@router.post("/estimates/generate-pdf")
async def generate_estimate_pdf_endpoint(
    payload: Dict[str, Any],
    download: bool = False,
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
    db: AsyncSession = Depends(get_db)
):
    proposal_data = payload.get("proposalData") or payload
    estimate_id = payload.get("estimateId")
    template_key = payload.get("templateKey") or payload.get("template_key") or proposal_data.get("templateKey") or "multi_option_proposal"
    
    try:
        # Generate PDF via Playwright
        pdf_bytes = await generate_estimate_proposal_pdf(proposal_data, template_key=template_key)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print("GENERATE_PDF_ERROR:\n", tb)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)} | {tb}")
    
    # Save file
    est_num = proposal_data.get("estimateNumber") or (f"EST_{estimate_id}" if estimate_id else "DRAFT")
    saved_url = save_estimate_pdf_file(est_num, pdf_bytes)
    
    if estimate_id:
        try:
            prop_data_json = orjson.dumps(proposal_data).decode("utf-8") if proposal_data else None
            await db.execute(
                text("""
                    UPDATE estimates 
                    SET pdf_url = :pdf_url, 
                        template_key = COALESCE(:template_key, template_key),
                        proposal_data = COALESCE(:proposal_data, proposal_data),
                        notes = COALESCE(notes, '') || :note 
                    WHERE id = :id
                """),
                {
                    "id": estimate_id,
                    "pdf_url": saved_url,
                    "template_key": template_key,
                    "proposal_data": prop_data_json,
                    "note": f"\n[PDF Generated: {saved_url}]"
                }
            )
            await db.commit()
        except Exception:
            pass
            
    if download:
        filename = f"RiseUp_Proposal_{est_num}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    return {
        "ok": True,
        "pdfUrl": saved_url,
        "downloadUrl": saved_url,
        "filename": os.path.basename(saved_url),
        "sizeBytes": len(pdf_bytes)
    }

@router.get("/estimates/{estimate_id}/pdf")
async def get_estimate_pdf(
    estimate_id: int,
    user: Dict[str, Any] = Depends(require_permission("estimates:view")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("SELECT * FROM estimates WHERE id = :id"), {"id": estimate_id})
    est_row = res.first()
    if not est_row:
        raise HTTPException(status_code=404, detail="Estimate not found")
    est = dict(est_row._mapping)
    template_key = est.get("template_key") or "multi_option_proposal"
    
    proposal_data = {
        "proposal_date": est.get("created_at").strftime("%m/%d/%Y") if est.get("created_at") else datetime.now().strftime("%m/%d/%Y"),
        "customer_name": est.get("customer_name") or "Homeowner",
        "customer_phone": est.get("customer_phone") or "",
        "customer_email": est.get("customer_email") or "",
        "customer_address": est.get("customer_address") or "",
        "customer_city": est.get("customer_city") or "",
        "roof_squares": float(est.get("roof_squares") or 25),
        "roof_pitch": est.get("roof_pitch") or "4:12",
        "stories": f"{est.get('stories', 1)} Story",
        "option_a": {
            "title": "TILE ROOF LIFT & RELAY",
            "subtitle": "REUSE EXISTING TILES",
            "lock_in_price": float(est.get("total") or 26870),
            "standard_price": round(float(est.get("total") or 26870) * 1.17),
            "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
        },
        "option_b": {
            "title": "COMPLETE NEW TILE ROOF SYSTEM",
            "subtitle": "100% NEW TILE INSTALLATION",
            "lock_in_price": round(float(est.get("total") or 26870) * 1.2),
            "standard_price": round(float(est.get("total") or 26870) * 1.38),
            "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
        }
    }
    
    if est.get("proposal_data"):
        raw_pd = est["proposal_data"]
        if isinstance(raw_pd, str):
            try:
                raw_pd = orjson.loads(raw_pd)
            except Exception:
                raw_pd = {}
        if isinstance(raw_pd, dict) and raw_pd:
            proposal_data = raw_pd
    elif est.get("addons"):
        try:
            addons_val = est["addons"]
            if isinstance(addons_val, str):
                addons_val = orjson.loads(addons_val)
            if isinstance(addons_val, dict) and "option_a" in addons_val:
                proposal_data.update(addons_val)
        except Exception:
            pass

    pdf_bytes = await generate_estimate_proposal_pdf(proposal_data, template_key=template_key)
    est_num = est.get("estimate_number") or f"EST-{estimate_id}"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=RiseUp_Proposal_{est_num}.pdf"}
    )

@router.post("/estimates/calculate")
async def calculate_universal_pricing(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("estimates:view")),
):
    squares = float(payload.get("roofSquares", 25))
    labor = float(payload.get("subcontractorLabor", 8500))
    materials = float(payload.get("roofingMaterials", 7200))
    disposal = float(payload.get("disposalFees", 850))
    permit = float(payload.get("permitFees", 650))
    plywood = float(payload.get("plywoodAllowance", 500))
    other = float(payload.get("otherCosts", 400))
    
    commission_val = payload.get("salesCommission", 10)
    commission_is_pct = payload.get("commissionIsPct", True)
    
    true_job_cost = labor + materials + disposal + permit + plywood + other
    
    margins = [0.15, 0.20, 0.25, 0.30, 0.35, 0.50]
    tier_results = {}
    for m in margins:
        pct_label = f"{int(m*100)}%"
        base_sell = true_job_cost / (1.0 - m) if m < 1.0 else true_job_cost * 2
        comm_amount = (base_sell * (float(commission_val) / 100.0)) if commission_is_pct else float(commission_val)
        final_price = round(base_sell + comm_amount)
        gross_profit = round(final_price - true_job_cost)
        tier_results[pct_label] = {
            "sellingPrice": final_price,
            "grossProfit": gross_profit,
            "marginPct": round((gross_profit / final_price) * 100, 1) if final_price > 0 else 0,
            "commission": round(comm_amount)
        }
        
    chosen_margin = float(payload.get("marginPct", 30)) / 100.0
    chosen_base = true_job_cost / (1.0 - chosen_margin) if chosen_margin < 1.0 else true_job_cost * 2
    chosen_comm = (chosen_base * (float(commission_val) / 100.0)) if commission_is_pct else float(commission_val)
    chosen_price = round(chosen_base + chosen_comm)
    chosen_profit = round(chosen_price - true_job_cost)

    return {
        "ok": True,
        "roofSquares": squares,
        "trueJobCost": round(true_job_cost, 2),
        "costBreakdown": {
            "labor": labor,
            "materials": materials,
            "disposal": disposal,
            "permit": permit,
            "plywood": plywood,
            "other": other,
        },
        "marginTiers": tier_results,
        "selected": {
            "marginPct": round(chosen_margin * 100, 1),
            "sellingPrice": chosen_price,
            "grossProfit": chosen_profit,
            "commission": round(chosen_comm, 2)
        }
    }


@router.post("/estimates/upload-photo")
async def upload_estimate_client_photo(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
):
    """
    Upload a client's property/roof photo for use on the estimate proposal cover and overview.
    """
    allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Please upload JPG, PNG, WebP, or AVIF."
        )

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_name = f"client_roof_{uuid.uuid4().hex[:10]}.{ext}"

    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "static",
        "uploads",
        "estimates",
        "client_photos"
    )
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, unique_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    public_url = f"/static/uploads/estimates/client_photos/{unique_name}"
    return {
        "ok": True,
        "url": public_url,
        "filename": unique_name,
        "sizeBytes": len(content),
    }


@router.post("/estimates/send-email")
async def send_estimate_email(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_permission("estimates:create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates official 2-page proposal PDF and transmits it attached via Resend email service.
    """
    customer_email = payload.get("customerEmail")
    if not customer_email:
        raise HTTPException(status_code=400, detail="Customer email address is required.")

    customer_name = payload.get("customerName", "Valued Homeowner")
    estimate_number = payload.get("estimateNumber", f"EST-{datetime.now().year}-{secrets.token_hex(2).upper()}")
    estimate_id = payload.get("estimateId")
    template_key = payload.get("templateKey", "multi_option_proposal")
    proposal_data = payload.get("proposalData")
    subject = payload.get("subject")
    message = payload.get("message")
    pdf_url = payload.get("pdfUrl")

    # 1. Compile or load PDF
    pdf_bytes = None

    if proposal_data:
        try:
            pdf_bytes = await generate_estimate_proposal_pdf(proposal_data, template_key=template_key)
            pdf_url = save_estimate_pdf_file(estimate_number, pdf_bytes)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
    elif pdf_url:
        clean_path = pdf_url.lstrip("/")
        backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        full_path = os.path.join(backend_root, clean_path)
        if os.path.exists(full_path):
            with open(full_path, "rb") as f:
                pdf_bytes = f.read()

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Could not compile or locate estimate PDF.")

    # 2. Transmit via Resend Email Service
    email_res = await send_estimate_proposal_email(
        to_email=customer_email,
        customer_name=customer_name,
        estimate_number=estimate_number,
        pdf_bytes=pdf_bytes,
        pdf_filename=f"RiseUp_Roofing_Proposal_{estimate_number}.pdf",
        subject=subject,
        custom_message=message,
    )

    if not email_res.get("success"):
        raise HTTPException(
            status_code=502,
            detail=f"Resend email dispatch error: {email_res.get('error')}"
        )

    # 3. Update database record status if estimate_id provided
    if estimate_id:
        try:
            await db.execute(
                text("""
                    UPDATE estimates
                    SET status = 'sent', sent_at = NOW(), pdf_url = COALESCE(:pdf_url, pdf_url), updated_at = NOW()
                    WHERE id = :id
                """),
                {"id": int(estimate_id), "pdf_url": pdf_url}
            )
        except Exception:
            pass

    # 4. Log activity in activities table
    client_id = payload.get("clientId")
    if client_id:
        try:
            await db.execute(
                text("""
                    INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
                    VALUES ('client', :cid, 'email', :title, :desc, 'Staff', :cid)
                """),
                {
                    "cid": int(client_id),
                    "title": f"Proposal Email Sent: {estimate_number}",
                    "desc": f"Official 2-page proposal emailed to {customer_email} via Resend. Email ID: {email_res.get('data', {}).get('id')}",
                }
            )
        except Exception:
            pass

    return {
        "ok": True,
        "message": f"Proposal successfully delivered to {customer_email}",
        "emailId": email_res.get("data", {}).get("id"),
        "pdfUrl": pdf_url,
        "sentAt": datetime.now(timezone.utc).isoformat(),
        "recipient": customer_email,
    }


import re
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.core.audit import record_audit_log
from app.middlewares.auth import require_auth, require_any_permission
from app.services.sla import evaluate_lead_sla

router = APIRouter(prefix="/api/admin/pipeline", tags=["Pipeline"])

STAGE_DISPLAY_NAMES: Dict[str, str] = {
    "cold_lead": "Cold Lead",
    "new_leads": "New Lead",
    "initial_call": "Contacted / Initial Call",
    "contacted": "Contacted",
    "inspection_scheduled": "Inspection Scheduled",
    "est_scheduled": "Estimate Scheduled",
    "inspection_completed": "Inspection Completed",
    "estimate_building": "Drafting Estimate",
    "estimate_sent": "Estimate Sent",
    "est_sent": "Estimate Sent",
    "follow_up": "Follow-Up",
    "followup_2day": "48h Follow-Up",
    "followup_7day": "7-Day Follow-Up",
    "decision_followup": "Decision Follow-Up",
    "contract_signed": "Contract Signed",
    "active_jobs": "Active Job",
    "job_completed": "Job Completed",
    "completed": "Job Completed",
    "closed_won": "Closed Won",
    "closed_lost": "Closed Lost",
    "future_followup": "Future Follow-Up",
}

MACRO_STAGES = [
    "stage_1_lead_gen",
    "stage_2_initial_contact",
    "stage_3_site_visit_estimate",
    "stage_4_closing",
    "stage_5_completion_followup",
]

GRANULAR_STAGES = [
    "cold_lead",
    "initial_call",
    "inspection_scheduled",
    "inspection_completed",
    "estimate_building",
    "estimate_sent",
    "follow_up",
    "future_followup",
    "contract_signed",
    "active_jobs",
    "closed_won",
    "closed_lost",
]

STAGE_TO_MACRO = {
    "cold_lead": "stage_1_lead_gen",
    "initial_call": "stage_2_initial_contact",
    "inspection_scheduled": "stage_3_site_visit_estimate",
    "inspection_completed": "stage_3_site_visit_estimate",
    "estimate_building": "stage_3_site_visit_estimate",
    "estimate_sent": "stage_3_site_visit_estimate",
    "follow_up": "stage_4_closing",
    "followup_2day": "stage_4_closing",     # legacy alias
    "followup_7day": "stage_4_closing",     # legacy alias
    "decision_followup": "stage_4_closing", # legacy alias
    "future_followup": "stage_4_closing",
    "contract_signed": "stage_4_closing",
    "active_jobs": "stage_5_completion_followup",
    "closed_won": "stage_5_completion_followup",
    "job_completed": "stage_5_completion_followup",
    "completed": "stage_5_completion_followup",
    "closed_lost": "stage_1_lead_gen",
}

ALL_VALID_STAGES = set(
    MACRO_STAGES
    + GRANULAR_STAGES
    + ["followup_2day", "followup_7day", "decision_followup", "job_completed", "completed"]
)

def classify_to_granular_stage(row: Dict[str, Any]) -> str:
    st = row.get("pipeline_stage") or "stage_1_lead_gen"
    if st in ("followup_2day", "followup_7day", "decision_followup", "follow_up"):
        return "follow_up"
    if st in ("contract_signed", "active_jobs"):
        return st
    if st in GRANULAR_STAGES:
        return st

    status = (row.get("status") or "").lower()
    if status == "lost":
        return "closed_lost"
    if status == "future_followup":
        return "future_followup"

    proposal_sent_at = row.get("proposal_sent_at")
    site_visit_completed_at = row.get("site_visit_completed_at")
    site_visit_scheduled_at = row.get("site_visit_scheduled_at")
    initial_contacted_at = row.get("initial_contacted_at")

    if st == "stage_1_lead_gen":
        return "cold_lead"
    elif st == "stage_2_initial_contact":
        return "initial_call"
    elif st == "stage_3_site_visit_estimate":
        if proposal_sent_at:
            return "estimate_sent"
        if status in ("estimate_drafting", "estimate_building"):
            return "estimate_building"
        if site_visit_completed_at or status == "inspected":
            return "inspection_completed"
        return "inspection_scheduled"
    elif st == "stage_4_closing":
        if row.get("contract_signed_at") or status == "won":
            return "contract_signed"
        return "follow_up"
    elif st == "stage_5_completion_followup":
        if row.get("job_completed_at") or status == "completed":
            return "closed_won"
        if row.get("job_id") or row.get("job_status") in ("in_progress", "scheduled"):
            return "active_jobs"
        if row.get("contract_signed_at") or status == "won":
            return "contract_signed"
        return "closed_won"

    if status == "won" or row.get("contract_signed_at"):
        return "contract_signed"

    return "cold_lead"

def map_service_color(service: Optional[str]) -> str:
    s = (service or "").lower()
    if "tile" in s:
        return "amber"
    if "shingle" in s:
        return "blue"
    if "commercial" in s or "flat" in s:
        return "sky"
    if "repair" in s or "maintenance" in s:
        return "coral"
    if "metal" in s:
        return "indigo"
    if "solar" in s or "gc" in s:
        return "purple"
    return "emerald"

class FollowUpPayload(BaseModel):
    method: str = "call"  # "call", "sms", "email", "in_person"
    notes: str = ""
    outcome: Optional[str] = "spoke_with_client"

@router.get("", dependencies=[Depends(require_any_permission(["leads:view", "jobs:view"]))])
async def get_sales_pipeline(
    search: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_auth)
):
    # ── 1. AUTOMATED 48-HOUR ESTIMATE SENT -> FOLLOW-UP TRANSITION SWEEP ──────
    # If a lead has been in estimate_sent for >= 48 hours without being moved,
    # automatically graduate it to the unified 'follow_up' column!
    try:
        auto_transition_sql = text("""
            UPDATE leads
            SET pipeline_stage = 'follow_up',
                stage_entered_at = NOW(),
                follow_up_at = NOW() + INTERVAL '7 days',
                status = 'follow_up',
                notes = CASE 
                    WHEN notes IS NULL OR notes = '' THEN '[48h Automated Rule]: Review window elapsed. Auto-moved from Estimate Sent to Active Follow-Up (7-day timer initialized).'
                    ELSE notes || E'\n\n' || '[48h Automated Rule]: Review window elapsed. Auto-moved from Estimate Sent to Active Follow-Up (7-day timer initialized).'
                END,
                updated_at = NOW()
            WHERE status != 'purged' AND status != 'lost' AND status != 'won'
              AND contract_signed_at IS NULL
              AND (
                  pipeline_stage = 'estimate_sent'
                  OR (pipeline_stage = 'stage_3_site_visit_estimate' AND proposal_sent_at IS NOT NULL)
              )
              AND (
                  (proposal_sent_at IS NOT NULL AND proposal_sent_at <= NOW() - INTERVAL '48 hours')
                  OR (stage_entered_at IS NOT NULL AND stage_entered_at <= NOW() - INTERVAL '48 hours')
              )
            RETURNING id
        """)
        res_auto = await db.execute(auto_transition_sql)
        auto_ids = res_auto.scalars().all()
        if auto_ids:
            await db.commit()
            for aid in auto_ids:
                try:
                    await db.execute(text("""
                        INSERT INTO activities (entity_type, entity_id, activity_type, title, description, created_at)
                        VALUES ('lead', :lid, 'stage_changed', 'Auto-Moved to Follow-Up', '48-hour review window elapsed. Lead automatically moved to Follow-Up.', NOW())
                    """), {"lid": aid})
                except Exception:
                    pass
            await db.commit()
    except Exception as e:
        print(f"Auto-transition notice: {e}")
        await db.rollback()

    conditions = ["l.status != 'purged'"]
    params: Dict[str, Any] = {}

    if assigned_to:
        if assigned_to == "unassigned":
            conditions.append("l.assigned_to_user_id IS NULL")
        elif assigned_to == "me":
            conditions.append("l.assigned_to_user_id = :curr_uid")
            params["curr_uid"] = current_user.id
        elif assigned_to.isdigit():
            conditions.append("l.assigned_to_user_id = :assigned_uid")
            params["assigned_uid"] = int(assigned_to)

    if source and source != "all":
        conditions.append("l.lead_source = :src")
        params["src"] = source

    if search and search.strip():
        conditions.append("""(
            LOWER(l.full_name) LIKE :q OR
            l.phone LIKE :q OR
            LOWER(COALESCE(l.email, '')) LIKE :q OR
            LOWER(COALESCE(l.address, '')) LIKE :q OR
            LOWER(COALESCE(l.city, '')) LIKE :q OR
            LOWER(COALESCE(l.service_type, '')) LIKE :q
        )""")
        params["q"] = f"%{search.strip().lower()}%"

    where_clause = f"WHERE {' AND '.join(conditions)}"

    sql = text(f"""
        SELECT 
            l.id, l.full_name, l.phone, l.email, l.address, l.city, l.zip, l.service_type,
            l.lead_source, l.lead_source_detail, COALESCE(l.lead_score, 0) as lead_score,
            COALESCE(l.priority, 'cool') as priority, l.status, l.notes,
            COALESCE(l.pipeline_stage, 'stage_1_lead_gen') as pipeline_stage,
            COALESCE(l.stage_entered_at, l.created_at) as stage_entered_at,
            l.initial_contacted_at, l.site_visit_scheduled_at, l.site_visit_completed_at,
            l.proposal_sent_at, l.contract_signed_at, l.job_completed_at,
            l.last_contact_at, l.follow_up_at,
            l.assigned_to_user_id, l.assigned_at, l.created_by_user_id,
            l.address_confirmed, l.discount_applied, l.financing_interested,
            COALESCE(l.estimated_value, 0) as estimated_value, l.lost_reason, l.created_at,
            u_assigned.name as assigned_to_name, u_assigned.role as assigned_to_role, u_assigned.avatar_url as assigned_to_avatar,
            u_creator.name as created_by_name, u_creator.role as created_by_role,
            -- Job
            j.id as job_id, j.job_number, j.status as job_status, j.contract_value, j.crew_lead,
            -- Estimate
            e.id as estimate_id, e.estimate_number, e.total as estimate_total, e.status as estimate_status, e.financing_months as estimate_financing_months,
            -- Inspection
            insp.id as inspection_id, insp.inspection_number, insp.roof_health_score, insp.inspection_date,
            -- Aux
            COALESCE(jp.photo_count, 0) as photo_count,
            w.warranty_number,
            CASE WHEN w.id IS NOT NULL THEN true ELSE false END as has_warranty,
            r.rating as review_rating,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review,
            cnt.id as contract_id, cnt.contract_number, cnt.status as raw_contract_status
        FROM leads l
        LEFT JOIN users u_assigned ON l.assigned_to_user_id = u_assigned.id
        LEFT JOIN users u_creator ON l.created_by_user_id = u_creator.id
        LEFT JOIN LATERAL (
            SELECT id, job_number, status, contract_value, crew_lead
            FROM jobs 
            WHERE lead_id = l.id OR (l.client_id IS NOT NULL AND client_id = l.client_id)
            ORDER BY id DESC LIMIT 1
        ) j ON true
        LEFT JOIN LATERAL (
            SELECT id, estimate_number, total, status, financing_months
            FROM estimates 
            WHERE lead_id = l.id OR (l.client_id IS NOT NULL AND client_id = l.client_id)
            ORDER BY id DESC LIMIT 1
        ) e ON true
        LEFT JOIN LATERAL (
            SELECT id, inspection_number, roof_health_score, inspection_date
            FROM inspections 
            WHERE lead_id = l.id OR (l.client_id IS NOT NULL AND client_id = l.client_id)
            ORDER BY id DESC LIMIT 1
        ) insp ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::INT as photo_count
            FROM job_photos 
            WHERE (j.id IS NOT NULL AND job_id = j.id) OR lead_id = l.id
        ) jp ON true
        LEFT JOIN LATERAL (
            SELECT id, warranty_number
            FROM warranties WHERE lead_id = l.id OR (j.id IS NOT NULL AND job_id = j.id)
            ORDER BY id DESC LIMIT 1
        ) w ON true
        LEFT JOIN LATERAL (
            SELECT id, rating
            FROM reviews WHERE lead_id = l.id OR (j.id IS NOT NULL AND job_id = j.id)
            ORDER BY id DESC LIMIT 1
        ) r ON true
        LEFT JOIN LATERAL (
            SELECT id, contract_number, status
            FROM contracts WHERE lead_id = l.id OR (e.id IS NOT NULL AND estimate_id = e.id)
            ORDER BY id DESC LIMIT 1
        ) cnt ON true
        {where_clause}
        ORDER BY l.stage_entered_at DESC, l.created_at DESC
    """)

    rows = (await db.execute(sql, params)).mappings().all()

    # Active team users
    users_sql = text("SELECT id, name, email, role, avatar_url FROM users WHERE status = 'active' ORDER BY name ASC")
    active_users = (await db.execute(users_sql)).mappings().all()

    # Checklist counts and completed keys
    checklist_rows = (await db.execute(text("""
        SELECT lead_id, stage, item_key, completed
        FROM lead_stage_checklists
        WHERE completed = true
    """))).mappings().all()
    checklist_map: Dict[str, int] = {}
    lead_checklist_keys: Dict[int, List[str]] = {}
    for c in checklist_rows:
        lid = int(c["lead_id"])
        stage_k = f"{lid}_{c['stage']}"
        checklist_map[stage_k] = checklist_map.get(stage_k, 0) + 1
        if lid not in lead_checklist_keys:
            lead_checklist_keys[lid] = []
        lead_checklist_keys[lid].append(str(c["item_key"]))


    stages: Dict[str, List[Dict[str, Any]]] = {s: [] for s in MACRO_STAGES}
    granular_stages: Dict[str, List[Dict[str, Any]]] = {s: [] for s in GRANULAR_STAGES}

    total_pipeline_value = 0.0
    unassigned_count = 0
    s2_total = 0
    s2_met_or_ok = 0
    active_installations = 0
    won_count = 0
    lost_count = 0

    now_utc = datetime.now(timezone.utc)

    for r in rows:
        row = dict(r)
        raw_st = row.get("pipeline_stage") or "stage_1_lead_gen"
        
        # Determine macro stage
        if raw_st in stages:
            macro_st = raw_st
        elif raw_st in STAGE_TO_MACRO:
            macro_st = STAGE_TO_MACRO[raw_st]
        else:
            macro_st = "stage_1_lead_gen"

        # Determine granular stage directly from raw row data
        granular_st = classify_to_granular_stage(row)

        sla = evaluate_lead_sla(
            stage=macro_st,
            stage_entered_at=row["stage_entered_at"],
            initial_contacted_at=row.get("initial_contacted_at"),
            proposal_sent_at=row.get("proposal_sent_at"),
            contract_signed_at=row.get("contract_signed_at")
        )

        # ── Specialized 48h and 7d Follow-Up SLA Calculations ────────────────
        is_followup_overdue = False
        followup_days_remaining = 7
        followup_hours_remaining = 168
        hours_until_auto_move = None

        if granular_st == "estimate_sent":
            ref_sent = row.get("proposal_sent_at") or row.get("stage_entered_at")
            if ref_sent:
                if ref_sent.tzinfo is None:
                    ref_sent = ref_sent.replace(tzinfo=timezone.utc)
                hours_since_sent = (now_utc - ref_sent).total_seconds() / 3600.0
                hours_until_auto_move = max(0, int(48.0 - hours_since_sent))
            else:
                hours_until_auto_move = 48

        elif granular_st == "follow_up":
            # Reference point: last contact or stage entered
            ref_contact = row.get("last_contact_at") or row.get("stage_entered_at") or row.get("created_at")
            if ref_contact:
                if ref_contact.tzinfo is None:
                    ref_contact = ref_contact.replace(tzinfo=timezone.utc)
                hours_since_contact = (now_utc - ref_contact).total_seconds() / 3600.0
                days_since_contact = max(0, int(hours_since_contact // 24))
            else:
                hours_since_contact = 0.0
                days_since_contact = 0

            # Follow up deadline
            deadline = row.get("follow_up_at")
            if deadline:
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)
                hours_remaining = (deadline - now_utc).total_seconds() / 3600.0
            else:
                hours_remaining = 168.0 - hours_since_contact

            is_followup_overdue = hours_remaining <= 0 or hours_since_contact >= 168.0
            followup_hours_remaining = int(hours_remaining)
            followup_days_remaining = max(0, int(hours_remaining // 24))

            if is_followup_overdue:
                overdue_days = max(1, int(abs(hours_remaining) // 24)) if hours_remaining < 0 else max(1, days_since_contact - 7)
                sla["status"] = "overdue"
                sla["badgeLabel"] = f"Overdue ({overdue_days}d past 7d SLA)"
                sla["badgeTone"] = "critical"
                sla["alertMessage"] = f"⚠️ Overdue: No contact in {days_since_contact} days! (7-day window expired)"
            else:
                sla["badgeLabel"] = f"Due in {followup_days_remaining}d"
                sla["badgeTone"] = "cool"
                sla["alertMessage"] = f"Follow-up window active ({followup_days_remaining}d remaining)"

        if macro_st == "stage_2_initial_contact":
            s2_total += 1
            if sla["status"] in ("met", "ok", "warning"):
                s2_met_or_ok += 1

        if not row.get("assigned_to_user_id"):
            unassigned_count += 1

        deal_value = float(row.get("contract_value") or row.get("estimate_total") or row.get("estimated_value") or 0)
        is_deal_lost = row.get("status") in ("lost", "closed_lost") or granular_st == "closed_lost"
        is_deal_completed = (
            row.get("status") in ("completed", "job_completed")
            or row.get("job_status") == "complete"
            or bool(row.get("job_completed_at"))
            or macro_st in ("completed", "job_completed")
            or granular_st in ("completed", "job_completed")
        )
        if not is_deal_lost and not is_deal_completed:
            total_pipeline_value += deal_value

        if (macro_st == "stage_5_completion_followup" or granular_st in ("closed_won", "active_jobs")) and row.get("job_status") != "complete" and not row.get("job_completed_at"):
            active_installations += 1

        if row.get("status") == "won" or row.get("contract_signed_at") or granular_st in ("closed_won", "contract_signed", "active_jobs"):
            won_count += 1
        elif row.get("status") == "lost" or granular_st == "closed_lost":
            lost_count += 1

        financing_offered = bool(row.get("financing_interested") or (row.get("estimate_financing_months") and int(row.get("estimate_financing_months") or 0) > 0))

        contract_status = row.get("raw_contract_status")
        if not contract_status:
            if row.get("contract_signed_at") or row.get("estimate_status") == "accepted":
                contract_status = "fully_executed" if row.get("job_id") else "client_signed"
            elif row.get("proposal_sent_at") or row.get("estimate_status") == "sent":
                contract_status = "action_required"

        completed_checklists = checklist_map.get(f"{row['id']}_{macro_st}", 0)

        # Days in stage calculation
        days_in_stage = 0
        if row.get("stage_entered_at"):
            dt = row["stage_entered_at"]
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            days_in_stage = max(0, int((now_utc - dt).total_seconds() // 86400))

        lead_item = {
            **row,
            "pipeline_stage": macro_st,
            "granular_stage": granular_st,
            "estimated_value": deal_value,
            "financing_offered": financing_offered,
            "contract_status": contract_status,
            "hours_in_stage": sla["hoursInStage"],
            "days_in_stage": days_in_stage,
            "sla_hours_remaining": sla["hoursRemaining"],
            "sla_status": sla["status"],
            "sla_badge_label": sla.get("badgeLabel"),
            "sla_badge_tone": sla.get("badgeTone"),
            "sla_alert_message": sla.get("alertMessage"),
            "is_followup_overdue": is_followup_overdue,
            "followup_days_remaining": followup_days_remaining,
            "followup_hours_remaining": followup_hours_remaining,
            "hours_until_auto_move": hours_until_auto_move,
            "last_contact_at": row["last_contact_at"].isoformat() if row.get("last_contact_at") else None,
            "follow_up_at": row["follow_up_at"].isoformat() if row.get("follow_up_at") else None,
            "checklist_completed_count": completed_checklists,
            "checklist_completed_keys": lead_checklist_keys.get(row["id"], []),
            "checklist_total_count": 5,
            "service_color": map_service_color(row.get("service_type")),
        }

        # Add to macro bucket if not lost
        if row.get("status") != "lost" and granular_st != "closed_lost":
            stages[macro_st].append(lead_item)

        # Add to granular bucket
        if granular_st in granular_stages:
            granular_stages[granular_st].append(lead_item)

    sla_health_pct = round((s2_met_or_ok / s2_total) * 100) if s2_total > 0 else 100

    return {
        "ok": True,
        "stages": stages,
        "granular_stages": granular_stages,
        "counts": {s: len(stages[s]) for s in MACRO_STAGES} | {
            "total": len(rows),
            "won": won_count,
            "lost": lost_count,
            **{f"step_{s}": len(granular_stages[s]) for s in GRANULAR_STAGES}
        },
        "summary": {
            "total_leads": len(rows),
            "total_pipeline_value": total_pipeline_value,
            "unassigned_count": unassigned_count,
            "sla_health_pct": sla_health_pct,
            "active_installations": active_installations,
            "won_count": won_count,
            "lost_count": lost_count,
        },
        "users": [dict(u) for u in active_users],
        "currentUser": current_user.to_dict(),
    }

@router.get("/analytics", dependencies=[Depends(require_any_permission(["leads:view", "jobs:view"]))])
async def get_pipeline_analytics(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    """
    Get pipeline analytics including stage probabilities, velocity, and conversion metrics.
    """
    stats_query = text("""
        SELECT 
            COUNT(*) AS total_leads,
            COUNT(*) FILTER (WHERE status = 'won' OR contract_signed_at IS NOT NULL) AS won_leads,
            COUNT(*) FILTER (WHERE status = 'lost') AS lost_leads,
            COUNT(*) FILTER (WHERE status = 'completed' OR job_completed_at IS NOT NULL) AS completed_leads,
            COALESCE(SUM(estimated_value) FILTER (WHERE status NOT IN ('lost', 'completed') AND (pipeline_stage IS NULL OR pipeline_stage NOT IN ('lost', 'closed_lost', 'completed', 'job_completed')) AND job_completed_at IS NULL), 0) AS active_pipeline_value,
            COALESCE(SUM(estimated_value) FILTER (WHERE status = 'completed' OR pipeline_stage IN ('completed', 'job_completed') OR job_completed_at IS NOT NULL), 0) AS realized_completed_value,
            COALESCE(AVG(estimated_value) FILTER (WHERE estimated_value > 0), 0) AS avg_deal_size
        FROM leads
    """)
    stats_row = (await db.execute(stats_query)).mappings().first()
    
    total = stats_row["total_leads"] if stats_row else 0
    won = stats_row["won_leads"] if stats_row else 0
    win_rate = round((won / total), 2) if total > 0 else 0.0
    
    # Compute real probabilities per stage from historical data
    prob_query = text("""
        SELECT 
            pipeline_stage,
            COUNT(*) AS total_in_stage,
            COUNT(*) FILTER (WHERE status = 'won' OR contract_signed_at IS NOT NULL) AS won_from_stage
        FROM leads
        WHERE pipeline_stage IS NOT NULL
        GROUP BY pipeline_stage
    """)
    prob_rows = (await db.execute(prob_query)).mappings().all()
    probabilities = {}
    for pr in prob_rows:
        stage = pr["pipeline_stage"]
        total_s = int(pr["total_in_stage"] or 0)
        won_s = int(pr["won_from_stage"] or 0)
        probabilities[stage] = round(won_s / total_s, 2) if total_s > 0 else 0.0
    
    # Compute real velocity (avg days from creation to contract signing)
    vel_query = text("""
        SELECT AVG(EXTRACT(DAY FROM (contract_signed_at - created_at))) AS avg_days
        FROM leads 
        WHERE contract_signed_at IS NOT NULL
    """)
    vel_row = (await db.execute(vel_query)).mappings().first()
    real_velocity = round(float(vel_row["avg_days"])) if vel_row and vel_row["avg_days"] else 14

    return {
        "ok": True,
        "probabilities": probabilities,
        "win_rate": win_rate,
        "active_pipeline_value": float(stats_row["active_pipeline_value"]) if stats_row else 0.0,
        "realized_completed_value": float(stats_row["realized_completed_value"]) if stats_row else 0.0,
        "avg_deal_size": round(float(stats_row["avg_deal_size"])) if stats_row else 0,
        "velocity_days": real_velocity,
    }

async def _process_stage_update(lead_id: int, request: Request, db: AsyncSession, user):
    body = await request.json()
    new_stage = body.get("stage")
    notes = body.get("notes")
    plain_note = body.get("plainNote")
    author_name = body.get("authorName") or getattr(user, "name", None) or "Staff"
    author_role = body.get("authorRole") or getattr(user, "role", None) or "Owner"
    if author_role:
        author_role = author_role.replace("_", " ").title()

    loss_reason = body.get("lossReason") or body.get("loss_reason")
    future_bucket = body.get("futureBucket") or body.get("future_bucket")
    future_date = body.get("futureFollowUpDate") or body.get("future_date")

    if not new_stage or new_stage not in ALL_VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid pipeline stage: {new_stage}")

    stage_title = STAGE_DISPLAY_NAMES.get(new_stage, new_stage.replace('_', ' ').title())

    updates = ["pipeline_stage = CAST(:stage AS TEXT)", "stage_entered_at = NOW()", "updated_at = NOW()"]
    params: Dict[str, Any] = {"stage": str(new_stage), "id": int(lead_id)}

    if new_stage in ("cold_lead", "stage_1_lead_gen", "new_leads"):
        updates.append("status = 'new'")
        updates.append("lost_reason = NULL")
    elif new_stage == "initial_call" or new_stage == "stage_2_initial_contact":
        updates.append("initial_contacted_at = COALESCE(initial_contacted_at, NOW())")
        updates.append("status = 'contacted'")
    elif new_stage == "inspection_scheduled":
        updates.append("site_visit_scheduled_at = COALESCE(site_visit_scheduled_at, NOW())")
        updates.append("status = 'site_visit_scheduled'")
    elif new_stage == "inspection_completed":
        updates.append("site_visit_completed_at = COALESCE(site_visit_completed_at, NOW())")
        updates.append("status = 'inspected'")
    elif new_stage == "estimate_building":
        updates.append("status = 'estimate_drafting'")
    elif new_stage in ("estimate_sent", "est_sent"):
        # Enforce gating: Estimate Sent is automated when proposal is created & sent via Estimates page
        check_est = (await db.execute(text("""
            SELECT id FROM estimates
            WHERE (lead_id = :lid OR (client_id IS NOT NULL AND client_id = (SELECT client_id FROM leads WHERE id = :lid)))
              AND status IN ('sent', 'accepted')
            LIMIT 1
        """), {"lid": int(lead_id)})).first()

        check_lead_sent = (await db.execute(text("""
            SELECT proposal_sent_at FROM leads WHERE id = :lid
        """), {"lid": int(lead_id)})).first()

        if not check_est and (not check_lead_sent or not check_lead_sent[0]):
            raise HTTPException(
                status_code=400,
                detail="The Estimate Sent stage is automated. You must compile and send an official proposal via the Estimates page to advance this lead."
            )

        updates.append("proposal_sent_at = COALESCE(proposal_sent_at, NOW())")
        updates.append("status = 'estimate_sent'")
        updates.append("follow_up_at = NOW() + INTERVAL '48 hours'")
        params["stage"] = "estimate_sent"
    elif new_stage in ("follow_up", "followup_2day", "followup_7day", "decision_followup"):
        updates.append("status = 'follow_up'")
        updates.append("last_contact_at = NOW()")
        updates.append("follow_up_at = NOW() + INTERVAL '7 days'")
    elif new_stage == "contract_signed":
        updates.append("contract_signed_at = COALESCE(contract_signed_at, NOW())")
        updates.append("status = 'won'")
    elif new_stage == "active_jobs":
        updates.append("contract_signed_at = COALESCE(contract_signed_at, NOW())")
        updates.append("status = 'won'")

        # ── Auto-provision a job record if one doesn't already exist ──
        existing_job = (await db.execute(text(
            "SELECT id FROM jobs WHERE lead_id = :lid"
        ), {"lid": int(lead_id)})).first()

        if not existing_job:
            # Get lead details for job creation
            lead_data = (await db.execute(text("""
                SELECT full_name, phone, email, address, city, zip,
                       service_type, estimated_value, client_id
                FROM leads WHERE id = :lid
            """), {"lid": int(lead_id)})).mappings().first()

            if lead_data:
                # Generate next job number
                max_num_row = (await db.execute(text(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 10) AS INTEGER)), 0) FROM jobs WHERE job_number LIKE 'JOB-%%'"
                ))).scalar()
                next_num = (max_num_row or 0) + 1
                from datetime import datetime as _dt
                job_number = f"JOB-{_dt.now().year}-{next_num:04d}"

                await db.execute(text("""
                    INSERT INTO jobs (
                        job_number, lead_id, client_id, customer_name,
                        customer_phone, customer_email,
                        address, city, zip,
                        service_type, contract_value,
                        status, milestones,
                        created_at, updated_at
                    ) VALUES (
                        :job_number, :lead_id, :client_id, :customer_name,
                        :customer_phone, :customer_email,
                        :address, :city, :zip,
                        :service_type, :contract_value,
                        'scheduled', '[]'::jsonb,
                        NOW(), NOW()
                    )
                """), {
                    "job_number": job_number,
                    "lead_id": int(lead_id),
                    "client_id": lead_data.get("client_id"),
                    "customer_name": lead_data.get("full_name") or "Unknown",
                    "customer_phone": lead_data.get("phone"),
                    "customer_email": lead_data.get("email"),
                    "address": lead_data.get("address") or "",
                    "city": lead_data.get("city") or "",
                    "zip": lead_data.get("zip") or "",
                    "service_type": lead_data.get("service_type") or "Residential Roofing",
                    "contract_value": float(lead_data.get("estimated_value") or 0),
                })
                print(f"Auto-provisioned job {job_number} for lead {lead_id}")

    elif new_stage in ("job_completed", "completed"):
        # Enforce job completion authorization: only claimer/assignee, creator, or unassigned (auto-claim)
        check_lead = (await db.execute(text("SELECT id, assigned_to_user_id, created_by_user_id FROM leads WHERE id = :id"), {"id": int(lead_id)})).mappings().first()
        if check_lead:
            current_assignee = check_lead.get("assigned_to_user_id")
            current_creator = check_lead.get("created_by_user_id")
            uid = getattr(user, "id", None) if not isinstance(user, dict) else (user.get("id") or user.get("sub"))
            user_role = (getattr(user, "role", None) if not isinstance(user, dict) else user.get("role")) or ""

            if uid is not None:
                uid_int = int(uid)
                if current_assignee is not None and current_assignee != uid_int and current_creator != uid_int and user_role.lower() not in ("owner", "admin"):
                    raise HTTPException(
                        status_code=403,
                        detail="Only the staff member who claimed or added this lead is authorized to complete the job."
                    )

        updates.append("job_completed_at = COALESCE(job_completed_at, NOW())")
        updates.append("contract_signed_at = COALESCE(contract_signed_at, NOW())")
        updates.append("status = 'completed'")
        if user and getattr(user, "id", None):
            updates.append("assigned_to_user_id = COALESCE(assigned_to_user_id, :uid_claim)")
            params["uid_claim"] = user.id
        params["stage"] = "stage_5_completion_followup"
    elif new_stage == "closed_won":
        updates.append("contract_signed_at = COALESCE(contract_signed_at, NOW())")
        updates.append("status = 'won'")
    elif new_stage == "closed_lost":
        updates.append("status = 'lost'")
        if loss_reason:
            updates.append("lost_reason = CAST(:loss_reason AS TEXT)")
            params["loss_reason"] = str(loss_reason)
    elif new_stage == "future_followup":
        updates.append("status = 'future_followup'")
        if future_bucket or future_date:
            extra_note = f"[Future Follow-Up]: Bucket: {future_bucket or '30-Day'}, Date: {future_date or 'TBD'}"
            updates.append("notes = CASE WHEN notes IS NULL OR notes = '' THEN CAST(:extra_note AS TEXT) ELSE CONCAT(notes, E'\\n\\n', CAST(:extra_note AS TEXT)) END")
            params["extra_note"] = extra_note

    # Clean and standardize move note content
    cleaned_note_text = ""
    if plain_note and str(plain_note).strip():
        cleaned_note_text = str(plain_note).strip()
    elif notes and str(notes).strip():
        raw = str(notes).strip()
        # Strip outer [timestamp...] header if frontend already serialized it
        m = re.match(r'^\[[^\]]+\]\s*(.*)$', raw, re.DOTALL)
        if m and m.group(1).strip():
            cleaned_note_text = m.group(1).strip()
        else:
            cleaned_note_text = raw

    now_dt = datetime.now()
    now_str = now_dt.strftime("%b %d, %Y • %I:%M %p")
    role_part = f" ({author_role})" if author_role else ""

    if cleaned_note_text:
        formatted_entry = f"[{now_str} — {author_name}{role_part}]\n➔ Moved to {stage_title}: {cleaned_note_text}"
        updates.append("notes = CASE WHEN notes IS NULL OR notes = '' THEN CAST(:move_notes AS TEXT) ELSE CONCAT(notes, E'\\n\\n', CAST(:move_notes AS TEXT)) END")
        params["move_notes"] = formatted_entry
    elif notes is not None and str(notes).strip() != "":
        formatted_entry = f"[{now_str} — {author_name}{role_part}]\n➔ Moved to {stage_title}"
        updates.append("notes = CASE WHEN notes IS NULL OR notes = '' THEN CAST(:move_notes AS TEXT) ELSE CONCAT(notes, E'\\n\\n', CAST(:move_notes AS TEXT)) END")
        params["move_notes"] = formatted_entry

    sql = text(f"""
        UPDATE leads
        SET {', '.join(updates)}
        WHERE id = :id
        RETURNING id, full_name, pipeline_stage, status, notes, lost_reason, estimated_value, assigned_to_user_id
    """)
    res = (await db.execute(sql, params)).mappings().first()
    if not res:
        raise HTTPException(status_code=404, detail="Lead not found")

    # If completing job, also update linked jobs record and record realised revenue
    if new_stage in ("job_completed", "completed"):
        try:
            await db.execute(text("""
                UPDATE jobs
                SET status = 'complete',
                    actual_end = COALESCE(actual_end, CURRENT_DATE),
                    updated_at = NOW()
                WHERE lead_id = :lid
            """), {"lid": int(lead_id)})
        except Exception as e:
            print(f"Linked job completion update note: {e}")

    # Insert into activities table (Permanent historical timeline)
    try:
        import json
        if new_stage in ("job_completed", "completed"):
            act_type = 'job_completed'
            act_title = "Job Completed & Revenue Realised"
            act_desc = f"Project certified complete by {author_name}. Realised contract value: ${float(res.get('estimated_value') or 0):,.2f}. {cleaned_note_text}".strip()
            act_meta = {"lead_name": res.get("full_name"), "contract_value": float(res.get("estimated_value") or 0)}
        elif new_stage == "contract_signed":
            act_type = 'contract_signed'
            act_title = "Contract Signed"
            act_desc = f"Contract signed by homeowner. Amount: ${float(res.get('estimated_value') or 0):,.2f}. {cleaned_note_text}".strip()
            act_meta = {"lead_name": res.get("full_name"), "amount": float(res.get("estimated_value") or 0)}
        elif new_stage == "estimate_sent":
            act_type = 'estimate_sent'
            act_title = "Estimate Sent"
            act_desc = f"Estimate proposal sent. Amount: ${float(res.get('estimated_value') or 0):,.2f}. {cleaned_note_text}".strip()
            act_meta = {"lead_name": res.get("full_name"), "amount": float(res.get("estimated_value") or 0)}
        else:
            act_type = 'stage_changed'
            act_title = f"Stage moved to {stage_title}"
            act_desc = cleaned_note_text if cleaned_note_text else f"Pipeline progression to {stage_title}"
            act_meta = {"lead_name": res.get("full_name"), "stage": new_stage}

        await db.execute(text("""
            INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, user_id, user_name, metadata, created_at)
            VALUES ('lead', :lead_id, :atype, :title, :desc, :perf_by, :uid, :uname, CAST(:meta AS jsonb), NOW())
        """), {
            "lead_id": int(lead_id),
            "atype": act_type,
            "title": act_title,
            "desc": act_desc,
            "perf_by": f"{author_name}{role_part}",
            "uid": user.id if user else None,
            "uname": author_name,
            "meta": json.dumps(act_meta)
        })
    except Exception as e:
        print(f"Failed to record stage move activity: {e}")

    await record_audit_log(
        db, "pipeline.stage_changed", "lead", lead_id, user.id, user.email, user.role,
        {"newStage": new_stage, "notes": notes, "moveNote": cleaned_note_text}, request
    )
    try:
        from app.core.redis import cache_delete
        await cache_delete("crm:dashboard:stats")
    except Exception:
        pass
    return {"ok": True, "lead": dict(res)}

@router.put("/{lead_id}/stage")
async def update_pipeline_stage(
    lead_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    return await _process_stage_update(lead_id, request, db, user)

@router.patch("/leads/{lead_id}/stage")
async def patch_lead_pipeline_stage(
    lead_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    return await _process_stage_update(lead_id, request, db, user)

@router.post("/{lead_id}/follow-up")
async def log_lead_follow_up(
    lead_id: int,
    payload: FollowUpPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    """
    Action: Log a follow-up interaction with a homeowner.
    Immediately resets the 7-day timer to +7 days from now, appends note,
    and logs communication activity.
    """
    check = await db.execute(text("SELECT id, full_name, notes, pipeline_stage FROM leads WHERE id = :id"), {"id": lead_id})
    lead = check.mappings().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    now = datetime.now(timezone.utc)
    method_icons = {"call": "📞 Call", "sms": "💬 SMS", "email": "✉️ Email", "in_person": "🤝 Meeting"}
    method_label = method_icons.get(payload.method.lower(), payload.method.upper())
    timestamp_str = now.strftime("%b %d, %Y %I:%M %p")
    user_name = getattr(user, "name", "Rep") or "Rep"

    note_line = f"[{timestamp_str} by {user_name}] {method_label}: {payload.notes.strip() or 'Follow-up contact logged'}"
    if payload.outcome:
        note_line += f" • Outcome: {payload.outcome.replace('_', ' ').title()}"
    note_line += " ➔ [Timer reset to 7 days]"

    await db.execute(text("""
        UPDATE leads
        SET last_contact_at = NOW(),
            follow_up_at = NOW() + INTERVAL '7 days',
            pipeline_stage = 'follow_up',
            status = 'follow_up',
            notes = CASE 
                WHEN notes IS NULL OR notes = '' THEN CAST(:entry AS TEXT)
                ELSE CONCAT(notes, E'\\n\\n', CAST(:entry AS TEXT))
            END,
            updated_at = NOW()
        WHERE id = :id
    """), {"id": lead_id, "entry": note_line})

    try:
        await db.execute(text("""
            INSERT INTO activities (entity_type, entity_id, activity_type, title, description, user_id, user_name, created_at)
            VALUES ('lead', :lid, 'communication', :title, :desc, :uid, :uname, NOW())
        """), {
            "lid": lead_id,
            "title": f"Follow-Up Logged: {method_label}",
            "desc": payload.notes or f"Follow-up contact logged via {method_label}. 7-day timer reset.",
            "uid": user.id if user else None,
            "uname": user_name,
        })
    except Exception:
        pass

    await db.commit()

    await record_audit_log(
        db, "pipeline.followup_logged", "lead", lead_id, user.id, user.email, user.role,
        {"method": payload.method, "notes": payload.notes, "outcome": payload.outcome}, request
    )

    next_deadline = (now + timedelta(days=7)).isoformat()
    try:
        from app.core.redis import cache_delete
        await cache_delete("crm:dashboard:stats")
    except Exception:
        pass
    return {
        "ok": True,
        "lead_id": lead_id,
        "last_contact_at": now.isoformat(),
        "follow_up_at": next_deadline,
        "message": f"Follow-up recorded! Next follow-up reset to 7 days from now."
    }

@router.post("/{lead_id}/claim")
async def claim_pipeline_lead(
    lead_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    sql = text("""
        UPDATE leads
        SET assigned_to_user_id = :uid,
            assigned_at = NOW(),
            updated_at = NOW()
        WHERE id = :id
        RETURNING id, full_name, assigned_to_user_id
    """)
    res = (await db.execute(sql, {"uid": user.id, "id": lead_id})).mappings().first()
    if not res:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        user_name = getattr(user, "name", None) or (user.email.split("@")[0] if getattr(user, "email", None) else "Staff")
        author_role = getattr(user, "role", "Staff")
        if author_role:
            author_role = str(author_role).replace("_", " ").title()
        perf_by = f"{user_name} ({author_role})" if author_role else str(user_name)
        lead_name = res["full_name"] if res and res.get("full_name") else f"Lead #{lead_id}"
        meta_dict = {"lead_name": lead_name}
        import json
        await db.execute(text("""
            INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, user_id, user_name, metadata, created_at)
            VALUES ('lead', :lid, 'lead_claimed', 'Lead Claimed', :desc, :pby, :uid, :uname, CAST(:meta AS jsonb), NOW())
        """), {
            "lid": int(lead_id),
            "desc": f"{user_name} claimed lead {lead_name}",
            "pby": perf_by,
            "uid": user.id if getattr(user, "id", None) else None,
            "uname": user_name,
            "meta": json.dumps(meta_dict)
        })
    except Exception as ex:
        print(f"Failed to record lead_claimed activity: {ex}")

    await record_audit_log(
        db, "pipeline.lead_claimed", "lead", lead_id, user.id, user.email, user.role,
        {"claimedBy": user.email}, request
    )
    try:
        from app.core.redis import cache_delete
        await cache_delete("crm:dashboard:stats")
    except Exception:
        pass
    return {"ok": True, "lead": dict(res)}

class ChecklistItemPayload(BaseModel):
    completed: bool
    stage: Optional[str] = "stage_1_lead_gen"
    notes: Optional[str] = None

@router.put("/{lead_id}/checklist/{item_key}")
async def update_pipeline_checklist_item(
    lead_id: int,
    item_key: str,
    payload: ChecklistItemPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_auth)
):
    """
    Action: Toggle or update a checklist item for a pipeline deal.
    Persists completion state, user ID, and timestamp into lead_stage_checklists.
    """
    now = datetime.now(timezone.utc)
    stage = payload.stage or "stage_1_lead_gen"
    user_id = getattr(user, "id", None)

    upsert_sql = text("""
        INSERT INTO lead_stage_checklists (lead_id, stage, item_key, completed, completed_by, completed_at, notes, updated_at)
        VALUES (:lid, :stage, :key, :completed, :uid, :cat, :notes, NOW())
        ON CONFLICT (lead_id, stage, item_key)
        DO UPDATE SET
            completed = EXCLUDED.completed,
            completed_by = EXCLUDED.completed_by,
            completed_at = EXCLUDED.completed_at,
            notes = COALESCE(EXCLUDED.notes, lead_stage_checklists.notes),
            updated_at = NOW()
        RETURNING *
    """)
    res = await db.execute(upsert_sql, {
        "lid": lead_id,
        "stage": stage,
        "key": item_key,
        "completed": payload.completed,
        "uid": user_id if payload.completed else None,
        "cat": now if payload.completed else None,
        "notes": payload.notes,
    })
    await db.commit()
    row = res.mappings().first()

    await record_audit_log(
        db, "pipeline.checklist_updated", "lead", lead_id, getattr(user, "id", None), getattr(user, "email", None), getattr(user, "role", None),
        {"item_key": item_key, "completed": payload.completed, "stage": stage}, request
    )
    return {"ok": True, "checklist_item": dict(row) if row else None}


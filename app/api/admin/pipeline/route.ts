import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export const PIPELINE_STAGES = [
  'stage_1_lead_gen',
  'stage_2_initial_contact',
  'stage_3_site_visit_estimate',
  'stage_4_closing',
  'stage_5_completion_followup',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface PipelineLead {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  service_type: string | null;
  lead_source: string | null;
  lead_source_detail: string | null;
  lead_score: number;
  priority: string;
  status: string;
  notes: string | null;
  pipeline_stage: PipelineStage;
  stage_entered_at: string;
  initial_contacted_at: string | null;
  site_visit_scheduled_at: string | null;
  site_visit_completed_at: string | null;
  proposal_sent_at: string | null;
  contract_signed_at: string | null;
  job_completed_at: string | null;
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  assigned_to_role: string | null;
  assigned_to_avatar: string | null;
  assigned_at: string | null;
  created_by_user_id: number | null;
  created_by_name: string | null;
  created_by_role: string | null;
  source_type: 'website' | 'team_member';
  address_confirmed: boolean;
  discount_applied: string | null;
  financing_interested: boolean;
  estimated_value: number;
  created_at: string;
  // SLA Info
  hours_in_stage: number;
  sla_hours_remaining?: number;
  sla_status?: 'met' | 'warning' | 'breached' | 'ok';
  // Linked Job Info
  job_id: number | null;
  job_number: string | null;
  job_status: string | null;
  contract_value: number | null;
  crew_lead: string | null;
  // Linked Estimate Info
  estimate_id: number | null;
  estimate_number: string | null;
  estimate_total: number | null;
  estimate_status: string | null;
  // Linked Inspection Info
  inspection_id: number | null;
  inspection_number: string | null;
  roof_health_score: number | null;
  inspection_date: string | null;
  // Auxiliary counters & indicators
  photo_count: number;
  has_warranty: boolean;
  warranty_number: string | null;
  has_review: boolean;
  review_rating: number | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['leads:view', 'jobs:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const assignedTo = searchParams.get('assigned_to');
  const source = searchParams.get('source');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (assignedTo) {
    if (assignedTo === 'unassigned') {
      conditions.push('l.assigned_to_user_id IS NULL');
    } else if (assignedTo === 'me') {
      params.push(auth.user.id);
      conditions.push(`l.assigned_to_user_id = $${params.length}`);
    } else if (!isNaN(Number(assignedTo))) {
      params.push(Number(assignedTo));
      conditions.push(`l.assigned_to_user_id = $${params.length}`);
    }
  }

  if (source && source !== 'all') {
    params.push(source);
    conditions.push(`l.lead_source = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(l.full_name) LIKE ${pIdx} OR
      l.phone LIKE ${pIdx} OR
      LOWER(COALESCE(l.email, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(l.address, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(l.city, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(l.service_type, '')) LIKE ${pIdx}
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Parallelize main pipeline fetch with users directory
    const [rows, users] = await Promise.all([
      query<any>(
        `SELECT 
          l.id,
          l.full_name,
          l.phone,
          l.email,
          l.address,
          l.city,
          l.zip,
          l.service_type,
          l.lead_source,
          l.lead_source_detail,
          COALESCE(l.lead_score, 0) as lead_score,
          COALESCE(l.priority, 'cool') as priority,
          l.status,
          l.notes,
          COALESCE(l.pipeline_stage, 'stage_1_lead_gen') as pipeline_stage,
          COALESCE(l.stage_entered_at, l.created_at) as stage_entered_at,
          l.initial_contacted_at,
          l.site_visit_scheduled_at,
          l.site_visit_completed_at,
          l.proposal_sent_at,
          l.contract_signed_at,
          l.job_completed_at,
          l.assigned_to_user_id,
          l.assigned_at,
          l.created_by_user_id,
          l.address_confirmed,
          l.discount_applied,
          l.financing_interested,
          COALESCE(l.estimated_value, 0) as estimated_value,
          l.created_at,
          u_assigned.name as assigned_to_name,
          u_assigned.role as assigned_to_role,
          u_assigned.avatar_url as assigned_to_avatar,
          u_creator.name as created_by_name,
          u_creator.role as created_by_role,
          -- Joined Job details
          j.id as job_id,
          j.job_number,
          j.status as job_status,
          j.contract_value,
          j.crew_lead,
          -- Joined Latest Estimate details
          e.id as estimate_id,
          e.estimate_number,
          e.total as estimate_total,
          e.status as estimate_status,
          -- Joined Latest Inspection details
          insp.id as inspection_id,
          insp.inspection_number,
          insp.roof_health_score,
          insp.inspection_date,
          -- Photo count
          COALESCE(jp.photo_count, 0) as photo_count,
          -- Warranty details
          w.warranty_number,
          CASE WHEN w.id IS NOT NULL THEN true ELSE false END as has_warranty,
          -- Review details
          r.rating as review_rating,
          CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
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
          SELECT id, estimate_number, total, status
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
          FROM job_photos WHERE job_id = j.id
        ) jp ON true
        LEFT JOIN LATERAL (
          SELECT id, warranty_number
          FROM warranties WHERE lead_id = l.id OR job_id = j.id
          ORDER BY id DESC LIMIT 1
        ) w ON true
        LEFT JOIN LATERAL (
          SELECT id, rating
          FROM reviews WHERE lead_id = l.id OR job_id = j.id
          ORDER BY id DESC LIMIT 1
        ) r ON true
        ${whereClause}
        ORDER BY l.stage_entered_at DESC, l.created_at DESC`,
        params
      ),
      query<{ id: number; name: string; email: string; role: string; avatar_url: string | null }>(
        `SELECT id, name, email, role, avatar_url
         FROM users
         WHERE status = 'active'
         ORDER BY name ASC`
      ),
    ]);

    const now = Date.now();

    // Group leads by stage and enrich with real-time SLA metrics
    const stages: Record<PipelineStage, PipelineLead[]> = {
      stage_1_lead_gen: [],
      stage_2_initial_contact: [],
      stage_3_site_visit_estimate: [],
      stage_4_closing: [],
      stage_5_completion_followup: [],
    };

    let totalPipelineValue = 0;
    let unassignedCount = 0;
    let s2Total = 0;
    let s2MetOrOk = 0;
    let activeInstallations = 0;

    for (const row of rows) {
      const isTeam = Boolean(row.created_by_user_id || row.created_by_name);
      const sourceType = isTeam ? 'team_member' : 'website';

      let sourceDetail = row.lead_source_detail;
      if (!sourceDetail) {
        if (sourceType === 'website') {
          if (row.lead_source === 'google_ads') sourceDetail = 'Google Ads Search';
          else if (row.lead_source === 'yelp') sourceDetail = 'Yelp Directory';
          else sourceDetail = 'Website Inbound';
        } else {
          sourceDetail = 'Sales Rep Outreach';
        }
      }

      const stageEnteredTime = new Date(row.stage_entered_at || row.created_at).getTime();
      const hoursInStage = Math.max(0, Math.round((now - stageEnteredTime) / (1000 * 60 * 60)));

      let slaHoursRemaining: number | undefined;
      let slaStatus: 'met' | 'warning' | 'breached' | 'ok' | undefined;

      const stage = (row.pipeline_stage as PipelineStage) || 'stage_1_lead_gen';

      if (stage === 'stage_2_initial_contact') {
        s2Total++;
        if (row.initial_contacted_at) {
          slaStatus = 'met';
          s2MetOrOk++;
        } else {
          // 48h SLA window
          const deadline = stageEnteredTime + 48 * 60 * 60 * 1000;
          slaHoursRemaining = Math.round((deadline - now) / (1000 * 60 * 60));
          if (slaHoursRemaining <= 0) {
            slaStatus = 'breached';
          } else if (slaHoursRemaining <= 12) {
            slaStatus = 'warning';
            s2MetOrOk++;
          } else {
            slaStatus = 'ok';
            s2MetOrOk++;
          }
        }
      }

      if (!row.assigned_to_user_id) {
        unassignedCount++;
      }

      // Calculate deal value
      const dealValue = Number(row.contract_value) || Number(row.estimate_total) || Number(row.estimated_value) || 12500;
      totalPipelineValue += dealValue;

      if (stage === 'stage_5_completion_followup' && row.job_status !== 'complete') {
        activeInstallations++;
      }

      const leadItem: PipelineLead = {
        id: Number(row.id),
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        zip: row.zip,
        service_type: row.service_type,
        lead_source: row.lead_source,
        lead_source_detail: sourceDetail,
        lead_score: Number(row.lead_score || 0),
        priority: row.priority || 'cool',
        status: row.status,
        notes: row.notes,
        pipeline_stage: stage,
        stage_entered_at: row.stage_entered_at,
        initial_contacted_at: row.initial_contacted_at,
        site_visit_scheduled_at: row.site_visit_scheduled_at,
        site_visit_completed_at: row.site_visit_completed_at,
        proposal_sent_at: row.proposal_sent_at,
        contract_signed_at: row.contract_signed_at,
        job_completed_at: row.job_completed_at,
        assigned_to_user_id: row.assigned_to_user_id ? Number(row.assigned_to_user_id) : null,
        assigned_to_name: row.assigned_to_name,
        assigned_to_role: row.assigned_to_role,
        assigned_to_avatar: row.assigned_to_avatar,
        assigned_at: row.assigned_at,
        created_by_user_id: row.created_by_user_id ? Number(row.created_by_user_id) : null,
        created_by_name: row.created_by_name,
        created_by_role: row.created_by_role,
        source_type: sourceType,
        address_confirmed: Boolean(row.address_confirmed),
        discount_applied: row.discount_applied,
        financing_interested: Boolean(row.financing_interested),
        estimated_value: dealValue,
        created_at: row.created_at,
        hours_in_stage: hoursInStage,
        sla_hours_remaining: slaHoursRemaining,
        sla_status: slaStatus,
        job_id: row.job_id ? Number(row.job_id) : null,
        job_number: row.job_number,
        job_status: row.job_status,
        contract_value: row.contract_value ? Number(row.contract_value) : null,
        crew_lead: row.crew_lead,
        estimate_id: row.estimate_id ? Number(row.estimate_id) : null,
        estimate_number: row.estimate_number,
        estimate_total: row.estimate_total ? Number(row.estimate_total) : null,
        estimate_status: row.estimate_status,
        inspection_id: row.inspection_id ? Number(row.inspection_id) : null,
        inspection_number: row.inspection_number,
        roof_health_score: row.roof_health_score ? Number(row.roof_health_score) : null,
        inspection_date: row.inspection_date,
        photo_count: Number(row.photo_count || 0),
        has_warranty: Boolean(row.has_warranty),
        warranty_number: row.warranty_number,
        has_review: Boolean(row.has_review),
        review_rating: row.review_rating ? Number(row.review_rating) : null,
      };

      if (stages[stage]) {
        stages[stage].push(leadItem);
      } else {
        stages.stage_1_lead_gen.push(leadItem);
      }
    }

    const slaHealthPct = s2Total > 0 ? Math.round((s2MetOrOk / s2Total) * 100) : 100;

    return NextResponse.json({
      ok: true,
      stages,
      counts: {
        stage_1_lead_gen: stages.stage_1_lead_gen.length,
        stage_2_initial_contact: stages.stage_2_initial_contact.length,
        stage_3_site_visit_estimate: stages.stage_3_site_visit_estimate.length,
        stage_4_closing: stages.stage_4_closing.length,
        stage_5_completion_followup: stages.stage_5_completion_followup.length,
        total: rows.length,
      },
      summary: {
        total_leads: rows.length,
        total_pipeline_value: totalPipelineValue,
        unassigned_count: unassignedCount,
        sla_health_pct: slaHealthPct,
        active_installations: activeInstallations,
      },
      users,
      currentUser: {
        id: auth.user.id,
        name: auth.user.name,
        role: auth.user.role,
        email: auth.user.email,
        avatar_url: auth.user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Error fetching pipeline:', err);
    return NextResponse.json({ ok: false, error: 'Database error fetching pipeline' }, { status: 500 });
  }
}

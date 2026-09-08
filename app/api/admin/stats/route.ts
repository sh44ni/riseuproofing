import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, hasPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const user = auth.user;
  const role = user.role;
  const isOwner = role === 'owner' || role === 'office_admin';
  const isPM = role === 'project_manager';
  const isSalesRep = role === 'sales_rep' || role === 'door_knocker' || role === 'canvasser';
  const isFieldCrew = role === 'field_foreman';

  const canViewProfit = hasPermission(user, 'finances:view_profit_ledger');
  const canViewInvoices = hasPermission(user, 'finances:view_invoices');
  const canViewLeads = hasPermission(user, 'leads:view');

  try {
    // 1. Fetch configurable Follow-Up Threshold Hours from app_settings (fallback to 72 hours)
    let followUpThresholdHours = 72;
    try {
      const settingsRow = await query<{ value: any }>(
        `SELECT value FROM app_settings WHERE key = 'follow_up_threshold_hours' LIMIT 1`
      );
      if (settingsRow.length > 0 && settingsRow[0].value) {
        const parsed = parseInt(String(settingsRow[0].value), 10);
        if (!isNaN(parsed) && parsed > 0) {
          followUpThresholdHours = parsed;
        }
      }
    } catch {
      // Use fallback default
    }

    // 2. Parallel data fetching based on user role
    const [
      kpisRes,
      needsFollowUpRes,
      myTasksRes,
      activeJobsRes,
      recentLeadsRes,
      topPerformersRes,
      trafficRes,
      jobsStageMapRes,
    ] = await Promise.all([
      // 2.1 KPI Strip Aggregations
      query<{
        new_leads_week: string;
        active_jobs: string;
        pending_estimates: string;
        revenue_mtd: string;
      }>(`
        WITH
          agg_leads AS (
            SELECT COUNT(*) as count FROM leads 
            WHERE created_at >= date_trunc('week', NOW())
            ${isSalesRep ? `AND assigned_to_user_id = ${user.id}` : ''}
          ),
          agg_jobs AS (
            SELECT COUNT(*) as count FROM jobs 
            WHERE status != 'complete'
            ${isSalesRep ? `AND (lead_id IN (SELECT id FROM leads WHERE assigned_to_user_id = ${user.id}))` : ''}
          ),
          agg_estimates AS (
            SELECT COUNT(*) as count FROM estimates 
            WHERE status IN ('sent', 'viewed', 'draft')
            ${isSalesRep ? `AND (lead_id IN (SELECT id FROM leads WHERE assigned_to_user_id = ${user.id}))` : ''}
          ),
          agg_revenue AS (
            SELECT COALESCE(SUM(amount), 0) as amount FROM invoices 
            WHERE status = 'paid' 
              AND (paid_at >= date_trunc('month', NOW()) OR (paid_at IS NULL AND updated_at >= date_trunc('month', NOW())))
          )
        SELECT 
          (SELECT count FROM agg_leads) as new_leads_week,
          (SELECT count FROM agg_jobs) as active_jobs,
          (SELECT count FROM agg_estimates) as pending_estimates,
          (SELECT amount FROM agg_revenue) as revenue_mtd;
      `),

      // 2.2 Needs Follow-Up (Stale leads waiting on decision > threshold hours)
      !isFieldCrew
        ? query<any>(`
            SELECT 
              l.id, l.full_name, l.phone, l.email, l.address, COALESCE(l.city, 'San Diego') as city, 
              l.service_type, l.estimated_value, l.pipeline_stage, l.status, l.priority, 
              l.assigned_to_name, l.assigned_to_user_id,
              COALESCE(l.proposal_sent_at, l.updated_at, l.created_at) as last_activity_at,
              ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(l.proposal_sent_at, l.updated_at, l.created_at))) / 86400)::int as days_idle
            FROM leads l
            WHERE l.status NOT IN ('won', 'lost')
              AND (
                l.pipeline_stage IN ('stage_4_proposal_negotiation', 'stage_3_site_visit_estimate')
                OR l.status IN ('quoted', 'contacted')
              )
              AND COALESCE(l.proposal_sent_at, l.updated_at, l.created_at) < NOW() - ($1 * INTERVAL '1 hour')
              ${isSalesRep ? `AND l.assigned_to_user_id = ${user.id}` : ''}
            ORDER BY COALESCE(l.proposal_sent_at, l.updated_at, l.created_at) ASC
            LIMIT 6
          `, [followUpThresholdHours])
        : Promise.resolve([]),

      // 2.3 My Tasks (CRUD-backed personal task list for current_user.id)
      query<any>(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.due_at, t.end_at, t.completed_at,
          t.entity_type, t.entity_id,
          COALESCE(l.full_name, j.customer_name) as related_name,
          COALESCE(l.phone, j.customer_phone) as related_phone
        FROM tasks t
        LEFT JOIN leads l ON t.entity_type = 'lead' AND t.entity_id = l.id
        LEFT JOIN jobs j ON t.entity_type = 'job' AND t.entity_id = j.id
        WHERE (t.assigned_to_user_id = $1 OR t.created_by_user_id = $1)
          AND (t.completed_at IS NULL OR t.completed_at >= CURRENT_DATE)
        ORDER BY (t.completed_at IS NOT NULL) ASC, t.due_at ASC
        LIMIT 10
      `, [user.id]),

      // 2.4 Active Jobs in Field
      query<any>(`
        SELECT 
          j.id, j.job_number, j.customer_name, j.customer_phone, j.address, 
          COALESCE(j.city, 'San Diego') as city, j.service_type, j.status, 
          j.crew_lead, j.contract_value, j.scheduled_start, j.lead_id
        FROM jobs j
        WHERE j.status IN ('scheduled', 'in_progress', 'material_order', 'permit_pending', 'punch_list', 'final_inspection')
        ${isFieldCrew ? `AND (DATE(j.scheduled_start) = CURRENT_DATE OR j.status = 'in_progress')` : ''}
        ${isSalesRep ? `AND (j.lead_id IN (SELECT id FROM leads WHERE assigned_to_user_id = ${user.id}))` : ''}
        ORDER BY j.updated_at DESC
        LIMIT 6
      `),

      // 2.5 Recent Prospects (Real priority field checked)
      !isFieldCrew && canViewLeads
        ? query<any>(`
            SELECT 
              id, full_name, phone, email, address, COALESCE(city, 'San Diego') as city, 
              service_type, status, priority, lead_score, estimated_value, created_at,
              source_type, lead_source_detail
            FROM leads
            ${isSalesRep ? `WHERE assigned_to_user_id = ${user.id}` : ''}
            ORDER BY created_at DESC
            LIMIT 6
          `)
        : Promise.resolve([]),

      // 2.6 Top Performers (Owner only, flat static aggregate)
      isOwner
        ? query<any>(`
            SELECT 
              u.id, u.name, u.role, u.avatar_url,
              COUNT(l.id)::int as won_leads,
              COALESCE(SUM(l.estimated_value), 0)::numeric as total_revenue
            FROM users u
            JOIN leads l ON l.assigned_to_user_id = u.id AND l.status = 'won'
            GROUP BY u.id, u.name, u.role, u.avatar_url
            ORDER BY total_revenue DESC, won_leads DESC
            LIMIT 5
          `)
        : Promise.resolve([]),

      // 2.7 Marketing & Traffic summary (for single-line teaser)
      isOwner || isPM || isSalesRep
        ? query<any>(`
            SELECT 
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN session_id END)::int as today,
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN session_id END)::int as past_7d
            FROM analytics_events 
            WHERE event_type = 'pageview' AND page_path NOT LIKE '/admin%'
          `).catch(() => [{ today: 0, past_7d: 0 }])
        : Promise.resolve([{ today: 0, past_7d: 0 }]),

      // 2.8 7-Stage Production Pulse Map
      query<any>(`
        SELECT status, COUNT(*)::int as count 
        FROM jobs 
        GROUP BY status
      `).catch(() => []),
    ]);

    // Build stage map
    const stageMap: Record<string, number> = {
      permit_pending: 0,
      material_order: 0,
      scheduled: 0,
      in_progress: 0,
      punch_list: 0,
      final_inspection: 0,
      complete: 0,
    };
    jobsStageMapRes.forEach((r: any) => {
      if (r.status in stageMap) {
        stageMap[r.status] = parseInt(String(r.count), 10) || 0;
      }
    });

    const kpiData = kpisRes[0] || {
      new_leads_week: '0',
      active_jobs: '0',
      pending_estimates: '0',
      revenue_mtd: '0',
    };

    const traffic = trafficRes[0] || { today: 0, past_7d: 0 };

    return NextResponse.json({
      userRole: role,
      userId: user.id,
      userName: user.name,
      followUpThresholdHours,
      kpis: {
        newLeadsThisWeek: parseInt(kpiData.new_leads_week || '0', 10),
        activeJobs: parseInt(kpiData.active_jobs || '0', 10),
        pendingEstimates: parseInt(kpiData.pending_estimates || '0', 10),
        revenueMtd: canViewProfit ? parseFloat(kpiData.revenue_mtd || '0') : 0,
      },
      needsFollowUp: needsFollowUpRes,
      myTasks: myTasksRes,
      activeJobs: activeJobsRes,
      recentLeads: recentLeadsRes,
      topPerformers: topPerformersRes,
      trafficSummary: {
        visitorsToday: parseInt(traffic.today || '0', 10),
        visitors7d: parseInt(traffic.past_7d || '0', 10),
      },
      jobsStageMap: stageMap,
    });
  } catch (err) {
    console.error('[api/admin/stats GET]', err);
    return NextResponse.json({ error: 'Server error loading stats' }, { status: 500 });
  }
}

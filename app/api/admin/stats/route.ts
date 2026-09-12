import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { hasPermission, getPermissionScope } from '@/lib/permissions';
import { query } from '@/lib/db';
import { getNeedsFollowUpSqlCondition } from '@/lib/pipeline-sla';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const user = auth.user;

  // Dynamic Permissions & Scopes (§3, §8 & §10)
  const leadsScope = getPermissionScope(user, 'leads.view');
  const jobsScope = getPermissionScope(user, 'jobs.view');
  const estimatesScope = getPermissionScope(user, 'estimates.view');
  const canViewProfit = hasPermission(user, 'finances.view') || hasPermission(user, 'finances:view_profit_ledger');
  const canViewReports = hasPermission(user, 'reports.view');
  const canViewAnalytics = hasPermission(user, 'analytics.view');

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

    // Dynamic Filter Clauses
    let leadFilter = '';
    if (leadsScope === 'own') {
      leadFilter = `AND (l.created_by = ${user.id} OR l.created_by_user_id = ${user.id})`;
    } else if (leadsScope === 'assigned') {
      leadFilter = `AND l.assigned_to_user_id = ${user.id}`;
    }

    let jobFilter = '';
    if (jobsScope === 'own') {
      jobFilter = `AND (j.created_by = ${user.id} OR j.lead_id IN (SELECT id FROM leads WHERE created_by = ${user.id} OR created_by_user_id = ${user.id}))`;
    } else if (jobsScope === 'assigned') {
      jobFilter = `AND (j.lead_id IN (SELECT id FROM leads WHERE assigned_to_user_id = ${user.id}))`;
    }

    let estimateFilter = '';
    if (estimatesScope === 'own') {
      estimateFilter = `AND (created_by = ${user.id} OR lead_id IN (SELECT id FROM leads WHERE created_by = ${user.id} OR created_by_user_id = ${user.id}))`;
    } else if (estimatesScope === 'assigned') {
      estimateFilter = `AND (lead_id IN (SELECT id FROM leads WHERE assigned_to_user_id = ${user.id}))`;
    }

    // 2. Parallel data fetching based on user permissions
    const [
      kpisRes,
      needsFollowUpRes,
      myTasksRes,
      activeJobsRes,
      recentLeadsRes,
      topPerformersRes,
      trafficRes,
      jobsStageMapRes,
      recentActivitiesRes,
    ] = await Promise.all([
      // 2.1 KPI Strip — current + previous month for real delta calculation
      query<{
        new_leads: string;      connected_leads: string;
        est_scheduled: string;  est_sent: string;
        jobs_won: string;       lost_closed: string;
        active_jobs: string;    revenue_mtd: string;
        // previous month
        prev_new_leads: string; prev_connected: string;
        prev_scheduled: string; prev_est_sent: string;
        prev_jobs_won: string;  prev_lost_closed: string;
      }>(`
        WITH
          -- Current month / running totals
          agg_leads AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.status != 'lost' ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          agg_connected AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.status != 'lost' AND (l.pipeline_stage != 'stage_1_lead_gen' OR l.last_contact_at IS NOT NULL) ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          agg_scheduled AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.status != 'lost' AND l.pipeline_stage = 'stage_3_site_visit_estimate' ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          agg_est_sent AS (
            ${estimatesScope !== null
              ? `SELECT COUNT(*) as count FROM estimates WHERE 1=1 ${estimateFilter}`
              : `SELECT 0 as count`}
          ),
          agg_jobs_won AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.status = 'won' ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          agg_lost AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.status = 'lost' ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          agg_jobs AS (
            ${jobsScope !== null
              ? `SELECT COUNT(*) as count FROM jobs j WHERE j.status != 'complete' ${jobFilter}`
              : `SELECT 0 as count`}
          ),
          agg_revenue AS (
            ${canViewProfit
              ? `SELECT COALESCE(SUM(amount), 0) as amount FROM invoices
                 WHERE status = 'paid'
                   AND (paid_at >= date_trunc('month', NOW()) OR (paid_at IS NULL AND updated_at >= date_trunc('month', NOW())))`
              : `SELECT 0 as amount`}
          ),
          -- Previous calendar month counts (for delta %)
          prev_month_start AS (SELECT date_trunc('month', NOW()) - INTERVAL '1 month' AS d),
          prev_month_end   AS (SELECT date_trunc('month', NOW()) AS d),
          prev_leads AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l
                 WHERE l.status != 'lost' AND l.created_at >= (SELECT d FROM prev_month_start)
                   AND l.created_at <  (SELECT d FROM prev_month_end) ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          prev_connected AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l
                 WHERE l.status != 'lost'
                   AND (l.pipeline_stage != 'stage_1_lead_gen' OR l.last_contact_at IS NOT NULL)
                   AND l.last_contact_at >= (SELECT d FROM prev_month_start)
                   AND l.last_contact_at <  (SELECT d FROM prev_month_end) ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          prev_scheduled AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l
                 WHERE l.status != 'lost' AND l.pipeline_stage = 'stage_3_site_visit_estimate'
                   AND l.stage_entered_at >= (SELECT d FROM prev_month_start)
                   AND l.stage_entered_at <  (SELECT d FROM prev_month_end) ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          prev_est AS (
            ${estimatesScope !== null
              ? `SELECT COUNT(*) as count FROM estimates
                 WHERE created_at >= (SELECT d FROM prev_month_start)
                   AND created_at <  (SELECT d FROM prev_month_end) ${estimateFilter}`
              : `SELECT 0 as count`}
          ),
          prev_won AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l
                 WHERE l.status = 'won'
                   AND l.updated_at >= (SELECT d FROM prev_month_start)
                   AND l.updated_at <  (SELECT d FROM prev_month_end) ${leadFilter}`
              : `SELECT 0 as count`}
          ),
          prev_lost AS (
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l
                 WHERE l.status = 'lost'
                   AND l.updated_at >= (SELECT d FROM prev_month_start)
                   AND l.updated_at <  (SELECT d FROM prev_month_end) ${leadFilter}`
              : `SELECT 0 as count`}
          )
        SELECT
          (SELECT count FROM agg_leads)      as new_leads,
          (SELECT count FROM agg_connected)  as connected_leads,
          (SELECT count FROM agg_scheduled)  as est_scheduled,
          (SELECT count FROM agg_est_sent)   as est_sent,
          (SELECT count FROM agg_jobs_won)   as jobs_won,
          (SELECT count FROM agg_lost)       as lost_closed,
          (SELECT count FROM agg_jobs)       as active_jobs,
          (SELECT amount FROM agg_revenue)   as revenue_mtd,
          (SELECT count FROM prev_leads)     as prev_new_leads,
          (SELECT count FROM prev_connected) as prev_connected,
          (SELECT count FROM prev_scheduled) as prev_scheduled,
          (SELECT count FROM prev_est)       as prev_est_sent,
          (SELECT count FROM prev_won)       as prev_jobs_won,
          (SELECT count FROM prev_lost)      as prev_lost_closed;
      `),


      // 2.2 Needs Follow-Up (Stale leads waiting on decision > threshold hours)
      leadsScope !== null
        ? query<any>(`
            SELECT 
              l.id, l.full_name, l.phone, l.email, l.address, COALESCE(l.city, 'San Diego') as city, 
              l.service_type, l.estimated_value, l.pipeline_stage, l.status, l.priority, 
              l.assigned_to as assigned_to_name, l.assigned_to_user_id,
              COALESCE(l.proposal_sent_at, l.last_contact_at, l.stage_entered_at, l.created_at) as last_activity_at,
              ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(l.proposal_sent_at, l.last_contact_at, l.stage_entered_at, l.created_at))) / 86400)::int as days_idle
            FROM leads l
            WHERE l.status NOT IN ('won', 'lost')
              AND ${getNeedsFollowUpSqlCondition(1)}
              ${leadFilter}
            ORDER BY COALESCE(l.proposal_sent_at, l.last_contact_at, l.stage_entered_at, l.created_at) ASC
            LIMIT 6
          `, [followUpThresholdHours])
        : Promise.resolve([]),

      // 2.3 My Tasks (CRUD-backed personal task list for current_user.id)
      query<any>(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.work_category, t.due_at, t.end_at, t.completed_at,
          t.entity_type, t.entity_id,
          COALESCE(l.full_name, j.customer_name) as related_name,
          COALESCE(l.phone, j.customer_phone) as related_phone
        FROM tasks t
        LEFT JOIN leads l ON t.entity_type = 'lead' AND t.entity_id = l.id
        LEFT JOIN jobs j ON t.entity_type = 'job' AND t.entity_id = j.id
        WHERE (t.assigned_to_user_id = $1 OR t.created_by_user_id = $1)
          AND (t.completed_at IS NULL OR t.completed_at >= CURRENT_DATE)
        ORDER BY 
          (t.completed_at IS NOT NULL) ASC,
          CASE t.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            WHEN 'low' THEN 4 
            ELSE 5 
          END ASC,
          t.due_at ASC NULLS LAST,
          t.created_at DESC
        LIMIT 25
      `, [user.id]),

      // 2.4 Active Jobs in Field
      jobsScope !== null
        ? query<any>(`
            SELECT 
              j.id, j.job_number, j.customer_name, j.customer_phone, j.address, 
              COALESCE(j.city, 'San Diego') as city, j.service_type, j.status, 
              j.crew_lead, j.contract_value, j.scheduled_start, j.lead_id
            FROM jobs j
            WHERE j.status IN ('scheduled', 'in_progress', 'material_order', 'permit_pending', 'punch_list', 'final_inspection')
            ${jobFilter}
            ORDER BY j.updated_at DESC
            LIMIT 6
          `)
        : Promise.resolve([]),

      // 2.5 Recent Prospects (Real priority field checked)
      leadsScope !== null
        ? query<any>(`
            SELECT 
              l.id, l.full_name, l.phone, l.email, l.address, COALESCE(l.city, 'San Diego') as city, 
              l.service_type, l.status, l.priority, l.lead_score, l.estimated_value, l.created_at,
              l.source_type, l.lead_source_detail
            FROM leads l
            WHERE 1=1 ${leadFilter}
            ORDER BY l.created_at DESC
            LIMIT 6
          `)
        : Promise.resolve([]),

      // 2.6 Top Performers (Gated on reports.view)
      canViewReports
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

      // 2.7 Marketing & Traffic summary (Gated on analytics.view)
      canViewAnalytics
        ? query<any>(`
            SELECT 
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN session_id END)::int as today,
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN session_id END)::int as past_7d
            FROM analytics_events 
            WHERE event_type = 'pageview' AND page_path NOT LIKE '/admin%'
          `).catch(() => [{ today: 0, past_7d: 0 }])
        : Promise.resolve([{ today: 0, past_7d: 0 }]),

      // 2.8 7-Stage Production Pulse Map
      jobsScope !== null
        ? query<any>(`
            SELECT status, COUNT(*)::int as count 
            FROM jobs 
            GROUP BY status
          `).catch(() => [])
        : Promise.resolve([]),

      // 2.9 Live Recent Activity Feed
      query<any>(`
        SELECT
          a.id,
          a.activity_type,
          a.title,
          a.description,
          a.performed_by,
          a.created_at,
          COALESCE(l.full_name, c.full_name) as lead_name
        FROM activities a
        LEFT JOIN leads l ON a.entity_type = 'lead' AND a.entity_id = l.id
        LEFT JOIN clients c ON a.entity_type = 'client' AND a.entity_id = c.id
        ORDER BY a.created_at DESC
        LIMIT 8
      `).catch(() => []),
    ]);

    // Build stage map
    const stageMap: Record<string, number> = {
      permit_pending: 0, material_order: 0, scheduled: 0,
      in_progress: 0,   punch_list: 0,     final_inspection: 0, complete: 0,
    };
    jobsStageMapRes.forEach((r: any) => {
      if (r.status in stageMap) stageMap[r.status] = parseInt(String(r.count), 10) || 0;
    });

    const kpiData = kpisRes[0] || {
      new_leads: '0', connected_leads: '0', est_scheduled: '0', est_sent: '0',
      jobs_won: '0',  lost_closed: '0',     active_jobs: '0',   revenue_mtd: '0',
      prev_new_leads: '0', prev_connected: '0', prev_scheduled: '0',
      prev_est_sent: '0',  prev_jobs_won: '0',  prev_lost_closed: '0',
    };

    const traffic = trafficRes[0] || { today: 0, past_7d: 0 };
    const recentActivities = (recentActivitiesRes as any[]) || [];

    // Helper — compute real % change vs previous period
    function calcDelta(curr: string | number, prev: string | number): { delta: string; isPositive: boolean } {
      const c = typeof curr === 'string' ? parseInt(curr, 10) : curr;
      const p = typeof prev === 'string' ? parseInt(prev, 10) : prev;
      if (isNaN(c) || isNaN(p)) return { delta: '—', isPositive: true };
      if (p === 0 && c === 0) return { delta: '—', isPositive: true };
      if (p === 0) return { delta: `+${c * 100}%`, isPositive: true };
      const pct = Math.round(((c - p) / p) * 100);
      if (pct === 0) return { delta: '0%', isPositive: true };
      return { delta: `${pct > 0 ? '+' : ''}${pct}%`, isPositive: pct >= 0 };
    }

    // 8-week weekly sparkline data per KPI (runs in parallel, gracefully skipped if table missing)
    const sparklineRows = leadsScope !== null
      ? await query<{ week: string; new_leads: string; connected: string; scheduled: string; won: string; lost: string }>(`
          SELECT
            date_trunc('week', created_at)::date::text as week,
            COUNT(*) FILTER (WHERE status != 'lost')                                              as new_leads,
            COUNT(*) FILTER (WHERE status != 'lost' AND (pipeline_stage != 'stage_1_lead_gen' OR last_contact_at IS NOT NULL)) as connected,
            COUNT(*) FILTER (WHERE status != 'lost' AND pipeline_stage = 'stage_3_site_visit_estimate') as scheduled,
            COUNT(*) FILTER (WHERE status = 'won')                                                as won,
            COUNT(*) FILTER (WHERE status = 'lost')                                               as lost
          FROM leads
          WHERE created_at >= NOW() - INTERVAL '8 weeks'
          GROUP BY date_trunc('week', created_at)
          ORDER BY week ASC
        `).catch(() => [] as any[])
      : [];

    // Convert rows to ordered number arrays (oldest → newest, always 8 slots)
    const toWeeklyPoints = (rows: any[], field: string): number[] => {
      const vals = rows.map(r => parseInt(r[field] ?? '0', 10) || 0);
      while (vals.length < 2) vals.unshift(0); // ensure at least 2 points for rendering
      return vals;
    };

    const sparkPoints = {
      newLeads:     toWeeklyPoints(sparklineRows, 'new_leads'),
      connected:    toWeeklyPoints(sparklineRows, 'connected'),
      estScheduled: toWeeklyPoints(sparklineRows, 'scheduled'),
      estSent:      toWeeklyPoints(sparklineRows, 'scheduled'), // best proxy available
      jobsWon:      toWeeklyPoints(sparklineRows, 'won'),
      lostClosed:   toWeeklyPoints(sparklineRows, 'lost'),
    };

    return NextResponse.json({
      userRole: user.role,
      userId: user.id,
      userName: user.name,
      followUpThresholdHours,
      // Backward-compatible KPIs
      kpis: {
        newLeadsThisWeek: parseInt(kpiData.new_leads || '0', 10),
        activeJobs:       parseInt(kpiData.active_jobs || '0', 10),
        pendingEstimates: parseInt(kpiData.est_sent || '0', 10),
        revenueMtd:       canViewProfit ? parseFloat(kpiData.revenue_mtd || '0') : 0,
      },
      // Executive 6-Metric KPI Strip — real counts, real deltas, real sparklines
      sixKpis: {
        newLeads: {
          count: parseInt(kpiData.new_leads || '0', 10),
          ...calcDelta(kpiData.new_leads, kpiData.prev_new_leads),
          sparkPoints: sparkPoints.newLeads,
        },
        connected: {
          count: parseInt(kpiData.connected_leads || '0', 10),
          ...calcDelta(kpiData.connected_leads, kpiData.prev_connected),
          sparkPoints: sparkPoints.connected,
        },
        estScheduled: {
          count: parseInt(kpiData.est_scheduled || '0', 10),
          ...calcDelta(kpiData.est_scheduled, kpiData.prev_scheduled),
          sparkPoints: sparkPoints.estScheduled,
        },
        estSent: {
          count: parseInt(kpiData.est_sent || '0', 10),
          ...calcDelta(kpiData.est_sent, kpiData.prev_est_sent),
          sparkPoints: sparkPoints.estSent,
        },
        jobsWon: {
          count: parseInt(kpiData.jobs_won || '0', 10),
          ...calcDelta(kpiData.jobs_won, kpiData.prev_jobs_won),
          sparkPoints: sparkPoints.jobsWon,
        },
        lostClosed: {
          count: parseInt(kpiData.lost_closed || '0', 10),
          ...calcDelta(kpiData.lost_closed, kpiData.prev_lost_closed),
          sparkPoints: sparkPoints.lostClosed,
        },
      },
      recentActivities,
      needsFollowUp: needsFollowUpRes,
      myTasks:       myTasksRes,
      activeJobs:    activeJobsRes,
      recentLeads:   recentLeadsRes,
      topPerformers: topPerformersRes,
      trafficSummary: {
        visitorsToday: parseInt(String(traffic.today  || '0'), 10),
        visitors7d:    parseInt(String(traffic.past_7d || '0'), 10),
      },
      jobsStageMap: stageMap,
    });
  } catch (err) {
    console.error('[api/admin/stats GET]', err);
    return NextResponse.json({ error: 'Server error loading stats' }, { status: 500 });
  }
}

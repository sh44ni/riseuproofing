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
            ${leadsScope !== null
              ? `SELECT COUNT(*) as count FROM leads l WHERE l.created_at >= date_trunc('week', NOW()) ${leadFilter}`
              : `SELECT 0 as count`
            }
          ),
          agg_jobs AS (
            ${jobsScope !== null
              ? `SELECT COUNT(*) as count FROM jobs j WHERE j.status != 'complete' ${jobFilter}`
              : `SELECT 0 as count`
            }
          ),
          agg_estimates AS (
            ${estimatesScope !== null
              ? `SELECT COUNT(*) as count FROM estimates WHERE status IN ('sent', 'viewed', 'draft') ${estimateFilter}`
              : `SELECT 0 as count`
            }
          ),
          agg_revenue AS (
            ${canViewProfit
              ? `SELECT COALESCE(SUM(amount), 0) as amount FROM invoices 
                 WHERE status = 'paid' 
                   AND (paid_at >= date_trunc('month', NOW()) OR (paid_at IS NULL AND updated_at >= date_trunc('month', NOW())))`
              : `SELECT 0 as amount`
            }
          )
        SELECT 
          (SELECT count FROM agg_leads) as new_leads_week,
          (SELECT count FROM agg_jobs) as active_jobs,
          (SELECT count FROM agg_estimates) as pending_estimates,
          (SELECT amount FROM agg_revenue) as revenue_mtd;
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
      userRole: user.role,
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

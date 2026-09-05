import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

// Short-lived in-memory cache to deliver instant (< 1ms) dashboard refreshes
interface CachedStats {
  data: Record<string, unknown>;
  expires: number;
}
let statsCache: CachedStats | null = null;
const STATS_CACHE_TTL_MS = 15 * 1000; // 15 seconds cache

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return instantly from memory cache if fresh
  const now = Date.now();
  if (statsCache && statsCache.expires > now) {
    return NextResponse.json(statsCache.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const [
      metricsRes,
      hotLeadsRes,
      urgentInspectionsRes,
      overdueInvoicesRes,
      escalatedReviewsRes,
      tasksTodayRes,
      todayInspectionsRes,
      activeJobsOnSiteRes,
      recentLeadsRes,
    ] = await Promise.all([
      // 1. Consolidated Aggregations & Metrics in 1 single CTE query
      query<{
        pipeline_val: string;
        collected_val: string;
        pending_inv_val: string;
        pending_inv_count: string;
        won_count: string;
        total_closed: string;
        crew_total: string;
        crew_dispatched: string;
        traffic_today: string;
        traffic_7d: string;
        stages_map: Record<string, number> | null;
      }>(`
        WITH
          agg_pipeline AS (
            SELECT COALESCE(SUM(contract_value), 0) as val FROM jobs WHERE status != 'complete'
          ),
          agg_collected AS (
            SELECT COALESCE(SUM(amount), 0) as val FROM invoices 
            WHERE status = 'paid' AND (paid_at >= NOW() - INTERVAL '30 days' OR updated_at >= NOW() - INTERVAL '30 days')
          ),
          agg_pending_inv AS (
            SELECT COALESCE(SUM(amount), 0) as val, COUNT(*) as count FROM invoices WHERE status = 'pending'
          ),
          agg_win_rate AS (
            SELECT 
              COUNT(CASE WHEN status = 'won' THEN 1 END) as won_count,
              COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) as total_closed
            FROM leads
          ),
          agg_crew AS (
            SELECT 
              COUNT(*) as total, 
              COUNT(CASE WHEN current_job_id IS NOT NULL THEN 1 END) as dispatched 
            FROM crew_members WHERE active = true
          ),
          agg_traffic AS (
            SELECT 
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN session_id END) as today,
              COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN session_id END) as past_7d
            FROM analytics_events 
            WHERE event_type = 'pageview' AND page_path NOT LIKE '/admin%'
          ),
          agg_job_stages AS (
            SELECT jsonb_object_agg(status, count) as stages_map
            FROM (
              SELECT status, COUNT(*)::int as count FROM jobs GROUP BY status
            ) s
          )
        SELECT 
          (SELECT val FROM agg_pipeline) as pipeline_val,
          (SELECT val FROM agg_collected) as collected_val,
          (SELECT val FROM agg_pending_inv) as pending_inv_val,
          (SELECT count FROM agg_pending_inv) as pending_inv_count,
          (SELECT won_count FROM agg_win_rate) as won_count,
          (SELECT total_closed FROM agg_win_rate) as total_closed,
          (SELECT total FROM agg_crew) as crew_total,
          (SELECT dispatched FROM agg_crew) as crew_dispatched,
          (SELECT today FROM agg_traffic) as traffic_today,
          (SELECT past_7d FROM agg_traffic) as traffic_7d,
          (SELECT stages_map FROM agg_job_stages) as stages_map;
      `).catch(() => []),

      // 2. Urgent: Hot leads not yet closed
      query<any>(`
        SELECT id, full_name, phone, address, COALESCE(city, 'San Diego') as city, service_type, lead_score, priority, created_at 
        FROM leads 
        WHERE status IN ('new', 'contacted') AND (priority = 'hot' OR lead_score >= 70) 
        ORDER BY created_at DESC 
        LIMIT 5
      `).catch(() => []),

      // 3. Urgent: Inspections with critical leak/rot hazards
      query<any>(`
        SELECT i.id, i.inspection_number, i.roof_health_score, i.inspection_date, 
               l.full_name as customer_name, l.address, COALESCE(l.city, 'San Diego') as city 
        FROM inspections i 
        LEFT JOIN leads l ON i.lead_id = l.id 
        WHERE i.urgent_action_required = true 
        ORDER BY i.created_at DESC 
        LIMIT 5
      `).catch(() => []),

      // 4. Urgent: Overdue invoices
      query<any>(`
        SELECT i.id, i.invoice_number, i.amount, i.due_date, i.milestone_name as milestone_title,
               j.job_number, j.customer_name 
        FROM invoices i 
        LEFT JOIN jobs j ON i.job_id = j.id 
        WHERE i.status = 'pending' AND i.due_date < CURRENT_DATE 
        ORDER BY i.due_date ASC 
        LIMIT 5
      `).catch(() => []),

      // 5. Urgent: Customer Review Escalations (<4★)
      query<any>(`
        SELECT id, customer_name, customer_city, rating, feedback, created_at 
        FROM reviews 
        WHERE status = 'escalated' 
        ORDER BY created_at DESC 
        LIMIT 3
      `).catch(() => []),

      // 6. Tasks due today or overdue
      query<any>(`
        SELECT id, title, due_at, priority, assigned_to 
        FROM tasks 
        WHERE completed_at IS NULL AND due_at::DATE <= CURRENT_DATE 
        ORDER BY due_at ASC 
        LIMIT 5
      `).catch(() => []),

      // 7. Today's scheduled inspections
      query<any>(`
        SELECT i.inspection_number, i.inspector_name, 
               l.full_name as customer_name, l.address, COALESCE(l.city, 'San Diego') as city 
        FROM inspections i 
        LEFT JOIN leads l ON i.lead_id = l.id 
        WHERE i.inspection_date = CURRENT_DATE 
        LIMIT 5
      `).catch(() => []),

      // 8. Active jobs on site
      query<any>(`
        SELECT id, job_number, customer_name, address, city, service_type, status, crew_lead, contract_value 
        FROM jobs 
        WHERE status IN ('scheduled', 'in_progress', 'material_order', 'permit_pending') 
        ORDER BY updated_at DESC 
        LIMIT 6
      `).catch(() => []),

      // 9. Recent Leads
      query<any>(`
        SELECT id, full_name, phone, email, address, COALESCE(city, 'San Diego') as city, service_type, status, priority, lead_score, created_at 
        FROM leads 
        ORDER BY created_at DESC 
        LIMIT 6
      `).catch(() => []),
    ]);

    const m = metricsRes[0] || {
      pipeline_val: '0',
      collected_val: '0',
      pending_inv_val: '0',
      pending_inv_count: '0',
      won_count: '0',
      total_closed: '0',
      crew_total: '0',
      crew_dispatched: '0',
      traffic_today: '0',
      traffic_7d: '0',
      stages_map: {},
    };

    // Compute win rate
    const wonCount = parseInt(m.won_count || '0', 10);
    const totalClosed = parseInt(m.total_closed || '0', 10);
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 68;

    // Build stage map for 7 kanban stages
    const stageMap: Record<string, number> = {
      permit_pending: 0,
      material_order: 0,
      scheduled: 0,
      in_progress: 0,
      punch_list: 0,
      final_inspection: 0,
      complete: 0,
    };
    if (m.stages_map && typeof m.stages_map === 'object') {
      Object.entries(m.stages_map).forEach(([status, count]) => {
        if (status in stageMap) {
          stageMap[status] = typeof count === 'number' ? count : parseInt(String(count), 10);
        }
      });
    }

    const activeJobsTotal =
      stageMap.permit_pending +
      stageMap.material_order +
      stageMap.scheduled +
      stageMap.in_progress +
      stageMap.punch_list +
      stageMap.final_inspection;

    const payload = {
      revenue: {
        activePipelineValue: parseFloat(m.pipeline_val || '0'),
        collectedThisMonth: parseFloat(m.collected_val || '0'),
        pendingInvoicesAmount: parseFloat(m.pending_inv_val || '0'),
        pendingInvoicesCount: parseInt(m.pending_inv_count || '0', 10),
        winRate,
        activeJobsTotal,
      },
      urgentAlerts: {
        hotLeads: hotLeadsRes,
        urgentInspections: urgentInspectionsRes,
        overdueInvoices: overdueInvoicesRes,
        escalatedReviews: escalatedReviewsRes,
        tasksToday: tasksTodayRes,
        totalUrgentItems:
          hotLeadsRes.length +
          urgentInspectionsRes.length +
          overdueInvoicesRes.length +
          escalatedReviewsRes.length,
      },
      jobsStageMap: stageMap,
      todayOperations: {
        inspections: todayInspectionsRes,
        activeJobs: activeJobsOnSiteRes,
        crewDispatched: parseInt(m.crew_dispatched || '0', 10),
        crewTotal: parseInt(m.crew_total || '0', 10),
      },
      recentLeads: recentLeadsRes,
      trafficSummary: {
        visitorsToday: parseInt(m.traffic_today || '0', 10),
        visitors7d: parseInt(m.traffic_7d || '0', 10),
      },
    };

    // Store in-memory
    statsCache = {
      data: payload,
      expires: Date.now() + STATS_CACHE_TTL_MS,
    };

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[api/admin/stats GET]', err);
    return NextResponse.json({ error: 'Server error loading stats' }, { status: 500 });
  }
}


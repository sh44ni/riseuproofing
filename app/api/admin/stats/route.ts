import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      pipelineRes,
      collectedRes,
      pendingInvoicesRes,
      winRateRes,
      hotLeadsRes,
      urgentInspectionsRes,
      overdueInvoicesRes,
      escalatedReviewsRes,
      tasksTodayRes,
      jobsStageRes,
      todayInspectionsRes,
      activeJobsOnSiteRes,
      crewRosterRes,
      recentLeadsRes,
      trafficSummaryRes,
    ] = await Promise.all([
      // 1. Active pipeline value ($ in non-complete jobs)
      query<{ val: string }>(`
        SELECT COALESCE(SUM(contract_value), 0) as val 
        FROM jobs 
        WHERE status != 'complete'
      `),

      // 2. Cash collected in past 30 days
      query<{ val: string }>(`
        SELECT COALESCE(SUM(amount), 0) as val 
        FROM invoices 
        WHERE status = 'paid' AND (paid_at >= NOW() - INTERVAL '30 days' OR updated_at >= NOW() - INTERVAL '30 days')
      `),

      // 3. Pending milestone invoices
      query<{ val: string; count: string }>(`
        SELECT COALESCE(SUM(amount), 0) as val, COUNT(*) as count 
        FROM invoices 
        WHERE status = 'pending'
      `),

      // 4. Win / Close Rate
      query<{ won_count: string; total_closed: string }>(`
        SELECT 
          COUNT(CASE WHEN status = 'won' THEN 1 END) as won_count,
          COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) as total_closed
        FROM leads
      `),

      // 5. Urgent: Hot leads not yet closed
      query<any>(`
        SELECT id, full_name, phone, address, city, service_type, lead_score, priority, created_at 
        FROM leads 
        WHERE status IN ('new', 'contacted') AND (priority = 'hot' OR lead_score >= 70) 
        ORDER BY created_at DESC 
        LIMIT 5
      `),

      // 6. Urgent: Inspections with critical leak/rot hazards
      query<any>(`
        SELECT i.id, i.inspection_number, i.roof_health_score, i.inspection_date, 
               l.full_name as customer_name, l.address, l.city 
        FROM inspections i 
        LEFT JOIN leads l ON i.lead_id = l.id 
        WHERE i.urgent_action_required = true 
        ORDER BY i.created_at DESC 
        LIMIT 5
      `),

      // 7. Urgent: Overdue invoices
      query<any>(`
        SELECT i.id, i.invoice_number, i.amount, i.due_date, i.milestone_title,
               j.job_number, j.customer_name 
        FROM invoices i 
        LEFT JOIN jobs j ON i.job_id = j.id 
        WHERE i.status = 'pending' AND i.due_date < CURRENT_DATE 
        ORDER BY i.due_date ASC 
        LIMIT 5
      `),

      // 8. Urgent: Customer Review Escalations (<4★)
      query<any>(`
        SELECT id, customer_name, customer_city, rating, feedback, created_at 
        FROM reviews 
        WHERE status = 'escalated' 
        ORDER BY created_at DESC 
        LIMIT 3
      `),

      // 9. Tasks due today or overdue
      query<any>(`
        SELECT id, title, due_at, priority, assigned_to 
        FROM tasks 
        WHERE completed_at IS NULL AND due_at::DATE <= CURRENT_DATE 
        ORDER BY due_at ASC 
        LIMIT 5
      `),

      // 10. Jobs count by 7 Kanban stages
      query<{ status: string; count: string }>(`
        SELECT status, COUNT(*) as count 
        FROM jobs 
        GROUP BY status
      `),

      // 11. Today's scheduled inspections
      query<any>(`
        SELECT i.inspection_number, i.inspector_name, 
               l.full_name as customer_name, l.address, l.city 
        FROM inspections i 
        LEFT JOIN leads l ON i.lead_id = l.id 
        WHERE i.inspection_date = CURRENT_DATE 
        LIMIT 5
      `),

      // 12. Active jobs on site
      query<any>(`
        SELECT id, job_number, customer_name, address, city, service_type, status, crew_lead, contract_value 
        FROM jobs 
        WHERE status IN ('scheduled', 'in_progress', 'material_order', 'permit_pending') 
        ORDER BY updated_at DESC 
        LIMIT 6
      `),

      // 13. Crew Roster status
      query<{ total: string; dispatched: string }>(`
        SELECT 
          COUNT(*) as total, 
          COUNT(CASE WHEN current_job_id IS NOT NULL THEN 1 END) as dispatched 
        FROM crew_members 
        WHERE active = true
      `),

      // 14. Recent Leads
      query<any>(`
        SELECT id, full_name, phone, email, address, city, service_type, status, priority, lead_score, created_at 
        FROM leads 
        ORDER BY created_at DESC 
        LIMIT 6
      `),

      // 15. Quick website traffic pulse
      query<{ today: string; past_7d: string }>(`
        SELECT 
          COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN session_id END) as today,
          COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN session_id END) as past_7d
        FROM analytics_events 
        WHERE event_type = 'pageview'
      `).catch(() => [{ today: '0', past_7d: '0' }]),
    ]);

    // Compute win rate
    const wonCount = parseInt(winRateRes[0]?.won_count || '0', 10);
    const totalClosed = parseInt(winRateRes[0]?.total_closed || '0', 10);
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
    jobsStageRes.forEach(r => {
      if (r.status in stageMap) {
        stageMap[r.status] = parseInt(r.count, 10);
      }
    });

    const activeJobsTotal =
      stageMap.permit_pending +
      stageMap.material_order +
      stageMap.scheduled +
      stageMap.in_progress +
      stageMap.punch_list +
      stageMap.final_inspection;

    return NextResponse.json({
      revenue: {
        activePipelineValue: parseFloat(pipelineRes[0]?.val || '0'),
        collectedThisMonth: parseFloat(collectedRes[0]?.val || '0'),
        pendingInvoicesAmount: parseFloat(pendingInvoicesRes[0]?.val || '0'),
        pendingInvoicesCount: parseInt(pendingInvoicesRes[0]?.count || '0', 10),
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
        crewDispatched: parseInt(crewRosterRes[0]?.dispatched || '0', 10),
        crewTotal: parseInt(crewRosterRes[0]?.total || '0', 10),
      },
      recentLeads: recentLeadsRes,
      trafficSummary: {
        visitorsToday: parseInt(trafficSummaryRes[0]?.today || '0', 10),
        visitors7d: parseInt(trafficSummaryRes[0]?.past_7d || '0', 10),
      },
    });
  } catch (err) {
    console.error('[api/admin/stats GET]', err);
    return NextResponse.json({ error: 'Server error loading stats' }, { status: 500 });
  }
}

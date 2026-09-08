import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { autoHealDataflowSync } from '@/lib/crm-sync';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('analytics:view');
  if (auth.response) return auth.response;

  try {
    const [counts, integrity] = await Promise.all([
      query<any>(`
        SELECT 
          (SELECT COUNT(*) FROM leads) as total_leads,
          (SELECT COUNT(*) FROM jobs) as total_jobs,
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM estimates) as total_estimates,
          (SELECT COUNT(*) FROM invoices) as total_invoices,
          (SELECT COUNT(*) FROM warranties) as total_warranties,
          (SELECT COUNT(*) FROM inspections) as total_inspections,
          (SELECT COUNT(*) FROM reviews) as total_reviews,
          (SELECT COUNT(*) FROM tasks) as total_tasks
      `),
      query<any>(`
        SELECT 
          (SELECT COUNT(*) FROM jobs WHERE lead_id IS NULL) as jobs_null_lead,
          (SELECT COUNT(*) FROM jobs WHERE client_id IS NULL) as jobs_null_client,
          (SELECT COUNT(*) FROM leads WHERE client_id IS NULL) as leads_null_client,
          (SELECT COUNT(*) FROM estimates WHERE client_id IS NULL) as estimates_null_client,
          (SELECT COUNT(*) FROM invoices WHERE client_id IS NULL) as invoices_null_client,
          (SELECT COUNT(*) FROM warranties WHERE client_id IS NULL) as warranties_null_client,
          (SELECT COUNT(*) FROM reviews WHERE client_id IS NULL) as reviews_null_client,
          (SELECT COUNT(*) FROM tasks WHERE client_id IS NULL) as tasks_null_client,
          (SELECT COUNT(*) FROM leads l JOIN jobs j ON j.lead_id = l.id WHERE l.pipeline_stage != 'stage_5_completion_followup') as pipeline_stage_mismatches,
          (SELECT COUNT(*) FROM clients c WHERE c.total_jobs_count = 0 AND EXISTS (SELECT 1 FROM jobs j WHERE j.client_id = c.id)) as client_jobs_count_desynced
      `),
    ]);

    const i = integrity[0] || {};
    const totalIssues = 
      Number(i.jobs_null_lead || 0) +
      Number(i.jobs_null_client || 0) +
      Number(i.leads_null_client || 0) +
      Number(i.estimates_null_client || 0) +
      Number(i.invoices_null_client || 0) +
      Number(i.warranties_null_client || 0) +
      Number(i.reviews_null_client || 0) +
      Number(i.tasks_null_client || 0) +
      Number(i.pipeline_stage_mismatches || 0) +
      Number(i.client_jobs_count_desynced || 0);

    const isHealthy = totalIssues === 0;

    return NextResponse.json({
      ok: true,
      status: isHealthy ? 'healthy' : 'issues_detected',
      totalIssues,
      counts: counts[0],
      integrity: i,
    });
  } catch (err: any) {
    console.error('[api/admin/audit GET]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('settings:edit');
  if (auth.response) return auth.response;

  try {
    const result = await autoHealDataflowSync();
    return NextResponse.json({
      ok: true,
      message: 'Dataflow synchronization and auto-healing routine completed successfully.',
      result,
    });
  } catch (err: any) {
    console.error('[api/admin/audit POST]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

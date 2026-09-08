import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission } from '@/lib/admin-auth';
import { buildScopeFilter } from '@/lib/permissions';
import { query } from '@/lib/db';

export const JOB_STAGES = [
  'permit_pending',
  'material_order',
  'scheduled',
  'in_progress',
  'punch_list',
  'final_inspection',
  'complete',
] as const;

export async function GET(req: NextRequest) {
  const auth = await requirePermission('jobs:view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Enforce dynamic scope filtering (§3 & §8)
  const scopeFilter = buildScopeFilter(auth.user, 'jobs.view', {
    creatorCol: 'COALESCE(jobs.created_by, (SELECT created_by_user_id FROM leads WHERE leads.id = jobs.lead_id))',
    assignedCol: '(SELECT assigned_to_user_id FROM leads WHERE leads.id = jobs.lead_id)',
    paramOffset: params.length + 1,
  });

  if (!scopeFilter.allowed) {
    return NextResponse.json({ ok: false, error: 'Forbidden: Insufficient permissions to view jobs' }, { status: 403 });
  }

  if (scopeFilter.clause !== '1=1') {
    conditions.push(scopeFilter.clause);
    params.push(...scopeFilter.params);
  }

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(customer_name) LIKE ${pIdx} OR 
      LOWER(job_number) LIKE ${pIdx} OR 
      LOWER(COALESCE(address, '')) LIKE ${pIdx} OR 
      LOWER(COALESCE(city, '')) LIKE ${pIdx}
    )`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [jobs, stats] = await Promise.all([
    query<any>(`SELECT * FROM jobs ${where} ORDER BY created_at DESC`, params),
    query<{
      total_count: string;
      active_count: string;
      total_value: string;
      active_value: string;
    }>(
      `SELECT 
         COUNT(*) as total_count,
         COUNT(CASE WHEN status != 'complete' THEN 1 END) as active_count,
         COALESCE(SUM(contract_value), 0) as total_value,
         COALESCE(SUM(CASE WHEN status != 'complete' THEN contract_value ELSE 0 END), 0) as active_value
       FROM jobs`
    ),
  ]);

  // Group by Kanban stages
  const kanban: Record<string, any[]> = {};
  for (const stage of JOB_STAGES) {
    kanban[stage] = [];
  }
  for (const j of jobs) {
    if (kanban[j.status]) {
      kanban[j.status].push(j);
    } else {
      kanban['permit_pending'].push(j);
    }
  }

  const summary = stats[0] || {
    total_count: '0',
    active_count: '0',
    total_value: '0',
    active_value: '0',
  };

  return NextResponse.json({
    jobs,
    kanban,
    summary: {
      totalCount: parseInt(summary.total_count, 10),
      activeCount: parseInt(summary.active_count, 10),
      totalValue: parseFloat(summary.total_value),
      activeValue: parseFloat(summary.active_value),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyPermission(['jobs:change_stage', 'estimates:create']);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      leadId,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      zip,
      serviceType = 'Residential Roofing',
      contractValue = 0,
      scheduledStart,
      estimatedDays = 3,
      crewLead,
      notes,
    } = body;

    // Strict rule: Jobs cannot be created without being tied to a Sales Pipeline lead
    const parsedLeadId = leadId ? parseInt(String(leadId), 10) : null;
    if (!parsedLeadId || isNaN(parsedLeadId)) {
      return NextResponse.json(
        { error: 'A valid sales pipeline lead is required to create a job. Please select an existing lead.' },
        { status: 400 }
      );
    }

    const leadRows = await query<any>('SELECT * FROM leads WHERE id = $1', [parsedLeadId]);
    if (leadRows.length === 0) {
      return NextResponse.json({ error: 'Selected lead not found in sales pipeline' }, { status: 404 });
    }
    const lead = leadRows[0];

    const finalName = customerName || lead.full_name;
    if (!finalName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Resolve or establish client_id
    let clientId: number | null = lead.client_id ? Number(lead.client_id) : null;
    if (!clientId) {
      const { findOrCreateClient } = await import('@/lib/crm-clients');
      const client = await findOrCreateClient({
        fullName: finalName,
        phone: customerPhone || lead.phone,
        email: customerEmail || lead.email,
        address: address || lead.address,
        city: city || lead.city,
        zip: zip || lead.zip,
        serviceType: serviceType || lead.service_type,
        leadSource: lead.lead_source || 'job_creation',
      });
      clientId = client.id;
      await query('UPDATE leads SET client_id = $1 WHERE id = $2', [clientId, parsedLeadId]);
    }

    // Check if lead has an estimate to link
    let estimateId: number | null = null;
    const estRows = await query<any>(
      `SELECT id, total FROM estimates WHERE lead_id = $1 OR (client_id = $2 AND client_id IS NOT NULL) ORDER BY created_at DESC LIMIT 1`,
      [parsedLeadId, clientId]
    );
    if (estRows.length > 0) {
      estimateId = Number(estRows[0].id);
    }

    // Resolve attribution snapshot (§7)
    let jobCreatedBy = lead.created_by || lead.created_by_user_id;
    let jobRoleSnapshot = lead.created_by_role_snapshot;
    if (!jobCreatedBy) {
      jobCreatedBy = auth.user.id;
      jobRoleSnapshot = (auth.user.roles && auth.user.roles.length > 0)
        ? auth.user.roles.map(r => r.name).join(', ')
        : (auth.user.role || 'Staff');
    }

    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const jobNumber = `JOB-${year}-${seq}`;
    const finalContractVal = Number(contractValue) || (estimateId && estRows[0]?.total ? Number(estRows[0].total) : 0);

    const rows = await query<any>(
      `INSERT INTO jobs (
        lead_id, client_id, estimate_id, job_number, status, customer_name, customer_phone, customer_email,
        address, city, zip, service_type, contract_value, scheduled_start,
        estimated_days, crew_lead, notes,
        created_by, created_by_role_snapshot
      ) VALUES (
        $1, $2, $3, $4, 'permit_pending', $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18
      ) RETURNING *`,
      [
        parsedLeadId,
        clientId,
        estimateId,
        jobNumber,
        finalName,
        customerPhone ?? lead.phone ?? null,
        customerEmail ?? lead.email ?? null,
        address ?? lead.address ?? null,
        city ?? lead.city ?? null,
        zip ?? lead.zip ?? null,
        serviceType || lead.service_type || 'Residential Roofing',
        finalContractVal,
        scheduledStart ?? null,
        Number(estimatedDays) || 3,
        crewLead ?? null,
        notes ?? null,
        jobCreatedBy,
        jobRoleSnapshot,
      ]
    );

    const newJob = rows[0];

    // Automatically transition lead to Stage 5 (Job Completion & Follow-up) and mark status = won
    await query(
      `UPDATE leads 
       SET pipeline_stage = 'stage_5_completion_followup',
           stage_entered_at = CASE WHEN pipeline_stage != 'stage_5_completion_followup' THEN NOW() ELSE stage_entered_at END,
           status = 'won',
           contract_signed_at = COALESCE(contract_signed_at, NOW()),
           estimated_value = GREATEST(COALESCE(estimated_value, 0), $1),
           updated_at = NOW()
       WHERE id = $2`,
      [finalContractVal, parsedLeadId]
    );

    // If estimate exists, mark it accepted and linked
    if (estimateId) {
      await query(
        `UPDATE estimates 
         SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()), client_id = COALESCE(client_id, $1) 
         WHERE id = $2`,
        [clientId, estimateId]
      );
    }

    // Recalculate client statistics
    if (clientId) {
      const { recalculateClientStats } = await import('@/lib/crm-clients');
      await recalculateClientStats(clientId);
    }

    // Log activity timeline
    await query(
      `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, $2, 'status_change', $3, $4, $5)`,
      [
        parsedLeadId,
        clientId,
        `Job Dispatched: ${jobNumber}`,
        `Moved to Stage 5 (Production / Permit Pending) with contract value $${finalContractVal.toLocaleString()}`,
        auth.user.name || 'Staff',
      ]
    );

    if (clientId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('client', $1, $1, 'status_change', $2, $3, $4)`,
        [
          clientId,
          `New Project Started: ${jobNumber}`,
          `Contract Value: $${finalContractVal.toLocaleString()} (${serviceType})`,
          auth.user.name || 'Staff',
        ]
      );
    }

    return NextResponse.json({ ok: true, job: newJob });
  } catch (err) {
    console.error('[api/admin/jobs POST]', err);
    return NextResponse.json({ error: 'Server error creating job' }, { status: 500 });
  }
}

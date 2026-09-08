import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { findOrCreateClient, recalculateClientStats } from '@/lib/crm-clients';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyPermission(['jobs:change_stage', 'estimates:create']);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const estimateId = parseInt(id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
  }

  const estRows = await query<any>(`SELECT * FROM estimates WHERE id = $1`, [estimateId]);
  if (!estRows || estRows.length === 0) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  const est = estRows[0];

  // Resolve or link client_id
  let clientId = est.client_id;
  if (!clientId && est.lead_id) {
    const lRows = await query<{ client_id: number | null }>(`SELECT client_id FROM leads WHERE id = $1`, [est.lead_id]);
    if (lRows[0]?.client_id) {
      clientId = lRows[0].client_id;
    }
  }
  if (!clientId && (est.customer_phone || est.customer_email)) {
    try {
      const client = await findOrCreateClient({
        fullName: est.customer_name,
        phone: est.customer_phone,
        email: est.customer_email,
        address: est.customer_address,
        city: est.customer_city,
        zip: est.customer_zip,
        leadSource: 'estimate_conversion',
      });
      clientId = client.id;
      await query(`UPDATE estimates SET client_id = $1 WHERE id = $2`, [clientId, estimateId]);
    } catch (e) {
      console.warn('Could not auto-link client during conversion:', e);
    }
  }

  // Check if already converted
  const existingJob = await query<any>(`SELECT id, job_number FROM jobs WHERE estimate_id = $1`, [estimateId]);
  if (existingJob && existingJob.length > 0) {
    return NextResponse.json({
      ok: true,
      alreadyConverted: true,
      job: existingJob[0],
    });
  }

  // Resolve lead attribution (§7)
  let jobCreatedBy = est.created_by;
  let jobRoleSnapshot = est.created_by_role_snapshot;

  if (!jobCreatedBy && est.lead_id) {
    const lRows = await query<any>(`SELECT created_by, created_by_user_id, created_by_role_snapshot FROM leads WHERE id = $1`, [est.lead_id]);
    if (lRows.length > 0) {
      jobCreatedBy = lRows[0].created_by || lRows[0].created_by_user_id;
      if (lRows[0].created_by_role_snapshot) {
        jobRoleSnapshot = lRows[0].created_by_role_snapshot;
      }
    }
  }

  if (!jobCreatedBy) {
    jobCreatedBy = auth.user.id;
    jobRoleSnapshot = (auth.user.roles && auth.user.roles.length > 0)
      ? auth.user.roles.map(r => r.name).join(', ')
      : (auth.user.role || 'Staff');
  }

  // Generate job number JOB-YYYY-XXXX
  const year = new Date().getFullYear();
  const jobCount = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs`);
  const seq = String(parseInt(jobCount[0]?.count ?? '0', 10) + 1).padStart(4, '0');
  const jobNumber = `JOB-${year}-${seq}`;

  // Insert Job with client_id and attribution
  const jobRows = await query<any>(
    `INSERT INTO jobs (
      lead_id, estimate_id, client_id, job_number, status, customer_name, customer_phone,
      customer_email, address, city, zip, service_type, contract_value, notes,
      created_by, created_by_role_snapshot
    ) VALUES (
      $1, $2, $3, $4, 'permit_pending', $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15
    ) RETURNING *`,
    [
      est.lead_id,
      est.id,
      clientId,
      jobNumber,
      est.customer_name,
      est.customer_phone,
      est.customer_email,
      est.customer_address,
      est.customer_city,
      est.customer_zip,
      est.service_type,
      est.total,
      est.notes,
      jobCreatedBy,
      jobRoleSnapshot,
    ]
  );

  const job = jobRows[0];

  // Mark estimate as accepted
  await query(
    `UPDATE estimates SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()) WHERE id = $1`,
    [estimateId]
  );

  // Mark lead as won and advance to Stage 5 if linked
  if (est.lead_id) {
    await query(
      `UPDATE leads 
       SET status = 'won', 
           pipeline_stage = 'stage_5_completion_followup',
           stage_entered_at = NOW(),
           contract_signed_at = COALESCE(contract_signed_at, NOW()),
           estimated_value = GREATEST(COALESCE(estimated_value, 0), $1),
           updated_at = NOW()
       WHERE id = $2`,
      [Number(est.total) || 0, est.lead_id]
    );

    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
       VALUES ('lead', $1, 'status_change', $2, $3, 'Admin', $4)`,
      [
        est.lead_id,
        `Deal Won! Converted to ${jobNumber}`,
        `Contract Value: $${Number(est.total).toLocaleString()} — Moved to Stage 5 (Job Completion & Follow-up)`,
        clientId,
      ]
    );
  }

  if (clientId) {
    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
       VALUES ('client', $1, 'status_change', $2, $3, 'Admin', $1)`,
      [
        clientId,
        `Active Job Created: ${jobNumber}`,
        `Contract Value: $${Number(est.total).toLocaleString()} from ${est.estimate_number}`,
      ]
    );
    await recalculateClientStats(clientId);
  }

  return NextResponse.json({ ok: true, job });
}

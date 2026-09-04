import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Check if already converted
  const existingJob = await query<any>(`SELECT id, job_number FROM jobs WHERE estimate_id = $1`, [estimateId]);
  if (existingJob && existingJob.length > 0) {
    return NextResponse.json({
      ok: true,
      alreadyConverted: true,
      job: existingJob[0],
    });
  }

  // Generate job number JOB-YYYY-XXXX
  const year = new Date().getFullYear();
  const jobCount = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs`);
  const seq = String(parseInt(jobCount[0]?.count ?? '0', 10) + 1).padStart(4, '0');
  const jobNumber = `JOB-${year}-${seq}`;

  // Insert Job
  const jobRows = await query<any>(
    `INSERT INTO jobs (
      lead_id, estimate_id, job_number, status, customer_name, customer_phone,
      customer_email, address, city, zip, service_type, contract_value, notes
    ) VALUES (
      $1, $2, $3, 'permit_pending', $4, $5,
      $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *`,
    [
      est.lead_id,
      est.id,
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
    ]
  );

  const job = jobRows[0];

  // Mark estimate as accepted
  await query(
    `UPDATE estimates SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()) WHERE id = $1`,
    [estimateId]
  );

  // Mark lead as won if linked
  if (est.lead_id) {
    await query(`UPDATE leads SET status = 'won' WHERE id = $1`, [est.lead_id]);

    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, 'status_change', $2, $3, 'Admin')`,
      [
        est.lead_id,
        `Deal Won! Converted to ${jobNumber}`,
        `Contract Value: $${Number(est.total).toLocaleString()} — Moved to Permit Pending stage`,
      ]
    );
  }

  return NextResponse.json({ ok: true, job });
}

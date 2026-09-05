import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('jobs:view');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const rows = await query<any>(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = rows[0];

  // Also fetch linked estimate details if exists
  let estimate = null;
  if (job.estimate_id) {
    const estRows = await query<any>(`SELECT * FROM estimates WHERE id = $1`, [job.estimate_id]);
    estimate = estRows[0] || null;
  }

  return NextResponse.json({ job, estimate });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyPermission(['jobs:change_stage', 'jobs:manage_permits']);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const body = await req.json();
  const allowed = [
    'status',
    'customer_name',
    'customer_phone',
    'customer_email',
    'address',
    'city',
    'zip',
    'service_type',
    'contract_value',
    'permit_status',
    'permit_number',
    'permit_filed_at',
    'permit_approved_at',
    'material_status',
    'material_ordered_at',
    'material_delivered_at',
    'crew_lead',
    'crew_members',
    'scheduled_start',
    'estimated_days',
    'actual_start',
    'actual_end',
    'weather_delays',
    'notes',
  ];

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const f of allowed) {
    if (body[f] !== undefined) {
      params.push(body[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: true });
  }

  updates.push(`updated_at = NOW()`);

  params.push(jobId);
  await query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${params.length}`, params);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('jobs:delete');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  await query(`DELETE FROM jobs WHERE id = $1`, [jobId]);
  return NextResponse.json({ ok: true });
}

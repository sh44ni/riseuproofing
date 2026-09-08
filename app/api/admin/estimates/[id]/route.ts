import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, hasPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('estimates:view');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const estimateId = parseInt(id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
  }

  const rows = await query<any>(`SELECT * FROM estimates WHERE id = $1`, [estimateId]);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  const estimate = rows[0];
  if (!hasPermission(auth.user, 'estimates:view_margins')) {
    delete estimate.material_cost;
    delete estimate.labor_cost;
    delete estimate.margin_pct;
  }

  return NextResponse.json({ estimate });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('estimates:create');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const estimateId = parseInt(id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
  }

  const body = await req.json();
  const allowed = [
    'status',
    'customer_name',
    'customer_phone',
    'customer_email',
    'customer_address',
    'customer_city',
    'customer_zip',
    'service_type',
    'roof_squares',
    'roof_pitch',
    'stories',
    'tearoff_layers',
    'material_type',
    'material_cost',
    'labor_cost',
    'addons',
    'subtotal',
    'margin_pct',
    'total',
    'financing_months',
    'monthly_payment',
    'valid_until',
    'notes',
    'sent_at',
  ];

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const f of allowed) {
    if (body[f] !== undefined) {
      params.push(f === 'addons' ? JSON.stringify(body[f]) : body[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }

  if (body.status === 'sent' && !body.sent_at) {
    updates.push(`sent_at = NOW()`);
  }

  updates.push(`updated_at = NOW()`);

  params.push(estimateId);
  const updatedEst = await query<any>(`UPDATE estimates SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);

  // If estimate was sent, advance linked lead directly to Stage 4 (Closing)
  if (body.status === 'sent' && updatedEst.length > 0) {
    const est = updatedEst[0];
    if (est.lead_id) {
      await query(
        `UPDATE leads
         SET 
           pipeline_stage = 'stage_4_closing',
           stage_entered_at = CASE WHEN pipeline_stage != 'stage_4_closing' THEN NOW() ELSE stage_entered_at END,
           proposal_sent_at = NOW(),
           status = 'proposal',
           estimated_value = GREATEST(COALESCE(estimated_value, 0), $1),
           updated_at = NOW()
         WHERE id = $2`,
        [Number(est.total) || 0, est.lead_id]
      );

      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'proposal_sent', 'Proposal Sent to Homeowner', $2, $3)`,
        [
          est.lead_id,
          `${auth.user.name} sent official estimate ${est.estimate_number} ($${Number(est.total).toLocaleString()}) to customer. Card advanced to Stage 4 (Closing).`,
          auth.user.name,
        ]
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('estimates:create');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const estimateId = parseInt(id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
  }

  await query(`DELETE FROM estimates WHERE id = $1`, [estimateId]);
  return NextResponse.json({ ok: true });
}

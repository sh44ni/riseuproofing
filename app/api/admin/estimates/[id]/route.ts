import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(
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

  const rows = await query<any>(`SELECT * FROM estimates WHERE id = $1`, [estimateId]);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  return NextResponse.json({ estimate: rows[0] });
}

export async function PATCH(
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
  await query(`UPDATE estimates SET ${updates.join(', ')} WHERE id = $${params.length}`, params);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  await query(`DELETE FROM estimates WHERE id = $1`, [estimateId]);
  return NextResponse.json({ ok: true });
}

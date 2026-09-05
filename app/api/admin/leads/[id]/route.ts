import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { calculateLeadScore } from '@/lib/crm-scoring';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:view');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  const rows = await query<any>(`SELECT * FROM leads WHERE id = $1`, [leadId]);
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = rows[0];

  // Auto-calculate score if not persisted
  if (!lead.lead_score || lead.lead_score === 0) {
    const scored = calculateLeadScore({
      serviceType: lead.service_type,
      phone: lead.phone,
      email: lead.email,
      roofSqf: lead.roof_sqf,
      address: lead.address,
      zip: lead.zip,
      leadSource: lead.lead_source,
      formType: lead.form_type,
    });
    lead.lead_score = scored.score;
    lead.priority = scored.priority;
    lead.score_factors = scored.factors;
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:edit');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  const body = await req.json();
  const allowedFields = [
    'full_name',
    'phone',
    'email',
    'address',
    'zip',
    'service_type',
    'notes',
    'status',
    'assigned_to',
    'lead_source',
    'property_type',
    'roof_type',
    'roof_sqf',
    'roof_age',
    'stories',
    'hoa',
    'priority',
    'lost_reason',
    'follow_up_at',
  ];

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      params.push(body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: true });
  }

  params.push(leadId);
  const sql = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${params.length}`;
  await query(sql, params);

  // If status changed, log activity entry
  if (body.status) {
    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, 'status_change', $2, $3, $4)`,
      [
        leadId,
        `Status changed to ${body.status}`,
        body.lost_reason ? `Reason: ${body.lost_reason}` : `Pipeline status updated to ${body.status}`,
        body.performed_by || 'Admin',
      ]
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:delete');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  await query(`DELETE FROM activities WHERE entity_type = 'lead' AND entity_id = $1`, [leadId]);
  await query(`DELETE FROM tasks WHERE entity_type = 'lead' AND entity_id = $1`, [leadId]);
  await query(`DELETE FROM leads WHERE id = $1`, [leadId]);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

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

  const rows = await query(
    `SELECT * FROM activities 
     WHERE entity_type = 'lead' AND entity_id = $1 
     ORDER BY created_at DESC`,
    [leadId]
  );

  return NextResponse.json({ activities: rows });
}

export async function POST(
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
  const {
    activityType = 'note',
    title,
    description,
    performedBy = 'Staff',
    callDuration,
    metadata,
  } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const res = await query(
    `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, call_duration, metadata)
     VALUES ('lead', $1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      leadId,
      activityType,
      title,
      description ?? null,
      performedBy,
      callDuration ?? null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  // Update last_contact_at on lead if it was an active interaction
  if (['call', 'text', 'email', 'visit'].includes(activityType)) {
    await query(`UPDATE leads SET last_contact_at = NOW() WHERE id = $1`, [leadId]);
  }

  return NextResponse.json({ ok: true, activity: res[0] });
}

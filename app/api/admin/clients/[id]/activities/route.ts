import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('clients:edit');
  if (auth.response) return auth.response;

  const resolved = await params;
  const clientId = parseInt(resolved.id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      activityType = 'note',
      title,
      description,
      callDuration,
      metadata,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Activity title is required' }, { status: 400 });
    }

    const rows = await query<any>(
      `INSERT INTO activities (
        entity_type, entity_id, client_id, activity_type, title, description,
        performed_by, user_id, user_name, call_duration, metadata
      ) VALUES (
        'client', $1, $1, $2, $3, $4,
        $5, $6, $7, $8, $9
      ) RETURNING *`,
      [
        clientId,
        activityType,
        title,
        description ?? null,
        auth.user.name,
        auth.user.id,
        auth.user.name,
        callDuration ? parseInt(callDuration, 10) : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    // Update client updated_at
    await query('UPDATE clients SET updated_at = NOW() WHERE id = $1', [clientId]);

    return NextResponse.json({ ok: true, activity: rows[0] });
  } catch (err) {
    console.error('[api/admin/clients/[id]/activities POST]', err);
    return NextResponse.json({ error: 'Server error logging activity' }, { status: 500 });
  }
}

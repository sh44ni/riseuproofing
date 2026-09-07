import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const resolvedParams = await params;
  const leadId = parseInt(resolvedParams.id, 10);

  if (isNaN(leadId)) {
    return NextResponse.json({ ok: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const targetUserId = body.assigned_to_user_id !== undefined && body.assigned_to_user_id !== null && body.assigned_to_user_id !== ''
      ? parseInt(body.assigned_to_user_id, 10)
      : null;
    const notes = body.notes || '';

    // Check if lead exists
    const existing = await query<{ id: number; full_name: string }>(
      'SELECT id, full_name FROM leads WHERE id = $1',
      [leadId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    let targetUser: { id: number; name: string; role: string; avatar_url: string | null } | null = null;
    if (targetUserId) {
      const users = await query<{ id: number; name: string; role: string; avatar_url: string | null }>(
        'SELECT id, name, role, avatar_url FROM users WHERE id = $1 AND status = \'active\'',
        [targetUserId]
      );
      if (users.length === 0) {
        return NextResponse.json({ ok: false, error: 'Target staff member not found or inactive' }, { status: 400 });
      }
      targetUser = users[0];
    }

    // Update lead assignment
    const updated = await query<{
      id: number;
      assigned_to_user_id: number | null;
      assigned_at: string | null;
      assigned_by_user_id: number | null;
    }>(
      `UPDATE leads
       SET 
         assigned_to_user_id = $1,
         assigned_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE NULL END,
         assigned_by_user_id = $2,
         updated_at = NOW()
       WHERE id = $3
       RETURNING id, assigned_to_user_id, assigned_at, assigned_by_user_id`,
      [targetUserId, auth.user.id, leadId]
    );

    const desc = targetUser
      ? `${auth.user.name} assigned lead to ${targetUser.name}${notes ? ` — Note: ${notes}` : ''}`
      : `${auth.user.name} moved lead to Unassigned Pool${notes ? ` — Note: ${notes}` : ''}`;

    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'lead',
        leadId,
        'assign',
        targetUser ? 'Lead Assigned' : 'Lead Unassigned',
        desc,
        auth.user.name,
      ]
    );

    return NextResponse.json({
      ok: true,
      lead: updated[0],
      assigned_to: targetUser,
    });
  } catch (err) {
    console.error('Error assigning lead:', err);
    return NextResponse.json({ ok: false, error: 'Database error assigning lead' }, { status: 500 });
  }
}

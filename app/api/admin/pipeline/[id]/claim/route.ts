import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(
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
    // Check if lead exists
    const existing = await query<{ id: number; full_name: string; assigned_to_user_id: number | null }>(
      'SELECT id, full_name, assigned_to_user_id FROM leads WHERE id = $1',
      [leadId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    // Update assignment to current authenticated user
    const updated = await query<{
      id: number;
      assigned_to_user_id: number;
      assigned_at: string;
      assigned_by_user_id: number;
    }>(
      `UPDATE leads
       SET 
         assigned_to_user_id = $1,
         assigned_at = NOW(),
         assigned_by_user_id = $1,
         updated_at = NOW()
       WHERE id = $2
       RETURNING id, assigned_to_user_id, assigned_at, assigned_by_user_id`,
      [auth.user.id, leadId]
    );

    // Record activity audit
    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'lead',
        leadId,
        'claim',
        'Lead Claimed',
        `${auth.user.name} claimed assignment of this lead`,
        auth.user.name,
      ]
    );

    return NextResponse.json({
      ok: true,
      lead: updated[0],
      assigned_to: {
        id: auth.user.id,
        name: auth.user.name,
        role: auth.user.role,
        avatar_url: auth.user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Error claiming lead:', err);
    return NextResponse.json({ ok: false, error: 'Database error claiming lead' }, { status: 500 });
  }
}

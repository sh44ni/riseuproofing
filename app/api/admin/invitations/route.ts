import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { hasPermission } from '@/lib/permissions';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'users.invite')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const invitations = await query<any>(`
      SELECT 
        i.id,
        i.email,
        i.invited_role_ids,
        i.status,
        i.expires_at,
        i.created_at,
        i.accepted_at,
        u.name as invited_by_name
      FROM invitations i
      LEFT JOIN users u ON i.invited_by = u.id
      ORDER BY i.created_at DESC
      LIMIT 50
    `);

    // Fetch role names for mapping
    const roles = await query<any>(`SELECT id, name FROM roles`);
    const roleMap: Record<number, string> = {};
    roles.forEach((r) => {
      roleMap[r.id] = r.name;
    });

    const enriched = invitations.map((inv) => ({
      ...inv,
      invited_roles: (inv.invited_role_ids || []).map((rid: number) => ({
        id: rid,
        name: roleMap[rid] || `Role #${rid}`,
      })),
    }));

    return NextResponse.json({ ok: true, invitations: enriched });
  } catch (err) {
    console.error('[api/admin/invitations GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'users.invite')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, roleIds } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 });
    }

    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'At least one role must be selected' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify roles exist
    const rolesRes = await query<any>(`SELECT id, name FROM roles WHERE id = ANY($1)`, [roleIds]);
    if (rolesRes.length === 0) {
      return NextResponse.json({ ok: false, error: 'Selected roles not found' }, { status: 400 });
    }

    // Generate secure token & 7-day expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const inserted = await query<any>(
      `INSERT INTO invitations (email, invited_role_ids, invited_by, token, status, expires_at)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, email, invited_role_ids, token, status, expires_at, created_at`,
      [cleanEmail, roleIds, auth.user.id, token, expiresAt]
    );

    const inviteUrl = `/admin/invite/${token}`;

    return NextResponse.json({
      ok: true,
      invitation: inserted[0],
      inviteUrl,
      roles: rolesRes.map((r) => r.name),
    });
  } catch (err) {
    console.error('[api/admin/invitations POST]', err);
    return NextResponse.json({ ok: false, error: 'Database error creating invitation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'users.invite')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Invitation ID is required' }, { status: 400 });
    }

    await query(`DELETE FROM invitations WHERE id = $1 AND status = 'pending'`, [parseInt(id, 10)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invitations DELETE]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

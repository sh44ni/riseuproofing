import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createSession, COOKIE_NAME, SESSION_HOURS } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
  }

  try {
    const rows = await query<any>(
      `SELECT id, email, invited_role_ids, status, expires_at, created_at
       FROM invitations
       WHERE token = $1`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invitation not found or invalid' }, { status: 404 });
    }

    const invitation = rows[0];

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `This invitation has already been ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await query(`UPDATE invitations SET status = 'expired' WHERE id = $1`, [invitation.id]);
      return NextResponse.json({ ok: false, error: 'This invitation has expired.' }, { status: 400 });
    }

    // Lookup role names
    const roleIds = invitation.invited_role_ids || [];
    const roles = await query<any>(`SELECT id, name, description FROM roles WHERE id = ANY($1)`, [roleIds]);

    return NextResponse.json({
      ok: true,
      invitation: {
        email: invitation.email,
        expires_at: invitation.expires_at,
        roles,
      },
    });
  } catch (err) {
    console.error('[api/admin/invitations/[token] GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
  }

  try {
    const invRows = await query<any>(
      `SELECT id, email, invited_role_ids, status, expires_at, invited_by
       FROM invitations
       WHERE token = $1`,
      [token]
    );

    if (invRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid invitation' }, { status: 404 });
    }

    const invitation = invRows[0];

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `This invitation has already been ${invitation.status}.` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await query(`UPDATE invitations SET status = 'expired' WHERE id = $1`, [invitation.id]);
      return NextResponse.json({ ok: false, error: 'This invitation has expired.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, password, phone } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { hash, salt } = hashPassword(password);
    const email = invitation.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query<any>(`SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)`, [email]);

    let userId: number;

    if (existing.length > 0) {
      userId = existing[0].id;
      // Update existing user credentials and activate
      await query(
        `UPDATE users
         SET name = $1, password_hash = $2, salt = $3, phone = COALESCE($4, phone), status = 'active', updated_at = NOW()
         WHERE id = $5`,
        [name.trim(), hash, salt, phone?.trim() || null, userId]
      );
    } else {
      // Find primary role name for legacy column compatibility
      let primaryRole = 'sales_rep';
      if (invitation.invited_role_ids?.length > 0) {
        const rName = await query<any>(`SELECT name FROM roles WHERE id = $1`, [invitation.invited_role_ids[0]]);
        if (rName.length > 0) {
          primaryRole = rName[0].name.toLowerCase().replace(/\s+/g, '_');
        }
      }

      const inserted = await query<any>(
        `INSERT INTO users (name, email, phone, role, password_hash, salt, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         RETURNING id`,
        [name.trim(), email, phone?.trim() || null, primaryRole, hash, salt]
      );
      userId = inserted[0].id;
    }

    // Assign roles in user_roles
    const roleIds = invitation.invited_role_ids || [];
    for (const rid of roleIds) {
      await query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId, rid, invitation.invited_by || null]
      );
    }

    // Mark invitation accepted
    await query(
      `UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invitation.id]
    );

    // Create active session
    const sessionToken = await createSession(userId);

    const response = NextResponse.json({
      ok: true,
      message: 'Account created and activated successfully',
      redirectUrl: '/admin/dashboard',
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_HOURS * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('[api/admin/invitations/[token] POST]', err);
    return NextResponse.json({ ok: false, error: 'Database error accepting invitation' }, { status: 500 });
  }
}

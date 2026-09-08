import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, invalidateSessionCache } from '@/lib/admin-auth';
import { hasPermission } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser, 'users.view')) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Missing required permission [users.view]' },
      { status: 403 }
    );
  }

  try {
    const users = await query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone,
         u.role,
         u.status,
         u.avatar_url,
         u.last_login_at,
         u.created_at,
         u.updated_at,
         COALESCE(
           json_agg(
             json_build_object('id', r.id, 'name', r.name, 'is_protected', r.is_protected)
           ) FILTER (WHERE r.id IS NOT NULL),
           '[]'::json
         ) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id
       ORDER BY u.id ASC`
    );

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error('[api/admin/users GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser, 'users.assign_roles')) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Missing required permission [users.assign_roles]' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, phone, roleIds, role, password, avatar_url } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'A user with this email address already exists.' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);

    // Resolve primary role name
    let primaryRole = role || 'staff';
    let targetRoleIds: number[] = Array.isArray(roleIds) ? roleIds : [];

    if (targetRoleIds.length > 0) {
      const rRow = await query<any>(`SELECT name FROM roles WHERE id = $1`, [targetRoleIds[0]]);
      if (rRow.length > 0) {
        primaryRole = rRow[0].name.toLowerCase().replace(/\s+/g, '_');
      }
    } else if (role) {
      const rRow = await query<any>(`SELECT id FROM roles WHERE LOWER(name) = LOWER($1)`, [role.replace(/_/g, ' ')]);
      if (rRow.length > 0) {
        targetRoleIds.push(rRow[0].id);
      }
    }

    const inserted = await query<any>(
      `INSERT INTO users (name, email, phone, role, password_hash, salt, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, name, email, phone, role, status, avatar_url, created_at`,
      [name.trim(), cleanEmail, phone?.trim() || null, primaryRole, hash, salt, avatar_url?.trim() || null]
    );

    const newUser = inserted[0];

    // Assign roles in user_roles
    for (const rid of targetRoleIds) {
      await query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [newUser.id, rid, currentUser.id]
      );
    }

    invalidateSessionCache();

    return NextResponse.json({ ok: true, user: newUser });
  } catch (err) {
    console.error('[api/admin/users POST]', err);
    return NextResponse.json({ ok: false, error: 'Database error creating user' }, { status: 500 });
  }
}

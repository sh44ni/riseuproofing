import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/admin-auth';
import { UserRole, DEFAULT_ROLE_PERMISSIONS } from '@/lib/rbac';
import { query } from '@/lib/db';

const VALID_ROLES: UserRole[] = [
  'owner',
  'project_manager',
  'sales_rep',
  'field_foreman',
  'office_admin',
];

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Owner gets full management view; other authenticated staff get safe team directory
    if (currentUser.role === 'owner') {
      const users = await query(
        `SELECT id, name, email, phone, role, status, avatar_url, permissions, last_login_at, created_at, updated_at
         FROM users
         ORDER BY id ASC`
      );
      return NextResponse.json({ ok: true, users });
    }

    const users = await query(
      `SELECT id, name, email, role, status, avatar_url
       FROM users
       WHERE status = 'active'
       ORDER BY name ASC`
    );
    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (currentUser.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Forbidden. Owner role required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, role, password, permissions, avatar_url } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ ok: false, error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ ok: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    // Check if email is already taken
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'A user with this email address already exists.' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);

    // Resolve permissions: use custom array if provided, otherwise default role preset
    const assignedPermissions =
      Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : DEFAULT_ROLE_PERMISSIONS[role as UserRole] || [];

    const inserted = await query<{ id: number; name: string; email: string; role: string; status: string; avatar_url?: string; permissions: string[] }>(
      `INSERT INTO users (name, email, phone, role, password_hash, salt, permissions, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING id, name, email, phone, role, status, avatar_url, permissions, created_at`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, role, hash, salt, assignedPermissions, avatar_url?.trim() || null]
    );

    const newUser = inserted[0];

    // Log to activity timeline
    try {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, user_id, user_name)
         VALUES ('user', $1, 'created', 'Team Member Added', $2, $3, $4)`,
        [
          newUser.id,
          `Owner ${currentUser.name} created user ${newUser.name} with role ${newUser.role}`,
          currentUser.id,
          currentUser.name,
        ]
      );
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({ ok: false, error: 'Failed to create user' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, invalidateSessionCache } from '@/lib/admin-auth';
import { hasPermission, PERMISSION_MAP } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'roles.view')) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Missing required permission [roles.view]' },
      { status: 403 }
    );
  }

  try {
    const rolesRows = await query<any>(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_protected,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT ur.user_id)::int as member_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name, r.description, r.is_protected, r.created_at, r.updated_at
      ORDER BY r.is_protected DESC, r.name ASC
    `);

    // Fetch permissions for all roles
    const permsRows = await query<any>(`
      SELECT 
        rp.role_id,
        p.key,
        p.resource,
        p.action,
        rp.scope
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
    `);

    const permsByRole: Record<number, Record<string, string>> = {};
    permsRows.forEach((p) => {
      if (!permsByRole[p.role_id]) {
        permsByRole[p.role_id] = {};
      }
      permsByRole[p.role_id][p.key] = p.scope;
    });

    const roles = rolesRows.map((r) => ({
      ...r,
      permissions: permsByRole[r.id] || {},
    }));

    return NextResponse.json({ ok: true, roles });
  } catch (err) {
    console.error('[api/admin/roles GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error fetching roles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'roles.create') || !hasPermission(auth.user, 'roles.assign_permissions')) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Missing role creation permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ ok: false, error: 'Role name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check uniqueness
    const existing = await query(`SELECT id FROM roles WHERE LOWER(name) = LOWER($1)`, [trimmedName]);
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'A role with this name already exists' }, { status: 409 });
    }

    // Insert role
    const inserted = await query<any>(
      `INSERT INTO roles (name, description, is_protected, created_by)
       VALUES ($1, $2, FALSE, $3)
       RETURNING id, name, description, is_protected, created_at, updated_at`,
      [trimmedName, description?.trim() || null, auth.user.id]
    );

    const newRole = inserted[0];

    // Insert role_permissions if provided
    if (permissions && typeof permissions === 'object') {
      for (const [key, scope] of Object.entries(permissions)) {
        if (!PERMISSION_MAP.has(key)) continue;
        const validScope = scope === 'own' || scope === 'assigned' || scope === 'all' ? scope : 'all';

        const pRow = await query<any>(`SELECT id FROM permissions WHERE key = $1`, [key]);
        if (pRow.length > 0) {
          await query(
            `INSERT INTO role_permissions (role_id, permission_id, scope)
             VALUES ($1, $2, $3)
             ON CONFLICT (role_id, permission_id) DO UPDATE SET scope = EXCLUDED.scope`,
            [newRole.id, pRow[0].id, validScope]
          );
        }
      }
    }

    invalidateSessionCache();

    return NextResponse.json({ ok: true, role: newRole });
  } catch (err) {
    console.error('[api/admin/roles POST]', err);
    return NextResponse.json({ ok: false, error: 'Database error creating role' }, { status: 500 });
  }
}

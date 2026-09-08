import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, invalidateSessionCache } from '@/lib/admin-auth';
import { hasPermission, PERMISSION_MAP, assertNotLockout } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'roles.view')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return NextResponse.json({ ok: false, error: 'Invalid role ID' }, { status: 400 });
  }

  try {
    const roles = await query<any>(
      `SELECT id, name, description, is_protected, created_at, updated_at FROM roles WHERE id = $1`,
      [roleId]
    );
    if (roles.length === 0) {
      return NextResponse.json({ ok: false, error: 'Role not found' }, { status: 404 });
    }

    const perms = await query<any>(
      `SELECT p.key, p.resource, p.action, rp.scope
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );

    const permissions: Record<string, string> = {};
    perms.forEach((p) => {
      permissions[p.key] = p.scope;
    });

    return NextResponse.json({
      ok: true,
      role: {
        ...roles[0],
        permissions,
      },
    });
  } catch (err) {
    console.error('[api/admin/roles/[id] GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'roles.edit') || !hasPermission(auth.user, 'roles.assign_permissions')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return NextResponse.json({ ok: false, error: 'Invalid role ID' }, { status: 400 });
  }

  try {
    const existing = await query<any>(`SELECT id, name, is_protected FROM roles WHERE id = $1`, [roleId]);
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'Role not found' }, { status: 404 });
    }

    const role = existing[0];
    const body = await req.json();
    const { name, description, permissions } = body;

    // Safety: Protected role cannot have permissions emptied down to empty
    if (role.is_protected && permissions && Object.keys(permissions).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Cannot clear permissions of the protected Owner role' },
        { status: 400 }
      );
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json({ ok: false, error: 'Role name cannot be empty' }, { status: 400 });
      }
      // Check duplicate name
      const dup = await query(`SELECT id FROM roles WHERE LOWER(name) = LOWER($1) AND id != $2`, [trimmed, roleId]);
      if (dup.length > 0) {
        return NextResponse.json({ ok: false, error: 'A role with this name already exists' }, { status: 409 });
      }
      await query(`UPDATE roles SET name = $1, updated_at = NOW() WHERE id = $2`, [trimmed, roleId]);
    }

    if (description !== undefined) {
      await query(`UPDATE roles SET description = $1, updated_at = NOW() WHERE id = $2`, [
        description ? String(description).trim() : null,
        roleId,
      ]);
    }

    if (permissions !== undefined && typeof permissions === 'object') {
      // Re-sync permissions
      await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

      for (const [key, scope] of Object.entries(permissions)) {
        if (!PERMISSION_MAP.has(key)) continue;
        const validScope = scope === 'own' || scope === 'assigned' || scope === 'all' ? scope : 'all';

        const pRow = await query<any>(`SELECT id FROM permissions WHERE key = $1`, [key]);
        if (pRow.length > 0) {
          await query(
            `INSERT INTO role_permissions (role_id, permission_id, scope)
             VALUES ($1, $2, $3)
             ON CONFLICT (role_id, permission_id) DO UPDATE SET scope = EXCLUDED.scope`,
            [roleId, pRow[0].id, validScope]
          );
        }
      }

      // Lockout Safeguard verification
      try {
        await assertNotLockout();
      } catch (lockoutErr: any) {
        // Rollback: Re-assign full owner permissions if this was the protected role
        if (role.is_protected) {
          const allP = await query<any>(`SELECT id FROM permissions`);
          for (const p of allP) {
            await query(
              `INSERT INTO role_permissions (role_id, permission_id, scope)
               VALUES ($1, $2, 'all')
               ON CONFLICT (role_id, permission_id) DO NOTHING`,
              [roleId, p.id]
            );
          }
        }
        return NextResponse.json({ ok: false, error: lockoutErr.message }, { status: 400 });
      }
    }

    invalidateSessionCache();

    return NextResponse.json({ ok: true, message: 'Role updated successfully' });
  } catch (err) {
    console.error('[api/admin/roles/[id] PATCH]', err);
    return NextResponse.json({ ok: false, error: 'Database error updating role' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  if (!hasPermission(auth.user, 'roles.delete')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return NextResponse.json({ ok: false, error: 'Invalid role ID' }, { status: 400 });
  }

  try {
    const existing = await query<any>(`SELECT id, name, is_protected FROM roles WHERE id = $1`, [roleId]);
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'Role not found' }, { status: 404 });
    }

    if (existing[0].is_protected) {
      return NextResponse.json(
        { ok: false, error: 'The system-protected Owner role cannot be deleted' },
        { status: 400 }
      );
    }

    // Check if any users are assigned to this role
    const assignedUsers = await query<any>(
      `SELECT u.id, u.name, u.email FROM user_roles ur JOIN users u ON ur.user_id = u.id WHERE ur.role_id = $1`,
      [roleId]
    );
    if (assignedUsers.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot delete role: ${assignedUsers.length} user(s) currently hold this role. Please reassign them to another role first.`,
        },
        { status: 400 }
      );
    }

    // Check lockout guard
    await assertNotLockout({ removingRoleId: roleId });

    await query(`DELETE FROM roles WHERE id = $1`, [roleId]);

    invalidateSessionCache();

    return NextResponse.json({ ok: true, message: 'Role deleted successfully' });
  } catch (err: any) {
    console.error('[api/admin/roles/[id] DELETE]', err);
    return NextResponse.json({ ok: false, error: err.message || 'Database error' }, { status: 500 });
  }
}

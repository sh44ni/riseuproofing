import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, invalidateSessionCache } from '@/lib/admin-auth';
import { hasPermission, assertNotLockout } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const targetUserId = parseInt(id, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, phone, roleIds, role, status, password, avatar_url } = body;

    // Check target user
    const existing = await query<any>(
      `SELECT u.id, u.role, u.email, u.status FROM users u WHERE u.id = $1`,
      [targetUserId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const targetUser = existing[0];

    // Permission enforcement
    if (roleIds !== undefined || role !== undefined) {
      if (!hasPermission(currentUser, 'users.assign_roles')) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Missing permission [users.assign_roles]' },
          { status: 403 }
        );
      }
    }

    if (status !== undefined && status !== targetUser.status) {
      if (!hasPermission(currentUser, 'users.deactivate')) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Missing permission [users.deactivate]' },
          { status: 403 }
        );
      }

      // Lockout check if deactivating user
      if (status === 'deactivated' || status === 'inactive' || status === 'suspended') {
        try {
          await assertNotLockout({ deactivatingUserId: targetUserId });
        } catch (lockoutErr: any) {
          return NextResponse.json({ ok: false, error: lockoutErr.message }, { status: 400 });
        }
      }
    }

    // Lockout check if changing roles
    if (roleIds !== undefined && Array.isArray(roleIds)) {
      try {
        await assertNotLockout({ fromUserId: targetUserId });
      } catch (lockoutErr: any) {
        return NextResponse.json({ ok: false, error: lockoutErr.message }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone?.trim() || null);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatar_url ? avatar_url.trim() : null);
    }
    if (status !== undefined) {
      const normalizedStatus = status === 'inactive' || status === 'suspended' ? 'deactivated' : status;
      updates.push(`status = $${idx++}`);
      values.push(normalizedStatus);
    }
    if (password) {
      const { hash, salt } = hashPassword(password);
      updates.push(`password_hash = $${idx++}`);
      values.push(hash);
      updates.push(`salt = $${idx++}`);
      values.push(salt);
    }

    // Role assignment
    if (roleIds !== undefined && Array.isArray(roleIds)) {
      await query(`DELETE FROM user_roles WHERE user_id = $1`, [targetUserId]);

      for (const rid of roleIds) {
        await query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, role_id) DO NOTHING`,
          [targetUserId, rid, currentUser.id]
        );
      }

      // Update primary role column
      if (roleIds.length > 0) {
        const rRow = await query<any>(`SELECT name FROM roles WHERE id = $1`, [roleIds[0]]);
        if (rRow.length > 0) {
          updates.push(`role = $${idx++}`);
          values.push(rRow[0].name.toLowerCase().replace(/\s+/g, '_'));
        }
      }
    } else if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(targetUserId);

      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // Invalidate sessions immediately on deactivation or role re-assignment
    if (status === 'deactivated' || roleIds !== undefined || role !== undefined) {
      if (status === 'deactivated') {
        await query('DELETE FROM admin_sessions WHERE user_id = $1', [targetUserId]);
      }
      invalidateSessionCache();
    }

    return NextResponse.json({ ok: true, message: 'User updated successfully' });
  } catch (err: any) {
    console.error('[api/admin/users/[id] PATCH]', err);
    return NextResponse.json({ ok: false, error: err.message || 'Database error' }, { status: 500 });
  }
}

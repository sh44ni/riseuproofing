import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, UserRole } from '@/lib/admin-auth';
import { query } from '@/lib/db';

const VALID_ROLES: UserRole[] = [
  'owner',
  'project_manager',
  'sales_rep',
  'field_foreman',
  'office_admin',
];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (currentUser.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Forbidden. Owner role required.' }, { status: 403 });
  }

  const { id } = await context.params;
  const targetUserId = parseInt(id, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, phone, role, status, password, permissions, avatar_url } = body;

    // Check if target user exists
    const existing = await query<{ id: number; role: string; email: string }>(
      'SELECT id, role, email FROM users WHERE id = $1',
      [targetUserId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // Safety guard: Don't allow deactivating or changing role of the last active owner
    if (
      existing[0].role === 'owner' &&
      (role !== 'owner' || status === 'inactive' || status === 'suspended')
    ) {
      const activeOwners = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'owner' AND status = 'active'"
      );
      if (parseInt(activeOwners[0]?.count || '1', 10) <= 1) {
        return NextResponse.json(
          { ok: false, error: 'Cannot demote or deactivate the only active Owner account.' },
          { status: 400 }
        );
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
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role as UserRole)) {
        return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
      }
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
      }
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (permissions !== undefined && Array.isArray(permissions)) {
      updates.push(`permissions = $${idx++}`);
      values.push(permissions);
    }
    if (password) {
      const { hash, salt } = hashPassword(password);
      updates.push(`password_hash = $${idx++}`);
      values.push(hash);
      updates.push(`salt = $${idx++}`);
      values.push(salt);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(targetUserId);

    const updated = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, status, avatar_url, permissions, updated_at`,
      values
    );

    // If deactivated, role changed, or permissions updated, invalidate sessions so changes take immediate effect
    if (status === 'inactive' || status === 'suspended' || role !== undefined || permissions !== undefined) {
      await query('DELETE FROM admin_sessions WHERE user_id = $1', [targetUserId]);
    }

    return NextResponse.json({ ok: true, user: updated[0] });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ ok: false, error: 'Database update failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (currentUser.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Forbidden. Owner role required.' }, { status: 403 });
  }

  const { id } = await context.params;
  const targetUserId = parseInt(id, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
  }

  if (targetUserId === currentUser.id) {
    return NextResponse.json({ ok: false, error: 'You cannot delete your own account.' }, { status: 400 });
  }

  try {
    // Soft-deactivate user & terminate sessions
    await query("UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = $1", [targetUserId]);
    await query('DELETE FROM admin_sessions WHERE user_id = $1', [targetUserId]);

    return NextResponse.json({ ok: true, message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ ok: false, error: 'Failed to deactivate user' }, { status: 500 });
  }
}

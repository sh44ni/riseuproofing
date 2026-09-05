import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, avatar_url } = body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ ok: false, error: 'Name cannot be empty' }, { status: 400 });
      }
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

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: 'No profile fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(currentUser.id);

    const updated = await query<{
      id: number;
      name: string;
      email: string;
      phone: string;
      role: string;
      status: string;
      avatar_url: string;
      permissions: string[];
    }>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, status, avatar_url, permissions`,
      values
    );

    return NextResponse.json({ ok: true, user: updated[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

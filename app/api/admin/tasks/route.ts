import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:view', 'jobs:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead_id');
  const personId = searchParams.get('person_id');
  const eventType = searchParams.get('event_type');

  let sql = `
    SELECT 
      t.*,
      l.full_name as lead_name,
      l.phone as lead_phone,
      l.service_type as lead_service,
      u.name as assigned_user_name,
      u.role as assigned_user_role,
      u.avatar_url as assigned_user_avatar
    FROM tasks t
    LEFT JOIN leads l ON t.entity_type = 'lead' AND t.entity_id = l.id
    LEFT JOIN users u ON t.assigned_to_user_id = u.id
  `;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (leadId) {
    params.push(parseInt(leadId, 10));
    conditions.push(`t.entity_type = 'lead' AND t.entity_id = $${params.length}`);
  }

  if (personId && personId !== 'all') {
    params.push(parseInt(personId, 10));
    conditions.push(`t.assigned_to_user_id = $${params.length}`);
  }

  if (eventType && eventType !== 'all') {
    params.push(eventType);
    conditions.push(`t.event_type = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY t.due_at ASC, t.created_at DESC`;

  const rows = await query<any>(sql, params);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdue: any[] = [];
  const today: any[] = [];
  const upcoming: any[] = [];
  const completed: any[] = [];

  for (const t of rows) {
    if (t.completed_at) {
      completed.push(t);
      continue;
    }

    const due = new Date(t.due_at);
    if (due < todayStart) {
      overdue.push(t);
    } else if (due <= todayEnd) {
      today.push(t);
    } else {
      upcoming.push(t);
    }
  }

  return NextResponse.json({
    tasks: rows,
    grouped: {
      overdue,
      today,
      upcoming,
      completed,
    },
    counts: {
      total: rows.length,
      overdue: overdue.length,
      today: today.length,
      upcoming: upcoming.length,
      completed: completed.length,
    }
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:edit', 'jobs:change_stage']);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      title,
      description,
      entityType = 'lead',
      entityId,
      assignedTo,
      assignedToUserId,
      dueAt,
      endAt,
      priority = 'normal',
      eventType = 'task',
    } = body;

    if (!title || !dueAt) {
      return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 });
    }

    let resolvedAssignedName = assignedTo || 'Staff';
    let resolvedUserId: number | null = assignedToUserId ? parseInt(String(assignedToUserId), 10) : null;

    if (resolvedUserId) {
      const uRows = await query<any>('SELECT name FROM users WHERE id = $1', [resolvedUserId]);
      if (uRows.length > 0) {
        resolvedAssignedName = uRows[0].name;
      }
    }

    const rows = await query<any>(
      `INSERT INTO tasks (
         title, description, entity_type, entity_id, assigned_to, assigned_to_user_id,
         due_at, end_at, priority, event_type, created_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title,
        description ?? null,
        entityId ? entityType : null,
        entityId ? parseInt(entityId, 10) : null,
        resolvedAssignedName,
        resolvedUserId,
        dueAt,
        endAt || null,
        priority,
        eventType,
        auth.user.id,
      ]
    );

    // If linked to lead, log in activity
    if (entityId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'note', $2, $3, $4)`,
        [
          parseInt(entityId, 10),
          `Task scheduled: ${title}`,
          `Due: ${new Date(dueAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
          resolvedAssignedName,
        ]
      );
    }

    return NextResponse.json({ ok: true, task: rows[0] });
  } catch (err) {
    console.error('[api/admin/tasks POST]', err);
    return NextResponse.json({ error: 'Server error creating task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:edit', 'jobs:change_stage']);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      id,
      completed,
      title,
      description,
      dueAt,
      endAt,
      priority,
      eventType,
      assignedTo,
      assignedToUserId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (completed !== undefined) {
      const completedAt = completed ? new Date().toISOString() : null;
      await query(`UPDATE tasks SET completed_at = $1 WHERE id = $2`, [completedAt, id]);
      return NextResponse.json({ ok: true });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (title !== undefined) { params.push(title); updates.push(`title = $${params.length}`); }
    if (description !== undefined) { params.push(description); updates.push(`description = $${params.length}`); }
    if (dueAt !== undefined) { params.push(dueAt); updates.push(`due_at = $${params.length}`); }
    if (endAt !== undefined) { params.push(endAt); updates.push(`end_at = $${params.length}`); }
    if (priority !== undefined) { params.push(priority); updates.push(`priority = $${params.length}`); }
    if (eventType !== undefined) { params.push(eventType); updates.push(`event_type = $${params.length}`); }

    if (assignedToUserId !== undefined) {
      const uid = assignedToUserId ? parseInt(String(assignedToUserId), 10) : null;
      params.push(uid);
      updates.push(`assigned_to_user_id = $${params.length}`);

      if (uid) {
        const uRows = await query<any>('SELECT name FROM users WHERE id = $1', [uid]);
        if (uRows.length > 0) {
          params.push(uRows[0].name);
          updates.push(`assigned_to = $${params.length}`);
        }
      } else if (assignedTo !== undefined) {
        params.push(assignedTo);
        updates.push(`assigned_to = $${params.length}`);
      }
    } else if (assignedTo !== undefined) {
      params.push(assignedTo);
      updates.push(`assigned_to = $${params.length}`);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/tasks PATCH]', err);
    return NextResponse.json({ error: 'Server error updating task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:delete', 'jobs:delete']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM tasks WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}

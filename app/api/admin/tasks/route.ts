import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission, hasAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:view', 'jobs:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead_id');
  const personId = searchParams.get('person_id');
  const eventType = searchParams.get('event_type');
  const workCategory = searchParams.get('work_category');
  const scope = searchParams.get('scope') || searchParams.get('tab') || 'team';
  const currentUserId = auth.user.id;

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

  // Scoping: personal notes vs team operations
  if (scope === 'personal') {
    params.push(currentUserId);
    conditions.push(`t.event_type = 'todo' AND (t.assigned_to_user_id = $${params.length} OR t.created_by_user_id = $${params.length})`);
  } else if (scope === 'team') {
    conditions.push(`(t.event_type != 'todo' OR t.entity_type IS NOT NULL)`);
  }
  // scope === 'all' applies no scope filter

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

  if (workCategory && workCategory !== 'all') {
    params.push(workCategory);
    conditions.push(`t.work_category = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY 
    (t.completed_at IS NOT NULL) ASC,
    CASE t.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'normal' THEN 3 
      WHEN 'low' THEN 4 
      ELSE 5 
    END ASC,
    t.due_at ASC NULLS LAST, 
    t.created_at DESC`;

  const [rows, countStats] = await Promise.all([
    query<any>(sql, params),
    query<any>(`
      SELECT
        COUNT(CASE WHEN (event_type != 'todo' OR entity_type IS NOT NULL) AND completed_at IS NULL THEN 1 END)::int as team_count,
        COUNT(CASE WHEN event_type = 'todo' AND (assigned_to_user_id = $1 OR created_by_user_id = $1) AND completed_at IS NULL THEN 1 END)::int as personal_count
      FROM tasks
    `, [currentUserId]),
  ]);

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

    if (!t.due_at) {
      today.push(t);
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

  const tabCounts = countStats[0] || { team_count: 0, personal_count: 0 };

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
    },
    teamCount: tabCounts.team_count,
    personalCount: tabCounts.personal_count,
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
      eventType = 'todo',
      workCategory = 'Rise Up',
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let resolvedAssignedName: string | null = null;
    let resolvedUserId: number | null = null;

    if (eventType === 'todo') {
      // Personal sticky note / to-do for current user
      resolvedUserId = auth.user.id ? parseInt(String(auth.user.id), 10) : null;
      resolvedAssignedName = auth.user?.name ?? 'Staff';
    } else {
      // Operational task
      if (assignedToUserId) {
        resolvedUserId = parseInt(String(assignedToUserId), 10);
        const uRows = await query<any>('SELECT name FROM users WHERE id = $1', [resolvedUserId]);
        resolvedAssignedName = uRows[0]?.name ?? (assignedTo || 'Staff');
      } else if (assignedTo && !String(assignedTo).toLowerCase().includes('unassigned')) {
        resolvedAssignedName = String(assignedTo).trim();
      } else {
        // True unassigned!
        resolvedUserId = null;
        resolvedAssignedName = null;
      }
    }

    let resolvedClientId: number | null = null;
    if (entityId) {
      if (entityType === 'lead') {
        const l = await query<any>('SELECT client_id FROM leads WHERE id = $1', [parseInt(entityId, 10)]);
        if (l[0]?.client_id) resolvedClientId = Number(l[0].client_id);
      } else if (entityType === 'job') {
        const j = await query<any>('SELECT client_id FROM jobs WHERE id = $1', [parseInt(entityId, 10)]);
        if (j[0]?.client_id) resolvedClientId = Number(j[0].client_id);
      } else if (entityType === 'client') {
        resolvedClientId = parseInt(entityId, 10);
      }
    }

    const rows = await query<any>(
      `INSERT INTO tasks (
         title, description, entity_type, entity_id, client_id, assigned_to, assigned_to_user_id,
         due_at, end_at, priority, event_type, work_category, created_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        String(title).trim(),
        description ?? null,
        entityId ? entityType : null,
        entityId ? parseInt(entityId, 10) : null,
        resolvedClientId,
        resolvedAssignedName,
        resolvedUserId,
        dueAt || null,
        endAt || null,
        priority || 'normal',
        eventType || 'todo',
        workCategory || 'Rise Up',
        auth.user.id,
      ]
    );

    // If linked to lead/job/client, log in activity
    if (entityId) {
      const displayAssignee = resolvedAssignedName || 'Unassigned';
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ($1, $2, $3, 'note', $4, $5, $6)`,
        [
          entityType,
          parseInt(entityId, 10),
          resolvedClientId,
          `Task Created: ${String(title).trim()}`,
          dueAt
            ? `Due ${new Date(dueAt).toLocaleDateString()} — Assigned to ${displayAssignee}`
            : `Assigned to ${displayAssignee}`,
          auth.user.name,
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
      workCategory,
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
    if (workCategory !== undefined) { params.push(workCategory); updates.push(`work_category = $${params.length}`); }

    if (assignedToUserId !== undefined) {
      const uid = assignedToUserId ? parseInt(String(assignedToUserId), 10) : null;
      params.push(uid);
      updates.push(`assigned_to_user_id = $${params.length}`);

      if (uid) {
        const uRows = await query<any>('SELECT name FROM users WHERE id = $1', [uid]);
        params.push(uRows[0]?.name ?? (assignedTo || 'Staff'));
        updates.push(`assigned_to = $${params.length}`);
      } else {
        const cleanName = assignedTo && !String(assignedTo).toLowerCase().includes('unassigned')
          ? String(assignedTo).trim()
          : null;
        params.push(cleanName);
        updates.push(`assigned_to = $${params.length}`);
      }
    } else if (assignedTo !== undefined) {
      const cleanName = assignedTo && !String(assignedTo).toLowerCase().includes('unassigned')
        ? String(assignedTo).trim()
        : null;
      params.push(cleanName);
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
  const auth = await requireAnyPermission(['field:view_calendar', 'leads:delete', 'jobs:delete', 'leads:view']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  const taskId = parseInt(id, 10);
  const rows = await query<any>('SELECT assigned_to_user_id, created_by_user_id FROM tasks WHERE id = $1', [taskId]);
  if (rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const isOwnerOfTask = rows[0].assigned_to_user_id === auth.user.id || rows[0].created_by_user_id === auth.user.id;
  if (!isOwnerOfTask && !hasAnyPermission(auth.user, ['field:view_calendar', 'leads:delete', 'jobs:delete'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await query(`DELETE FROM tasks WHERE id = $1`, [taskId]);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { normalizePhone, recalculateClientStats, ensureClientsTable } from '@/lib/crm-clients';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('clients:view');
  if (auth.response) return auth.response;

  await ensureClientsTable();

  const resolved = await params;
  const clientId = parseInt(resolved.id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const clientRows = await query<any>(
    `SELECT c.*, u.name as assigned_to_name, u.email as assigned_to_email
     FROM clients c
     LEFT JOIN users u ON c.assigned_to_user_id = u.id
     WHERE c.id = $1`,
    [clientId]
  );

  if (!clientRows || clientRows.length === 0) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const client = clientRows[0];

  // Fetch all related entities in parallel
  const [
    leads,
    inspections,
    estimates,
    jobs,
    invoices,
    warranties,
    reviews,
    activities,
    tasks,
  ] = await Promise.all([
    // Leads
    query<any>(
      `SELECT * FROM leads 
       WHERE client_id = $1 
          OR (phone_normalized IS NOT NULL AND phone_normalized = $2)
       ORDER BY created_at DESC`,
      [clientId, client.phone_normalized || '__NONE__']
    ),

    // Roof Inspections
    query<any>(
      `SELECT ins.*, j.job_number 
       FROM inspections ins
       LEFT JOIN jobs j ON ins.job_id = j.id
       WHERE ins.client_id = $1 
          OR ins.lead_id IN (SELECT id FROM leads WHERE client_id = $1)
          OR ins.job_id IN (SELECT id FROM jobs WHERE client_id = $1)
       ORDER BY ins.inspection_date DESC, ins.created_at DESC`,
      [clientId]
    ),

    // Estimates
    query<any>(
      `SELECT e.*, l.status as lead_status
       FROM estimates e
       LEFT JOIN leads l ON e.lead_id = l.id
       WHERE e.client_id = $1 
          OR e.lead_id IN (SELECT id FROM leads WHERE client_id = $1)
       ORDER BY e.created_at DESC`,
      [clientId]
    ),

    // Jobs
    query<any>(
      `SELECT j.*, e.estimate_number, u1.name as pm_name, u2.name as foreman_name
       FROM jobs j
       LEFT JOIN estimates e ON j.estimate_id = e.id
       LEFT JOIN users u1 ON j.project_manager_id = u1.id
       LEFT JOIN users u2 ON j.foreman_id = u2.id
       WHERE j.client_id = $1 
          OR j.lead_id IN (SELECT id FROM leads WHERE client_id = $1)
       ORDER BY j.created_at DESC`,
      [clientId]
    ),

    // Invoices & Milestone Payments
    query<any>(
      `SELECT i.*, j.job_number, j.status as job_status
       FROM invoices i
       LEFT JOIN jobs j ON i.job_id = j.id
       WHERE i.client_id = $1 
          OR i.job_id IN (SELECT id FROM jobs WHERE client_id = $1)
          OR i.estimate_id IN (SELECT id FROM estimates WHERE client_id = $1)
       ORDER BY i.due_date ASC, i.created_at DESC`,
      [clientId]
    ),

    // Warranties
    query<any>(
      `SELECT w.*, j.job_number, j.service_type as job_service_type
       FROM warranties w
       LEFT JOIN jobs j ON w.job_id = j.id
       WHERE w.client_id = $1 
          OR w.job_id IN (SELECT id FROM jobs WHERE client_id = $1)
       ORDER BY w.created_at DESC`,
      [clientId]
    ),

    // Reviews
    query<any>(
      `SELECT r.*, j.job_number 
       FROM reviews r
       LEFT JOIN jobs j ON r.job_id = j.id
       WHERE r.client_id = $1 
          OR r.lead_id IN (SELECT id FROM leads WHERE client_id = $1)
          OR r.job_id IN (SELECT id FROM jobs WHERE client_id = $1)
       ORDER BY r.created_at DESC`,
      [clientId]
    ),

    // Unified Activities Timeline
    query<any>(
      `SELECT DISTINCT ON (a.id) a.*
       FROM activities a
       WHERE a.client_id = $1
          OR (a.entity_type = 'client' AND a.entity_id = $1)
          OR (a.entity_type = 'lead' AND a.entity_id IN (SELECT id FROM leads WHERE client_id = $1))
          OR (a.entity_type = 'job' AND a.entity_id IN (SELECT id FROM jobs WHERE client_id = $1))
       ORDER BY a.id, a.created_at DESC
       LIMIT 100`,
      [clientId]
    ).then(res => res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())),

    // Tasks & Follow-ups
    query<any>(
      `SELECT DISTINCT ON (t.id) t.*
       FROM tasks t
       WHERE t.client_id = $1
          OR (t.entity_type = 'client' AND t.entity_id = $1)
          OR (t.entity_type = 'lead' AND t.entity_id IN (SELECT id FROM leads WHERE client_id = $1))
          OR (t.entity_type = 'job' AND t.entity_id IN (SELECT id FROM jobs WHERE client_id = $1))
       ORDER BY t.id, t.completed_at NULLS FIRST, t.due_at ASC`,
      [clientId]
    ),
  ]);

  // Compute balance due from pending/overdue invoices
  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0);
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, inv) => acc + Number(inv.amount || 0), 0);
  const balanceDue = Math.max(0, totalBilled - totalPaid);

  return NextResponse.json({
    ok: true,
    client: {
      ...client,
      balance_due: balanceDue,
      total_billed: totalBilled,
      total_paid: totalPaid,
    },
    leads,
    inspections,
    estimates,
    jobs,
    invoices,
    warranties,
    reviews,
    activities,
    tasks,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('clients:edit');
  if (auth.response) return auth.response;

  const resolved = await params;
  const clientId = parseInt(resolved.id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    await ensureClientsTable();
    const body = await req.json();
    const allowedFields = [
      'full_name',
      'phone',
      'email',
      'secondary_phone',
      'address',
      'city',
      'zip',
      'property_type',
      'roof_type',
      'roof_sqf',
      'roof_age',
      'stories',
      'hoa',
      'status',
      'tags',
      'notes',
      'assigned_to_user_id',
    ];

    const updates: string[] = [];
    const updateParams: unknown[] = [clientId];
    const intFields = ['roof_sqf', 'roof_age', 'stories', 'assigned_to_user_id'];
    const boolFields = ['hoa'];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        let val = body[key];
        if (intFields.includes(key)) {
          if (val === '' || val === null || val === undefined) {
            val = null;
          } else {
            const parsed = parseInt(String(val), 10);
            val = isNaN(parsed) ? null : parsed;
          }
        } else if (boolFields.includes(key)) {
          val = Boolean(val);
        } else if (typeof val === 'string' && val.trim() === '' && ['secondary_phone', 'notes', 'roof_type'].includes(key)) {
          val = null;
        }

        updateParams.push(val);
        updates.push(`${key} = $${updateParams.length}`);

        // If phone changed, also update phone_normalized
        if (key === 'phone') {
          const norm = normalizePhone(val);
          updateParams.push(norm);
          updates.push(`phone_normalized = $${updateParams.length}`);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);

    const result = await query<any>(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      updateParams
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Log update activity (non-blocking)
    try {
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('client', $1, $1, 'note', 'Client Profile Updated', $2, $3)`,
        [clientId, `Updated: ${Object.keys(body).join(', ')}`, auth.user.name || 'Staff']
      );
    } catch (actErr) {
      console.warn('Could not log client update activity:', actErr);
    }

    try {
      await recalculateClientStats(clientId);
    } catch (recErr) {
      console.warn('Could not recalculate stats:', recErr);
    }

    return NextResponse.json({ ok: true, client: result[0] });
  } catch (err: any) {
    console.error('[api/admin/clients/[id] PATCH]', err);
    return NextResponse.json({ error: err.message || 'Server error updating client' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('clients:delete');
  if (auth.response) return auth.response;

  const resolved = await params;
  const clientId = parseInt(resolved.id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  try {
    // Soft delete: set status to 'inactive'
    await query(`UPDATE clients SET status = 'inactive', updated_at = NOW() WHERE id = $1`, [clientId]);

    await query(
      `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
       VALUES ('client', $1, $1, 'system', 'Client Archived', 'Client marked as inactive', $2)`,
      [clientId, auth.user.name]
    );

    return NextResponse.json({ ok: true, message: 'Client archived' });
  } catch (err) {
    console.error('[api/admin/clients/[id] DELETE]', err);
    return NextResponse.json({ error: 'Server error archiving client' }, { status: 500 });
  }
}

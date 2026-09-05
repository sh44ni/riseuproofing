import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(['field:manage_crew', 'field:view_calendar']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const active = searchParams.get('active');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (role && role !== 'all') {
    params.push(role);
    conditions.push(`c.role = $${params.length}`);
  }

  if (active !== null && active !== undefined && active !== '') {
    params.push(active === 'true');
    conditions.push(`c.active = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT c.*, 
            j.job_number, j.customer_name as current_job_customer, j.address as current_job_address, j.city as current_job_city, j.status as current_job_status
     FROM crew_members c
     LEFT JOIN jobs j ON c.current_job_id = j.id
     ${where}
     ORDER BY c.active DESC, c.role ASC, c.name ASC`,
    params
  );

  // Summary counts
  const [counts] = await query<{
    total_crew: string;
    active_count: string;
    foremen_count: string;
    installer_count: string;
    on_job_count: string;
  }>(`
    SELECT 
      COUNT(*) as total_crew,
      COUNT(CASE WHEN active = true THEN 1 END) as active_count,
      COUNT(CASE WHEN role = 'foreman' AND active = true THEN 1 END) as foremen_count,
      COUNT(CASE WHEN role IN ('lead_installer', 'laborer') AND active = true THEN 1 END) as installer_count,
      COUNT(CASE WHEN current_job_id IS NOT NULL AND active = true THEN 1 END) as on_job_count
    FROM crew_members
  `);

  return NextResponse.json({
    crew: rows,
    summary: {
      totalCrew: parseInt(counts?.total_crew || '0', 10),
      activeCount: parseInt(counts?.active_count || '0', 10),
      foremenCount: parseInt(counts?.foremen_count || '0', 10),
      installerCount: parseInt(counts?.installer_count || '0', 10),
      onJobCount: parseInt(counts?.on_job_count || '0', 10),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('field:manage_crew');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { name, phone, role, active = true, currentJobId, skills = [], notes } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const rows = await query<any>(
      `INSERT INTO crew_members (name, phone, role, active, current_job_id, skills, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        phone || null,
        role,
        active,
        currentJobId ? parseInt(currentJobId, 10) : null,
        Array.isArray(skills) ? skills : [],
        notes || null,
      ]
    );

    return NextResponse.json({ ok: true, crewMember: rows[0] });
  } catch (err) {
    console.error('[api/admin/crew POST]', err);
    return NextResponse.json({ error: 'Server error creating crew member' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('field:manage_crew');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, name, phone, role, active, currentJobId, skills, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Crew member ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (phone !== undefined) {
      params.push(phone);
      updates.push(`phone = $${params.length}`);
    }
    if (role !== undefined) {
      params.push(role);
      updates.push(`role = $${params.length}`);
    }
    if (active !== undefined) {
      params.push(active);
      updates.push(`active = $${params.length}`);
    }
    if (currentJobId !== undefined) {
      params.push(currentJobId ? parseInt(currentJobId, 10) : null);
      updates.push(`current_job_id = $${params.length}`);
    }
    if (skills !== undefined) {
      params.push(Array.isArray(skills) ? skills : []);
      updates.push(`skills = $${params.length}`);
    }
    if (notes !== undefined) {
      params.push(notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);
    const rows = await query<any>(
      `UPDATE crew_members SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    return NextResponse.json({ ok: true, crewMember: rows[0] });
  } catch (err) {
    console.error('[api/admin/crew PATCH]', err);
    return NextResponse.json({ error: 'Server error updating crew member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('field:manage_crew');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Crew member ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM crew_members WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}

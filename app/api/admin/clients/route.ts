import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { findOrCreateClient, normalizePhone } from '@/lib/crm-clients';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('clients:view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status');
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort') || 'recent';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (tag && tag !== 'all') {
    params.push(tag);
    conditions.push(`$${params.length} = ANY(tags)`);
  }

  if (search) {
    const norm = normalizePhone(search);
    params.push(`%${search.toLowerCase()}%`);
    const pSearch = `$${params.length}`;

    if (norm && norm.length >= 4) {
      params.push(`%${norm}%`);
      const pNorm = `$${params.length}`;
      conditions.push(`(
        LOWER(full_name) LIKE ${pSearch} OR
        LOWER(COALESCE(email, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(address, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(city, '')) LIKE ${pSearch} OR
        phone_normalized LIKE ${pNorm} OR
        phone LIKE ${pSearch}
      )`);
    } else {
      conditions.push(`(
        LOWER(full_name) LIKE ${pSearch} OR
        LOWER(COALESCE(email, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(address, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(city, '')) LIKE ${pSearch} OR
        phone LIKE ${pSearch}
      )`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'updated_at DESC';
  if (sort === 'ltv') {
    orderBy = 'total_revenue DESC, updated_at DESC';
  } else if (sort === 'name') {
    orderBy = 'full_name ASC';
  } else if (sort === 'jobs') {
    orderBy = 'total_jobs_count DESC, updated_at DESC';
  } else if (sort === 'created') {
    orderBy = 'created_at DESC';
  }

  const [clients, countRows, summaryRows] = await Promise.all([
    query<any>(
      `SELECT c.*, u.name as assigned_to_name
       FROM clients c
       LEFT JOIN users u ON c.assigned_to_user_id = u.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM clients ${where}`, params),
    query<{
      total_clients: string;
      active_jobs: string;
      leads_count: string;
      total_ltv: string;
    }>(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN status = 'active_job' THEN 1 END) as active_jobs,
        COUNT(CASE WHEN status = 'lead' THEN 1 END) as leads_count,
        COALESCE(SUM(total_revenue), 0) as total_ltv
      FROM clients
    `),
  ]);

  const total = parseInt(countRows[0]?.count || '0', 10);
  const summary = {
    totalClients: parseInt(summaryRows[0]?.total_clients || '0', 10),
    activeProjects: parseInt(summaryRows[0]?.active_jobs || '0', 10),
    leadCount: parseInt(summaryRows[0]?.leads_count || '0', 10),
    totalLtv: parseFloat(summaryRows[0]?.total_ltv || '0'),
  };

  return NextResponse.json({
    ok: true,
    clients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    summary,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('clients:create');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      secondaryPhone,
      address,
      city,
      zip,
      propertyType,
      roofType,
      roofSqf,
      roofAge,
      stories,
      hoa,
      notes,
      assignedToUserId,
    } = body;

    if (!fullName || (!phone && !email)) {
      return NextResponse.json(
        { error: 'Client name and at least one contact method (phone or email) are required' },
        { status: 400 }
      );
    }

    const client = await findOrCreateClient({
      fullName,
      phone,
      email,
      secondaryPhone,
      address,
      city,
      zip,
      propertyType,
      roofType,
      roofSqf: roofSqf ? parseInt(roofSqf, 10) : null,
      roofAge: roofAge ? parseInt(roofAge, 10) : null,
      stories: stories ? parseInt(stories, 10) : 1,
      hoa: Boolean(hoa),
      leadSource: 'admin_manual',
      notes,
      assignedToUserId: assignedToUserId ? parseInt(assignedToUserId, 10) : null,
    });

    // Log client creation activity
    await query(
      `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
       VALUES ('client', $1, $1, 'system', 'Client Profile Created', $2, $3)`,
      [client.id, `Manual client profile setup by staff`, auth.user.name]
    );

    return NextResponse.json({ ok: true, client });
  } catch (err) {
    console.error('[api/admin/clients POST]', err);
    return NextResponse.json({ error: 'Server error creating client' }, { status: 500 });
  }
}

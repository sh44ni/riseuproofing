import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { findOrCreateClient, normalizePhone, ensureClientsTable, autoHealDataflowSync } from '@/lib/crm-clients';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('clients:view');
  if (auth.response) return auth.response;

  await ensureClientsTable();

  const { searchParams } = new URL(req.url);
  const sync = searchParams.get('sync') === 'true';
  if (sync) {
    try {
      await autoHealDataflowSync();
    } catch (syncErr) {
      console.warn('[clients GET] autoHealDataflowSync error:', syncErr);
    }
  }

  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort') || 'recent';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Lifecycle category filtering
  if (category && category !== 'all') {
    let targetCat = category;
    if (targetCat === 'leads') targetCat = 'lead';
    else if (targetCat === 'new_clients') targetCat = 'new_client';
    else if (targetCat === 'existing_clients') targetCat = 'existing_client';
    else if (targetCat === 'lost_leads') targetCat = 'lost_lead';

    params.push(targetCat);
    conditions.push(`c.client_category = $${params.length}`);
  } else if (status && status !== 'all') {
    if (status === 'lost') {
      conditions.push(`(c.client_category = 'lost_lead' OR c.status = 'lost')`);
    } else {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }
  } else {
    // Default active view: Exclude lost leads so they remain strictly inside "Lost Leads" tab
    conditions.push(`(c.client_category IS NULL OR c.client_category != 'lost_lead')`);
  }

  if (tag && tag !== 'all') {
    params.push(tag);
    conditions.push(`$${params.length} = ANY(c.tags)`);
  }

  if (search) {
    const norm = normalizePhone(search);
    params.push(`%${search.toLowerCase()}%`);
    const pSearch = `$${params.length}`;

    if (norm && norm.length >= 4) {
      params.push(`%${norm}%`);
      const pNorm = `$${params.length}`;
      conditions.push(`(
        LOWER(c.full_name) LIKE ${pSearch} OR
        LOWER(COALESCE(c.email, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(c.address, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(c.city, '')) LIKE ${pSearch} OR
        c.phone_normalized LIKE ${pNorm} OR
        c.phone LIKE ${pSearch}
      )`);
    } else {
      conditions.push(`(
        LOWER(c.full_name) LIKE ${pSearch} OR
        LOWER(COALESCE(c.email, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(c.address, '')) LIKE ${pSearch} OR
        LOWER(COALESCE(c.city, '')) LIKE ${pSearch} OR
        c.phone LIKE ${pSearch}
      )`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'c.updated_at DESC';
  if (sort === 'ltv') {
    orderBy = 'c.total_revenue DESC, c.updated_at DESC';
  } else if (sort === 'name') {
    orderBy = 'c.full_name ASC';
  } else if (sort === 'jobs') {
    orderBy = 'c.total_jobs_count DESC, c.updated_at DESC';
  } else if (sort === 'created') {
    orderBy = 'c.created_at DESC';
  }

  const [clients, countRows, summaryRows] = await Promise.all([
    query<any>(
      `SELECT 
         c.*, 
         u.name as assigned_to_name,
         u_acq.name as acquired_by_name,
         u_acq.role as acquired_by_role,
         u_acq.avatar_url as acquired_by_avatar,
         (
           SELECT lost_reason FROM leads 
           WHERE client_id = c.id AND status = 'lost' AND lost_reason IS NOT NULL 
           ORDER BY updated_at DESC LIMIT 1
         ) as lead_lost_reason,
         (
           SELECT total FROM estimates 
           WHERE client_id = c.id OR lead_id IN (SELECT id FROM leads WHERE client_id = c.id) 
           ORDER BY created_at DESC LIMIT 1
         ) as latest_estimate_total
       FROM clients c
       LEFT JOIN users u ON c.assigned_to_user_id = u.id
       LEFT JOIN users u_acq ON c.acquired_by_user_id = u_acq.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM clients c ${where}`, params),
    query<{
      total_clients: string;
      existing_clients_count: string;
      new_clients_count: string;
      leads_count: string;
      lost_leads_count: string;
      active_jobs: string;
      total_ltv: string;
    }>(`
      SELECT 
        COUNT(CASE WHEN client_category != 'lost_lead' OR client_category IS NULL THEN 1 END) as total_clients,
        COUNT(CASE WHEN client_category = 'existing_client' OR status IN ('active_job', 'completed', 'repeat') THEN 1 END) as existing_clients_count,
        COUNT(CASE WHEN client_category = 'new_client' OR (client_category != 'existing_client' AND client_category != 'lost_lead' AND status = 'opportunity') THEN 1 END) as new_clients_count,
        COUNT(CASE WHEN client_category = 'lead' OR (client_category IS NULL AND status = 'lead') THEN 1 END) as leads_count,
        COUNT(CASE WHEN client_category = 'lost_lead' OR (client_category != 'existing_client' AND status = 'lost') THEN 1 END) as lost_leads_count,
        COUNT(CASE WHEN status = 'active_job' THEN 1 END) as active_jobs,
        COALESCE(SUM(CASE WHEN client_category != 'lost_lead' THEN total_revenue ELSE 0 END), 0) as total_ltv
      FROM clients
    `),
  ]);

  const total = parseInt(countRows[0]?.count || '0', 10);
  const summary = {
    totalClients: parseInt(summaryRows[0]?.total_clients || '0', 10),
    existingClientsCount: parseInt(summaryRows[0]?.existing_clients_count || '0', 10),
    newClientsCount: parseInt(summaryRows[0]?.new_clients_count || '0', 10),
    leadsCount: parseInt(summaryRows[0]?.leads_count || '0', 10),
    lostLeadsCount: parseInt(summaryRows[0]?.lost_leads_count || '0', 10),
    activeProjects: parseInt(summaryRows[0]?.active_jobs || '0', 10),
    leadCount: parseInt(summaryRows[0]?.leads_count || '0', 10),
    totalLtv: parseFloat(summaryRows[0]?.total_ltv || '0'),
  };

  const enrichedClients = clients.map(c => {
    const isTeam = Boolean(c.acquired_by_user_id || c.acquired_by_name);
    return {
      ...c,
      client_category: c.client_category || 'lead',
      lost_reason: c.lost_reason || c.lead_lost_reason || null,
      latest_estimate_total: c.latest_estimate_total ? Number(c.latest_estimate_total) : null,
      source_type: isTeam ? 'team_member' : 'website',
      lead_source_detail: c.lead_source_detail || (isTeam ? 'Sales Rep Outreach' : 'Website Inbound'),
    };
  });

  return NextResponse.json({
    ok: true,
    clients: enrichedClients,
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
    await ensureClientsTable();
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
      sourceType = 'website',
      acquiredByUserId,
      leadSourceDetail,
    } = body;

    if (!fullName || (!phone && !email)) {
      return NextResponse.json(
        { error: 'Client name and at least one contact method (phone or email) are required' },
        { status: 400 }
      );
    }

    const finalSourceType = sourceType === 'team_member' ? 'team_member' : 'website';
    const finalAcquiredBy = finalSourceType === 'team_member'
      ? (acquiredByUserId ? parseInt(String(acquiredByUserId), 10) : auth.user.id)
      : null;
    const finalSourceDetail = leadSourceDetail || (finalSourceType === 'team_member' ? 'Team Member Attribution' : 'Manual Office Inbound');

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
      sourceType: finalSourceType,
      acquiredByUserId: finalAcquiredBy,
      leadSourceDetail: finalSourceDetail,
    });

    // Log client creation activity (non-blocking)
    try {
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('client', $1, $1, 'system', 'Client Profile Created', $2, $3)`,
        [client.id, `Manual client profile setup by staff`, auth.user.name || 'Staff']
      );
    } catch (actErr) {
      console.warn('Could not log client activity:', actErr);
    }

    return NextResponse.json({ ok: true, client });
  } catch (err: any) {
    console.error('[api/admin/clients POST]', err);
    return NextResponse.json({ error: err.message || 'Server error creating client' }, { status: 500 });
  }
}

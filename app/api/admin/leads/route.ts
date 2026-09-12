import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { buildScopeFilter } from '@/lib/permissions';
import { query } from '@/lib/db';
import { calculateLeadScore } from '@/lib/crm-scoring';
import { recalculateClientStats } from '@/lib/crm-clients';

// Cache 30-day lead trend to prevent re-querying on every pagination / filter
interface CachedDaily {
  data: { day: string; count: string }[];
  expires: number;
}
let cachedDaily: CachedDaily | null = null;
const DAILY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(req: NextRequest) {
  const auth = await requirePermission('leads.view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const formType = searchParams.get('form_type');
  const priority = searchParams.get('priority');
  const source = searchParams.get('source');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Dynamic Scope Filtering: own vs assigned vs all (§3 & §8)
  const scopeFilter = buildScopeFilter(auth.user, 'leads.view', {
    creatorCol: 'l.created_by_user_id',
    assignedCol: 'l.assigned_to_user_id',
    paramOffset: params.length + 1,
  });

  if (!scopeFilter.allowed) {
    return NextResponse.json({ ok: false, error: 'Forbidden: Insufficient permissions to view leads' }, { status: 403 });
  }

  if (scopeFilter.clause !== '1=1') {
    conditions.push(scopeFilter.clause);
    params.push(...scopeFilter.params);
  }

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  } else {
    // Default active queue: Exclude lost leads so active sales pipeline stays clean
    conditions.push(`l.status != 'lost'`);
  }

  if (formType && formType !== 'all') {
    params.push(formType);
    conditions.push(`l.form_type = $${params.length}`);
  }

  if (priority && priority !== 'all') {
    params.push(priority);
    conditions.push(`l.priority = $${params.length}`);
  }

  if (source && source !== 'all') {
    params.push(source);
    conditions.push(`l.lead_source = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(l.full_name) LIKE ${pIdx} OR 
      l.phone LIKE ${pIdx} OR 
      LOWER(COALESCE(l.email, '')) LIKE ${pIdx} OR 
      LOWER(COALESCE(l.address, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(l.service_type, '')) LIKE ${pIdx}
    )`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const now = Date.now();
  const dailyPromise = (cachedDaily && cachedDaily.expires > now)
    ? Promise.resolve(cachedDaily.data)
    : query<{ day: string; count: string }>(
        `SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*) AS count
         FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day`
      ).then(res => {
        cachedDaily = { data: res, expires: Date.now() + DAILY_CACHE_TTL };
        return res;
      });

  const [rows, countRow, daily] = await Promise.all([
    query<any>(
      `SELECT 
         l.*,
         u_creator.name as created_by_name,
         u_creator.role as created_by_role,
         u_creator.avatar_url as created_by_avatar,
         u_assigned.name as assigned_to_name
       FROM leads l
       LEFT JOIN users u_creator ON l.created_by_user_id = u_creator.id
       LEFT JOIN users u_assigned ON l.assigned_to_user_id = u_assigned.id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM leads l ${where}`, params),
    dailyPromise,
  ]);

  // Ensure every lead has source attribution & score & priority populated
  const enrichedLeads = rows.map(lead => {
    // Automatic Website Lead Recognition:
    // Any lead without a team member creator, or coming through public forms,
    // is automatically recognized as an inbound Website Lead.
    const isTeam = Boolean(lead.created_by_user_id || lead.created_by_name);
    const sourceType = isTeam ? 'team_member' : 'website';

    let sourceDetail = lead.lead_source_detail;
    if (!sourceDetail) {
      if (sourceType === 'website') {
        if (lead.form_type === 'contact') sourceDetail = 'Website Contact Form';
        else if (lead.form_type === 'storm_promo' || lead.lead_source === 'storm_promo_popup') sourceDetail = 'Storm Season Alert';
        else if (lead.form_type === 'estimate' || lead.form_type === 'estimator_full') sourceDetail = 'Website Estimate Request';
        else if (lead.form_type === 'calculator') sourceDetail = 'Cost Calculator Inbound';
        else if (lead.lead_source === 'google_ads') sourceDetail = 'Google Ads Search';
        else if (lead.lead_source === 'yelp') sourceDetail = 'Yelp Directory';
        else sourceDetail = 'Website Inbound';
      } else {
        sourceDetail = 'Sales Rep Outreach';
      }
    }

    let item = {
      ...lead,
      source_type: sourceType,
      lead_source_detail: sourceDetail,
    };

    if (!item.lead_score || item.lead_score === 0) {
      const scored = calculateLeadScore({
        serviceType: item.service_type,
        phone: item.phone,
        email: item.email,
        roofSqf: item.roof_sqf,
        address: item.address,
        zip: item.zip,
        leadSource: item.lead_source,
        formType: item.form_type,
      });
      item = {
        ...item,
        lead_score: scored.score,
        priority: scored.priority,
      };
    }
    return item;
  });

  return NextResponse.json({
    leads: enrichedLeads,
    total: parseInt(countRow[0]?.count ?? '0', 10),
    page,
    daily,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('leads:create');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      address,
      zip,
      serviceType,
      leadSource = 'phone',
      notes,
      propertyType,
      roofType,
      roofSqf,
      stories,
      sourceType = 'website',
      createdByUserId,
      leadSourceDetail,
      assignedToUserId,
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 });
    }

    const finalSourceType = sourceType === 'team_member' ? 'team_member' : 'website';
    const finalCreatedByUserId = finalSourceType === 'team_member'
      ? (createdByUserId ? parseInt(String(createdByUserId), 10) : auth.user.id)
      : null;
    const finalAssignedToUserId = assignedToUserId ? parseInt(String(assignedToUserId), 10) : null;
    const finalSourceDetail = leadSourceDetail || (finalSourceType === 'team_member' ? 'Team Member Attribution' : 'Manual Office Inbound');

    const scored = calculateLeadScore({
      serviceType,
      phone,
      email,
      roofSqf: roofSqf ? parseInt(roofSqf, 10) : null,
      address,
      zip,
      leadSource,
      formType: 'manual',
    });

    let clientId: number | null = null;
    try {
      const { findOrCreateClient } = await import('@/lib/crm-clients');
      const client = await findOrCreateClient({
        fullName,
        phone,
        email: email ?? null,
        address: address ?? null,
        zip: zip ?? null,
        propertyType: propertyType ?? null,
        roofType: roofType ?? null,
        roofSqf: roofSqf ? parseInt(roofSqf, 10) : null,
        stories: stories ? parseInt(stories, 10) : null,
        leadSource,
        notes: notes ?? null,
        sourceType: finalSourceType,
        acquiredByUserId: finalCreatedByUserId,
        leadSourceDetail: finalSourceDetail,
        assignedToUserId: finalAssignedToUserId,
      });
      clientId = client.id;
    } catch (clientErr) {
      console.error('[api/admin/leads POST] Client link error:', clientErr);
    }

    // Resolve attribution snapshot (§7)
    const userRoleSnapshot = (auth.user.roles && auth.user.roles.length > 0)
      ? auth.user.roles.map(r => r.name).join(', ')
      : (auth.user.role || 'Staff');

    let finalRoleSnapshot = userRoleSnapshot;
    if (finalCreatedByUserId && finalCreatedByUserId !== auth.user.id) {
      try {
        const creatorRolesRes = await query<{ role_names: string }>(
          `SELECT string_agg(r.name, ', ') as role_names
           FROM user_roles ur
           JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_id = $1`,
          [finalCreatedByUserId]
        );
        if (creatorRolesRes[0]?.role_names) {
          finalRoleSnapshot = creatorRolesRes[0].role_names;
        }
      } catch (err) {
        console.warn('[leads POST] Failed to fetch creator role names:', err);
      }
    }

    const rows = await query<any>(
      `INSERT INTO leads (
        form_type, full_name, phone, email, address, zip, service_type,
        lead_source, notes, property_type, roof_type, roof_sqf, stories,
        lead_score, priority, status, source_page, client_id,
        source_type, created_by_user_id, lead_source_detail, assigned_to_user_id,
        created_by, created_by_role_snapshot
      ) VALUES (
        'manual', $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, 'new', 'admin', $15,
        $16, $17, $18, $19,
        $20, $21
      ) RETURNING *`,
      [
        fullName,
        phone,
        email ?? null,
        address ?? null,
        zip ?? null,
        serviceType ?? null,
        leadSource,
        notes ?? null,
        propertyType ?? null,
        roofType ?? null,
        roofSqf ? parseInt(roofSqf, 10) : null,
        stories ? parseInt(stories, 10) : null,
        scored.score,
        scored.priority,
        clientId,
        finalSourceType,
        finalCreatedByUserId,
        finalSourceDetail,
        finalAssignedToUserId,
        finalCreatedByUserId,
        finalRoleSnapshot,
      ]
    );

    const newLead = rows[0];
    cachedDaily = null; // Invalidate daily sparkline cache

    // Log creation activity
    await query(
      `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, $2, 'system', 'Lead created manually', $3, 'Staff')`,
      [newLead.id, clientId, `Created via manual entry (Source: ${leadSource}, Attributed to: ${finalRoleSnapshot})`]
    );

    return NextResponse.json({ ok: true, lead: newLead });
  } catch (err) {
    console.error('[api/admin/leads POST]', err);
    return NextResponse.json({ error: 'Server error creating lead' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('leads:edit');
  if (auth.response) return auth.response;

  const { id, status, performedBy, lost_reason, notes } = await req.json();
  const valid = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Enforce leads.edit dynamic scope (§3 & §8)
  // $1=status, $2=lost_reason, $3=notes, $4=id, $5=performedBy -> params offset = 6
  const patchScope = buildScopeFilter(auth.user, 'leads.edit', {
    creatorCol: 'COALESCE(leads.created_by, leads.created_by_user_id)',
    assignedCol: 'leads.assigned_to_user_id',
    paramOffset: 6,
  });

  if (!patchScope.allowed) {
    return NextResponse.json({ ok: false, error: 'Forbidden: Insufficient permissions to edit this lead' }, { status: 403 });
  }

  const scopeClause = patchScope.clause !== '1=1' ? `AND ${patchScope.clause}` : '';
  const noteAppend = notes?.trim() ? `\n[${new Date().toLocaleDateString()}] ${notes.trim()}` : null;

  // Atomically update status, lost_reason, notes, and log activity in a single round-trip
  const updateRes = await query<any>(`
    WITH updated_lead AS (
      UPDATE leads 
      SET status = $1,
          lost_reason = CASE WHEN $1 = 'lost' THEN COALESCE($2, lost_reason) ELSE NULL END,
          notes = CASE 
            WHEN $3::text IS NOT NULL THEN COALESCE(notes, '') || $3::text 
            ELSE notes 
          END,
          updated_at = NOW()
      WHERE id = $4 ${scopeClause} 
      RETURNING id, client_id
    )
    INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
    SELECT 'lead', id, 'status_change', 
      CASE WHEN $1 = 'lost' THEN 'Lead Moved to Lost Archive' ELSE 'Status updated' END,
      CASE 
        WHEN $1 = 'lost' THEN 'Lead marked as lost. Reason: ' || COALESCE($2, 'Unspecified') || CASE WHEN $3::text IS NOT NULL THEN ' | Notes: ' || $3::text ELSE '' END
        ELSE 'Lead status changed to ' || $1 
      END, 
      $5
    FROM updated_lead
    RETURNING entity_id
  `, [
    status,
    lost_reason || null,
    noteAppend,
    id,
    performedBy || auth.user.name || 'Staff',
    ...patchScope.params,
  ]);

  // Recalculate linked client stats & 4-tier lifecycle category
  try {
    const leadRows = await query<{ client_id: number | null }>(`SELECT client_id FROM leads WHERE id = $1`, [id]);
    const clientId = leadRows[0]?.client_id;
    if (clientId) {
      await recalculateClientStats(Number(clientId));
    }
  } catch (syncErr) {
    console.warn('Could not recalculate client stats on lead status change:', syncErr);
  }

  cachedDaily = null; // Invalidate daily sparkline cache

  return NextResponse.json({ ok: true });
}


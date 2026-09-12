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

  const [rows, countRow, daily, kpiRes, sparklineRows, filterOptionsRes] = await Promise.all([
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
    // 6-Metric Live Leads Strip with real month-over-month comparisons
    query<{
      total_leads: string; new_leads: string; in_contact: string; scheduled_quoted: string; won_jobs: string;
      prev_total: string;  prev_new: string;  prev_contact: string; prev_quoted: string;       prev_won: string;
    }>(`
      WITH
        prev_month_start AS (SELECT date_trunc('month', NOW()) - INTERVAL '1 month' AS d),
        prev_month_end   AS (SELECT date_trunc('month', NOW()) AS d)
      SELECT
        COUNT(*) FILTER (WHERE l.status != 'lost') as total_leads,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'new' OR l.pipeline_stage = 'stage_1_lead_gen')) as new_leads,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'contacted' OR l.pipeline_stage = 'stage_2_initial_contact')) as in_contact,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'quoted' OR l.pipeline_stage IN ('stage_3_site_visit_estimate', 'stage_4_closing') OR l.proposal_sent_at IS NOT NULL)) as scheduled_quoted,
        COUNT(*) FILTER (WHERE l.status = 'won' OR l.pipeline_stage = 'stage_5_completion_followup') as won_jobs,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND l.created_at >= (SELECT d FROM prev_month_start) AND l.created_at < (SELECT d FROM prev_month_end)) as prev_total,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'new' OR l.pipeline_stage = 'stage_1_lead_gen') AND l.created_at >= (SELECT d FROM prev_month_start) AND l.created_at < (SELECT d FROM prev_month_end)) as prev_new,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'contacted' OR l.pipeline_stage = 'stage_2_initial_contact') AND l.updated_at >= (SELECT d FROM prev_month_start) AND l.updated_at < (SELECT d FROM prev_month_end)) as prev_contact,
        COUNT(*) FILTER (WHERE l.status != 'lost' AND (l.status = 'quoted' OR l.pipeline_stage IN ('stage_3_site_visit_estimate', 'stage_4_closing') OR l.proposal_sent_at IS NOT NULL) AND l.updated_at >= (SELECT d FROM prev_month_start) AND l.updated_at < (SELECT d FROM prev_month_end)) as prev_quoted,
        COUNT(*) FILTER ((l.status = 'won' OR l.pipeline_stage = 'stage_5_completion_followup') AND l.updated_at >= (SELECT d FROM prev_month_start) AND l.updated_at < (SELECT d FROM prev_month_end)) as prev_won
      FROM leads l
    `).catch(() => [] as any[]),
    // Weekly sparklines (last 8 weeks)
    query<{ week: string; total_leads: string; new_leads: string; in_contact: string; scheduled_quoted: string; won_jobs: string }>(`
      SELECT
        date_trunc('week', created_at)::date::text as week,
        COUNT(*) FILTER (WHERE status != 'lost') as total_leads,
        COUNT(*) FILTER (WHERE status != 'lost' AND (status = 'new' OR pipeline_stage = 'stage_1_lead_gen')) as new_leads,
        COUNT(*) FILTER (WHERE status != 'lost' AND (status = 'contacted' OR pipeline_stage = 'stage_2_initial_contact')) as in_contact,
        COUNT(*) FILTER (WHERE status != 'lost' AND (status = 'quoted' OR pipeline_stage IN ('stage_3_site_visit_estimate', 'stage_4_closing') OR proposal_sent_at IS NOT NULL)) as scheduled_quoted,
        COUNT(*) FILTER (WHERE status = 'won' OR pipeline_stage = 'stage_5_completion_followup') as won_jobs
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY date_trunc('week', created_at)
      ORDER BY week ASC
    `).catch(() => [] as any[]),
    // Distinct filter options
    Promise.all([
      query<{ val: string }>(`SELECT DISTINCT lead_source as val FROM leads WHERE lead_source IS NOT NULL AND lead_source != '' ORDER BY val`).catch(() => []),
      query<{ val: string }>(`SELECT DISTINCT service_type as val FROM leads WHERE service_type IS NOT NULL AND service_type != '' ORDER BY val`).catch(() => []),
      query<{ val: string }>(`SELECT DISTINCT u.name as val FROM users u JOIN leads l ON l.assigned_to_user_id = u.id WHERE u.name IS NOT NULL ORDER BY val`).catch(() => []),
    ]).catch(() => [[], [], []]),
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

  // Helper — compute real % change vs previous period
  function calcDelta(curr: string | number, prev: string | number): { delta: string; isPositive: boolean } {
    const c = typeof curr === 'string' ? parseInt(curr, 10) : curr;
    const p = typeof prev === 'string' ? parseInt(prev, 10) : prev;
    if (isNaN(c) || isNaN(p)) return { delta: '—', isPositive: true };
    if (p === 0 && c === 0) return { delta: '—', isPositive: true };
    if (p === 0) return { delta: `+${c * 100}%`, isPositive: true };
    const pct = Math.round(((c - p) / p) * 100);
    if (pct === 0) return { delta: '0%', isPositive: true };
    return { delta: `${pct > 0 ? '+' : ''}${pct}%`, isPositive: pct >= 0 };
  }

  // Convert sparkline rows to number arrays (oldest → newest, at least 2 points)
  const toWeeklyPoints = (sRows: any[], field: string): number[] => {
    const vals = (sRows || []).map(r => parseInt(r[field] ?? '0', 10) || 0);
    while (vals.length < 2) vals.unshift(0);
    return vals;
  };

  const kpiData = (kpiRes && kpiRes[0]) || {
    total_leads: '0', new_leads: '0', in_contact: '0', scheduled_quoted: '0', won_jobs: '0',
    prev_total: '0', prev_new: '0', prev_contact: '0', prev_quoted: '0', prev_won: '0',
  };

  const totalActive = parseInt(kpiData.total_leads || '0', 10);
  const wonCount = parseInt(kpiData.won_jobs || '0', 10);
  const prevTotal = parseInt(kpiData.prev_total || '0', 10);
  const prevWon = parseInt(kpiData.prev_won || '0', 10);
  const winRatePct = totalActive > 0 ? Math.round((wonCount / totalActive) * 100) : 0;
  const prevWinRatePct = prevTotal > 0 ? Math.round((prevWon / prevTotal) * 100) : 0;

  const kpis = {
    totalLeads: {
      count: totalActive,
      ...calcDelta(kpiData.total_leads, kpiData.prev_total),
      sparkPoints: toWeeklyPoints(sparklineRows, 'total_leads'),
    },
    newLeads: {
      count: parseInt(kpiData.new_leads || '0', 10),
      ...calcDelta(kpiData.new_leads, kpiData.prev_new),
      sparkPoints: toWeeklyPoints(sparklineRows, 'new_leads'),
    },
    inContact: {
      count: parseInt(kpiData.in_contact || '0', 10),
      ...calcDelta(kpiData.in_contact, kpiData.prev_contact),
      sparkPoints: toWeeklyPoints(sparklineRows, 'in_contact'),
    },
    scheduledQuoted: {
      count: parseInt(kpiData.scheduled_quoted || '0', 10),
      ...calcDelta(kpiData.scheduled_quoted, kpiData.prev_quoted),
      sparkPoints: toWeeklyPoints(sparklineRows, 'scheduled_quoted'),
    },
    wonDeals: {
      count: wonCount,
      ...calcDelta(kpiData.won_jobs, kpiData.prev_won),
      sparkPoints: toWeeklyPoints(sparklineRows, 'won_jobs'),
    },
    winRate: {
      count: `${winRatePct}%`,
      ...calcDelta(winRatePct, prevWinRatePct),
      sparkPoints: toWeeklyPoints(sparklineRows, 'won_jobs'),
    },
  };

  const [sourceRows, serviceRows, repRows] = (filterOptionsRes as any[]) || [[], [], []];

  return NextResponse.json({
    leads: enrichedLeads,
    total: parseInt(countRow[0]?.count ?? '0', 10),
    page,
    daily,
    kpis,
    filterOptions: {
      sources: (sourceRows || []).map((r: any) => r.val).filter(Boolean),
      services: (serviceRows || []).map((r: any) => r.val).filter(Boolean),
      reps: (repRows || []).map((r: any) => r.val).filter(Boolean),
    },
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


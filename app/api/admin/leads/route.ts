import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { calculateLeadScore } from '@/lib/crm-scoring';

// Cache 30-day lead trend to prevent re-querying on every pagination / filter
interface CachedDaily {
  data: { day: string; count: string }[];
  expires: number;
}
let cachedDaily: CachedDaily | null = null;
const DAILY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(req: NextRequest) {
  const auth = await requirePermission('leads:view');
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

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (formType && formType !== 'all') {
    params.push(formType);
    conditions.push(`form_type = $${params.length}`);
  }

  if (priority && priority !== 'all') {
    params.push(priority);
    conditions.push(`priority = $${params.length}`);
  }

  if (source && source !== 'all') {
    params.push(source);
    conditions.push(`lead_source = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(full_name) LIKE ${pIdx} OR 
      phone LIKE ${pIdx} OR 
      LOWER(COALESCE(email, '')) LIKE ${pIdx} OR 
      LOWER(COALESCE(address, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(service_type, '')) LIKE ${pIdx}
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
      `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM leads ${where}`, params),
    dailyPromise,
  ]);

  // Ensure every lead has score & priority populated
  const enrichedLeads = rows.map(lead => {
    if (!lead.lead_score || lead.lead_score === 0) {
      const scored = calculateLeadScore({
        serviceType: lead.service_type,
        phone: lead.phone,
        email: lead.email,
        roofSqf: lead.roof_sqf,
        address: lead.address,
        zip: lead.zip,
        leadSource: lead.lead_source,
        formType: lead.form_type,
      });
      return {
        ...lead,
        lead_score: scored.score,
        priority: scored.priority,
      };
    }
    return lead;
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
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 });
    }

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

    const rows = await query<any>(
      `INSERT INTO leads (
        form_type, full_name, phone, email, address, zip, service_type,
        lead_source, notes, property_type, roof_type, roof_sqf, stories,
        lead_score, priority, status, source_page
      ) VALUES (
        'manual', $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, 'new', 'admin'
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
      ]
    );

    const newLead = rows[0];
    cachedDaily = null; // Invalidate daily sparkline cache

    // Log creation activity
    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, 'system', 'Lead created manually', $2, 'Staff')`,
      [newLead.id, `Created via manual entry (Source: ${leadSource})`]
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

  const { id, status, performedBy } = await req.json();
  const valid = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Atomically update status and log activity in a single round-trip
  await query(`
    WITH updated_lead AS (
      UPDATE leads SET status = $1 WHERE id = $2 RETURNING id
    )
    INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
    SELECT 'lead', id, 'status_change', $3, $4, $5
    FROM updated_lead
  `, [
    status,
    id,
    `Status changed to ${status}`,
    `Lead status updated to ${status}`,
    performedBy || 'Staff',
  ]);

  cachedDaily = null; // Invalidate daily sparkline cache

  return NextResponse.json({ ok: true });
}


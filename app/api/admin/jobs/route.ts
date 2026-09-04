import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export const JOB_STAGES = [
  'permit_pending',
  'material_order',
  'scheduled',
  'in_progress',
  'punch_list',
  'final_inspection',
  'complete',
] as const;

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(customer_name) LIKE ${pIdx} OR 
      LOWER(job_number) LIKE ${pIdx} OR 
      LOWER(COALESCE(address, '')) LIKE ${pIdx} OR 
      LOWER(COALESCE(city, '')) LIKE ${pIdx}
    )`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [jobs, stats] = await Promise.all([
    query<any>(`SELECT * FROM jobs ${where} ORDER BY created_at DESC`, params),
    query<{
      total_count: string;
      active_count: string;
      total_value: string;
      active_value: string;
    }>(
      `SELECT 
         COUNT(*) as total_count,
         COUNT(CASE WHEN status != 'complete' THEN 1 END) as active_count,
         COALESCE(SUM(contract_value), 0) as total_value,
         COALESCE(SUM(CASE WHEN status != 'complete' THEN contract_value ELSE 0 END), 0) as active_value
       FROM jobs`
    ),
  ]);

  // Group by Kanban stages
  const kanban: Record<string, any[]> = {};
  for (const stage of JOB_STAGES) {
    kanban[stage] = [];
  }
  for (const j of jobs) {
    if (kanban[j.status]) {
      kanban[j.status].push(j);
    } else {
      kanban['permit_pending'].push(j);
    }
  }

  const summary = stats[0] || {
    total_count: '0',
    active_count: '0',
    total_value: '0',
    active_value: '0',
  };

  return NextResponse.json({
    jobs,
    kanban,
    summary: {
      totalCount: parseInt(summary.total_count, 10),
      activeCount: parseInt(summary.active_count, 10),
      totalValue: parseFloat(summary.total_value),
      activeValue: parseFloat(summary.active_value),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      leadId,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      zip,
      serviceType = 'Residential Roofing',
      contractValue = 0,
      scheduledStart,
      estimatedDays = 3,
      crewLead,
      notes,
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const jobNumber = `JOB-${year}-${seq}`;

    const rows = await query<any>(
      `INSERT INTO jobs (
        lead_id, job_number, status, customer_name, customer_phone, customer_email,
        address, city, zip, service_type, contract_value, scheduled_start,
        estimated_days, crew_lead, notes
      ) VALUES (
        $1, $2, 'permit_pending', $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14
      ) RETURNING *`,
      [
        leadId ? parseInt(leadId, 10) : null,
        jobNumber,
        customerName,
        customerPhone ?? null,
        customerEmail ?? null,
        address ?? null,
        city ?? null,
        zip ?? null,
        serviceType,
        Number(contractValue) || 0,
        scheduledStart ?? null,
        Number(estimatedDays) || 3,
        crewLead ?? null,
        notes ?? null,
      ]
    );

    return NextResponse.json({ ok: true, job: rows[0] });
  } catch (err) {
    console.error('[api/admin/jobs POST]', err);
    return NextResponse.json({ error: 'Server error creating job' }, { status: 500 });
  }
}

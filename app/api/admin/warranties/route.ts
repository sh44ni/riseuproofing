import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const jobId = searchParams.get('job_id');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (jobId) {
    params.push(parseInt(jobId, 10));
    conditions.push(`w.job_id = $${params.length}`);
  }

  if (status && status !== 'all') {
    if (status === 'checkin_due') {
      conditions.push(
        `((w.checkin_6mo_completed = false AND w.checkin_6mo_due <= CURRENT_DATE + INTERVAL '14 days') OR 
          (w.checkin_1yr_completed = false AND w.checkin_1yr_due <= CURRENT_DATE + INTERVAL '14 days'))`
      );
    } else {
      params.push(status);
      conditions.push(`w.status = $${params.length}`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT w.*, 
            j.job_number, j.customer_name, j.customer_phone, j.customer_email, 
            j.address, j.city, j.service_type, j.contract_value,
            e.material_type, e.roof_squares
     FROM warranties w
     LEFT JOIN jobs j ON w.job_id = j.id
     LEFT JOIN estimates e ON j.estimate_id = e.id
     ${where}
     ORDER BY w.created_at DESC`,
    params
  );

  // Summary counts
  const [stats] = await query<{
    total_warranties: string;
    active_count: string;
    checkin_6mo_due: string;
    checkin_1yr_due: string;
  }>(`
    SELECT 
      COUNT(*) as total_warranties,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
      COUNT(CASE WHEN checkin_6mo_completed = false AND checkin_6mo_due <= CURRENT_DATE + INTERVAL '14 days' THEN 1 END) as checkin_6mo_due,
      COUNT(CASE WHEN checkin_1yr_completed = false AND checkin_1yr_due <= CURRENT_DATE + INTERVAL '14 days' THEN 1 END) as checkin_1yr_due
    FROM warranties
  `);

  return NextResponse.json({
    warranties: rows,
    summary: {
      totalWarranties: parseInt(stats?.total_warranties || '0', 10),
      activeCount: parseInt(stats?.active_count || '0', 10),
      checkin6moDue: parseInt(stats?.checkin_6mo_due || '0', 10),
      checkin1yrDue: parseInt(stats?.checkin_1yr_due || '0', 10),
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
      jobId,
      warrantyType = 'Owens Corning Preferred Protection (50-Yr System)',
      startDate,
      yearsDuration = 50,
      coverageDetails,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const jobRows = await query<any>(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
    if (!jobRows || jobRows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobRows[0];

    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM warranties`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const warrantyNumber = `WAR-${year}-${seq}`;

    const start = startDate ? new Date(startDate) : new Date();
    const startDateStr = start.toISOString().slice(0, 10);

    const expDate = new Date(start);
    expDate.setFullYear(expDate.getFullYear() + (parseInt(yearsDuration, 10) || 50));
    const expirationDateStr = expDate.toISOString().slice(0, 10);

    const checkin6mo = new Date(start);
    checkin6mo.setMonth(checkin6mo.getMonth() + 6);
    const checkin6moStr = checkin6mo.toISOString().slice(0, 10);

    const checkin1yr = new Date(start);
    checkin1yr.setFullYear(checkin1yr.getFullYear() + 1);
    const checkin1yrStr = checkin1yr.toISOString().slice(0, 10);

    const defaultCoverage =
      coverageDetails ||
      'Owens Corning Preferred Protection System Warranty (50-Year Non-Prorated TruDefinition Duration Shingles) with Rise Up Roofing 10-Year Workmanship Guarantee. CSLB #1096492.';

    const rows = await query<any>(
      `INSERT INTO warranties (
        job_id, lead_id, warranty_number, warranty_type, start_date, expiration_date,
        coverage_details, status, checkin_6mo_due, checkin_1yr_due
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
      RETURNING *`,
      [
        job.id,
        job.lead_id,
        warrantyNumber,
        warrantyType,
        startDateStr,
        expirationDateStr,
        defaultCoverage,
        checkin6moStr,
        checkin1yrStr,
      ]
    );

    // Log to lead activity timeline
    if (job.lead_id) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'status_change', $2, $3, 'Warranty Dept')`,
        [
          job.lead_id,
          `Warranty Certificate Issued: ${warrantyNumber}`,
          `${warrantyType} issued. Valid through ${expirationDateStr}. 6-month inspection scheduled for ${checkin6moStr}.`,
        ]
      );
    }

    return NextResponse.json({ ok: true, warranty: rows[0] });
  } catch (err) {
    console.error('[api/admin/warranties POST]', err);
    return NextResponse.json({ error: 'Server error creating warranty' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, checkin6moCompleted, checkin1yrCompleted, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Warranty ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (checkin6moCompleted !== undefined) {
      params.push(Boolean(checkin6moCompleted));
      updates.push(`checkin_6mo_completed = $${params.length}`);
    }
    if (checkin1yrCompleted !== undefined) {
      params.push(Boolean(checkin1yrCompleted));
      updates.push(`checkin_1yr_completed = $${params.length}`);
    }
    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const rows = await query<any>(
      `UPDATE warranties SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    const war = rows[0];

    // Log check-in completion to timeline if lead exists
    if (war && (checkin6moCompleted || checkin1yrCompleted)) {
      const jobRows = await query<any>(`SELECT lead_id FROM jobs WHERE id = $1`, [war.job_id]);
      if (jobRows && jobRows.length > 0 && jobRows[0].lead_id) {
        const milestone = checkin6moCompleted ? '6-Month Post-Job Check-In' : '1-Year Post-Job Check-In';
        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ('lead', $1, 'visit', $2, $3, 'Field Inspector')`,
          [
            jobRows[0].lead_id,
            `Warranty Follow-up Completed: ${milestone}`,
            `Verified roof flashing, valleys, and underlayment for ${war.warranty_number}. Homeowner in good standing.`,
          ]
        );
      }
    }

    return NextResponse.json({ ok: true, warranty: war });
  } catch (err) {
    console.error('[api/admin/warranties PATCH]', err);
    return NextResponse.json({ error: 'Server error updating warranty' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { calculateRoofEstimate, ROOFING_MATERIALS } from '@/lib/crm-calculator';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const leadId = searchParams.get('lead_id');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (leadId) {
    params.push(parseInt(leadId, 10));
    conditions.push(`lead_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [estimates, stats] = await Promise.all([
    query<any>(`SELECT * FROM estimates ${where} ORDER BY created_at DESC`, params),
    query<{
      total_count: string;
      pipeline_value: string;
      accepted_count: string;
      accepted_value: string;
    }>(
      `SELECT 
         COUNT(*) as total_count,
         COALESCE(SUM(total), 0) as pipeline_value,
         COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
         COALESCE(SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END), 0) as accepted_value
       FROM estimates`
    ),
  ]);

  const summary = stats[0] || {
    total_count: '0',
    pipeline_value: '0',
    accepted_count: '0',
    accepted_value: '0',
  };

  return NextResponse.json({
    estimates,
    summary: {
      totalCount: parseInt(summary.total_count, 10),
      pipelineValue: parseFloat(summary.pipeline_value),
      acceptedCount: parseInt(summary.accepted_count, 10),
      acceptedValue: parseFloat(summary.accepted_value),
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
      customerAddress,
      customerCity,
      customerZip,
      serviceType = 'Residential Roofing',
      roofSquares = 25,
      roofPitch = '4:12',
      stories = 1,
      tearoffLayers = 1,
      materialId = 'oc_duration',
      addons = [],
      marginPct = 30,
      financingMonths = 60,
      validDays = 30,
      notes,
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Calculate costs
    const calc = calculateRoofEstimate({
      roofSquares: Number(roofSquares),
      materialId,
      pitch: roofPitch,
      stories: Number(stories),
      tearoffLayers: Number(tearoffLayers),
      addons,
      marginPct: Number(marginPct),
      financingMonths: Number(financingMonths),
    });

    // Generate unique estimate number EST-YYYY-XXXX
    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM estimates`);
    const nextSeq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const estimateNumber = `EST-${year}-${nextSeq}`;

    // Valid until
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const rows = await query<any>(
      `INSERT INTO estimates (
        lead_id, estimate_number, status, customer_name, customer_phone, customer_email,
        customer_address, customer_city, customer_zip, service_type,
        roof_squares, roof_pitch, stories, tearoff_layers, material_type,
        material_cost, labor_cost, addons, subtotal, margin_pct, total,
        financing_months, monthly_payment, valid_until, notes
      ) VALUES (
        $1, $2, 'draft', $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24
      ) RETURNING *`,
      [
        leadId ? parseInt(leadId, 10) : null,
        estimateNumber,
        customerName,
        customerPhone ?? null,
        customerEmail ?? null,
        customerAddress ?? null,
        customerCity ?? null,
        customerZip ?? null,
        serviceType,
        calc.squares,
        roofPitch,
        stories,
        tearoffLayers,
        calc.material.name,
        calc.materialSubtotal,
        calc.laborSubtotal + calc.tearoffSubtotal,
        JSON.stringify(calc.addonsDetail),
        calc.costSubtotal,
        calc.marginPct,
        calc.totalPrice,
        financingMonths,
        calc.monthlyPayment,
        validUntil.toISOString().slice(0, 10),
        notes ?? null,
      ]
    );

    const newEstimate = rows[0];

    // Log to Lead Activity if linked
    if (leadId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'note', $2, $3, 'Staff')`,
        [
          parseInt(leadId, 10),
          `Estimate Created: ${estimateNumber}`,
          `Total: $${calc.totalPrice.toLocaleString()} (${calc.squares} sq, ${calc.material.name})`,
        ]
      );

      // Update lead status to 'quoted' if was 'new' or 'contacted'
      await query(
        `UPDATE leads SET status = 'quoted' WHERE id = $1 AND status IN ('new', 'contacted', 'inspected')`,
        [parseInt(leadId, 10)]
      );
    }

    return NextResponse.json({ ok: true, estimate: newEstimate });
  } catch (err) {
    console.error('[api/admin/estimates POST]', err);
    return NextResponse.json({ error: 'Server error creating estimate' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, hasPermission } from '@/lib/admin-auth';
import { buildScopeFilter } from '@/lib/permissions';
import { query } from '@/lib/db';
import { calculateRoofEstimate, ROOFING_MATERIALS } from '@/lib/crm-calculator';
import { findOrCreateClient, recalculateClientStats } from '@/lib/crm-clients';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('estimates:view');
  if (auth.response) return auth.response;

  const canViewMargins = hasPermission(auth.user, 'estimates:view_margins');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const leadId = searchParams.get('lead_id');

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Enforce dynamic scope filtering (§3 & §8)
  const scopeFilter = buildScopeFilter(auth.user, 'estimates.view', {
    creatorCol: 'COALESCE(estimates.created_by, (SELECT created_by_user_id FROM leads WHERE leads.id = estimates.lead_id))',
    assignedCol: '(SELECT assigned_to_user_id FROM leads WHERE leads.id = estimates.lead_id)',
    paramOffset: params.length + 1,
  });

  if (!scopeFilter.allowed) {
    return NextResponse.json({ ok: false, error: 'Forbidden: Insufficient permissions to view estimates' }, { status: 403 });
  }

  if (scopeFilter.clause !== '1=1') {
    conditions.push(scopeFilter.clause);
    params.push(...scopeFilter.params);
  }

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

  const sanitizedEstimates = canViewMargins
    ? estimates
    : estimates.map(e => {
        const { material_cost, labor_cost, margin_pct, ...rest } = e;
        return rest;
      });

  return NextResponse.json({
    estimates: sanitizedEstimates,
    summary: {
      totalCount: parseInt(summary.total_count, 10),
      pipelineValue: parseFloat(summary.pipeline_value),
      acceptedCount: parseInt(summary.accepted_count, 10),
      acceptedValue: parseFloat(summary.accepted_value),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('estimates:create');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      leadId,
      clientId,
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

    const calc = calculateRoofEstimate({
      roofSquares: Number(roofSquares),
      pitch: roofPitch,
      stories: Number(stories),
      tearoffLayers: Number(tearoffLayers),
      materialId,
      addons,
      marginPct: Number(marginPct),
      financingMonths: Number(financingMonths),
    });

    // Resolve or link client_id
    let finalClientId: number | null = clientId ? parseInt(clientId, 10) : null;
    if (!finalClientId && leadId) {
      const leadRows = await query<{ client_id: number | null }>(`SELECT client_id FROM leads WHERE id = $1`, [parseInt(leadId, 10)]);
      if (leadRows[0]?.client_id) {
        finalClientId = leadRows[0].client_id;
      }
    }
    if (!finalClientId && (customerPhone || customerEmail)) {
      try {
        const client = await findOrCreateClient({
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          city: customerCity,
          zip: customerZip,
          leadSource: 'estimate_generator',
        });
        finalClientId = client.id;
      } catch (e) {
        console.warn('Could not auto-link client for estimate:', e);
      }
    }

    // Resolve attribution snapshot (§7)
    let estimateCreatedBy: number = auth.user.id;
    let estimateRoleSnapshot: string = (auth.user.roles && auth.user.roles.length > 0)
      ? auth.user.roles.map(r => r.name).join(', ')
      : (auth.user.role || 'Staff');

    if (leadId) {
      try {
        const leadAttr = await query<any>(
          `SELECT created_by, created_by_user_id, created_by_role_snapshot FROM leads WHERE id = $1`,
          [parseInt(leadId, 10)]
        );
        if (leadAttr.length > 0) {
          const l = leadAttr[0];
          if (l.created_by || l.created_by_user_id) {
            estimateCreatedBy = Number(l.created_by || l.created_by_user_id);
          }
          if (l.created_by_role_snapshot) {
            estimateRoleSnapshot = l.created_by_role_snapshot;
          }
        }
      } catch (err) {
        console.warn('[estimates POST] Failed to fetch lead attribution:', err);
      }
    }

    // Auto-generate Estimate Number (e.g. EST-2026-0001)
    const year = new Date().getFullYear();
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM estimates`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const estimateNumber = `EST-${year}-${seq}`;

    // Valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (Number(validDays) || 30));

    // Generate high-entropy access token for secure portal verification
    const accessToken = crypto.randomBytes(16).toString('hex');

    const rows = await query<any>(
      `INSERT INTO estimates (
        lead_id, client_id, estimate_number, status, customer_name, customer_phone, customer_email,
        customer_address, customer_city, customer_zip, service_type,
        roof_squares, roof_pitch, stories, tearoff_layers, material_type,
        material_cost, labor_cost, addons, subtotal, margin_pct, total,
        financing_months, monthly_payment, valid_until, notes, access_token,
        created_by, created_by_role_snapshot
      ) VALUES (
        $1, $2, $3, 'draft', $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26,
        $27, $28
      ) RETURNING *`,
      [
        leadId ? parseInt(leadId, 10) : null,
        finalClientId,
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
        accessToken,
        estimateCreatedBy,
        estimateRoleSnapshot,
      ]
    );

    const newEstimate = rows[0];

    // Log to Lead Activity if linked
    if (leadId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
         VALUES ('lead', $1, 'note', $2, $3, 'Staff', $4)`,
        [
          parseInt(leadId, 10),
          `Estimate Created: ${estimateNumber}`,
          `Total: $${calc.totalPrice.toLocaleString()} (${calc.squares} sq, ${calc.material.name})`,
          finalClientId,
        ]
      );

      // Update lead status to 'quoted' if was 'new' or 'contacted'
      await query(
        `UPDATE leads SET status = 'quoted' WHERE id = $1 AND status IN ('new', 'contacted', 'inspected')`,
        [parseInt(leadId, 10)]
      );
    }

    if (finalClientId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by, client_id)
         VALUES ('client', $1, 'quote_sent', $2, $3, 'Staff', $1)`,
        [
          finalClientId,
          `Estimate Created: ${estimateNumber}`,
          `Total: $${calc.totalPrice.toLocaleString()} (${calc.squares} sq, ${calc.material.name})`,
        ]
      );
      await recalculateClientStats(finalClientId);
    }

    return NextResponse.json({ ok: true, estimate: newEstimate });
  } catch (err) {
    console.error('[api/admin/estimates POST]', err);
    return NextResponse.json({ error: 'Server error creating estimate' }, { status: 500 });
  }
}

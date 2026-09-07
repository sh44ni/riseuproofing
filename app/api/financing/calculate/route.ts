import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateFinancing } from '@/lib/financing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, projectCost, downPayment = 0, sessionId } = body;

    const rawCost = Number(projectCost);
    if (isNaN(rawCost) || rawCost <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Valid project cost is required' },
        { status: 400 }
      );
    }

    // Fetch settings for boundary validation
    const settingsRows = await query<{
      min_project_cost: string;
      max_project_cost: string;
    }>('SELECT min_project_cost, max_project_cost FROM financing_settings WHERE id = 1 LIMIT 1');

    const minCost = Number(settingsRows[0]?.min_project_cost || 5000);
    const maxCost = Number(settingsRows[0]?.max_project_cost || 50000);

    const clampedCost = Math.min(Math.max(rawCost, minCost), maxCost);

    // Fetch chosen plan or default plan
    let planQuery = 'SELECT id, name, apr, term_months, min_down_payment_pct, is_default FROM financing_plans WHERE ';
    const params: unknown[] = [];
    if (planId) {
      planQuery += 'id = $1 AND is_active = true';
      params.push(planId);
    } else {
      planQuery += 'is_default = true AND is_active = true LIMIT 1';
    }

    let planRows = await query<{
      id: number;
      name: string;
      apr: string;
      term_months: number;
      min_down_payment_pct: string;
      is_default: boolean;
    }>(planQuery, params);

    // Fallback to first active plan if specified ID is not found
    if (planRows.length === 0) {
      planRows = await query<{
        id: number;
        name: string;
        apr: string;
        term_months: number;
        min_down_payment_pct: string;
        is_default: boolean;
      }>('SELECT id, name, apr, term_months, min_down_payment_pct, is_default FROM financing_plans WHERE is_active = true ORDER BY sort_order ASC LIMIT 1');
    }

    if (planRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No active financing plans available' },
        { status: 404 }
      );
    }

    const plan = planRows[0];
    const minDownPct = Number(plan.min_down_payment_pct || 0);
    const minRequiredDown = Math.round((clampedCost * minDownPct) / 100);

    const rawDown = Number(downPayment || 0);
    const clampedDown = Math.min(clampedCost, Math.max(minRequiredDown, isNaN(rawDown) ? 0 : rawDown));

    const result = calculateFinancing(
      {
        name: plan.name,
        apr: Number(plan.apr),
        termMonths: plan.term_months,
      },
      clampedCost,
      clampedDown
    );

    // Asynchronously log anonymous telemetry
    query(
      `INSERT INTO financing_calculations (plan_id, project_cost, down_payment, monthly_payment, session_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        plan.id,
        clampedCost,
        clampedDown,
        result.monthlyPayment,
        sessionId ? String(sessionId).slice(0, 100) : null,
      ]
    ).catch((err) => {
      console.warn('[financing_calculations] Telemetry log error:', err);
    });

    return NextResponse.json({
      ok: true,
      planId: plan.id,
      planName: plan.name,
      apr: result.apr,
      termMonths: result.termMonths,
      projectCost: clampedCost,
      downPayment: clampedDown,
      principal: result.principal,
      monthlyPayment: result.monthlyPayment,
      totalInterest: result.totalInterest,
      totalCost: result.totalCost,
      formattedMonthly: result.formattedMonthly,
      formattedPrincipal: result.formattedPrincipal,
      formattedInterest: result.formattedInterest,
      formattedTotalCost: result.formattedTotalCost,
    });
  } catch (err) {
    console.error('[api/financing/calculate]', err);
    return NextResponse.json({ ok: false, error: 'Calculation failed' }, { status: 500 });
  }
}

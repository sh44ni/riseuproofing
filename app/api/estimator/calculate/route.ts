import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateEstimate, type EstimatorPricingRule } from '@/lib/estimator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, sqft, source = 'preset', sessionId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { ok: false, error: 'Service identifier is required' },
        { status: 400 }
      );
    }

    const rawSqftNum = Number(sqft);
    if (isNaN(rawSqftNum) || rawSqftNum <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid square footage greater than 0' },
        { status: 400 }
      );
    }

    // Look up service either by ID or by slug
    const isNumericId = typeof serviceId === 'number' || /^\d+$/.test(String(serviceId));
    const serviceRows = await query<{
      id: number;
      slug: string;
      name: string;
      price_per_sqft_low: string;
      price_per_sqft_high: string;
      base_fee_low: string;
      base_fee_high: string;
      min_sqft: number | null;
      max_sqft: number | null;
      apr_available: boolean;
      financing_apr: string | null;
      financing_term_months: number | null;
    }>(
      `SELECT s.id, s.slug, s.name, p.price_per_sqft_low, p.price_per_sqft_high,
              p.base_fee_low, p.base_fee_high, p.min_sqft, p.max_sqft,
              p.apr_available, p.financing_apr, p.financing_term_months
       FROM estimator_services s
       JOIN estimator_pricing_rules p ON s.id = p.service_id
       WHERE ${isNumericId ? 's.id = $1' : 's.slug = $1'} AND s.is_active = true
       LIMIT 1`,
      [serviceId]
    );

    if (serviceRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Selected roofing service is not found or inactive' },
        { status: 404 }
      );
    }

    const s = serviceRows[0];
    const pricing: EstimatorPricingRule = {
      pricePerSqftLow: Number(s.price_per_sqft_low),
      pricePerSqftHigh: Number(s.price_per_sqft_high),
      baseFeeLow: Number(s.base_fee_low),
      baseFeeHigh: Number(s.base_fee_high),
      minSqft: s.min_sqft ?? 500,
      maxSqft: s.max_sqft ?? 12000,
      aprAvailable: s.apr_available,
      financingApr: Number(s.financing_apr || 0),
      financingTermMonths: s.financing_term_months || 60,
    };

    const result = calculateEstimate(pricing, rawSqftNum);

    // Asynchronously log anonymous calculation to estimator_leads
    query(
      `INSERT INTO estimator_leads (service_id, sqft_entered, estimate_low, estimate_high, source, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        s.id,
        result.clampedSqft,
        result.low,
        result.high,
        source === 'custom' ? 'custom' : 'preset',
        sessionId ? String(sessionId).slice(0, 100) : null,
      ]
    ).catch((logErr) => {
      console.warn('[estimator_leads] Telemetry logging error:', logErr);
    });

    return NextResponse.json({
      ok: true,
      serviceId: s.id,
      serviceSlug: s.slug,
      serviceName: s.name,
      low: result.low,
      high: result.high,
      monthlyEstimate: result.monthlyEstimate,
      aprAvailable: result.aprAvailable,
      formattedRange: result.formattedRange,
      formattedMonthly: result.formattedMonthly,
      clampedSqft: result.clampedSqft,
    });
  } catch (err) {
    console.error('[api/estimator/calculate]', err);
    return NextResponse.json({ ok: false, error: 'Calculation failed' }, { status: 500 });
  }
}

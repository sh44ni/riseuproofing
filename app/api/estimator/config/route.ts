import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { EstimatorService, EstimatorSizePreset } from '@/lib/estimator';

export const revalidate = 3600; // 1 hour ISR fallback

export async function GET() {
  try {
    const rawServices = await query<{
      id: number;
      slug: string;
      name: string;
      short_label: string;
      icon_key: string;
      badge_label: string | null;
      sort_order: number;
      is_active: boolean;
      price_per_sqft_low: string;
      price_per_sqft_high: string;
      base_fee_low: string;
      base_fee_high: string;
      min_sqft: number | null;
      max_sqft: number | null;
      apr_available: boolean;
      financing_apr: string | null;
      financing_term_months: number | null;
    }>(`
      SELECT 
        s.id, s.slug, s.name, s.short_label, s.icon_key, s.badge_label, s.sort_order, s.is_active,
        p.price_per_sqft_low, p.price_per_sqft_high, p.base_fee_low, p.base_fee_high,
        p.min_sqft, p.max_sqft, p.apr_available, p.financing_apr, p.financing_term_months
      FROM estimator_services s
      JOIN estimator_pricing_rules p ON s.id = p.service_id
      WHERE s.is_active = true
      ORDER BY s.sort_order ASC
    `);

    const rawPresets = await query<{
      id: number;
      service_id: number | null;
      label: string;
      sqft_value: number;
      sort_order: number;
    }>(`
      SELECT id, service_id, label, sqft_value, sort_order
      FROM estimator_size_presets
      ORDER BY sort_order ASC
    `);

    // Separate global presets and per-service presets
    const globalPresets: EstimatorSizePreset[] = rawPresets
      .filter((p) => p.service_id === null)
      .map((p) => ({
        id: p.id,
        serviceId: null,
        label: p.label,
        sqftValue: p.sqft_value,
        sortOrder: p.sort_order,
      }));

    const services: EstimatorService[] = rawServices.map((s) => {
      const serviceSpecificPresets = rawPresets
        .filter((p) => p.service_id === s.id)
        .map((p) => ({
          id: p.id,
          serviceId: s.id,
          label: p.label,
          sqftValue: p.sqft_value,
          sortOrder: p.sort_order,
        }));

      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortLabel: s.short_label,
        iconKey: s.icon_key,
        badgeLabel: s.badge_label,
        sortOrder: s.sort_order,
        isActive: s.is_active,
        pricing: {
          pricePerSqftLow: Number(s.price_per_sqft_low),
          pricePerSqftHigh: Number(s.price_per_sqft_high),
          baseFeeLow: Number(s.base_fee_low),
          baseFeeHigh: Number(s.base_fee_high),
          minSqft: s.min_sqft ?? 500,
          maxSqft: s.max_sqft ?? 12000,
          aprAvailable: s.apr_available,
          financingApr: Number(s.financing_apr || 0),
          financingTermMonths: s.financing_term_months || 60,
        },
        presets: serviceSpecificPresets.length > 0 ? serviceSpecificPresets : globalPresets,
      };
    });

    return NextResponse.json(
      { ok: true, services },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('[api/estimator/config]', err);
    return NextResponse.json({ ok: false, error: 'Failed to load estimator configuration' }, { status: 500 });
  }
}

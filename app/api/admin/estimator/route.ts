import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/admin-auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser, 'settings:edit') && currentUser.role !== 'owner' && currentUser.role !== 'project_manager') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const services = await query<{
      id: number;
      slug: string;
      name: string;
      short_label: string;
      icon_key: string;
      badge_label: string | null;
      sort_order: number;
      is_active: boolean;
      created_at: string;
      pricing_id: number;
      price_per_sqft_low: string;
      price_per_sqft_high: string;
      base_fee_low: string;
      base_fee_high: string;
      min_sqft: number | null;
      max_sqft: number | null;
      apr_available: boolean;
      financing_apr: string | null;
      financing_term_months: number | null;
      updated_at: string;
      updated_by: string | null;
    }>(`
      SELECT 
        s.id, s.slug, s.name, s.short_label, s.icon_key, s.badge_label, s.sort_order, s.is_active, s.created_at,
        p.id as pricing_id, p.price_per_sqft_low, p.price_per_sqft_high, p.base_fee_low, p.base_fee_high,
        p.min_sqft, p.max_sqft, p.apr_available, p.financing_apr, p.financing_term_months,
        p.updated_at, p.updated_by
      FROM estimator_services s
      LEFT JOIN estimator_pricing_rules p ON s.id = p.service_id
      ORDER BY s.sort_order ASC
    `);

    const presets = await query<{
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

    const leads = await query<{
      id: string;
      service_name: string | null;
      sqft_entered: number;
      estimate_low: string;
      estimate_high: string;
      source: string;
      session_id: string | null;
      created_at: string;
    }>(`
      SELECT l.id, s.name as service_name, l.sqft_entered, l.estimate_low, l.estimate_high, l.source, l.session_id, l.created_at
      FROM estimator_leads l
      LEFT JOIN estimator_services s ON l.service_id = s.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({
      ok: true,
      services: services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortLabel: s.short_label,
        iconKey: s.icon_key,
        badgeLabel: s.badge_label,
        sortOrder: s.sort_order,
        isActive: s.is_active,
        pricing: {
          id: s.pricing_id,
          pricePerSqftLow: Number(s.price_per_sqft_low ?? 0),
          pricePerSqftHigh: Number(s.price_per_sqft_high ?? 0),
          baseFeeLow: Number(s.base_fee_low ?? 0),
          baseFeeHigh: Number(s.base_fee_high ?? 0),
          minSqft: s.min_sqft ?? 500,
          maxSqft: s.max_sqft ?? 12000,
          aprAvailable: Boolean(s.apr_available),
          financingApr: Number(s.financing_apr ?? 0),
          financingTermMonths: s.financing_term_months ?? 60,
          updatedAt: s.updated_at,
          updatedBy: s.updated_by,
        },
      })),
      presets: presets.map((p) => ({
        id: p.id,
        serviceId: p.service_id,
        label: p.label,
        sqftValue: p.sqft_value,
        sortOrder: p.sort_order,
      })),
      leads: leads.map((l) => ({
        id: l.id,
        serviceName: l.service_name ?? 'Unknown',
        sqftEntered: l.sqft_entered,
        estimateLow: Number(l.estimate_low),
        estimateHigh: Number(l.estimate_high),
        source: l.source,
        sessionId: l.session_id,
        createdAt: l.created_at,
      })),
    });
  } catch (err) {
    console.error('[api/admin/estimator GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser, 'settings:edit') && currentUser.role !== 'owner' && currentUser.role !== 'project_manager') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── 1. Update Pricing Rules ──────────────────────────────────────────────
    if (action === 'update_pricing') {
      const {
        serviceId,
        pricePerSqftLow,
        pricePerSqftHigh,
        baseFeeLow,
        baseFeeHigh,
        minSqft,
        maxSqft,
        aprAvailable,
        financingApr,
        financingTermMonths,
      } = body;

      if (!serviceId) {
        return NextResponse.json({ ok: false, error: 'Service ID is required' }, { status: 400 });
      }

      const lowPrice = Number(pricePerSqftLow);
      const highPrice = Number(pricePerSqftHigh);
      const lowBase = Number(baseFeeLow);
      const highBase = Number(baseFeeHigh);
      const minS = Number(minSqft);
      const maxS = Number(maxSqft);
      const aprVal = Number(financingApr || 0);
      const termVal = Number(financingTermMonths || 60);

      // Validation
      if (isNaN(lowPrice) || lowPrice < 0) {
        return NextResponse.json({ ok: false, error: 'Price/sqft (Low) must be a non-negative number' }, { status: 400 });
      }
      if (isNaN(highPrice) || highPrice < lowPrice) {
        return NextResponse.json({ ok: false, error: 'Price/sqft (High) must be greater than or equal to Low price' }, { status: 400 });
      }
      if (isNaN(lowBase) || lowBase < 0) {
        return NextResponse.json({ ok: false, error: 'Base Fee (Low) must be non-negative' }, { status: 400 });
      }
      if (isNaN(highBase) || highBase < lowBase) {
        return NextResponse.json({ ok: false, error: 'Base Fee (High) must be greater than or equal to Base Fee (Low)' }, { status: 400 });
      }
      if (minS <= 0 || maxS < minS) {
        return NextResponse.json({ ok: false, error: 'Invalid min/max square footage bounds' }, { status: 400 });
      }
      if (termVal <= 0) {
        return NextResponse.json({ ok: false, error: 'Financing term months must be at least 1' }, { status: 400 });
      }

      await query(
        `UPDATE estimator_pricing_rules
         SET price_per_sqft_low = $1,
             price_per_sqft_high = $2,
             base_fee_low = $3,
             base_fee_high = $4,
             min_sqft = $5,
             max_sqft = $6,
             apr_available = $7,
             financing_apr = $8,
             financing_term_months = $9,
             updated_at = NOW(),
             updated_by = $10
         WHERE service_id = $11`,
        [
          lowPrice,
          highPrice,
          lowBase,
          highBase,
          minS,
          maxS,
          Boolean(aprAvailable),
          aprVal,
          termVal,
          currentUser.name,
          serviceId,
        ]
      );

      // Invalidate public caches immediately
      try {
        revalidatePath('/');
        revalidatePath('/api/estimator/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Pricing rules updated successfully' });
    }

    // ── 2. Update or Create Service ──────────────────────────────────────────
    if (action === 'save_service') {
      const { id, name, shortLabel, iconKey, badgeLabel, sortOrder, isActive, slug } = body;

      if (!name || !shortLabel || !iconKey) {
        return NextResponse.json({ ok: false, error: 'Name, short label, and icon key are required' }, { status: 400 });
      }

      if (id) {
        // Update existing service
        await query(
          `UPDATE estimator_services
           SET name = $1, short_label = $2, icon_key = $3, badge_label = $4, sort_order = $5, is_active = $6
           WHERE id = $7`,
          [name, shortLabel, iconKey, badgeLabel || null, Number(sortOrder) || 0, Boolean(isActive), id]
        );
      } else {
        // Create new service
        const safeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const res = await query<{ id: number }>(
          `INSERT INTO estimator_services (slug, name, short_label, icon_key, badge_label, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [safeSlug, name, shortLabel, iconKey, badgeLabel || null, Number(sortOrder) || 10, Boolean(isActive)]
        );

        const newId = res[0].id;
        // Insert default pricing rules for the new service
        await query(
          `INSERT INTO estimator_pricing_rules (
             service_id, price_per_sqft_low, price_per_sqft_high, base_fee_low, base_fee_high,
             min_sqft, max_sqft, apr_available, financing_apr, financing_term_months, updated_by
           ) VALUES ($1, 4.00, 6.50, 500, 1000, 800, 8000, true, 0, 60, $2)`,
          [newId, currentUser.name]
        );
      }

      try {
        revalidatePath('/');
        revalidatePath('/api/estimator/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Service saved successfully' });
    }

    // ── 3. Save / Reorder Presets ───────────────────────────────────────────
    if (action === 'save_preset') {
      const { id, serviceId, label, sqftValue, sortOrder } = body;

      if (!label || !sqftValue || Number(sqftValue) <= 0) {
        return NextResponse.json({ ok: false, error: 'Preset label and positive sqft value are required' }, { status: 400 });
      }

      if (id) {
        await query(
          `UPDATE estimator_size_presets
           SET label = $1, sqft_value = $2, sort_order = $3, service_id = $4
           WHERE id = $5`,
          [label, Number(sqftValue), Number(sortOrder) || 0, serviceId || null, id]
        );
      } else {
        await query(
          `INSERT INTO estimator_size_presets (service_id, label, sqft_value, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [serviceId || null, label, Number(sqftValue), Number(sortOrder) || 0]
        );
      }

      try {
        revalidatePath('/');
        revalidatePath('/api/estimator/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Preset saved successfully' });
    }

    // ── 4. Delete Preset ────────────────────────────────────────────────────
    if (action === 'delete_preset') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Preset ID is required' }, { status: 400 });
      }

      await query('DELETE FROM estimator_size_presets WHERE id = $1', [id]);

      try {
        revalidatePath('/');
        revalidatePath('/api/estimator/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Preset deleted successfully' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/estimator POST]', err);
    return NextResponse.json({ ok: false, error: 'Operation failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { hasPermission } from '@/lib/permissions';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  try {
    // 1. Fetch templates
    const templates = await query<any>(`
      SELECT * FROM estimate_templates 
      WHERE is_active = true 
      ORDER BY sort_order ASC, id ASC
    `);

    // 2. Fetch current estimator pricing rules to attach dynamic per-sqft rates
    const pricingRules = await query<any>(`
      SELECT 
        r.id, r.service_id, r.price_per_sqft_low, r.price_per_sqft_high,
        r.base_fee_low, r.base_fee_high, r.min_sqft, r.max_sqft,
        s.slug as service_slug, s.name as service_name
      FROM estimator_pricing_rules r
      JOIN estimator_services s ON r.service_id = s.id
      WHERE s.is_active = true
    `);

    const rulesBySlug = new Map<string, any>();
    for (const r of pricingRules) {
      rulesBySlug.set(r.service_slug, r);
    }

    // Merge pricing rules into templates
    const enrichedTemplates = templates.map((t) => {
      // Map template to service slug
      let slug = 'residential';
      if (t.template_key.includes('repair')) {
        slug = 'repair';
      }

      const rule = rulesBySlug.get(slug) || rulesBySlug.get('residential');
      const baseSqftLow = rule ? Number(rule.price_per_sqft_low) : 4.0;
      const baseSqftHigh = rule ? Number(rule.price_per_sqft_high) : 6.2;

      const multBudget = Number(t.price_multiplier_budget) || 1.0;
      const multPremium = Number(t.price_multiplier_premium) || 1.25;

      return {
        id: t.id,
        template_key: t.template_key,
        name: t.name,
        service_type: t.service_type,
        description: t.description,
        service_slug: slug,
        // Pricing rules derived from Estimator Settings
        pricing_rule: {
          base_rate_sqft_low: baseSqftLow,
          base_rate_sqft_high: baseSqftHigh,
          budget_rate_sqft: Math.round(baseSqftLow * multBudget * 100) / 100,
          premium_rate_sqft: Math.round(baseSqftHigh * multPremium * 100) / 100,
          base_fee_low: rule ? Number(rule.base_fee_low) : 500,
          base_fee_high: rule ? Number(rule.base_fee_high) : 950,
          min_sqft: rule ? Number(rule.min_sqft) : 500,
          max_sqft: rule ? Number(rule.max_sqft) : 10000,
        },
        budget_tier: {
          name: t.budget_tier_name,
          materials: t.budget_material_details,
          scope_of_work: t.budget_scope_of_work,
          multiplier: multBudget,
        },
        premium_tier: {
          name: t.premium_tier_name,
          materials: t.premium_material_details,
          scope_of_work: t.premium_scope_of_work,
          multiplier: multPremium,
        },
        warranty_years: t.warranty_years,
      };
    });

    return NextResponse.json({
      ok: true,
      templates: enrichedTemplates,
    });
  } catch (err) {
    console.error('[estimate-templates GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error fetching estimate templates' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  // Only owner or users with roles.edit / estimates.manage can edit boilerplate scope
  if (auth.user.role !== 'owner' && !hasPermission(auth.user, 'settings.edit')) {
    return NextResponse.json({ ok: false, error: 'Only owners or managers can modify estimate template scopes' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, budget_scope_of_work, premium_scope_of_work, budget_material_details, premium_material_details } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Template ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE estimate_templates
       SET 
         budget_scope_of_work = COALESCE($1, budget_scope_of_work),
         premium_scope_of_work = COALESCE($2, premium_scope_of_work),
         budget_material_details = COALESCE($3, budget_material_details),
         premium_material_details = COALESCE($4, premium_material_details),
         updated_at = NOW(),
         updated_by = $5
       WHERE id = $6`,
      [budget_scope_of_work, premium_scope_of_work, budget_material_details, premium_material_details, auth.user.name, id]
    );

    return NextResponse.json({ ok: true, message: 'Estimate template scope updated successfully' });
  } catch (err) {
    console.error('[estimate-templates PATCH]', err);
    return NextResponse.json({ ok: false, error: 'Failed to update template' }, { status: 500 });
  }
}

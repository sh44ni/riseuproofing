import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { FinancingPlan, FinancingSettings } from '@/lib/financing';

export const revalidate = 3600; // 1 hour ISR fallback

export async function GET() {
  try {
    const plansRaw = await query<{
      id: number;
      name: string;
      apr: string;
      term_months: number;
      min_down_payment_pct: string;
      is_default: boolean;
      is_active: boolean;
      sort_order: number;
      badge_label: string | null;
      description: string | null;
    }>(`
      SELECT id, name, apr, term_months, min_down_payment_pct, is_default, is_active, sort_order, badge_label, description
      FROM financing_plans
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    const settingsRaw = await query<{
      min_project_cost: string;
      max_project_cost: string;
      default_project_cost: string;
      credit_check_copy_flag: boolean;
    }>(`
      SELECT min_project_cost, max_project_cost, default_project_cost, credit_check_copy_flag
      FROM financing_settings
      WHERE id = 1
      LIMIT 1
    `);

    const plans: FinancingPlan[] = plansRaw.map((p) => ({
      id: p.id,
      name: p.name,
      apr: Number(p.apr),
      termMonths: p.term_months,
      minDownPaymentPct: Number(p.min_down_payment_pct),
      isDefault: p.is_default,
      isActive: p.is_active,
      sortOrder: p.sort_order,
      badgeLabel: p.badge_label,
      description: p.description,
    }));

    const s = settingsRaw[0] || {
      min_project_cost: '5000',
      max_project_cost: '50000',
      default_project_cost: '16500',
      credit_check_copy_flag: true,
    };

    const settings: FinancingSettings = {
      minProjectCost: Number(s.min_project_cost),
      maxProjectCost: Number(s.max_project_cost),
      defaultProjectCost: Number(s.default_project_cost),
      creditCheckCopyFlag: Boolean(s.credit_check_copy_flag),
    };

    const defaultPlan = plans.find((p) => p.isDefault) || plans[0] || null;

    return NextResponse.json(
      { ok: true, plans, settings, defaultPlan },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('[api/financing/config]', err);
    return NextResponse.json({ ok: false, error: 'Failed to load financing configuration' }, { status: 500 });
  }
}

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
    const plans = await query<{
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
      created_at: string;
      updated_at: string;
    }>(`
      SELECT id, name, apr, term_months, min_down_payment_pct, is_default, is_active, sort_order, badge_label, description, created_at, updated_at
      FROM financing_plans
      ORDER BY sort_order ASC
    `);

    const settingsRows = await query<{
      id: number;
      min_project_cost: string;
      max_project_cost: string;
      default_project_cost: string;
      credit_check_copy_flag: boolean;
      updated_at: string;
      updated_by: string | null;
    }>(`
      SELECT id, min_project_cost, max_project_cost, default_project_cost, credit_check_copy_flag, updated_at, updated_by
      FROM financing_settings
      WHERE id = 1
      LIMIT 1
    `);

    const calculations = await query<{
      id: string;
      plan_name: string | null;
      project_cost: string;
      down_payment: string;
      monthly_payment: string;
      session_id: string | null;
      created_at: string;
    }>(`
      SELECT c.id, p.name as plan_name, c.project_cost, c.down_payment, c.monthly_payment, c.session_id, c.created_at
      FROM financing_calculations c
      LEFT JOIN financing_plans p ON c.plan_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `);

    const s = settingsRows[0] || {
      min_project_cost: '5000',
      max_project_cost: '50000',
      default_project_cost: '16500',
      credit_check_copy_flag: true,
      updated_at: new Date().toISOString(),
      updated_by: 'system',
    };

    return NextResponse.json({
      ok: true,
      plans: plans.map((p) => ({
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
        updatedAt: p.updated_at,
      })),
      settings: {
        minProjectCost: Number(s.min_project_cost),
        maxProjectCost: Number(s.max_project_cost),
        defaultProjectCost: Number(s.default_project_cost),
        creditCheckCopyFlag: Boolean(s.credit_check_copy_flag),
        updatedAt: s.updated_at,
        updatedBy: s.updated_by,
      },
      calculations: calculations.map((c) => ({
        id: c.id,
        planName: c.plan_name || 'Custom Plan',
        projectCost: Number(c.project_cost),
        downPayment: Number(c.down_payment),
        monthlyPayment: Number(c.monthly_payment),
        sessionId: c.session_id,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    console.error('[api/admin/financing GET]', err);
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

    // ── 1. Save or Create Plan ───────────────────────────────────────────────
    if (action === 'save_plan') {
      const {
        id,
        name,
        apr,
        termMonths,
        minDownPaymentPct,
        isDefault,
        isActive,
        sortOrder,
        badgeLabel,
        description,
      } = body;

      if (!name || name.trim().length === 0) {
        return NextResponse.json({ ok: false, error: 'Plan name is required' }, { status: 400 });
      }

      const aprNum = Number(apr);
      const termNum = parseInt(String(termMonths), 10);
      const minDownNum = Number(minDownPaymentPct || 0);

      if (isNaN(aprNum) || aprNum < 0) {
        return NextResponse.json({ ok: false, error: 'APR must be a non-negative number' }, { status: 400 });
      }
      if (isNaN(termNum) || termNum <= 0) {
        return NextResponse.json({ ok: false, error: 'Term months must be greater than 0' }, { status: 400 });
      }
      if (isNaN(minDownNum) || minDownNum < 0 || minDownNum > 100) {
        return NextResponse.json({ ok: false, error: 'Min down payment % must be between 0 and 100' }, { status: 400 });
      }

      // If this plan is marked as default, clear default status from all others
      if (Boolean(isDefault)) {
        await query('UPDATE financing_plans SET is_default = false');
      }

      if (id) {
        await query(
          `UPDATE financing_plans
           SET name = $1, apr = $2, term_months = $3, min_down_payment_pct = $4,
               is_default = $5, is_active = $6, sort_order = $7, badge_label = $8,
               description = $9, updated_at = NOW()
           WHERE id = $10`,
          [
            name.trim(),
            aprNum,
            termNum,
            minDownNum,
            Boolean(isDefault),
            Boolean(isActive),
            Number(sortOrder) || 0,
            badgeLabel ? String(badgeLabel).trim() : null,
            description ? String(description).trim() : null,
            id,
          ]
        );
      } else {
        await query(
          `INSERT INTO financing_plans (
             name, apr, term_months, min_down_payment_pct, is_default, is_active, sort_order, badge_label, description
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            name.trim(),
            aprNum,
            termNum,
            minDownNum,
            Boolean(isDefault),
            Boolean(isActive),
            Number(sortOrder) || 0,
            badgeLabel ? String(badgeLabel).trim() : null,
            description ? String(description).trim() : null,
          ]
        );
      }

      // Ensure at least one plan remains default
      const defaultCheck = await query<{ count: string }>('SELECT COUNT(*) as count FROM financing_plans WHERE is_default = true AND is_active = true');
      if (parseInt(defaultCheck[0]?.count || '0', 10) === 0) {
        await query('UPDATE financing_plans SET is_default = true WHERE id = (SELECT id FROM financing_plans WHERE is_active = true ORDER BY sort_order ASC LIMIT 1)');
      }

      try {
        revalidatePath('/roof-financing-san-diego');
        revalidatePath('/api/financing/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Financing plan saved successfully' });
    }

    // ── 2. Set Default Plan ──────────────────────────────────────────────────
    if (action === 'set_default') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Plan ID is required' }, { status: 400 });
      }

      await query('UPDATE financing_plans SET is_default = false');
      await query('UPDATE financing_plans SET is_default = true, is_active = true WHERE id = $1', [id]);

      try {
        revalidatePath('/roof-financing-san-diego');
        revalidatePath('/api/financing/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Default plan updated' });
    }

    // ── 3. Save Calculator Settings ──────────────────────────────────────────
    if (action === 'save_settings') {
      const { minProjectCost, maxProjectCost, defaultProjectCost, creditCheckCopyFlag } = body;

      const minCost = Number(minProjectCost);
      const maxCost = Number(maxProjectCost);
      const defCost = Number(defaultProjectCost);

      if (isNaN(minCost) || minCost <= 0) {
        return NextResponse.json({ ok: false, error: 'Min project cost must be greater than 0' }, { status: 400 });
      }
      if (isNaN(maxCost) || maxCost <= minCost) {
        return NextResponse.json({ ok: false, error: 'Max project cost must be greater than min project cost' }, { status: 400 });
      }
      if (isNaN(defCost) || defCost < minCost || defCost > maxCost) {
        return NextResponse.json({ ok: false, error: 'Default project cost must be within min and max bounds' }, { status: 400 });
      }

      await query(
        `UPDATE financing_settings
         SET min_project_cost = $1,
             max_project_cost = $2,
             default_project_cost = $3,
             credit_check_copy_flag = $4,
             updated_at = NOW(),
             updated_by = $5
         WHERE id = 1`,
        [minCost, maxCost, defCost, Boolean(creditCheckCopyFlag), currentUser.name]
      );

      try {
        revalidatePath('/roof-financing-san-diego');
        revalidatePath('/api/financing/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Calculator settings saved' });
    }

    // ── 4. Delete Plan ───────────────────────────────────────────────────────
    if (action === 'delete_plan') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ ok: false, error: 'Plan ID is required' }, { status: 400 });
      }

      const planToDelete = await query<{ is_default: boolean }>('SELECT is_default FROM financing_plans WHERE id = $1', [id]);
      if (planToDelete.length > 0 && planToDelete[0].is_default) {
        return NextResponse.json({ ok: false, error: 'Cannot delete the default financing plan. Please set another plan as default first.' }, { status: 400 });
      }

      await query('DELETE FROM financing_plans WHERE id = $1', [id]);

      try {
        revalidatePath('/roof-financing-san-diego');
        revalidatePath('/api/financing/config');
      } catch {}

      return NextResponse.json({ ok: true, message: 'Plan deleted' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/financing POST]', err);
    return NextResponse.json({ ok: false, error: 'Operation failed' }, { status: 500 });
  }
}

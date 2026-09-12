import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from '@/lib/dashboard-config';
export type { DashboardConfig };
export { DEFAULT_DASHBOARD_CONFIG };

export async function GET() {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  try {
    const rows = await query<{ value: any }>(
      `SELECT value FROM app_settings WHERE key = 'dashboard_customization' LIMIT 1`
    );

    if (rows.length === 0 || !rows[0].value) {
      return NextResponse.json({ ok: true, config: DEFAULT_DASHBOARD_CONFIG });
    }

    const saved = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
    const merged: DashboardConfig = {
      hero: { ...DEFAULT_DASHBOARD_CONFIG.hero, ...(saved.hero || {}) },
      quoteCard: { ...DEFAULT_DASHBOARD_CONFIG.quoteCard, ...(saved.quoteCard || {}) },
      weather: { ...DEFAULT_DASHBOARD_CONFIG.weather, ...(saved.weather || {}) },
      topPerformersSeed: saved.topPerformersSeed || DEFAULT_DASHBOARD_CONFIG.topPerformersSeed,
    };

    return NextResponse.json({ ok: true, config: merged });
  } catch (error: any) {
    console.error('Error fetching dashboard customization config:', error);
    return NextResponse.json({ ok: true, config: DEFAULT_DASHBOARD_CONFIG });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();

    const rows = await query<{ value: any }>(
      `SELECT value FROM app_settings WHERE key = 'dashboard_customization' LIMIT 1`
    );
    const existing = rows.length > 0 && rows[0].value
      ? (typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value)
      : DEFAULT_DASHBOARD_CONFIG;

    const updatedConfig: DashboardConfig = {
      hero: {
        ...existing.hero,
        ...(body.hero || {}),
      },
      quoteCard: {
        ...existing.quoteCard,
        ...(body.quoteCard || {}),
      },
      weather: {
        ...existing.weather,
        ...(body.weather || {}),
      },
      topPerformersSeed: body.topPerformersSeed || existing.topPerformersSeed,
    };

    await query(
      `INSERT INTO app_settings (key, value, updated_at) 
       VALUES ('dashboard_customization', $1::jsonb, NOW()) 
       ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(updatedConfig)]
    );

    return NextResponse.json({ ok: true, config: updatedConfig, message: 'Dashboard updated successfully' });
  } catch (error: any) {
    console.error('Error updating dashboard customization:', error);
    return NextResponse.json({ error: error.message || 'Failed to update dashboard' }, { status: 500 });
  }
}

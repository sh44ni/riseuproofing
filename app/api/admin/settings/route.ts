import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

const TRACKED_TABLES = [
  { name: 'users', label: 'Team Members & RBAC', desc: 'Staff accounts, roles & credentials' },
  { name: 'leads', label: 'Leads & Inquiries', desc: 'Homeowner prospects & score vectors' },
  { name: 'jobs', label: 'Jobs Pipeline', desc: '7-stage production roofs' },
  { name: 'estimates', label: 'Estimates & Quotes', desc: 'Digital proposals with e-sign' },
  { name: 'invoices', label: 'Milestone Invoices', desc: 'CSLB 4-stage cash collections' },
  { name: 'tasks', label: 'Tasks & Reminders', desc: 'Follow-ups and scheduled calls' },
  { name: 'activities', label: 'Activity Timeline', desc: 'All customer touchpoints and visits' },
  { name: 'crew_members', label: 'Crew & Dispatch', desc: 'Foremen, applicators & installers' },
  { name: 'job_photos', label: 'Field Photos', desc: 'Before/during/after roof photos' },
  { name: 'warranties', label: '50-Yr Warranties', desc: 'Owens Corning certificates & check-ins' },
  { name: 'inspections', label: 'Roof Inspections', desc: '12-point health score reports' },
  { name: 'job_expenses', label: 'Job Costing & Receipts', desc: 'Dumpsters, materials & labor ledger' },
  { name: 'templates', label: 'Message Templates', desc: 'Canned SMS & Email flows' },
  { name: 'reviews', label: 'Customer Reviews', desc: 'Reputation feedback & Google boosts' },
  { name: 'call_events', label: 'Call Tracking', desc: 'Inbound phone button clicks' },
  { name: 'analytics_events', label: 'Web Analytics', desc: 'Pageviews, CTAs & click heatmaps' },
  { name: 'admin_sessions', label: 'Admin Sessions', desc: 'Active authenticated tokens' },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden. Owner role required.' }, { status: 403 });
  }

  const startMs = Date.now();

  try {
    // 1. Fetch all app_settings
    const settingsRows = await query<{ key: string; value: any }>(
      `SELECT key, value FROM app_settings`
    );

    const settingsMap: Record<string, any> = {};
    settingsRows.forEach(r => {
      settingsMap[r.key] = r.value;
    });

    // Provide default company profile if not yet set
    if (!settingsMap.company_profile) {
      settingsMap.company_profile = {
        company_name: 'Rise Up Roofing & Construction',
        license_cslb: '1096492',
        phone: '(619) 432-7663',
        email: 'info@riseuproofing.com',
        office_address: 'Escondido & San Diego County, CA',
        google_review_url: 'https://g.page/r/riseuproofing/review',
        owens_corning_id: 'OC-PREFERRED-1096492',
      };
    }

    // Provide default pricing if not yet set
    if (!settingsMap.pricing_defaults) {
      settingsMap.pricing_defaults = {
        target_margin_pct: 30,
        labor_rate_per_sq: 95,
        dumpster_flat_fee: 650,
        permit_base_fee: 450,
        default_shingle_per_sq: 135,
        default_tile_per_sq: 220,
        default_tpo_per_sq: 275,
      };
    }

    // 2. Fetch row count for each tracked table
    const tableStats = await Promise.all(
      TRACKED_TABLES.map(async t => {
        try {
          const res = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ${t.name}`);
          return {
            table: t.name,
            label: t.label,
            desc: t.desc,
            count: parseInt(res[0]?.count || '0', 10),
          };
        } catch {
          return {
            table: t.name,
            label: t.label,
            desc: t.desc,
            count: 0,
          };
        }
      })
    );

    const latencyMs = Date.now() - startMs;

    return NextResponse.json({
      settings: settingsMap,
      tableStats,
      dbHealth: {
        status: 'healthy',
        latencyMs,
        provider: 'Neon Serverless PostgreSQL',
        connected: true,
      },
    });
  } catch (err) {
    console.error('[api/admin/settings GET]', err);
    return NextResponse.json({ error: 'Server error loading settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden. Owner role required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'Settings key and value are required' }, { status: 400 });
    }

    await query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE 
       SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );

    return NextResponse.json({ ok: true, key });
  } catch (err) {
    console.error('[api/admin/settings POST]', err);
    return NextResponse.json({ error: 'Server error updating settings' }, { status: 500 });
  }
}

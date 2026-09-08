import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { PERMISSIONS_CATALOG } from '@/lib/permissions';
import { query } from '@/lib/db';

const RESOURCE_METADATA: Record<string, { name: string; description: string; order: number }> = {
  leads: { name: 'Leads & Inquiries', description: 'Capture, assign, and manage prospective homeowners', order: 1 },
  pipeline: { name: 'Sales Pipeline', description: 'Manage stages, deals, and gate overrides', order: 2 },
  estimates: { name: 'Estimates & Proposals', description: 'Cost calculations, proposals, and pricing templates', order: 3 },
  contracts: { name: 'Contracts & Agreements', description: 'Signed contracts, terms, and void authority', order: 4 },
  jobs: { name: 'Production Jobs', description: '7-stage roofing jobs, permits, and materials', order: 5 },
  calendar: { name: 'Schedule & Calendar', description: 'Site visits, crew installations, and dispatches', order: 6 },
  inspections: { name: 'Roof Inspections', description: '12-point digital inspections and checklist templates', order: 7 },
  finances: { name: 'Finances & Invoicing', description: 'Milestone invoices, payment logs, and expense ledgers', order: 8 },
  reports: { name: 'Executive Reports', description: 'KPI analytics, win rates, and rep leaderboards', order: 9 },
  warranties: { name: '50-Yr Warranties', description: 'Owens Corning warranty certificates and guarantees', order: 10 },
  crew: { name: 'Crew & Dispatch', description: 'Field installers, foremen, and crew rosters', order: 11 },
  estimator_settings: { name: 'Estimator Pricing', description: 'Pitch multipliers, material unit costs, and margins', order: 12 },
  roles: { name: 'Roles & Permissions', description: 'Custom dynamic roles and granular scope controls', order: 13 },
  users: { name: 'Team Members & Invites', description: 'User accounts, role assignments, and email invites', order: 14 },
};

function formatActionTitle(action: string, resource: string): string {
  const words = action.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const resLabel = resource.charAt(0).toUpperCase() + resource.slice(1);
  if (action === 'view') return `View ${resLabel}`;
  if (action === 'create') return `Create New ${resLabel}`;
  if (action === 'edit') return `Edit & Update ${resLabel}`;
  if (action === 'delete') return `Delete ${resLabel}`;
  return words;
}

export async function GET() {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  try {
    const dbPerms = await query<any>(`
      SELECT id, key, resource, action, description
      FROM permissions
      ORDER BY id ASC
    `);

    const dbMap = new Map<string, any>();
    dbPerms.forEach((p) => dbMap.set(p.key, p));

    // Combine static catalog metadata with DB IDs
    const enrichedPermissions = PERMISSIONS_CATALOG.map((catItem) => {
      const dbRow = dbMap.get(catItem.key);
      return {
        id: dbRow ? dbRow.id : undefined,
        key: catItem.key,
        resource: catItem.resource,
        action: catItem.action,
        name: formatActionTitle(catItem.action, catItem.resource),
        description: catItem.description,
        supports_scope: catItem.supportsScope,
        default_scope: (catItem.supportsScope ? 'all' : 'all') as 'own' | 'assigned' | 'all',
      };
    });

    // Group into organized categories
    const categoriesMap = new Map<string, {
      resource: string;
      name: string;
      description: string;
      order: number;
      permissions: typeof enrichedPermissions;
    }>();

    enrichedPermissions.forEach((p) => {
      if (!categoriesMap.has(p.resource)) {
        const meta = RESOURCE_METADATA[p.resource] || {
          name: p.resource.charAt(0).toUpperCase() + p.resource.slice(1),
          description: '',
          order: 99,
        };
        categoriesMap.set(p.resource, {
          resource: p.resource,
          name: meta.name,
          description: meta.description,
          order: meta.order,
          permissions: [],
        });
      }
      categoriesMap.get(p.resource)!.permissions.push(p);
    });

    const categories = Array.from(categoriesMap.values()).sort((a, b) => a.order - b.order);

    const grouped: Record<string, typeof PERMISSIONS_CATALOG> = {};
    PERMISSIONS_CATALOG.forEach((p) => {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p);
    });

    return NextResponse.json({
      ok: true,
      permissions: enrichedPermissions,
      categories,
      catalog: PERMISSIONS_CATALOG,
      grouped,
    });
  } catch (err) {
    console.error('[api/admin/permissions GET]', err);
    return NextResponse.json({ ok: false, error: 'Database error fetching permissions' }, { status: 500 });
  }
}


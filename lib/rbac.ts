export type UserRole =
  | 'owner'
  | 'project_manager'
  | 'sales_rep'
  | 'field_foreman'
  | 'office_admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  permissions?: string[];
}

export interface PermissionDefinition {
  id: string;
  label: string;
  category: string;
  desc: string;
  sensitive?: boolean;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // ── Leads & Inquiries ──────────────────────────────────────────────────────
  { id: 'leads:view', label: 'View Leads Pipeline', category: 'Leads & Inquiries', desc: 'Browse homeowner inquiries and lead profiles' },
  { id: 'leads:create', label: 'Create New Leads', category: 'Leads & Inquiries', desc: 'Add new homeowner prospects and inquiry details' },
  { id: 'leads:edit', label: 'Edit & Assign Leads', category: 'Leads & Inquiries', desc: 'Update property info, lead scores, and sales rep assignments' },
  { id: 'leads:delete', label: 'Delete Leads', category: 'Leads & Inquiries', desc: 'Permanently remove lost or invalid leads' },
  { id: 'leads:export', label: 'Export Leads CSV', category: 'Leads & Inquiries', desc: 'Download leads spreadsheet for external marketing' },

  // ── Estimating & Proposals ─────────────────────────────────────────────────
  { id: 'estimates:view', label: 'View Estimates', category: 'Estimating & Proposals', desc: 'Browse cost estimates and proposal archives' },
  { id: 'estimates:create', label: 'Create Estimates', category: 'Estimating & Proposals', desc: 'Run 4-step roof cost calculator and generate quotes' },
  { id: 'estimates:send', label: 'Send Digital Proposals', category: 'Estimating & Proposals', desc: 'Publish proposal portal and dispatch e-Sign link to customer' },
  { id: 'estimates:view_margins', label: 'View Profit Margins', category: 'Estimating & Proposals', desc: 'See wholesale material cost, labor rates & margin %', sensitive: true },

  // ── Jobs & Production (7 Stages) ───────────────────────────────────────────
  { id: 'jobs:view', label: 'View Jobs Kanban', category: 'Jobs & Production', desc: 'View 7-stage roofing production board' },
  { id: 'jobs:change_stage', label: 'Move Job Stages', category: 'Jobs & Production', desc: 'Progress jobs from permit pending to final completion' },
  { id: 'jobs:manage_permits', label: 'Manage Permits & Materials', category: 'Jobs & Production', desc: 'Update building permit numbers and material delivery dates' },
  { id: 'jobs:delete', label: 'Delete Jobs', category: 'Jobs & Production', desc: 'Remove cancelled job records from CRM' },

  // ── Financials & Accounting ────────────────────────────────────────────────
  { id: 'finances:view_invoices', label: 'View Invoices & Cash Flow', category: 'Financials & Invoicing', desc: 'Browse CSLB milestone invoices and balances' },
  { id: 'finances:create_invoices', label: 'Generate Milestone Invoices', category: 'Financials & Invoicing', desc: 'Issue Deposit, Tear-off, Underlayment & Final invoices' },
  { id: 'finances:record_payment', label: 'Record Payments', category: 'Financials & Invoicing', desc: 'Mark invoices paid via Check, Credit Card, or Financing' },
  { id: 'finances:view_expenses', label: 'View Job Expenses Ledger', category: 'Financials & Invoicing', desc: 'Browse dumpsters, materials & labor expense logs' },
  { id: 'finances:manage_expenses', label: 'Log & Edit Expenses', category: 'Financials & Invoicing', desc: 'Upload vendor receipts and expense entries' },
  { id: 'finances:view_profit_ledger', label: 'View Company Profit Ledger', category: 'Financials & Invoicing', desc: 'Access executive net profit and business performance', sensitive: true },

  // ── Field Operations & Dispatch ────────────────────────────────────────────
  { id: 'field:view_calendar', label: 'View Operations Calendar', category: 'Field Operations', desc: 'See job schedules, inspections, and crew tasks' },
  { id: 'field:manage_dispatch', label: 'Manage Crew Dispatch', category: 'Field Operations', desc: 'Assign and reassign crew members to active roofs' },
  { id: 'field:manage_crew', label: 'Manage Crew Roster', category: 'Field Operations', desc: 'Add/edit foremen, installers, and phone contacts' },
  { id: 'inspections:conduct', label: 'Conduct 12-Point Roof Inspection', category: 'Field Operations', desc: 'Execute digital roof inspection checklist' },
  { id: 'photos:upload', label: 'Upload Field Photos', category: 'Field Operations', desc: 'Upload before, decking, underlayment & final photos' },
  { id: 'photos:delete', label: 'Delete Field Photos', category: 'Field Operations', desc: 'Remove uploaded job photos' },
  { id: 'warranties:issue', label: 'Issue 50-Yr Warranty Certificates', category: 'Field Operations', desc: 'Create Owens Corning 50-year warranty certificates' },

  // ── Customer & Marketing ───────────────────────────────────────────────────
  { id: 'reviews:manage', label: 'Manage Customer Reviews', category: 'Customer & Marketing', desc: 'Send review requests and resolve negative feedback' },
  { id: 'templates:manage', label: 'Manage Message Templates', category: 'Customer & Marketing', desc: 'Edit SMS and email templates in Studio' },
  { id: 'analytics:view', label: 'View Web & Marketing Hub', category: 'Customer & Marketing', desc: 'Access traffic trends, call logs, and click heatmaps' },

  // ── System Administration ──────────────────────────────────────────────────
  { id: 'users:manage', label: 'Manage Team Members & Permissions', category: 'System Administration', desc: 'Create accounts, assign roles, and grant permissions', sensitive: true },
  { id: 'settings:edit', label: 'Edit Pricing & System Settings', category: 'System Administration', desc: 'Modify CSLB info, default pricing, and DB tools', sensitive: true },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  project_manager: [
    'leads:view',
    'leads:edit',
    'estimates:view',
    'estimates:create',
    'estimates:send',
    'estimates:view_margins',
    'jobs:view',
    'jobs:change_stage',
    'jobs:manage_permits',
    'finances:view_invoices',
    'finances:create_invoices',
    'finances:view_expenses',
    'finances:manage_expenses',
    'finances:view_profit_ledger',
    'field:view_calendar',
    'field:manage_dispatch',
    'field:manage_crew',
    'inspections:conduct',
    'photos:upload',
    'photos:delete',
    'warranties:issue',
    'reviews:manage',
    'templates:manage',
    'analytics:view',
  ],
  sales_rep: [
    'leads:view',
    'leads:create',
    'leads:edit',
    'estimates:view',
    'estimates:create',
    'estimates:send',
    'jobs:view',
    'field:view_calendar',
    'inspections:conduct',
    'photos:upload',
    'reviews:manage',
  ],
  field_foreman: [
    'jobs:view',
    'field:view_calendar',
    'field:manage_crew',
    'inspections:conduct',
    'photos:upload',
    'warranties:issue',
  ],
  office_admin: [
    'leads:view',
    'leads:create',
    'leads:edit',
    'leads:export',
    'estimates:view',
    'jobs:view',
    'finances:view_invoices',
    'finances:create_invoices',
    'finances:record_payment',
    'finances:view_expenses',
    'finances:manage_expenses',
    'reviews:manage',
    'templates:manage',
    'analytics:view',
  ],
};

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: string; badgeColor: string; description: string }
> = {
  owner: {
    label: 'Owner / Qualifier',
    icon: '👑',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Full administrative, financial, user, and CSLB command',
  },
  project_manager: {
    label: 'Project Manager',
    icon: '🏗️',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Production Kanban, dispatch, permits, material orders & job costs',
  },
  sales_rep: {
    label: 'Sales Representative',
    icon: '💼',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Lead follow-up, cost estimating, digital proposals & closing',
  },
  field_foreman: {
    label: 'Field Foreman',
    icon: '🔨',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Mobile jobsite hub, 12-point roof inspections & photo uploads',
  },
  office_admin: {
    label: 'Office Administrator',
    icon: '📋',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Milestone invoicing, payment receipts, reviews & messaging templates',
  },
};

/**
 * Check if a user has a specific atomic permission
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string
): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'owner') return true;
  if (user.permissions?.includes('*')) return true;
  if (user.permissions && user.permissions.includes(permission)) return true;

  // Fallback to role default permissions if user has no explicit custom array
  if (!user.permissions || user.permissions.length === 0) {
    const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return roleDefaults.includes('*') || roleDefaults.includes(permission);
  }

  return false;
}

/**
 * Check if a user has any permission from a list
 */
export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: string[]
): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'owner') return true;
  if (user.permissions?.includes('*')) return true;
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Role-Based Access Control Path Guard (Dynamic Permissions Aware)
 * Accepts either full AuthUser or UserRole string for backward compatibility
 */
export function canAccessPath(
  userOrRole: AuthUser | UserRole | null | undefined,
  pathname: string
): boolean {
  if (!userOrRole) return false;

  // If passed as a role string, construct synthetic AuthUser
  const user: AuthUser =
    typeof userOrRole === 'string'
      ? {
          id: 0,
          name: '',
          email: '',
          role: userOrRole,
          status: 'active',
          permissions: DEFAULT_ROLE_PERMISSIONS[userOrRole] || [],
        }
      : userOrRole;

  if (user.role === 'owner' || user.permissions?.includes('*')) return true;

  // Route-to-Permission Mapping
  if (pathname.startsWith('/admin/users')) return hasPermission(user, 'users:manage');
  if (pathname.startsWith('/admin/settings')) return hasPermission(user, 'settings:edit');
  if (pathname.startsWith('/admin/finances')) return hasPermission(user, 'finances:view_invoices');
  if (pathname.startsWith('/admin/reports')) return hasPermission(user, 'finances:view_profit_ledger');
  if (
    pathname.startsWith('/admin/analytics') ||
    pathname.startsWith('/admin/calls') ||
    pathname.startsWith('/admin/heatmaps')
  ) {
    return hasPermission(user, 'analytics:view');
  }
  if (pathname.startsWith('/admin/leads')) return hasPermission(user, 'leads:view');
  if (pathname.startsWith('/admin/estimates')) return hasPermission(user, 'estimates:view');
  if (pathname.startsWith('/admin/jobs')) return hasPermission(user, 'jobs:view');
  if (pathname.startsWith('/admin/calendar')) return hasPermission(user, 'field:view_calendar');
  if (pathname.startsWith('/admin/inspections')) return hasPermission(user, 'inspections:conduct');
  if (pathname.startsWith('/admin/crew')) return hasPermission(user, 'field:manage_crew');
  if (pathname.startsWith('/admin/warranties')) return hasPermission(user, 'warranties:issue');
  if (pathname.startsWith('/admin/reviews')) return hasPermission(user, 'reviews:manage');
  if (pathname.startsWith('/admin/templates')) return hasPermission(user, 'templates:manage');
  if (pathname.startsWith('/admin/tasks')) return hasPermission(user, 'field:view_calendar');

  return true;
}

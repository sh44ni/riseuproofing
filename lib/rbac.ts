export type UserRole =
  | 'owner'
  | 'project_manager'
  | 'sales_rep'
  | 'door_knocker'
  | 'canvasser'
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

  // ── Clients 360 & Profiles ────────────────────────────────────────────────
  { id: 'clients:view', label: 'View Clients Directory & 360 Profiles', category: 'Clients & Profiles', desc: 'Access 360-degree customer history, jobs, billing, and warranties' },
  { id: 'clients:create', label: 'Create Clients', category: 'Clients & Profiles', desc: 'Add new client records manually' },
  { id: 'clients:edit', label: 'Edit Clients & Specs', category: 'Clients & Profiles', desc: 'Update contact info, property specs, tags, and notes' },
  { id: 'clients:delete', label: 'Delete Clients', category: 'Clients & Profiles', desc: 'Archive or delete client profiles' },

  // ── System Administration ──────────────────────────────────────────────────
  { id: 'users:manage', label: 'Manage Team Members & Permissions', category: 'System Administration', desc: 'Create accounts, assign roles, and grant permissions', sensitive: true },
  { id: 'settings:edit', label: 'Edit Pricing & System Settings', category: 'System Administration', desc: 'Modify CSLB info, default pricing, and DB tools', sensitive: true },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  project_manager: [
    'clients:view',
    'clients:edit',
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
    'clients:view',
    'clients:create',
    'clients:edit',
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
  door_knocker: [
    'clients:view',
    'clients:create',
    'leads:view',
    'leads:create',
    'photos:upload',
  ],
  canvasser: [
    'clients:view',
    'clients:create',
    'leads:view',
    'leads:create',
    'photos:upload',
  ],
  field_foreman: [
    'clients:view',
    'jobs:view',
    'field:view_calendar',
    'field:manage_crew',
    'inspections:conduct',
    'photos:upload',
    'warranties:issue',
  ],
  office_admin: [
    'clients:view',
    'clients:create',
    'clients:edit',
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

export type RoleIconName =
  | 'Crown'
  | 'Briefcase'
  | 'TrendingUp'
  | 'HardHat'
  | 'ClipboardCheck'
  | 'Footprints'
  | 'MapPin';

export const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    iconName: RoleIconName;
    badgeColor: string;
    accentColor: string;
    description: string;
  }
> = {
  owner: {
    label: 'Owner / Qualifier',
    iconName: 'Crown',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
    accentColor: '#D97706',
    description: 'Full administrative, financial, user, and CSLB command',
  },
  project_manager: {
    label: 'Project Manager',
    iconName: 'Briefcase',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
    accentColor: '#2563EB',
    description: 'Production Kanban, dispatch, permits, material orders & job costs',
  },
  sales_rep: {
    label: 'Sales Representative',
    iconName: 'TrendingUp',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    accentColor: '#059669',
    description: 'Lead follow-up, cost estimating, digital proposals & closing',
  },
  door_knocker: {
    label: 'Door Knocker',
    iconName: 'Footprints',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
    accentColor: '#0D9488',
    description: 'Canvassing neighborhoods, field lead capture & homeowner qualifying',
  },
  canvasser: {
    label: 'Field Canvasser',
    iconName: 'MapPin',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    accentColor: '#0891B2',
    description: 'Neighborhood field marketing, door-to-door promotions & flyer distribution',
  },
  field_foreman: {
    label: 'Field Foreman',
    iconName: 'HardHat',
    badgeColor: 'bg-orange-50 text-orange-900 border-orange-300',
    accentColor: '#EA580C',
    description: 'Mobile jobsite hub, 12-point roof inspections & photo uploads',
  },
  office_admin: {
    label: 'Office Administrator',
    iconName: 'ClipboardCheck',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
    accentColor: '#9333EA',
    description: 'Milestone invoicing, payment receipts, reviews & messaging templates',
  },
};

export const DEFAULT_AVATARS: Record<UserRole, string> = {
  owner: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  project_manager: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  sales_rep: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  door_knocker: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  canvasser: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  field_foreman: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
  office_admin: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
};

export const CURATED_PORTRAITS = [
  { id: 'p1', label: 'Sam Martinez (Owner)', role: 'owner' as UserRole, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
  { id: 'p2', label: 'Carlos Ramirez (PM)', role: 'project_manager' as UserRole, url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80' },
  { id: 'p3', label: 'Jessica Hayes (Sales)', role: 'sales_rep' as UserRole, url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80' },
  { id: 'p4', label: 'Marco Silva (Foreman)', role: 'field_foreman' as UserRole, url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80' },
  { id: 'p5', label: 'Elena Rostova (Office)', role: 'office_admin' as UserRole, url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80' },
  { id: 'p6', label: 'David Chen (Engineer)', role: 'project_manager' as UserRole, url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80' },
  { id: 'p7', label: 'Rachel Moore (Consultant)', role: 'sales_rep' as UserRole, url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&q=80' },
  { id: 'p8', label: 'Tomas Vance (Superintendent)', role: 'field_foreman' as UserRole, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
  { id: 'p9', label: 'Lucas Wright (Crew Lead)', role: 'field_foreman' as UserRole, url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80' },
  { id: 'p10', label: 'Maya Patel (Coordinator)', role: 'office_admin' as UserRole, url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80' },
  { id: 'p11', label: 'Jordan Cole (Door Knocker)', role: 'door_knocker' as UserRole, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
  { id: 'p12', label: 'Diego Alvarez (Canvasser)', role: 'canvasser' as UserRole, url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80' },
];

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

  // Check role default permissions as well
  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  if (roleDefaults.includes('*') || roleDefaults.includes(permission)) {
    return true;
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
  if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/estimator')) return hasPermission(user, 'settings:edit');
  if (pathname.startsWith('/admin/finances')) return hasPermission(user, 'finances:view_invoices');
  if (pathname.startsWith('/admin/reports')) return hasPermission(user, 'finances:view_profit_ledger');
  if (
    pathname.startsWith('/admin/analytics') ||
    pathname.startsWith('/admin/calls') ||
    pathname.startsWith('/admin/heatmaps')
  ) {
    return hasPermission(user, 'analytics:view');
  }
  if (pathname.startsWith('/admin/clients')) return hasPermission(user, 'clients:view');
  if (pathname.startsWith('/admin/leads') || pathname.startsWith('/admin/pipeline')) {
    return hasPermission(user, 'leads:view') || hasPermission(user, 'jobs:view');
  }
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

import { query } from './db';
import { AuthUser } from './rbac';

export type PermissionScope = 'own' | 'assigned' | 'all';

export interface PermissionCatalogItem {
  key: string;
  resource: string;
  action: string;
  description: string;
  supportsScope: boolean;
}

export const PERMISSIONS_CATALOG: PermissionCatalogItem[] = [
  // leads
  { key: 'leads.view', resource: 'leads', action: 'view', description: 'Browse and view lead records', supportsScope: true },
  { key: 'leads.create', resource: 'leads', action: 'create', description: 'Create and capture new homeowner leads', supportsScope: false },
  { key: 'leads.edit', resource: 'leads', action: 'edit', description: 'Edit lead details, contact info, and status', supportsScope: true },
  { key: 'leads.delete', resource: 'leads', action: 'delete', description: 'Delete or archive lost leads', supportsScope: true },
  { key: 'leads.claim', resource: 'leads', action: 'claim', description: 'Claim leads from the unassigned pool', supportsScope: false },
  { key: 'leads.reassign', resource: 'leads', action: 'reassign', description: 'Reassign leads to other sales reps or estimators', supportsScope: false },

  // pipeline
  { key: 'pipeline.view', resource: 'pipeline', action: 'view', description: 'Access and view the 5-stage sales pipeline', supportsScope: false },
  { key: 'pipeline.advance_stage', resource: 'pipeline', action: 'advance_stage', description: 'Advance deals across pipeline stages', supportsScope: false },
  { key: 'pipeline.override_gate', resource: 'pipeline', action: 'override_gate', description: 'Override required stage gates', supportsScope: false },

  // estimates
  { key: 'estimates.view', resource: 'estimates', action: 'view', description: 'View cost estimates and proposals', supportsScope: true },
  { key: 'estimates.create', resource: 'estimates', action: 'create', description: 'Generate roof cost estimates', supportsScope: false },
  { key: 'estimates.send', resource: 'estimates', action: 'send', description: 'Send digital proposals and contract links to homeowners', supportsScope: false },
  { key: 'estimates.edit_pricing_templates', resource: 'estimates', action: 'edit_pricing_templates', description: 'Modify pricing formulas, margins, and estimate templates', supportsScope: false },

  // contracts
  { key: 'contracts.view', resource: 'contracts', action: 'view', description: 'View signed contracts and agreement terms', supportsScope: false },
  { key: 'contracts.void', resource: 'contracts', action: 'void', description: 'Void or cancel legal contracts', supportsScope: false },

  // jobs
  { key: 'jobs.view', resource: 'jobs', action: 'view', description: 'View jobs and 7-stage production boards', supportsScope: true },
  { key: 'jobs.edit', resource: 'jobs', action: 'edit', description: 'Update job details, permits, materials, and schedules', supportsScope: true },
  { key: 'jobs.mark_complete', resource: 'jobs', action: 'mark_complete', description: 'Mark roofing jobs as complete and trigger sign-off', supportsScope: false },

  // calendar
  { key: 'calendar.view', resource: 'calendar', action: 'view', description: 'View schedule, site visits, and installations', supportsScope: true },
  { key: 'calendar.create_event', resource: 'calendar', action: 'create_event', description: 'Schedule new calendar events and dispatches', supportsScope: false },
  { key: 'calendar.view_others', resource: 'calendar', action: 'view_others', description: 'Filter and view calendar events for other team members', supportsScope: false },

  // inspections
  { key: 'inspections.view', resource: 'inspections', action: 'view', description: 'View completed roof inspection reports', supportsScope: false },
  { key: 'inspections.create', resource: 'inspections', action: 'create', description: 'Perform 12-point roof inspections and checklists', supportsScope: false },
  { key: 'inspections.edit_checklist_templates', resource: 'inspections', action: 'edit_checklist_templates', description: 'Edit inspection criteria and checklists', supportsScope: false },

  // finances
  { key: 'finances.view', resource: 'finances', action: 'view', description: 'View invoices, cash collections, and expenses', supportsScope: false },
  { key: 'finances.edit', resource: 'finances', action: 'edit', description: 'Create milestone invoices, log expenses, and record payments', supportsScope: false },

  // reports
  { key: 'reports.view', resource: 'reports', action: 'view', description: 'Access executive reports, win rates, and rep leaderboards', supportsScope: false },

  // warranties
  { key: 'warranties.view', resource: 'warranties', action: 'view', description: 'View issued 50-year warranty certificates', supportsScope: false },
  { key: 'warranties.create', resource: 'warranties', action: 'create', description: 'Issue Owens Corning warranty certificates', supportsScope: false },
  { key: 'warranties.edit', resource: 'warranties', action: 'edit', description: 'Edit warranty certificates and coverage terms', supportsScope: false },

  // crew
  { key: 'crew.view', resource: 'crew', action: 'view', description: 'View crew members and dispatched rosters', supportsScope: false },
  { key: 'crew.edit', resource: 'crew', action: 'edit', description: 'Manage crew members, certifications, and contacts', supportsScope: false },

  // estimator_settings
  { key: 'estimator_settings.view', resource: 'estimator_settings', action: 'view', description: 'View estimator pricing configuration', supportsScope: false },
  { key: 'estimator_settings.edit', resource: 'estimator_settings', action: 'edit', description: 'Edit pitch multipliers, material costs, and labor rates', supportsScope: false },

  // roles
  { key: 'roles.view', resource: 'roles', action: 'view', description: 'View team roles and permission matrix', supportsScope: false },
  { key: 'roles.create', resource: 'roles', action: 'create', description: 'Create new custom team roles', supportsScope: false },
  { key: 'roles.edit', resource: 'roles', action: 'edit', description: 'Edit role permissions and scopes', supportsScope: false },
  { key: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete custom roles', supportsScope: false },
  { key: 'roles.assign_permissions', resource: 'roles', action: 'assign_permissions', description: 'Grant or revoke permissions on roles', supportsScope: false },

  // users
  { key: 'users.view', resource: 'users', action: 'view', description: 'Browse team user accounts and profiles', supportsScope: false },
  { key: 'users.invite', resource: 'users', action: 'invite', description: 'Send invitation emails to new team members', supportsScope: false },
  { key: 'users.deactivate', resource: 'users', action: 'deactivate', description: 'Deactivate or suspend user accounts', supportsScope: false },
  { key: 'users.assign_roles', resource: 'users', action: 'assign_roles', description: 'Assign or reassign roles to team members', supportsScope: false },
];

export const PERMISSION_MAP = new Map(PERMISSIONS_CATALOG.map((p) => [p.key, p]));

const PERMISSION_ALIASES: Record<string, string> = {
  'finances.view_invoices': 'finances.view',
  'finances.view_profit_ledger': 'finances.view',
  'finances.create_invoices': 'finances.edit',
  'finances.record_payment': 'finances.edit',
  'jobs.view_jobs': 'jobs.view',
  'clients.view_clients': 'clients.view',
};

/**
 * Normalized key converter (e.g. 'leads:view' -> 'leads.view')
 */
export function normalizePermissionKey(key: string): string {
  const normalized = key.replace(/:/g, '.');
  return PERMISSION_ALIASES[normalized] || normalized;
}

export interface UserRoleRecord {
  id: number;
  name: string;
  is_protected: boolean;
}

export interface UserEffectivePermissions {
  roles: UserRoleRecord[];
  permissions: Record<string, PermissionScope>;
  isProtectedOwner: boolean;
}

/**
 * Resolves the effective permissions for a user across all assigned roles.
 * Computes union of permissions and widest scope ('all' > 'assigned' + 'own' > 'assigned' > 'own').
 */
export async function getUserEffectivePermissions(
  userId: number
): Promise<UserEffectivePermissions> {
  const rows = await query<{
    role_id: number;
    role_name: string;
    is_protected: boolean;
    permission_key: string;
    scope: PermissionScope;
  }>(
    `SELECT 
       r.id as role_id,
       r.name as role_name,
       r.is_protected,
       p.key as permission_key,
       rp.scope
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE ur.user_id = $1`,
    [userId]
  );

  const rolesMap = new Map<number, UserRoleRecord>();
  let isProtectedOwner = false;
  const permissions: Record<string, PermissionScope> = {};

  rows.forEach((r) => {
    if (!rolesMap.has(r.role_id)) {
      rolesMap.set(r.role_id, {
        id: r.role_id,
        name: r.role_name,
        is_protected: Boolean(r.is_protected),
      });
    }

    if (r.is_protected) {
      isProtectedOwner = true;
    }

    if (r.permission_key) {
      const existingScope = permissions[r.permission_key];
      if (!existingScope) {
        permissions[r.permission_key] = r.scope;
      } else if (existingScope !== 'all') {
        if (r.scope === 'all') {
          permissions[r.permission_key] = 'all';
        } else if (
          (existingScope === 'own' && r.scope === 'assigned') ||
          (existingScope === 'assigned' && r.scope === 'own')
        ) {
          // Both own and assigned granted
          permissions[r.permission_key] = 'assigned';
        }
      }
    }
  });

  // If user holds protected role or legacy owner, grant all permissions at 'all' scope
  if (isProtectedOwner) {
    PERMISSIONS_CATALOG.forEach((p) => {
      permissions[p.key] = 'all';
    });
    permissions['*'] = 'all';
  }

  return {
    roles: Array.from(rolesMap.values()),
    permissions,
    isProtectedOwner,
  };
}

/**
 * Check if user holds a specific permission with optional required scope
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
  requiredScope?: PermissionScope
): boolean {
  if (!user || user.status === 'deactivated') return false;

  const normKey = normalizePermissionKey(permission);

  // Protected Owner check
  if (user.role === 'owner' || user.roles?.some((r) => r.is_protected)) return true;

  let scope: PermissionScope | undefined;
  if (Array.isArray(user.permissions)) {
    if (user.permissions.includes('*') || user.permissions.includes(normKey) || user.permissions.includes(permission)) {
      scope = 'all';
    }
  } else if (user.permissions && typeof user.permissions === 'object') {
    const permMap = user.permissions as Record<string, PermissionScope>;
    if (permMap['*']) return true;
    scope = permMap[normKey] || permMap[permission];
  }

  if (!scope) return false;

  if (!requiredScope) return true;

  if (requiredScope === 'all') {
    return scope === 'all';
  }
  if (requiredScope === 'assigned') {
    return scope === 'assigned' || scope === 'all';
  }
  if (requiredScope === 'own') {
    return scope === 'own' || scope === 'assigned' || scope === 'all';
  }

  return true;
}

/**
 * Get effective scope for a specific permission key
 */
export function getPermissionScope(
  user: AuthUser | null | undefined,
  permission: string
): PermissionScope | null {
  if (!user || user.status === 'deactivated') return null;

  const normKey = normalizePermissionKey(permission);

  if (user.role === 'owner' || user.roles?.some((r) => r.is_protected)) return 'all';

  if (Array.isArray(user.permissions)) {
    if (user.permissions.includes('*') || user.permissions.includes(normKey) || user.permissions.includes(permission)) {
      return 'all';
    }
    return null;
  }

  if (user.permissions && typeof user.permissions === 'object') {
    const permMap = user.permissions as Record<string, PermissionScope>;
    if (permMap['*']) return 'all';
    return permMap[normKey] || permMap[permission] || null;
  }

  return null;
}

/**
 * Builds SQL filter clause based on dynamic permission scope
 */
export function buildScopeFilter(
  user: AuthUser | null | undefined,
  permission: string,
  options: {
    creatorCol?: string;
    assignedCol?: string;
    paramOffset?: number;
  } = {}
): {
  allowed: boolean;
  clause: string;
  params: unknown[];
  scope: PermissionScope | null;
} {
  const scope = getPermissionScope(user, permission);
  if (!user || !scope) {
    return { allowed: false, clause: '1=0', params: [], scope: null };
  }

  const creatorCol = options.creatorCol || 'created_by';
  const assignedCol = options.assignedCol || 'assigned_to_user_id';
  const offset = options.paramOffset || 1;

  if (scope === 'all') {
    return { allowed: true, clause: '1=1', params: [], scope: 'all' };
  }

  if (scope === 'assigned') {
    return {
      allowed: true,
      clause: `(${assignedCol} = $${offset} OR ${creatorCol} = $${offset})`,
      params: [user.id],
      scope: 'assigned',
    };
  }

  if (scope === 'own') {
    return {
      allowed: true,
      clause: `${creatorCol} = $${offset}`,
      params: [user.id],
      scope: 'own',
    };
  }

  return { allowed: false, clause: '1=0', params: [], scope: null };
}

/**
 * Lockout Safeguard:
 * Ensures at least one active user org-wide retains both 'roles.edit' and 'users.assign_roles' at 'all' scope.
 */
export async function assertNotLockout(context?: {
  deactivatingUserId?: number;
  removingRoleId?: number;
  fromUserId?: number;
}): Promise<void> {
  const querySql = `
    SELECT u.id, u.name, r.is_protected, p.key as permission_key, rp.scope
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE u.status = 'active'
  `;

  const rows = await query<{
    id: number;
    name: string;
    is_protected: boolean;
    permission_key: string;
    scope: PermissionScope;
  }>(querySql);

  // Group by user
  const userPerms = new Map<number, { isProtected: boolean; perms: Map<string, PermissionScope> }>();

  rows.forEach((r) => {
    // If we are deactivating this user, exclude them from safety count
    if (context?.deactivatingUserId && r.id === context.deactivatingUserId) {
      return;
    }

    // If we are removing a role from this user, exclude that role
    if (
      context?.fromUserId &&
      context?.removingRoleId &&
      r.id === context.fromUserId
    ) {
      // Role will be excluded
      return;
    }

    if (!userPerms.has(r.id)) {
      userPerms.set(r.id, {
        isProtected: false,
        perms: new Map(),
      });
    }

    const entry = userPerms.get(r.id)!;
    if (r.is_protected) {
      entry.isProtected = true;
    }
    if (r.permission_key) {
      entry.perms.set(r.permission_key, r.scope);
    }
  });

  let adminCount = 0;
  for (const [, data] of userPerms) {
    if (data.isProtected) {
      adminCount++;
      continue;
    }

    const hasRolesEdit = data.perms.get('roles.edit') === 'all';
    const hasAssignRoles = data.perms.get('users.assign_roles') === 'all';

    if (hasRolesEdit && hasAssignRoles) {
      adminCount++;
    }
  }

  if (adminCount < 1) {
    throw new Error(
      "Lockout safeguard: At least one active user must retain 'roles.edit' and 'users.assign_roles' permissions with 'all' scope."
    );
  }
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  UserPlus,
  RotateCcw,
  Search,
  Check,
  X,
  Sliders,
  Sparkles,
  Key,
  Lock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  BarChart3,
  Calendar,
  FileText,
  Briefcase,
  Camera,
  HardHat,
  FileCheck,
  Award,
  Zap,
  Save,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TeamMembersList } from './TeamMembersList';

interface ModuleConfig {
  view: 'none' | 'own' | 'assigned' | 'all';
  manage: boolean;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  is_protected?: boolean;
  user_count?: number;
  permissions?: Array<{ permission_id: number; key?: string; scope: string }>;
  modules?: Record<string, ModuleConfig>;
}

interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  scoped: boolean;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'leads',
    label: 'Leads & Inquiries',
    description: 'Inbound prospective homeowners, storm leads & door knocker canvassing submissions',
    icon: UserPlus,
    accentColor: 'from-amber-500 to-orange-500 text-amber-600 bg-amber-50 border-amber-200',
    scoped: true,
  },
  {
    id: 'pipeline',
    label: 'Sales Pipeline',
    description: 'Kanban deal stages, win/loss probabilities, velocity tracking, and stage transitions',
    icon: Sliders,
    accentColor: 'from-sky-500 to-blue-600 text-sky-600 bg-sky-50 border-sky-200',
    scoped: true,
  },
  {
    id: 'estimates',
    label: 'Estimates & Proposals',
    description: 'Roofing cost calculations, material formulas, pricing templates, and sent proposals',
    icon: FileText,
    accentColor: 'from-indigo-500 to-purple-600 text-indigo-600 bg-indigo-50 border-indigo-200',
    scoped: true,
  },
  {
    id: 'contracts',
    label: 'Contracts & Signatures',
    description: 'Legally binding work authorizations, deposit terms, and client signature sign-offs',
    icon: FileCheck,
    accentColor: 'from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50 border-emerald-200',
    scoped: false,
  },
  {
    id: 'jobs',
    label: 'Production Jobs',
    description: 'Jobsite work orders, crew dispatch schedules, material deliveries, and completion sign-offs',
    icon: Briefcase,
    accentColor: 'from-blue-600 to-indigo-700 text-blue-600 bg-blue-50 border-blue-200',
    scoped: true,
  },
  {
    id: 'calendar',
    label: 'Schedule & Calendar',
    description: 'Roof inspection appointments, crew dispatch calendars, and team events',
    icon: Calendar,
    accentColor: 'from-violet-500 to-purple-600 text-violet-600 bg-violet-50 border-violet-200',
    scoped: true,
  },
  {
    id: 'inspections',
    label: 'Roof Inspections',
    description: '12-point photo audits, drone inspection reports, and storm damage assessments',
    icon: Camera,
    accentColor: 'from-teal-500 to-emerald-600 text-teal-600 bg-teal-50 border-teal-200',
    scoped: false,
  },
  {
    id: 'finances',
    label: 'Finances & Invoicing',
    description: 'Customer invoices, payment processing, project gross margins, and profit ledgers',
    icon: DollarSign,
    accentColor: 'from-rose-500 to-pink-600 text-rose-600 bg-rose-50 border-rose-200',
    scoped: false,
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    description: 'Executive revenue KPIs, proposal win rates, roofer leaderboard, and speed-to-lead',
    icon: BarChart3,
    accentColor: 'from-orange-500 to-amber-600 text-orange-600 bg-orange-50 border-orange-200',
    scoped: false,
  },
  {
    id: 'warranties',
    label: 'Warranties & Certificates',
    description: 'Manufacturer material guarantees and Rise Up workmanship roof certificates',
    icon: Award,
    accentColor: 'from-amber-600 to-yellow-600 text-amber-700 bg-amber-50 border-amber-200',
    scoped: false,
  },
  {
    id: 'crew',
    label: 'Field Crew & Subcontractors',
    description: 'In-house journeymen roofer rosters, daily laborers, and certified trade subcontractors',
    icon: HardHat,
    accentColor: 'from-cyan-600 to-sky-600 text-cyan-600 bg-cyan-50 border-cyan-200',
    scoped: false,
  },
  {
    id: 'estimator_settings',
    label: 'Estimator & Pricing Formulas',
    description: 'Base square costs, labor multipliers, pitch steepness factors, and margin floors',
    icon: Sliders,
    accentColor: 'from-slate-600 to-slate-800 text-slate-700 bg-slate-100 border-slate-200',
    scoped: false,
  },
  {
    id: 'users',
    label: 'Team & User Accounts',
    description: 'Staff account provisioning, invitation management, and account deactivation',
    icon: Users,
    accentColor: 'from-emerald-600 to-green-700 text-emerald-700 bg-emerald-50 border-emerald-200',
    scoped: false,
  },
  {
    id: 'roles',
    label: 'Roles & RBAC Privileges',
    description: 'Security role definitions, permission studio assignments, and access policies',
    icon: ShieldCheck,
    accentColor: 'from-purple-600 to-indigo-700 text-purple-700 bg-purple-50 border-purple-200',
    scoped: false,
  },
];

// Presets for 1-click role configuration
const ROLE_PRESETS: Record<string, { label: string; description: string; getModules: () => Record<string, ModuleConfig> }> = {
  sales_rep: {
    label: 'Field Sales Rep',
    description: 'Assigned leads, deals, estimates & calendar. No finances or company settings.',
    getModules: () => ({
      leads: { view: 'assigned', manage: true },
      pipeline: { view: 'assigned', manage: true },
      estimates: { view: 'assigned', manage: true },
      contracts: { view: 'all', manage: false },
      jobs: { view: 'assigned', manage: false },
      calendar: { view: 'all', manage: true },
      inspections: { view: 'all', manage: true },
      finances: { view: 'none', manage: false },
      reports: { view: 'none', manage: false },
      warranties: { view: 'all', manage: false },
      crew: { view: 'none', manage: false },
      estimator_settings: { view: 'none', manage: false },
      users: { view: 'none', manage: false },
      roles: { view: 'none', manage: false },
    }),
  },
  door_knocker: {
    label: 'Door Knocker / Canvasser',
    description: 'Creates & views own leads only. Completely restricted from quotes, jobs & financials.',
    getModules: () => ({
      leads: { view: 'own', manage: true },
      pipeline: { view: 'none', manage: false },
      estimates: { view: 'none', manage: false },
      contracts: { view: 'none', manage: false },
      jobs: { view: 'none', manage: false },
      calendar: { view: 'own', manage: true },
      inspections: { view: 'none', manage: false },
      finances: { view: 'none', manage: false },
      reports: { view: 'none', manage: false },
      warranties: { view: 'none', manage: false },
      crew: { view: 'none', manage: false },
      estimator_settings: { view: 'none', manage: false },
      users: { view: 'none', manage: false },
      roles: { view: 'none', manage: false },
    }),
  },
  project_manager: {
    label: 'Project Manager',
    description: 'Full operational control over leads, pipeline, estimates, contracts, jobs, and crews.',
    getModules: () => ({
      leads: { view: 'all', manage: true },
      pipeline: { view: 'all', manage: true },
      estimates: { view: 'all', manage: true },
      contracts: { view: 'all', manage: true },
      jobs: { view: 'all', manage: true },
      calendar: { view: 'all', manage: true },
      inspections: { view: 'all', manage: true },
      finances: { view: 'none', manage: false },
      reports: { view: 'all', manage: false },
      warranties: { view: 'all', manage: true },
      crew: { view: 'all', manage: true },
      estimator_settings: { view: 'all', manage: false },
      users: { view: 'none', manage: false },
      roles: { view: 'none', manage: false },
    }),
  },
  read_only: {
    label: 'Read Only (Observer)',
    description: 'Can view all records across all modules without ability to edit or delete.',
    getModules: () => {
      const m: Record<string, ModuleConfig> = {};
      MODULE_DEFINITIONS.forEach((def) => {
        m[def.id] = { view: 'all', manage: false };
      });
      return m;
    },
  },
  full_admin: {
    label: 'Full Operational Admin',
    description: 'Grants view & manage privileges across every CRM module.',
    getModules: () => {
      const m: Record<string, ModuleConfig> = {};
      MODULE_DEFINITIONS.forEach((def) => {
        m[def.id] = { view: 'all', manage: true };
      });
      return m;
    },
  },
};

export function TeamRolesPermissionMatrix() {
  const { user: currentUser, isOwner, can } = useAuth();
  const [activeTab, setActiveTab] = useState<'matrix' | 'members'>('matrix');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeModules, setActiveModules] = useState<Record<string, ModuleConfig>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search filter
  const [searchModule, setSearchModule] = useState<string>('');

  // Create Role Modal State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('sales_rep');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadRoles = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.getRoles(),
        api.getUsers(),
      ]);

      const rawRoles: Role[] = rolesRes.roles || [];
      const rawUsers = usersRes.users || [];

      // Calculate user counts per role
      const counts: Record<number, number> = {};
      rawUsers.forEach((u: any) => {
        if (u.roles && u.roles.length > 0) {
          u.roles.forEach((r: any) => {
            counts[r.id] = (counts[r.id] || 0) + 1;
          });
        } else if (u.role) {
          const matched = rawRoles.find(
            (r) =>
              r.name.toLowerCase() === u.role.toLowerCase() ||
              r.name.toLowerCase().replace(/ /g, '_') === u.role.toLowerCase()
          );
          if (matched) counts[matched.id] = (counts[matched.id] || 0) + 1;
        }
      });

      const augmentedRoles = rawRoles.map((r) => ({
        ...r,
        user_count: counts[r.id] || 0,
      }));

      setRoles(augmentedRoles);

      // Default select first non-protected role or first role
      if (!selectedRoleId && augmentedRoles.length > 0) {
        const defaultRole = augmentedRoles.find((r) => !r.is_protected) || augmentedRoles[0];
        setSelectedRoleId(defaultRole.id);
        setActiveModules(defaultRole.modules || {});
      } else if (selectedRoleId) {
        const curr = augmentedRoles.find((r) => r.id === selectedRoleId);
        if (curr) {
          setActiveModules(curr.modules || {});
        }
      }
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const handleSelectRole = (role: Role) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved permission changes. Switch role anyway?')) {
        return;
      }
    }
    setSelectedRoleId(role.id);
    setActiveModules(role.modules || {});
    setHasUnsavedChanges(false);
  };

  const handleViewChange = (moduleId: string, newView: 'none' | 'own' | 'assigned' | 'all') => {
    if (!activeRole || activeRole.is_protected) return;
    if (!can('roles.edit') && !isOwner) {
      showToast('You do not have permission to edit roles.');
      return;
    }

    setActiveModules((prev) => {
      const current = prev[moduleId] || { view: 'none', manage: false };
      // If setting view to none, manage must automatically become false
      const nextManage = newView === 'none' ? false : current.manage;
      return {
        ...prev,
        [moduleId]: {
          view: newView,
          manage: nextManage,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleManageChange = (moduleId: string, newManage: boolean) => {
    if (!activeRole || activeRole.is_protected) return;
    if (!can('roles.edit') && !isOwner) {
      showToast('You do not have permission to edit roles.');
      return;
    }

    setActiveModules((prev) => {
      const current = prev[moduleId] || { view: 'none', manage: false };
      // If enabling manage while view was none, auto-enable view to 'all' or 'assigned'
      const def = MODULE_DEFINITIONS.find((m) => m.id === moduleId);
      let nextView = current.view;
      if (newManage && current.view === 'none') {
        nextView = def?.scoped ? 'assigned' : 'all';
      }
      return {
        ...prev,
        [moduleId]: {
          view: nextView,
          manage: newManage,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleApplyPreset = (presetKey: string) => {
    if (!activeRole || activeRole.is_protected) return;
    const preset = ROLE_PRESETS[presetKey];
    if (!preset) return;

    const newMods = preset.getModules();
    setActiveModules(newMods);
    setHasUnsavedChanges(true);
    showToast(`Applied preset: ${preset.label}`);
  };

  const handleSaveChanges = async () => {
    if (!activeRole || activeRole.is_protected) return;
    setIsSaving(true);
    try {
      await api.updateRole(activeRole.id, {
        modules: activeModules,
      });
      showToast(`Permissions saved successfully for "${activeRole.name}".`);
      setHasUnsavedChanges(false);
      await loadRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to save role permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const preset = ROLE_PRESETS[selectedPresetKey];
    const initialModules = preset ? preset.getModules() : {};

    try {
      const res = await api.createRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || 'Custom operational role',
        modules: initialModules,
      });
      showToast(`Role "${newRoleName}" created successfully!`);
      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      await loadRoles();
      if (res.role?.id) {
        setSelectedRoleId(res.role.id);
        setActiveModules(res.role.modules || {});
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_protected) {
      showToast('Cannot delete system protected Owner role.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"? Users in this role will lose their privileges.`)) {
      return;
    }
    try {
      await api.deleteRole(role.id);
      showToast(`Role "${role.name}" deleted.`);
      const remaining = roles.filter((r) => r.id !== role.id);
      setSelectedRoleId(remaining[0]?.id || null);
      await loadRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // Filtered modules based on search
  const filteredModules = useMemo(() => {
    const q = searchModule.toLowerCase().trim();
    if (!q) return MODULE_DEFINITIONS;
    return MODULE_DEFINITIONS.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [searchModule]);

  return (
    <div className="space-y-6 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs font-semibold flex items-center gap-3 shadow-xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 mb-2 shadow-2xs">
            <ShieldCheck size={14} className="text-sky-600" />
            <span>Role Permissions Studio • {roles.length} Configured Roles</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Team, Roles & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic roles per module with clean [View] and [Manage] access controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadRoles();
              showToast('Role permissions synced with database.');
            }}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <RotateCcw size={14} className={isRefreshing ? 'animate-spin text-sky-600' : 'text-slate-500'} />
            <span>Sync</span>
          </button>

          {(isOwner || can('roles.create')) && (
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#E06800] to-[#FF8A00] hover:from-[#C85A00] hover:to-[#E06800] shadow-[0_2px_12px_rgba(224,104,0,0.25)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Create New Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Tab Bar (Members vs Roles Studio) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
            activeTab === 'members'
              ? 'text-sky-700 bg-sky-50 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users size={15} />
          <span>Team Members & Invitations</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
            activeTab === 'matrix'
              ? 'text-sky-700 bg-sky-50 border border-sky-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield size={15} className={activeTab === 'matrix' ? 'text-sky-600' : ''} />
          <span>Role Permissions Studio</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-sky-100 text-sky-700 border border-sky-200">
            {roles.length} Roles
          </span>
        </button>
      </div>

      {/* Tab 1: Team Members List */}
      {activeTab === 'members' && (
        <TeamMembersList roles={roles} onRefresh={loadRoles} />
      )}

      {/* Tab 2: Role Permissions Studio */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 1. Horizontal Role Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Select Role to Configure</span>
              <span>Click a role to adjust its module radios</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`p-3 rounded-xl text-left transition-all relative border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-2 ring-sky-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>
                          {r.name}
                        </span>
                        {r.is_protected && (
                          <span title="Protected Owner Role">
                            <Lock size={11} className="text-amber-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {r.description || 'Custom role'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                      <span>{r.user_count ?? 0} staff</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-sky-600 flex items-center gap-0.5">
                          <Check size={11} /> Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Active Role Control Studio */}
          {activeRole && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Studio Header Bar */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">
                      Configuring Role
                    </span>
                    <h2 className="text-lg font-black text-slate-900">{activeRole.name}</h2>
                    {activeRole.is_protected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Lock size={10} /> Root Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeRole.description || 'Custom operational role with tailored module permissions.'}
                  </p>
                </div>

                {/* Preset Templates Bar & Save Action */}
                <div className="flex items-center flex-wrap gap-2">
                  {!activeRole.is_protected && (
                    <>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 px-2">Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('sales_rep')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Sales Rep
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('door_knocker')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Door Knocker
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('project_manager')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Project Mgr
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('read_only')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Read Only
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          hasUnsavedChanges
                            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <RotateCcw size={13} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            <span>{hasUnsavedChanges ? 'Save Changes *' : 'Saved'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRole(activeRole)}
                        title="Delete this role"
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}

                  {activeRole.is_protected && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
                      <Lock size={13} className="text-amber-600" />
                      <span>Owner permissions are permanent root (* &rarr; all).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Module Search & Filter Bar */}
              <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchModule}
                    onChange={(e) => setSearchModule(e.target.value)}
                    placeholder="Search module (e.g. leads, pipeline, finances)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Access Legend:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    None (Hidden)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    View Only
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Full Manage
                  </span>
                </div>
              </div>

              {/* Module Radios Table / Rows */}
              <div className="divide-y divide-slate-100">
                {filteredModules.map((module) => {
                  const modConfig = activeModules[module.id] || { view: 'none', manage: false };
                  const isProtected = activeRole.is_protected;
                  const Icon = module.icon;
                  const currentView = isProtected ? 'all' : modConfig.view;
                  const currentManage = isProtected ? true : modConfig.manage;
                  const canManageDisabled = isProtected || currentView === 'none';

                  // Compute summary badge
                  let summaryBadge = {
                    label: 'No Access',
                    className: 'bg-slate-100 text-slate-500 border-slate-200',
                  };
                  if (currentView !== 'none') {
                    if (currentManage) {
                      summaryBadge = {
                        label: currentView === 'all' ? 'Full Manage (All)' : `Full Manage (${currentView.toUpperCase()})`,
                        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-black',
                      };
                    } else {
                      summaryBadge = {
                        label: currentView === 'all' ? 'View Only (All)' : `View Only (${currentView.toUpperCase()})`,
                        className: 'bg-sky-50 text-sky-700 border-sky-200 font-bold',
                      };
                    }
                  }

                  return (
                    <div
                      key={module.id}
                      className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Module Info */}
                      <div className="flex items-start gap-3 md:w-5/12">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${module.accentColor}`}>
                          <Icon size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{module.label}</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] uppercase tracking-wider border ${summaryBadge.className}`}>
                              {summaryBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            {module.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: The Radios Control Box */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:w-7/12 justify-end">
                        {/* 1. View Access Radios */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                            View Access
                          </label>
                          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 gap-1 shadow-2xs">
                            {/* None */}
                            <button
                              type="button"
                              disabled={isProtected}
                              onClick={() => handleViewChange(module.id, 'none')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                currentView === 'none'
                                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-800'
                              } ${isProtected ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              None
                            </button>

                            {/* Scoped Options */}
                            {module.scoped ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isProtected}
                                  onClick={() => handleViewChange(module.id, 'assigned')}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    currentView === 'assigned' || currentView === 'own'
                                      ? 'bg-sky-600 text-white shadow-2xs font-bold'
                                      : 'text-slate-500 hover:text-slate-800'
                                  } ${isProtected ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  title="Can only view leads/deals assigned to user or created by them"
                                >
                                  Assigned / Own
                                </button>
                                <button
                                  type="button"
                                  disabled={isProtected}
                                  onClick={() => handleViewChange(module.id, 'all')}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    currentView === 'all'
                                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                      : 'text-slate-500 hover:text-slate-800'
                                  } ${isProtected ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  title="Can view all records across the entire organization"
                                >
                                  Org-Wide
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={isProtected}
                                onClick={() => handleViewChange(module.id, 'all')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                  currentView === 'all'
                                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                    : 'text-slate-500 hover:text-slate-800'
                                } ${isProtected ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                Can View
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2. Manage Access Radios */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Manage Access
                          </label>
                          <div className={`inline-flex items-center p-1 rounded-xl border gap-1 shadow-2xs ${
                            canManageDisabled ? 'bg-slate-50 border-slate-200/60 opacity-60' : 'bg-slate-100/90 border-slate-200'
                          }`}>
                            <button
                              type="button"
                              disabled={canManageDisabled}
                              onClick={() => handleManageChange(module.id, false)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                !currentManage
                                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-800'
                              } ${canManageDisabled ? 'cursor-not-allowed' : ''}`}
                            >
                              Read Only
                            </button>

                            <button
                              type="button"
                              disabled={canManageDisabled}
                              onClick={() => handleManageChange(module.id, true)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                currentManage
                                  ? 'bg-gradient-to-r from-[#E06800] to-[#FF8A00] text-white shadow-2xs font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              } ${canManageDisabled ? 'cursor-not-allowed' : ''}`}
                              title="Allows creating, updating, editing, and deleting records in this module"
                            >
                              Can Manage
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Save Bar if unsaved */}
              {hasUnsavedChanges && !activeRole.is_protected && (
                <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <AlertCircle size={15} className="text-amber-600" />
                    <span>You have unsaved radio changes for <strong>{activeRole.name}</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModules(activeRole.modules || {});
                        setHasUnsavedChanges(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-amber-100/60 cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSaving ? <RotateCcw size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Save Role Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create New Role Modal */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsCreateRoleOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E06800] to-[#FF8A00] flex items-center justify-center text-white font-bold shadow-md">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Custom Role</h3>
                <p className="text-xs text-slate-500">
                  Define an operational role with preset module permissions.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Commercial Estimator, Field Auditor, Billing Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Description
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="e.g. Canvassing neighborhoods, qualifying leads, performing roof inspections"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Base Template Preset
                </label>
                <select
                  value={selectedPresetKey}
                  onChange={(e) => setSelectedPresetKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs cursor-pointer"
                >
                  <option value="sales_rep">Field Sales Rep (Assigned Deals, Quotes & Calendar)</option>
                  <option value="door_knocker">Door Knocker (Create & View Own Leads Only)</option>
                  <option value="project_manager">Project Manager (Full Operations, No Finances)</option>
                  <option value="read_only">Read Only Observer (View-only all records)</option>
                  <option value="full_admin">Full Operational Admin (All Modules)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_PRESETS[selectedPresetKey]?.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#E06800] to-[#FF8A00] hover:from-[#C85A00] hover:to-[#E06800] shadow-md transition-all cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

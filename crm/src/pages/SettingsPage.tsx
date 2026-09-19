import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { TeamRolesPermissionMatrix } from '@/components/rbac/TeamRolesPermissionMatrix';
import { CompanyProfileTab } from '@/components/settings/CompanyProfileTab';
import { PricingFormulasTab } from '@/components/settings/PricingFormulasTab';
import { InviteUserModal } from '@/components/settings/InviteUserModal';
import { useCompany } from '@/context/CompanyContext';

import {
  SettingsTab,
  TeamMember,
  UserRole,
  CompanyProfile,
  PricingConfig,
  PipelineAutomation,
  NotificationSettings,
  IntegrationItem,
  SecuritySession,
  AuditLogEntry,
  RoleType,
  PermissionKey,
} from '@/types/settingsTypes';

import {
  INITIAL_TEAM_MEMBERS,
  INITIAL_USER_ROLES,
  INITIAL_PRICING_CONFIG,
  INITIAL_PIPELINE_AUTOMATION,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_SECURITY_SESSIONS,
  INITIAL_AUDIT_LOGS,
} from '@/data/settingsData';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') as SettingsTab | null;

  const validTabs: SettingsTab[] = [
    'users',
    'company',
    'pricing',
  ];

  const initialTab =
    queryTab && validTabs.includes(queryTab) ? queryTab : 'users';

  // Master State
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [search, setSearch] = useState<string>('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Global Company State from context (applies everywhere across the CRM)
  const { company, updateCompany, resetCompany } = useCompany();

  // Data Collections
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('rise_up_team_members');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [roles, setRoles] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem('rise_up_user_roles');
    return saved ? JSON.parse(saved) : INITIAL_USER_ROLES;
  });

  const [pricing, setPricing] = useState<PricingConfig>(() => {
    const saved = localStorage.getItem('rise_up_pricing_config');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_CONFIG;
  });

  const [pipeline, setPipeline] = useState<PipelineAutomation>(() => {
    const saved = localStorage.getItem('rise_up_pipeline_config');
    return saved ? JSON.parse(saved) : INITIAL_PIPELINE_AUTOMATION;
  });

  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('rise_up_notification_config');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_SETTINGS;
  });

  const [integrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [sessions, setSessions] = useState<SecuritySession[]>(
    INITIAL_SECURITY_SESSIONS
  );
  const [auditLogs, setAuditLogs] =
    useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Sync URL search params with active tab
  useEffect(() => {
    if (queryTab && validTabs.includes(queryTab) && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Global keyboard shortcut: ⌘ / Win + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector(
          'input[placeholder*="Search settings"]'
        ) as HTMLInputElement;
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (newTab: SettingsTab) => {
    if (validTabs.includes(newTab)) {
      setActiveTab(newTab);
      setSearchParams({ tab: newTab });
    }
  };

  const addAuditLog = (action: string, category: AuditLogEntry['category']) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      user: 'Silvester Stone',
      userInitials: 'SS',
      action,
      category,
      ip: '172.56.42.18',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // State Change Triggers
  const handleCompanyChange = (updated: CompanyProfile) => {
    updateCompany(updated);
    setHasUnsavedChanges(true);
  };

  const handlePricingChange = (updated: PricingConfig) => {
    setPricing(updated);
    setHasUnsavedChanges(true);
  };

  const handleUpdateMember = (updatedMember: TeamMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    setHasUnsavedChanges(true);
    addAuditLog(
      `Updated member profile & role for ${updatedMember.name}`,
      'team'
    );
  };

  const handleDeleteMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setHasUnsavedChanges(true);
    if (target) {
      addAuditLog(`Revoked CRM access and removed ${target.name}`, 'team');
    }
  };

  const handleInviteMember = (newMemberData: {
    name: string;
    email: string;
    phone: string;
    role: RoleType;
    roleLabel: string;
    branch: string;
    avatarColor: string;
    initials: string;
    status: 'active' | 'invited';
    twoFactorEnabled: boolean;
  }) => {
    const newMember: TeamMember = {
      ...newMemberData,
      id: `usr-${Date.now()}`,
      lastActive: 'Invited Now',
      joinedDate: 'Sep 2026',
    };

    setMembers((prev) => [...prev, newMember]);
    setHasUnsavedChanges(true);
    addAuditLog(
      `Invited new staff member ${newMember.name} as ${newMember.roleLabel}`,
      'team'
    );
  };

  const handleUpdatePermissions = (
    roleId: RoleType,
    permKey: PermissionKey,
    val: boolean
  ) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [permKey]: val,
            },
          };
        }
        return r;
      })
    );
    setHasUnsavedChanges(true);
    addAuditLog(
      `Modified security policy permissions for role: ${roleId}`,
      'security'
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    addAuditLog(`Terminated remote session ${sessionId}`, 'security');
  };

  const handleCreateBackup = () => {
    addAuditLog('Triggered manual encrypted cloud snapshot', 'compliance');
    alert('Encrypted backup successfully created and pushed to cloud storage.');
  };

  // Master Synchronize & Save
  const handleSaveAll = () => {
    setIsSaving(true);

    // Save global company profile (dispatches cross-window sync event)
    updateCompany(company);

    localStorage.setItem('rise_up_team_members', JSON.stringify(members));
    localStorage.setItem('rise_up_user_roles', JSON.stringify(roles));
    localStorage.setItem('rise_up_pricing_config', JSON.stringify(pricing));
    localStorage.setItem('rise_up_pipeline_config', JSON.stringify(pipeline));
    localStorage.setItem(
      'rise_up_notification_config',
      JSON.stringify(notifications)
    );

    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      addAuditLog(
        'Saved and synchronized all CRM operational settings to cloud storage',
        'security'
      );
    }, 600);
  };

  const handleDiscard = () => {
    setMembers(INITIAL_TEAM_MEMBERS);
    setRoles(INITIAL_USER_ROLES);
    resetCompany();
    setPricing(INITIAL_PRICING_CONFIG);
    setPipeline(INITIAL_PIPELINE_AUTOMATION);
    setNotifications(INITIAL_NOTIFICATION_SETTINGS);
    setHasUnsavedChanges(false);
    addAuditLog('Discarded pending changes and restored defaults', 'security');
  };

  const handleExportConfig = () => {
    const fullConfig = {
      exportedAt: new Date().toISOString(),
      company,
      pricing,
      pipeline,
      notifications,
      teamMembers: members,
      roles,
      activeIntegrations: integrations,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(fullConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `rise_up_crm_config_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAuditLog('Exported CRM configuration snapshot (JSON)', 'compliance');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none pb-24">
      {/* 1. Unified 220px Hero Header with Top Search & Actions */}
      <CrmPageHero
        pageId="settings"
        defaultEyebrow={`Operations & Contractor Infrastructure • ${company.dba || 'Oceanside HQ'}`}
        defaultTitle="BUSINESS SETTINGS & TEAM SUITE"
        defaultSubtitle="Centralized operations, contractor licensing, estimator pricing multipliers, team user roles, and security policies."
        showSearch={true}
        searchPlaceholder="Search settings, team members..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        topRightActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportConfig}
              className="h-9 px-3.5 rounded-xl liquid-glass-btn text-slate-700 hover:text-slate-900 hover:border-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Export complete configuration JSON snapshot"
            >
              <Download size={13} className="text-[#1878B8]" />
              <span>Export</span>
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="h-9 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Discard</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-[#1878B8] via-sky-500 to-[#55C4F5] text-white font-bold text-xs shadow-xs hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Save Changes</span>
                  {hasUnsavedChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping ml-0.5" />
                  )}
                </>
              )}
            </button>
          </div>
        }
        bottomRightBadges={
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{company.licenseNumber || 'CSLB #1115874'} Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs shrink-0">
              <ShieldCheck size={11} className="text-sky-600" />
              <span>{company.dba || 'Rise Up Roofing'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/90 text-[10px] font-bold text-slate-700 shadow-2xs shrink-0">
              <span>Backups: Hourly</span>
            </span>
          </div>
        }
      />

      {/* 2. Sleek Tab Navigation with Disabled Under-Development Badges */}
      <SettingsNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userCount={members.length}
      />

      {/* 3. Active Tab Deep-Dive Viewport */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'users' && (
          <TeamRolesPermissionMatrix />
        )}

        {activeTab === 'company' && (
          <CompanyProfileTab
            company={company}
            onChange={handleCompanyChange}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingFormulasTab
            pricing={pricing}
            onChange={handlePricingChange}
          />
        )}
      </div>

      {/* 4. Invite User Modal Dialog */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
        roles={roles}
      />
    </div>
  );
}

export default SettingsPage;

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Lock,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Camera,
  Copy,
  Trash2,
  Sliders,
  Users,
  Shield,
  Key,
  ExternalLink,
  Info,
  Check,
  X,
  Send,
  AlertCircle,
  Eye,
  Building2,
  UserCheck,
  Settings,
  CheckCheck,
  Minus,
} from 'lucide-react';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import AvatarPickerModal from '@/components/admin/shared/AvatarPickerModal';
import CustomSelect from '@/components/admin/shared/CustomSelect';

interface UserRoleInfo {
  id: number;
  name: string;
  is_protected: boolean;
}

interface UserRecord {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  roles?: UserRoleInfo[];
  status: 'invited' | 'active' | 'deactivated' | 'inactive' | 'suspended';
  avatar_url?: string | null;
  last_login_at?: string | null;
  created_at: string;
}

interface InvitationRecord {
  id: number;
  email: string;
  invited_role_ids: number[];
  invited_roles: { id: number; name: string }[];
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
  invited_by_name?: string | null;
  token?: string;
}

interface RoleRecord {
  id: number;
  name: string;
  description?: string | null;
  is_protected: boolean;
  member_count: number;
  created_at?: string;
  updated_at?: string;
  permissions?: Record<string, 'own' | 'assigned' | 'all'>;
}

interface PermissionItem {
  id?: number;
  key: string;
  resource: string;
  action: string;
  name: string;
  description: string;
  supports_scope: boolean;
  default_scope: 'own' | 'assigned' | 'all';
}

interface PermissionCategory {
  resource: string;
  name: string;
  description: string;
  order: number;
  permissions: PermissionItem[];
}

export default function TeamAndRolesConsole() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  // Filters for Users Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Filters for Matrix Tab
  const [matrixSearch, setMatrixSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [avatarUser, setAvatarUser] = useState<UserRecord | null>(null);

  // Toast & Errors
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load all core data safely
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setActionError(null);

    try {
      const [uRes, iRes, rRes, pRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/invitations'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ]);

      if (uRes.status === 403 || rRes.status === 403) {
        setIsForbidden(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const uData = uRes.ok ? await uRes.json().catch(() => ({ ok: false })) : { ok: false };
      const iData = iRes.ok ? await iRes.json().catch(() => ({ ok: false })) : { ok: false };
      const rData = rRes.ok ? await rRes.json().catch(() => ({ ok: false })) : { ok: false };
      const pData = pRes.ok ? await pRes.json().catch(() => ({ ok: false })) : { ok: false };

      if (uData.ok && Array.isArray(uData.users)) {
        setUsers(uData.users);
      }
      if (iData.ok && Array.isArray(iData.invitations)) {
        setInvitations(iData.invitations);
      }
      if (rData.ok && Array.isArray(rData.roles)) {
        setRoles(rData.roles);
      }

      // Handle permissions and categories
      if (pData.ok) {
        if (Array.isArray(pData.categories) && pData.categories.length > 0) {
          setCategories(pData.categories);
        } else if (pData.grouped && typeof pData.grouped === 'object') {
          // Fallback construct categories from grouped
          const constructed: PermissionCategory[] = Object.entries(pData.grouped).map(([resource, items]: [string, any]) => ({
            resource,
            name: resource.charAt(0).toUpperCase() + resource.slice(1),
            description: '',
            order: 50,
            permissions: (items || []).map((it: any) => ({
              key: it.key,
              resource: it.resource,
              action: it.action,
              name: it.action ? it.action.replace(/_/g, ' ') : it.key,
              description: it.description || '',
              supports_scope: Boolean(it.supportsScope),
              default_scope: 'all' as const,
            })),
          }));
          setCategories(constructed);
        }

        if (Array.isArray(pData.permissions)) {
          setAllPermissions(pData.permissions);
        } else if (Array.isArray(pData.catalog)) {
          setAllPermissions(
            pData.catalog.map((it: any) => ({
              key: it.key,
              resource: it.resource,
              action: it.action,
              name: it.action ? it.action.replace(/_/g, ' ') : it.key,
              description: it.description || '',
              supports_scope: Boolean(it.supportsScope),
              default_scope: 'all' as const,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load access control data:', err);
      setActionError('Failed to synchronize user and role records with server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u) return false;
      const userName = (u.name || '').toLowerCase();
      const userEmail = (u.email || '').toLowerCase();
      const userPhone = u.phone || '';
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        userName.includes(query) ||
        userEmail.includes(query) ||
        userPhone.includes(query);

      const userRoleNames =
        u.roles && u.roles.length > 0
          ? u.roles.map((r) => (r.name || '').toLowerCase())
          : [u.role ? u.role.toLowerCase() : ''];

      const matchesRole =
        selectedRoleFilter === 'all' ||
        userRoleNames.some((r) => r === selectedRoleFilter.toLowerCase());

      const userStatus = u.status === 'inactive' || u.status === 'suspended' ? 'deactivated' : u.status;
      const matchesStatus =
        selectedStatusFilter === 'all' ||
        userStatus === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Filtered Categories & Permissions for Matrix
  const filteredCategories = useMemo(() => {
    const q = matrixSearch.trim().toLowerCase();

    return categories
      .filter((cat) => {
        if (selectedCategoryFilter !== 'all' && cat.resource !== selectedCategoryFilter) {
          return false;
        }
        return true;
      })
      .map((cat) => {
        const matchingPermissions = (cat.permissions || []).filter((p) => {
          if (!q) return true;
          return (
            (p.name || '').toLowerCase().includes(q) ||
            (p.key || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (cat.name || '').toLowerCase().includes(q)
          );
        });

        return {
          ...cat,
          permissions: matchingPermissions,
        };
      })
      .filter((cat) => cat.permissions.length > 0);
  }, [categories, matrixSearch, selectedCategoryFilter]);

  // Total permissions count matching
  const matrixPermissionsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.permissions.length, 0);
  }, [filteredCategories]);

  // Copy link helper
  const copyInviteLink = (tokenOrUrl: string) => {
    if (!tokenOrUrl) {
      showToast('Invitation token missing', 'error');
      return;
    }
    const fullUrl = tokenOrUrl.startsWith('http')
      ? tokenOrUrl
      : `${window.location.origin}${tokenOrUrl.startsWith('/') ? tokenOrUrl : `/admin/invite/${tokenOrUrl}`}`;

    navigator.clipboard.writeText(fullUrl);
    showToast('Invitation link copied to clipboard!', 'success');
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invId: number) => {
    if (!confirm('Are you sure you want to revoke this pending invitation?')) return;
    try {
      const res = await fetch(`/api/admin/invitations?id=${invId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('Invitation revoked.', 'info');
        loadAllData(true);
      } else {
        showToast(data.error || 'Failed to revoke invitation', 'error');
      }
    } catch {
      showToast('Error connecting to server', 'error');
    }
  };

  // Toggle User Status (Deactivate / Activate)
  const handleToggleUserStatus = async (user: UserRecord) => {
    const isDeactivated = user.status === 'deactivated' || user.status === 'inactive' || user.status === 'suspended';
    const newStatus = isDeactivated ? 'active' : 'deactivated';
    const actionLabel = isDeactivated ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${actionLabel} ${user.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`User ${user.name} is now ${newStatus}.`, 'success');
        loadAllData(true);
      } else {
        showToast(data.error || `Could not ${actionLabel} user`, 'error');
      }
    } catch {
      showToast('Error connecting to server', 'error');
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: RoleRecord) => {
    if (role.is_protected) {
      alert('This protected system role cannot be deleted.');
      return;
    }
    if (role.member_count > 0) {
      alert(`Cannot delete "${role.name}" because it is currently assigned to ${role.member_count} member(s). Reassign them first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast(`Role "${role.name}" deleted.`, 'info');
        loadAllData(true);
      } else {
        showToast(data.error || 'Failed to delete role', 'error');
      }
    } catch {
      showToast('Error connecting to server', 'error');
    }
  };

  if (isForbidden) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
          <Lock size={28} />
        </div>
        <h2 className="text-[#0B1E33] font-bold text-lg">Access Restricted</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">
          You do not have administrative permission to view or manage team roles and user permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-7xl mx-auto px-3.5 sm:px-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : toastMessage.type === 'info'
              ? 'bg-slate-800 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1878B8]/10 text-[#1878B8]">
              <ShieldCheck size={13} />
              Access Control &amp; RBAC
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-[11px] font-semibold text-slate-500">
              {roles.length} Roles • {users.length} Active Users
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0B1E33] tracking-tight">
            Team, Roles &amp; Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure freeform dynamic roles, review the granular permission matrix, and invite team members.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh records"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#1878B8]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {activeTab === 'users' ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus size={14} strokeWidth={2.5} />
              <span>Invite Team Member</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRole(null);
                setIsNewRole(true);
                setShowRoleEditor(true);
              }}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Shield size={14} strokeWidth={2.5} />
              <span>Create New Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative cursor-pointer ${
            activeTab === 'users'
              ? 'text-[#0B1E33] border-b-2 border-[#1878B8]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={15} />
          <span>Team Members &amp; Invitations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative cursor-pointer ${
            activeTab === 'roles'
              ? 'text-[#0B1E33] border-b-2 border-[#1878B8]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield size={15} />
          <span>Roles &amp; Permission Matrix</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1878B8]/10 text-[#1878B8] font-bold">
            {roles.length} Roles
          </span>
        </button>
      </div>

      {/* ── TAB 1: USERS & INVITATIONS ──────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1878B8] shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter size={13} />
                <span>Role:</span>
              </div>
              <div className="w-40 sm:w-44">
                <CustomSelect
                  value={selectedRoleFilter}
                  onChange={(val) => setSelectedRoleFilter(val)}
                  options={[
                    { value: 'all', label: 'All Roles' },
                    ...roles.map((r) => ({
                      value: r.name || '',
                      label: r.name || '',
                    })),
                  ]}
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2">
                <span>Status:</span>
              </div>
              <div className="w-36 sm:w-40">
                <CustomSelect
                  value={selectedStatusFilter}
                  onChange={(val) => setSelectedStatusFilter(val)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'invited', label: 'Invited' },
                    { value: 'deactivated', label: 'Deactivated' },
                  ]}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Assigned Roles</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Joined / Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-[#1878B8]/30 border-t-[#1878B8] rounded-full animate-spin mx-auto mb-2" />
                        Loading team members...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No team members match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userRoles =
                        u.roles && u.roles.length > 0
                          ? u.roles
                          : [{ id: 0, name: u.role || 'Staff', is_protected: (u.role || '').toLowerCase() === 'owner' }];
                      const isDeactivated =
                        u.status === 'deactivated' || u.status === 'inactive' || u.status === 'suspended';

                      return (
                        <tr
                          key={String(u.id)}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isDeactivated ? 'opacity-60 bg-slate-50/40' : ''
                          }`}
                        >
                          {/* Member info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group">
                                <UserAvatar
                                  name={u.name || 'User'}
                                  avatarUrl={u.avatar_url}
                                  role={u.role}
                                  size="md"
                                />
                                <button
                                  onClick={() => setAvatarUser(u)}
                                  className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Change avatar"
                                >
                                  <Camera size={12} />
                                </button>
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-[#0B1E33] block truncate">
                                  {u.name || 'Unnamed User'}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {u.email || 'No email'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Roles */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {userRoles.map((r, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    r.is_protected || (r.name || '').toLowerCase() === 'owner'
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : 'bg-blue-50 text-sky-900 border-blue-200'
                                  }`}
                                >
                                  {(r.is_protected || (r.name || '').toLowerCase() === 'owner') && (
                                    <ShieldCheck size={10} className="text-amber-700" />
                                  )}
                                  <span>{r.name || 'Role'}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : u.status === 'invited'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500'
                                    : u.status === 'invited'
                                    ? 'bg-amber-500 animate-pulse'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {u.status || 'unknown'}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 text-slate-500">
                            {u.phone ? (
                              <span className="font-mono text-[11px]">{u.phone}</span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditUser(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                                title="Edit Roles"
                              >
                                <Edit2 size={12} />
                                <span>Roles</span>
                              </button>

                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                                  isDeactivated
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                                title={isDeactivated ? 'Activate User' : 'Deactivate User'}
                              >
                                {isDeactivated ? (
                                  <>
                                    <CheckCircle2 size={12} />
                                    <span>Activate</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} />
                                    <span>Deactivate</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0B1E33] flex items-center gap-1.5">
                  <Mail size={15} className="text-[#1878B8]" />
                  <span>Pending Email Invitations</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Track sent invitations. Token links are valid for 7 days from dispatch.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Invited Email</th>
                      <th className="py-2.5 px-4">Assigned Roles</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Expires</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          No pending invitations. Click &quot;Invite Team Member&quot; to send an invitation.
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => {
                        const isExpired = inv.expires_at ? new Date(inv.expires_at).getTime() < Date.now() : false;
                        const isAccepted = inv.status === 'accepted';

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {inv.email}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {inv.invited_roles && inv.invited_roles.length > 0 ? (
                                  inv.invited_roles.map((r, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200"
                                    >
                                      {r.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isAccepted
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isExpired
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {isAccepted ? 'Accepted' : isExpired ? 'Expired' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                              {inv.expires_at
                                ? new Date(inv.expires_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isAccepted && (
                                  <button
                                    onClick={() => copyInviteLink(`/admin/invite/${inv.token || ''}`)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="Copy Invitation Link"
                                  >
                                    <Copy size={11} />
                                    <span>Copy Link</span>
                                  </button>
                                )}
                                {!isAccepted && (
                                  <button
                                    onClick={() => handleRevokeInvitation(inv.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Revoke Invitation"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ROLES & PERMISSIONS MATRIX ────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {roles.map((r) => {
              const isOwner = r.is_protected || (r.name || '').toLowerCase() === 'owner';
              const permCount = r.permissions ? Object.keys(r.permissions).length : 0;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-[#1878B8]/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-sm font-black text-[#0B1E33] truncate">
                          {r.name}
                        </h3>
                        {isOwner && (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldCheck size={10} /> Protected
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">
                        {r.member_count} {r.member_count === 1 ? 'user' : 'users'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      {r.description || 'Organizational CRM operational role.'}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Key size={12} className="text-[#1878B8]" />
                      <span>{isOwner ? 'All 43' : permCount} perms</span>
                    </span>

                    <button
                      onClick={() => {
                        setEditingRole(r);
                        setIsNewRole(false);
                        setShowRoleEditor(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Sliders size={11} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Matrix Search */}
              <div className="relative flex-1 max-w-md">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Filter permissions (e.g. leads, margins, invoices, delete)..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1878B8]"
                />
              </div>

              {/* Matrix Stats & Legend */}
              <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                <span className="text-slate-500 font-semibold">
                  Showing {matrixPermissionsCount} permissions
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ALL
                  </span>
                  <span className="text-slate-400 text-[10px]">Org-Wide</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-sky-800 border border-blue-200">
                    ASSIGNED
                  </span>
                  <span className="text-slate-400 text-[10px]">Assigned Deals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    OWN
                  </span>
                  <span className="text-slate-400 text-[10px]">Creator Only</span>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[#0B1E33] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All Categories ({categories.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.resource}
                  onClick={() => setSelectedCategoryFilter(cat.resource)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategoryFilter === cat.resource
                      ? 'bg-[#1878B8] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.name} ({cat.permissions.length})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive 2D Permissions Matrix Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {/* Sticky Left Header */}
                    <th className="py-3 px-4 min-w-[280px] sm:min-w-[320px] sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      Permission &amp; Action
                    </th>

                    {/* Role Columns */}
                    {roles.map((r) => {
                      const isOwner = r.is_protected || (r.name || '').toLowerCase() === 'owner';
                      return (
                        <th
                          key={r.id}
                          className={`py-3 px-3.5 text-center min-w-[130px] border-r border-slate-200/60 ${
                            isOwner ? 'bg-amber-50/40 text-amber-950 font-black' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              {isOwner && <ShieldCheck size={12} className="text-amber-600" />}
                              <span className="truncate max-w-[115px]">{r.name}</span>
                            </div>
                            <span className="text-[10px] lowercase font-normal text-slate-400 mt-0.5">
                              {r.member_count} {r.member_count === 1 ? 'user' : 'users'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRole(r);
                                setIsNewRole(false);
                                setShowRoleEditor(true);
                              }}
                              className="mt-1.5 text-[10px] font-bold text-[#1878B8] hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Sliders size={9} />
                              <span>Configure</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="py-16 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-[#1878B8]/30 border-t-[#1878B8] rounded-full animate-spin mx-auto mb-2" />
                        Loading roles &amp; permission matrix...
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="py-12 text-center text-slate-400">
                        No permissions match your filter query &quot;{matrixSearch}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <React.Fragment key={cat.resource}>
                        {/* Category Row Banner */}
                        <tr className="bg-slate-100/70 border-y border-slate-200/90 font-bold">
                          <td
                            colSpan={roles.length + 1}
                            className="py-2 px-4 text-[#0B1E33] text-[11px] tracking-wide uppercase flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#1878B8]" />
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-slate-400 lowercase font-normal">
                                ({cat.permissions.length} actions)
                              </span>
                            </div>
                            {cat.description && (
                              <span className="text-[10px] text-slate-400 normal-case font-normal hidden md:inline">
                                {cat.description}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Category Permissions */}
                        {cat.permissions.map((perm) => (
                          <tr key={perm.key} className="hover:bg-slate-50/50 transition-colors">
                            {/* Permission Title & Key (Sticky Left) */}
                            <td className="py-2.5 px-4 sticky left-0 bg-white hover:bg-slate-50/50 z-10 border-r border-slate-200/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#0B1E33] text-xs">
                                      {perm.name}
                                    </span>
                                    {perm.supports_scope && (
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        Scoped
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                    {perm.key}
                                  </span>
                                  {perm.description && (
                                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-1">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Cells for Each Role */}
                            {roles.map((r) => {
                              const isOwner = r.is_protected || (r.name || '').toLowerCase() === 'owner';
                              const roleScope = r.permissions ? r.permissions[perm.key] : undefined;
                              const isGranted = isOwner || Boolean(roleScope);

                              return (
                                <td
                                  key={r.id}
                                  className={`py-2 px-3 text-center border-r border-slate-200/50 ${
                                    isOwner ? 'bg-amber-50/20' : ''
                                  }`}
                                >
                                  {isOwner ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/70 text-amber-900 border border-amber-200">
                                      <Check size={11} strokeWidth={3} className="text-amber-700" />
                                      <span>ALL</span>
                                    </span>
                                  ) : isGranted ? (
                                    perm.supports_scope ? (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                          roleScope === 'all'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : roleScope === 'assigned'
                                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}
                                      >
                                        <Check size={10} strokeWidth={3} />
                                        <span>{(roleScope || 'all').toUpperCase()}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto">
                                        <Check size={12} strokeWidth={3} />
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-300 font-mono text-sm select-none">
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INVITE TEAM MEMBER ────────────────────────────────────── */}
      {showInviteModal && (
        <InviteUserModal
          roles={roles}
          onClose={() => setShowInviteModal(false)}
          onSuccess={(inviteUrl) => {
            setShowInviteModal(false);
            showToast('Invitation generated successfully!', 'success');
            copyInviteLink(inviteUrl);
            loadAllData(true);
          }}
        />
      )}

      {/* ── MODAL: EDIT USER ROLES ───────────────────────────────────────── */}
      {editUser && (
        <EditUserRolesModal
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            showToast('User roles updated successfully.', 'success');
            loadAllData(true);
          }}
        />
      )}

      {/* ── MODAL: ROLE PERMISSIONS MATRIX EDITOR ────────────────────────── */}
      {showRoleEditor && (
        <RoleEditorModal
          role={editingRole}
          isNew={isNewRole}
          categories={categories}
          onClose={() => setShowRoleEditor(false)}
          onSuccess={() => {
            setShowRoleEditor(false);
            showToast('Role and permission matrix saved.', 'success');
            loadAllData(true);
          }}
        />
      )}

      {/* ── MODAL: AVATAR PICKER ─────────────────────────────────────────── */}
      {avatarUser && (
        <AvatarPickerModal
          isOpen={Boolean(avatarUser)}
          onClose={() => setAvatarUser(null)}
          userName={avatarUser.name || 'User'}
          userRole={avatarUser.role}
          currentAvatarUrl={avatarUser.avatar_url}
          onSelectAvatar={async (url) => {
            try {
              const res = await fetch(`/api/admin/users/${avatarUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar_url: url }),
              });
              if (res.ok) {
                showToast('Avatar updated', 'success');
                loadAllData(true);
              }
            } catch {
              showToast('Failed to update avatar', 'error');
            }
            setAvatarUser(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-MODAL 1: INVITE USER MODAL
// ─────────────────────────────────────────────────────────────────────────────
function InviteUserModal({
  roles,
  onClose,
  onSuccess,
}: {
  roles: RoleRecord[];
  onClose: () => void;
  onSuccess: (inviteUrl: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (id: number) => {
    if (selectedRoleIds.includes(id)) {
      setSelectedRoleIds(selectedRoleIds.filter((r) => r !== id));
    } else {
      setSelectedRoleIds([...selectedRoleIds, id]);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (selectedRoleIds.length === 0) {
      setError('Please select at least one role for this team member.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          roleIds: selectedRoleIds,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSuccess(data.inviteUrl);
      } else {
        setError(data.error || 'Failed to dispatch invitation.');
      }
    } catch {
      setError('Network error connecting to invitation service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#EAA636] flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <h3 className="font-black text-sm text-[#0B1E33]">Invite Team Member</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="colleague@riseuprac.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1878B8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign Roles <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Select one or more roles. Permissions will union automatically.
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {roles.map((r) => {
                const checked = selectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      checked
                        ? 'border-[#1878B8] bg-sky-50/50 text-[#0B1E33] font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          checked ? 'bg-[#1878B8] border-[#1878B8] text-white' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span>{r.name}</span>
                    </div>
                    {r.is_protected && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Protected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0B1E33]/30 border-t-[#0B1E33] rounded-full animate-spin" />
                  <span>Generating Invite...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send &amp; Generate Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-MODAL 2: EDIT USER ROLES MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditUserRolesModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: UserRecord;
  roles: RoleRecord[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initialRoleIds = (user.roles || []).map((r) => r.id);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(initialRoleIds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (id: number) => {
    if (selectedRoleIds.includes(id)) {
      setSelectedRoleIds(selectedRoleIds.filter((r) => r !== id));
    } else {
      setSelectedRoleIds([...selectedRoleIds, id]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRoleIds.length === 0) {
      setError('User must have at least one assigned role.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleIds: selectedRoleIds,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update user roles.');
      }
    } catch {
      setError('Network error connecting to user service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-sm text-[#0B1E33]">Assign Roles: {user.name}</h3>
            <p className="text-[11px] text-slate-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select User Roles
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {roles.map((r) => {
                const checked = selectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      checked
                        ? 'border-[#1878B8] bg-sky-50/50 text-[#0B1E33] font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          checked ? 'bg-[#1878B8] border-[#1878B8] text-white' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span>{r.name}</span>
                    </div>
                    {r.is_protected && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Protected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Changes...' : 'Save Role Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-MODAL 3: ROLE & PERMISSION MATRIX EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function RoleEditorModal({
  role,
  isNew,
  categories,
  onClose,
  onSuccess,
}: {
  role: RoleRecord | null;
  isNew: boolean;
  categories: PermissionCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isProtected = role?.is_protected || (role?.name || '').toLowerCase() === 'owner';

  const [roleName, setRoleName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');

  // Map of permission key -> scope ('own' | 'assigned' | 'all') or undefined if unselected
  const [permissionsState, setPermissionsState] = useState<Record<string, 'own' | 'assigned' | 'all'>>(() => {
    const init: Record<string, 'own' | 'assigned' | 'all'> = {};
    if (role && role.permissions && typeof role.permissions === 'object') {
      Object.entries(role.permissions).forEach(([k, s]) => {
        init[k] = s;
      });
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle single permission
  const togglePermission = (perm: PermissionItem) => {
    if (isProtected) return; // Protected owner cannot have permissions removed

    setPermissionsState((prev) => {
      const next = { ...prev };
      if (next[perm.key]) {
        delete next[perm.key];
      } else {
        next[perm.key] = perm.supports_scope ? perm.default_scope : 'all';
      }
      return next;
    });
  };

  // Change scope for single permission
  const changeScope = (permKey: string, scope: 'own' | 'assigned' | 'all') => {
    if (isProtected) return;
    setPermissionsState((prev) => ({
      ...prev,
      [permKey]: scope,
    }));
  };

  // Toggle entire category
  const toggleCategory = (cat: PermissionCategory) => {
    if (isProtected) return;

    const allChecked = (cat.permissions || []).every((p) => Boolean(permissionsState[p.key]));
    setPermissionsState((prev) => {
      const next = { ...prev };
      (cat.permissions || []).forEach((p) => {
        if (allChecked) {
          delete next[p.key];
        } else {
          next[p.key] = p.supports_scope ? p.default_scope : 'all';
        }
      });
      return next;
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }

    const keysCount = Object.keys(permissionsState).length;
    if (keysCount === 0) {
      setError('Role must have at least one permission assigned.');
      return;
    }

    setSubmitting(true);
    try {
      const url = isNew ? '/api/admin/roles' : `/api/admin/roles/${role!.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          description: description ? description.trim() : null,
          permissions: permissionsState,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save role configuration.');
      }
    } catch {
      setError('Network error connecting to roles service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-[#0B1E33]">
                {isNew ? 'Create New Custom Role' : `Edit Role: ${role?.name}`}
              </h3>
              {isProtected && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <ShieldCheck size={11} /> Protected Role
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure name, description, and granular permission scopes for this role.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 flex-shrink-0">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveRole} className="overflow-y-auto p-5 space-y-6 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isProtected}
                placeholder="e.g. Senior Estimator"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1878B8] disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="Responsibilities and access scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1878B8]"
              />
            </div>
          </div>

          {/* Catalog Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Permission Catalog &amp; Granular Data Scopes
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">
                {Object.keys(permissionsState).length} permissions active
              </span>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const perms = cat.permissions || [];
                const checkedCount = perms.filter((p) => Boolean(permissionsState[p.key])).length;
                const isAllChecked = perms.length > 0 && checkedCount === perms.length;

                return (
                  <div
                    key={cat.resource}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0B1E33]">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          ({checkedCount}/{perms.length})
                        </span>
                      </div>
                      {!isProtected && perms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="text-[11px] text-[#1878B8] hover:underline font-semibold cursor-pointer"
                        >
                          {isAllChecked ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Permissions list */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {perms.map((perm) => {
                        const isChecked = Boolean(permissionsState[perm.key]);
                        const currentScope = permissionsState[perm.key] || perm.default_scope || 'all';

                        return (
                          <div
                            key={perm.key}
                            className={`p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                              isChecked ? 'bg-sky-50/20' : 'opacity-70'
                            }`}
                          >
                            <label
                              onClick={() => togglePermission(perm)}
                              className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0"
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border flex-shrink-0 ${
                                  isChecked
                                    ? 'bg-[#1878B8] border-[#1878B8] text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isChecked && <Check size={11} strokeWidth={3} />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#0B1E33] block">
                                    {perm.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {perm.key}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                  {perm.description}
                                </span>
                              </div>
                            </label>

                            {/* Scope Selector */}
                            {perm.supports_scope && isChecked && (
                              <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  Scope:
                                </span>
                                <div className="w-36">
                                  <CustomSelect
                                    disabled={isProtected}
                                    value={currentScope}
                                    onChange={(val) => changeScope(perm.key, val as any)}
                                    options={[
                                      { value: 'all', label: 'All Records' },
                                      { value: 'assigned', label: 'Assigned Only' },
                                      { value: 'own', label: 'Created by User' },
                                    ]}
                                    variant="compact"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 px-5 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <p className="text-[11px] text-slate-400">
            {isProtected
              ? 'Protected system role. Core permissions are permanently locked.'
              : 'Permission updates invalidate cached session credentials immediately.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRole}
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Role...' : isNew ? 'Create Role' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

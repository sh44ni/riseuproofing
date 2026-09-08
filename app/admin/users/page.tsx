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
} from 'lucide-react';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import AvatarPickerModal from '@/components/admin/shared/AvatarPickerModal';

interface UserRoleInfo {
  id: number;
  name: string;
  is_protected: boolean;
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roles?: UserRoleInfo[];
  status: 'invited' | 'active' | 'deactivated' | 'inactive' | 'suspended';
  avatar_url?: string | null;
  last_login_at?: string;
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
  accepted_at?: string;
  invited_by_name?: string;
}

interface RoleRecord {
  id: number;
  name: string;
  description: string;
  is_protected: boolean;
  member_count: number;
  created_at?: string;
  permissions?: {
    permission_id: number;
    name: string;
    action: string;
    scope: 'own' | 'assigned' | 'all';
    supports_scope: boolean;
  }[];
}

interface CatalogPermission {
  id: number;
  name: string;
  action: string;
  description: string;
  supports_scope: boolean;
  default_scope: 'own' | 'assigned' | 'all';
}

interface CatalogCategory {
  resource: string;
  name: string;
  permissions: CatalogPermission[];
}

export default function TeamAndRolesConsole() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [avatarUser, setAvatarUser] = useState<UserRecord | null>(null);

  // Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load core data
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setActionError(null);

    try {
      const [uRes, iRes, rRes, cRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/invitations'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ]);

      if (uRes.status === 403) {
        setIsForbidden(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [uData, iData, rData, cData] = await Promise.all([
        uRes.json(),
        iRes.json(),
        rRes.json(),
        cRes.json(),
      ]);

      if (uData.ok) setUsers(uData.users || []);
      if (iData.ok) setInvitations(iData.invitations || []);
      if (rData.ok) setRoles(rData.roles || []);
      if (cData.ok) setCatalog(cData.catalog || []);
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
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const userRoleNames = u.roles && u.roles.length > 0
        ? u.roles.map((r) => r.name.toLowerCase())
        : [u.role.toLowerCase()];

      const matchesRole =
        selectedRoleFilter === 'all' ||
        userRoleNames.some((r) => r === selectedRoleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  // Copy link helper
  const copyInviteLink = (tokenOrUrl: string) => {
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
    const newStatus = user.status === 'deactivated' ? 'active' : 'deactivated';
    const actionLabel = newStatus === 'deactivated' ? 'deactivate' : 'activate';

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
          </div>
          <h1 className="text-2xl font-black text-[#0B1E33] tracking-tight">
            Team, Roles &amp; Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure freeform dynamic roles, assign granular permissions with data scopes, and invite team members.
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
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
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
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'roles'
              ? 'text-[#0B1E33] border-b-2 border-[#1878B8]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield size={15} />
          <span>Roles &amp; Permission Matrix</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {roles.length}
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

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter size={13} />
                <span>Role:</span>
              </div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
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
                      const userRoles = u.roles && u.roles.length > 0 ? u.roles : [{ id: 0, name: u.role, is_protected: u.role === 'owner' }];
                      const isDeactivated = u.status === 'deactivated';

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isDeactivated ? 'opacity-60 bg-slate-50/40' : ''
                          }`}
                        >
                          {/* Member info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group">
                                <UserAvatar
                                  name={u.name}
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
                                  {u.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {u.email}
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
                                    r.is_protected || r.name.toLowerCase() === 'owner'
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : 'bg-blue-50 text-sky-900 border-blue-200'
                                  }`}
                                >
                                  {r.is_protected && <ShieldCheck size={10} className="text-amber-700" />}
                                  <span>{r.name}</span>
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
                              {u.status}
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
                            {new Date(u.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
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
                        const isExpired = new Date(inv.expires_at).getTime() < Date.now();
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
                              {new Date(inv.expires_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isAccepted && (
                                  <button
                                    onClick={() => copyInviteLink(`/admin/invite/${(inv as any).token || ''}`)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => {
              const isOwner = r.is_protected || r.name.toLowerCase() === 'owner';

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#1878B8]/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#0B1E33] tracking-tight">
                          {r.name}
                        </h3>
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldCheck size={11} /> Protected
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {r.member_count} {r.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                      {r.description || 'Custom organizational role for CRM operations.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingRole(r);
                        setIsNewRole(false);
                        setShowRoleEditor(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders size={13} />
                      <span>Edit Permissions &amp; Scopes</span>
                    </button>

                    {!isOwner && (
                      <button
                        onClick={() => handleDeleteRole(r)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
          catalog={catalog}
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
          userName={avatarUser.name}
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
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
          role_ids: selectedRoleIds,
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
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
  catalog,
  onClose,
  onSuccess,
}: {
  role: RoleRecord | null;
  isNew: boolean;
  catalog: CatalogCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isProtected = role?.is_protected || false;

  const [roleName, setRoleName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');

  // Map of permission_id -> scope ('own' | 'assigned' | 'all') or undefined if unselected
  const [permissionsState, setPermissionsState] = useState<Record<number, 'own' | 'assigned' | 'all'>>(() => {
    const init: Record<number, 'own' | 'assigned' | 'all'> = {};
    if (role && role.permissions) {
      role.permissions.forEach((p) => {
        init[p.permission_id] = p.scope || 'all';
      });
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle single permission
  const togglePermission = (perm: CatalogPermission) => {
    if (isProtected) return; // Protected owner cannot have permissions removed

    setPermissionsState((prev) => {
      const next = { ...prev };
      if (next[perm.id]) {
        delete next[perm.id];
      } else {
        next[perm.id] = perm.supports_scope ? perm.default_scope : 'all';
      }
      return next;
    });
  };

  // Change scope for single permission
  const changeScope = (permId: number, scope: 'own' | 'assigned' | 'all') => {
    if (isProtected) return;
    setPermissionsState((prev) => ({
      ...prev,
      [permId]: scope,
    }));
  };

  // Toggle entire category
  const toggleCategory = (cat: CatalogCategory) => {
    if (isProtected) return;

    const allChecked = cat.permissions.every((p) => Boolean(permissionsState[p.id]));
    setPermissionsState((prev) => {
      const next = { ...prev };
      cat.permissions.forEach((p) => {
        if (allChecked) {
          delete next[p.id];
        } else {
          next[p.id] = p.supports_scope ? p.default_scope : 'all';
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

    const permissionsPayload = Object.entries(permissionsState).map(([permId, scope]) => ({
      permission_id: parseInt(permId, 10),
      scope,
    }));

    if (permissionsPayload.length === 0) {
      setError('Role must have at least one permission.');
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
          description: description.trim(),
          permissions: permissionsPayload,
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              {catalog.map((cat) => {
                const checkedCount = cat.permissions.filter((p) => Boolean(permissionsState[p.id])).length;
                const isAllChecked = checkedCount === cat.permissions.length;

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
                          ({checkedCount}/{cat.permissions.length})
                        </span>
                      </div>
                      {!isProtected && (
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
                      {cat.permissions.map((perm) => {
                        const isChecked = Boolean(permissionsState[perm.id]);
                        const currentScope = permissionsState[perm.id] || perm.default_scope;

                        return (
                          <div
                            key={perm.id}
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
                                <span className="text-xs font-bold text-[#0B1E33] block">
                                  {perm.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block leading-tight">
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
                                <select
                                  disabled={isProtected}
                                  value={currentScope}
                                  onChange={(e) => changeScope(perm.id, e.target.value as any)}
                                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1878B8] cursor-pointer"
                                >
                                  <option value="all">All Records</option>
                                  <option value="assigned">Assigned Only</option>
                                  <option value="own">Created by User</option>
                                </select>
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRole}
              disabled={submitting}
              className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Saving Role...' : isNew ? 'Create Role' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  ROLE_CONFIG,
  UserRole,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionDefinition,
} from '@/lib/rbac';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge, { RoleIcon } from '@/components/admin/shared/RoleBadge';
import AvatarPickerModal from '@/components/admin/shared/AvatarPickerModal';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string | null;
  permissions?: string[];
  last_login_at?: string;
  created_at: string;
}

export default function TeamManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('sales_rep');
  const [newPassword, setNewPassword] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>('');
  const [showAddAvatarPicker, setShowAddAvatarPicker] = useState(false);
  const [newPermissions, setNewPermissions] = useState<string[]>(
    DEFAULT_ROLE_PERMISSIONS.sales_rep
  );
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('sales_rep');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [showEditAvatarPicker, setShowEditAvatarPicker] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setIsForbidden(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
      } else {
        setActionError(data.error || 'Failed to load team users');
      }
    } catch {
      setActionError('Error connecting to users service');
    } finally {
      setLoading(false);
    }
  }

  // Handle Add Role Change — Auto-loads default permissions preset
  function handleAddRoleChange(role: UserRole) {
    setNewRole(role);
    setNewPermissions(DEFAULT_ROLE_PERMISSIONS[role] || []);
  }

  // Handle Edit Role Change — Auto-loads default permissions preset
  function handleEditRoleChange(role: UserRole) {
    setEditRole(role);
    setEditPermissions(DEFAULT_ROLE_PERMISSIONS[role] || []);
  }

  function toggleAddPermission(id: string) {
    if (newPermissions.includes('*')) {
      const allIds = ALL_PERMISSIONS.map((p) => p.id).filter((pId) => pId !== id);
      setNewPermissions(allIds);
      return;
    }
    if (newPermissions.includes(id)) {
      setNewPermissions(newPermissions.filter((p) => p !== id));
    } else {
      setNewPermissions([...newPermissions, id]);
    }
  }

  function toggleEditPermission(id: string) {
    if (editPermissions.includes('*')) {
      const allIds = ALL_PERMISSIONS.map((p) => p.id).filter((pId) => pId !== id);
      setEditPermissions(allIds);
      return;
    }
    if (editPermissions.includes(id)) {
      setEditPermissions(editPermissions.filter((p) => p !== id));
    } else {
      setEditPermissions([...editPermissions, id]);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          role: newRole,
          password: newPassword,
          avatar_url: newAvatarUrl || null,
          permissions: newPermissions,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionSuccess(`Successfully added team member ${data.user.name}`);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        setNewAvatarUrl('');
        setNewPermissions(DEFAULT_ROLE_PERMISSIONS.sales_rep);
        fetchUsers();
      } else {
        setActionError(data.error || 'Failed to create user');
      }
    } catch {
      setActionError('Connection error while adding user');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(u: UserRecord) {
    setEditUser(u);
    setEditName(u.name);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditStatus(u.status === 'active' ? 'active' : 'inactive');
    setEditPassword('');
    setEditAvatarUrl(u.avatar_url || '');
    setEditPermissions(u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || []);
    setActionError('');
    setActionSuccess('');
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const payload: Record<string, unknown> = {
        name: editName,
        phone: editPhone,
        role: editRole,
        status: editStatus,
        avatar_url: editAvatarUrl || null,
        permissions: editPermissions,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setActionSuccess(`Updated user ${data.user.name} successfully`);
        setEditUser(null);
        fetchUsers();
      } else {
        setActionError(data.error || 'Failed to update user');
      }
    } catch {
      setActionError('Connection error while updating user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(u: UserRecord) {
    if (
      !confirm(
        `Are you sure you want to deactivate ${u.name}? They will immediately lose CRM access.`
      )
    ) {
      return;
    }
    setActionError('');
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setActionSuccess(`${u.name} has been deactivated`);
        fetchUsers();
      } else {
        setActionError(data.error || 'Failed to deactivate user');
      }
    } catch {
      setActionError('Error deactivating user');
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Categories list
  const CATEGORIES = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.category)));

  if (isForbidden) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center my-16 space-y-4">
        <div className="w-16 h-16 rounded-[16px] bg-amber-50 border border-amber-200/80 text-[#EAA636] flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-black text-[#0B1E33]">Owner Access Required</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Only the primary Owner / Qualifier has authorization to manage team members, assign
          operational roles, and configure system credentials.
        </p>
        <div className="pt-2">
          <a
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200/80 shadow-2xs"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-[16px] p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-[#1878B8] shadow-2xs">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black text-[#0B1E33]">
                Team &amp; Dynamic Permissions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200/80 text-amber-800">
                CSLB #1096492
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Add unlimited team members, grant specific permissions, or assign full super-admin
              privileges
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setActionError('');
            setActionSuccess('');
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
        >
          <UserPlus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-800 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
          const cfg = ROLE_CONFIG[r];
          const count = roleCounts[r] || 0;
          return (
            <div
              key={r}
              onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-sky-50/50 border-[#2F9FE3] shadow-xs ring-1 ring-sky-400'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <RoleIcon role={r} size={20} />
                <span className="text-lg font-black text-[#0B1E33]">{count}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{cfg.label}</p>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                {cfg.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#2F9FE3] cursor-pointer shadow-2xs"
          >
            <option value="all">All Roles ({users.length})</option>
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_CONFIG[r].label} ({roleCounts[r] || 0})
              </option>
            ))}
          </select>
          <button
            onClick={fetchUsers}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-[#0B1E33] transition-colors cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#1878B8]' : ''} />
          </button>
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-[16px] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={28} className="animate-spin text-[#1878B8] mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading team members...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No team members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Team Member</th>
                  <th className="px-4 py-3.5">Role &amp; Scope</th>
                  <th className="px-4 py-3.5">Granted Capabilities</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.sales_rep;
                  const isActive = u.status === 'active';
                  const hasAll = u.permissions?.includes('*') || u.role === 'owner';
                  const permCount = hasAll ? ALL_PERMISSIONS.length : u.permissions?.length || 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={u.name}
                            avatarUrl={u.avatar_url}
                            role={u.role}
                            size="md"
                            showStatus
                            statusOnline={isActive}
                            showRoleBadge
                          />
                          <div>
                            <div className="font-bold text-[#0B1E33] text-sm">{u.name}</div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <RoleBadge role={u.role} size="sm" />
                      </td>

                      <td className="px-4 py-4">
                        {hasAll ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200/80 text-[#1878B8] text-[11px] font-bold">
                            <Sparkles size={12} />
                            Full Access (All {ALL_PERMISSIONS.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-medium">
                            {permCount} / {ALL_PERMISSIONS.length} Permissions
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {u.last_login_at ? (
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(u.last_login_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0B1E33] border border-slate-200/60 transition-colors cursor-pointer"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isActive && u.role !== 'owner' && (
                            <button
                              onClick={() => handleDeactivate(u)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                              title="Deactivate Account"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal with Dynamic Permissions Matrix */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col text-[#0B1E33]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#EAA636] border border-amber-200/80 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-[#0B1E33] text-base">Add Team Member</h3>
                  <p className="text-xs text-slate-500">
                    Assign role preset and configure custom permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Member Portrait Picker */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <UserAvatar
                  name={newName || 'New Member'}
                  avatarUrl={newAvatarUrl}
                  role={newRole}
                  size="xl"
                  showRoleBadge
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">Member Portrait</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {newAvatarUrl
                      ? 'Custom photo selected'
                      : 'No photo chosen (will display clean monogram initials)'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAvatarPicker(true)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera size={13} className="text-[#1878B8]" />
                      {newAvatarUrl ? 'Change Portrait' : 'Choose Portrait'}
                    </button>
                    {newAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewAvatarUrl('')}
                        className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. David Vance"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@riseuproofing.com"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(818) 555-0100"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Base Role Template
                </label>
                <select
                  value={newRole}
                  onChange={(e) => handleAddRoleChange(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white cursor-pointer shadow-2xs"
                >
                  {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Permissions Matrix */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-[16px] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                  <div>
                    <h4 className="text-xs font-black text-[#0B1E33] flex items-center gap-1.5">
                      <Lock size={14} className="text-[#1878B8]" />
                      Custom Permissions Matrix
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Granted:{' '}
                      <span className="text-[#1878B8] font-bold">
                        {newPermissions.includes('*') ? ALL_PERMISSIONS.length : newPermissions.length}{' '}
                        / {ALL_PERMISSIONS.length}
                      </span>{' '}
                      capabilities
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewPermissions(['*'])}
                      className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1878B8] text-[10px] font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPermissions([])}
                      className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-medium cursor-pointer"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || [])}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                      title="Reset to role defaults"
                    >
                      <RotateCcw size={11} />
                      Reset Preset
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions */}
                <div className="space-y-3 pt-1">
                  {CATEGORIES.map((cat) => {
                    const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                          {cat}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map((p) => {
                            const isChecked =
                              newPermissions.includes('*') || newPermissions.includes(p.id);

                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                                  isChecked
                                    ? 'bg-white border-[#2F9FE3] text-[#0B1E33] shadow-2xs ring-1 ring-sky-300'
                                    : 'bg-white/80 border-slate-200/80 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleAddPermission(p.id)}
                                  className="mt-0.5 rounded border-slate-300 text-[#2F9FE3] focus:ring-0 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold leading-tight text-slate-800">
                                      {p.label}
                                    </span>
                                    {p.sensitive && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        Sensitive
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                    {p.desc}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200/80 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating User...' : 'Save & Grant Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal with Dynamic Permissions Matrix */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col text-[#0B1E33]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#1878B8] border border-sky-200/80 flex items-center justify-center">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-black text-[#0B1E33] text-base">Edit Team Member</h3>
                  <p className="text-xs text-slate-500">{editUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Member Portrait Picker */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <UserAvatar
                  name={editName || editUser.name}
                  avatarUrl={editAvatarUrl}
                  role={editRole}
                  size="xl"
                  showRoleBadge
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">Member Portrait</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {editAvatarUrl
                      ? 'Custom photo active'
                      : 'No photo chosen (will display clean monogram initials)'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditAvatarPicker(true)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera size={13} className="text-[#1878B8]" />
                      {editAvatarUrl ? 'Change Portrait' : 'Choose Portrait'}
                    </button>
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl('')}
                        className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white cursor-pointer shadow-2xs"
                  >
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_CONFIG[r].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white cursor-pointer shadow-2xs"
                  >
                    <option value="active">Active (Can log in)</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Reset Password{' '}
                  <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                />
              </div>

              {/* Dynamic Permissions Matrix */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-[16px] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                  <div>
                    <h4 className="text-xs font-black text-[#0B1E33] flex items-center gap-1.5">
                      <Lock size={14} className="text-[#1878B8]" />
                      Granted Permissions &amp; Data Scopes
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Granted:{' '}
                      <span className="text-[#1878B8] font-bold">
                        {editPermissions.includes('*')
                          ? ALL_PERMISSIONS.length
                          : editPermissions.length}{' '}
                        / {ALL_PERMISSIONS.length}
                      </span>{' '}
                      capabilities
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditPermissions(['*'])}
                      className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1878B8] text-[10px] font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions([])}
                      className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-medium cursor-pointer"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(DEFAULT_ROLE_PERMISSIONS[editRole] || [])}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                      title="Reset to role defaults"
                    >
                      <RotateCcw size={11} />
                      Reset Preset
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions */}
                <div className="space-y-3 pt-1">
                  {CATEGORIES.map((cat) => {
                    const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                          {cat}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map((p) => {
                            const isChecked =
                              editPermissions.includes('*') || editPermissions.includes(p.id);

                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                                  isChecked
                                    ? 'bg-white border-[#2F9FE3] text-[#0B1E33] shadow-2xs ring-1 ring-sky-300'
                                    : 'bg-white/80 border-slate-200/80 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEditPermission(p.id)}
                                  className="mt-0.5 rounded border-slate-300 text-[#2F9FE3] focus:ring-0 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold leading-tight text-slate-800">
                                      {p.label}
                                    </span>
                                    {p.sensitive && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        Sensitive
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                    {p.desc}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200/80 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal for Add User */}
      <AvatarPickerModal
        isOpen={showAddAvatarPicker}
        onClose={() => setShowAddAvatarPicker(false)}
        currentAvatarUrl={newAvatarUrl}
        userName={newName || 'New Member'}
        userRole={newRole}
        onSelectAvatar={(url) => setNewAvatarUrl(url || '')}
      />

      {/* Avatar Picker Modal for Edit User */}
      {editUser && (
        <AvatarPickerModal
          isOpen={showEditAvatarPicker}
          onClose={() => setShowEditAvatarPicker(false)}
          currentAvatarUrl={editAvatarUrl}
          userName={editName || editUser.name}
          userRole={editRole}
          onSelectAvatar={(url) => setEditAvatarUrl(url || '')}
        />
      )}
    </div>
  );
}

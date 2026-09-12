'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Bell } from 'lucide-react';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import { AuthUser } from '@/lib/rbac';

interface DashboardUserCardProps {
  user: AuthUser | null;
  notificationCount?: number;
}

const ROLE_DISPLAY: Record<string, string> = {
  owner: 'Owner / Estimator',
  admin: 'Admin',
  sales_rep: 'Sales Rep',
  foreman: 'Foreman',
  office: 'Office Manager',
  viewer: 'Viewer',
};

export default function DashboardUserCard({ user, notificationCount = 0 }: DashboardUserCardProps) {
  if (!user) return null;

  const roleLabel = ROLE_DISPLAY[user.role] ?? user.role.replace('_', ' ');

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      {/* Bell + Badge */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#0B1E33] cursor-pointer"
          title="Notifications"
        >
          <Bell size={16} />
        </button>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm border border-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </div>

      {/* Avatar + Name/Role */}
      <Link
        href="/admin/settings"
        title="Edit Profile"
        className="flex-1 flex items-center gap-2.5 min-w-0 group"
      >
        <UserAvatar
          name={user.name}
          avatarUrl={user.avatar_url}
          role={user.role}
          size="sm"
          showStatus
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold text-[#0B1E33] truncate leading-tight group-hover:text-[#1878B8] transition-colors">
            {user.name}
          </p>
          <p className="text-[11px] text-slate-400 font-medium truncate capitalize">
            {roleLabel}
          </p>
        </div>
      </Link>

      {/* Chevron */}
      <Link
        href="/admin/settings"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        title="Account Settings"
      >
        <ChevronDown size={15} />
      </Link>
    </div>
  );
}

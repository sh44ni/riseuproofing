'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserRole, ROLE_CONFIG } from '@/lib/rbac';
import { RoleIcon } from './RoleBadge';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  role?: UserRole | string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStatus?: boolean;
  statusOnline?: boolean;
  showRoleBadge?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'w-5 h-5 text-[9px]',
    status: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5',
    badge: 'w-3 h-3 -bottom-1 -right-1 p-0.5',
    badgeIcon: 7,
  },
  sm: {
    container: 'w-7 h-7 text-xs font-bold',
    status: 'w-2 h-2 -bottom-0.5 -right-0.5',
    badge: 'w-3.5 h-3.5 -bottom-1 -right-1 p-0.5',
    badgeIcon: 8,
  },
  md: {
    container: 'w-9 h-9 text-sm font-bold',
    status: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    badge: 'w-4 h-4 -bottom-1 -right-1 p-0.5',
    badgeIcon: 9,
  },
  lg: {
    container: 'w-12 h-12 text-base font-black',
    status: 'w-3 h-3 -bottom-0.5 -right-0.5',
    badge: 'w-5 h-5 -bottom-1 -right-1 p-0.5',
    badgeIcon: 11,
  },
  xl: {
    container: 'w-16 h-16 text-xl font-black',
    status: 'w-3.5 h-3.5 bottom-0 right-0',
    badge: 'w-6 h-6 -bottom-1 -right-1 p-1',
    badgeIcon: 13,
  },
  '2xl': {
    container: 'w-24 h-24 text-3xl font-black',
    status: 'w-4 h-4 bottom-1 right-1',
    badge: 'w-7 h-7 -bottom-1 -right-1 p-1',
    badgeIcon: 15,
  },
};

export default function UserAvatar({
  name = 'User',
  avatarUrl,
  role = 'owner',
  size = 'md',
  showStatus = false,
  statusOnline = true,
  showRoleBadge = false,
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const safeRole = (role && role in ROLE_CONFIG ? role : 'owner') as UserRole;
  const roleCfg = ROLE_CONFIG[safeRole];
  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;

  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0) : 'U').toUpperCase();

  const hasValidPhoto = !!avatarUrl && !imgError;

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
      <div
        className={`relative overflow-hidden rounded-full flex items-center justify-center border border-slate-200/90 shadow-2xs ${sizeCfg.container} ${
          hasValidPhoto
            ? 'bg-slate-100'
            : 'bg-gradient-to-br from-sky-50 to-blue-100 text-[#1878B8]'
        }`}
      >
        {hasValidPhoto ? (
          <img
            src={avatarUrl!}
            alt={name || 'User'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="font-black tracking-wider leading-none text-[#1878B8]">
            {initial}
          </span>
        )}
      </div>

      {/* Online Status Dot */}
      {showStatus && (
        <span
          className={`absolute rounded-full border-2 border-white ring-1 ring-emerald-500/40 ${
            statusOnline ? 'bg-emerald-500' : 'bg-slate-400'
          } ${sizeCfg.status}`}
          title={statusOnline ? 'Active Now' : 'Offline'}
        />
      )}

      {/* Mini Role Badge Icon */}
      {showRoleBadge && (
        <span
          className={`absolute rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-2xs ${roleCfg.badgeColor} ${sizeCfg.badge}`}
          title={roleCfg.label}
        >
          <RoleIcon role={safeRole} size={sizeCfg.badgeIcon} />
        </span>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import {
  Crown,
  Briefcase,
  TrendingUp,
  HardHat,
  ClipboardCheck,
  Shield,
  LucideIcon,
} from 'lucide-react';
import { UserRole, ROLE_CONFIG, RoleIconName } from '@/lib/rbac';

const ICON_MAP: Record<RoleIconName, LucideIcon> = {
  Crown,
  Briefcase,
  TrendingUp,
  HardHat,
  ClipboardCheck,
};

interface RoleBadgeProps {
  role?: UserRole | string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export function RoleIcon({
  role,
  size = 14,
  className = '',
}: {
  role?: UserRole | string | null;
  size?: number;
  className?: string;
}) {
  const safeRole = (role && role in ROLE_CONFIG ? role : 'owner') as UserRole;
  const config = ROLE_CONFIG[safeRole];
  const Icon = ICON_MAP[config.iconName] || Shield;

  return <Icon size={size} className={className} />;
}

export default function RoleBadge({
  role,
  size = 'sm',
  showLabel = true,
  className = '',
  iconOnly = false,
}: RoleBadgeProps) {
  const safeRole = (role && role in ROLE_CONFIG ? role : 'owner') as UserRole;
  const config = ROLE_CONFIG[safeRole];
  const Icon = ICON_MAP[config.iconName] || Shield;

  const sizeStyles = {
    xs: {
      badge: 'px-1.5 py-0.5 text-[9px] gap-1',
      iconSize: 10,
    },
    sm: {
      badge: 'px-2.5 py-0.5 text-[10px] gap-1.5',
      iconSize: 12,
    },
    md: {
      badge: 'px-3 py-1 text-xs gap-2',
      iconSize: 14,
    },
    lg: {
      badge: 'px-3.5 py-1.5 text-sm gap-2.5',
      iconSize: 16,
    },
  }[size];

  if (iconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full p-1 border ${config.badgeColor} ${className}`}
        title={config.label}
      >
        <Icon size={sizeStyles.iconSize} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-black uppercase tracking-wider ${config.badgeColor} ${sizeStyles.badge} ${className}`}
    >
      <Icon size={sizeStyles.iconSize} className="flex-shrink-0" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

'use client';

import React from 'react';
import { Globe, UserCheck, Calendar } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';
import { formatClientSince, formatClientTenure } from '@/lib/crm-clients-utils';

export interface SourceAttributionBadgeProps {
  sourceType?: 'website' | 'team_member' | string | null;
  sourceDetail?: string | null;
  teamMemberName?: string | null;
  teamMemberRole?: string | null;
  teamMemberAvatar?: string | null;
  clientSince?: string | Date | null;
  showTenure?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card' | 'compact';
  className?: string;
}

export default function SourceAttributionBadge({
  sourceType = 'website',
  sourceDetail,
  teamMemberName,
  teamMemberRole,
  teamMemberAvatar,
  clientSince,
  showTenure = false,
  size = 'sm',
  variant = 'badge',
  className = '',
}: SourceAttributionBadgeProps) {
  const isTeam = sourceType === 'team_member' || Boolean(teamMemberName);
  const tenureText = clientSince ? formatClientTenure(clientSince) : null;
  const sinceText = clientSince ? formatClientSince(clientSince) : null;

  // Render Compact Pill Variant (e.g. for small tables / chips)
  if (variant === 'compact') {
    if (!isTeam) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70 ${className}`}
          title={sourceDetail || 'Inbound Website'}
        >
          <Globe size={11} className="text-sky-500 shrink-0" />
          <span className="truncate max-w-[120px]">{sourceDetail || 'Website'}</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 ${className}`}
        title={`${teamMemberName || 'Staff'}${teamMemberRole ? ` (${teamMemberRole})` : ''}`}
      >
        <UserAvatar
          name={teamMemberName || 'Staff'}
          avatarUrl={teamMemberAvatar}
          role={teamMemberRole}
          size="xs"
        />
        <span className="truncate max-w-[120px]">{teamMemberName || 'Team Member'}</span>
      </span>
    );
  }

  // Render Full Card Variant (e.g. for Lead details, Client Header & Overview)
  if (variant === 'card') {
    if (!isTeam) {
      return (
        <div
          className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/90 via-sky-50/40 to-slate-50 border border-sky-200/80 shadow-xs ${className}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-[#2F9FE3] text-white flex items-center justify-center shadow-xs shrink-0">
            <Globe size={20} className="animate-pulse duration-1000" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                Inbound Lead Source
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                Digital Platform
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {sourceDetail || 'Website Inbound'}
            </div>
            {showTenure && clientSince && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-medium">
                <Calendar size={12} className="text-sky-600" />
                <span>{tenureText}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">Since {sinceText}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-slate-200/80 shadow-xs ${className}`}
      >
        <div className="shrink-0">
          <UserAvatar
            name={teamMemberName || 'Staff'}
            avatarUrl={teamMemberAvatar}
            role={teamMemberRole}
            size="lg"
            showRoleBadge
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <UserCheck size={13} className="text-blue-600" />
              <span>Brought By Team Member</span>
            </span>
            {teamMemberRole && <RoleBadge role={teamMemberRole} size="xs" />}
          </div>
          <div className="text-sm font-black text-slate-900 truncate mt-0.5">
            {teamMemberName || 'Staff Member'}
          </div>
          {sourceDetail && sourceDetail !== 'Team Member Attribution' && (
            <div className="text-xs text-slate-500 truncate">{sourceDetail}</div>
          )}
          {showTenure && clientSince && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-medium">
              <Calendar size={12} className="text-blue-600" />
              <span>{tenureText}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Since {sinceText}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Sleek Apple Liquid Glass Badge Variant
  if (!isTeam) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-50/90 text-sky-900 border border-sky-200/70 shadow-2xs backdrop-blur-xs ${className}`}
      >
        <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0">
          <Globe size={13} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold leading-tight truncate">
            {sourceDetail || 'Website Inbound'}
          </div>
          {showTenure && clientSince && (
            <div className="text-[10px] text-sky-700/80 leading-none mt-0.5 font-medium">
              {tenureText}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 border border-slate-200 shadow-2xs backdrop-blur-xs ${className}`}
    >
      <UserAvatar
        name={teamMemberName || 'Staff'}
        avatarUrl={teamMemberAvatar}
        role={teamMemberRole}
        size={size === 'lg' ? 'md' : 'sm'}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black truncate text-slate-900">
            {teamMemberName || 'Team Member'}
          </span>
          {teamMemberRole && <RoleBadge role={teamMemberRole} size="xs" />}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <span>{sourceDetail || 'Originator'}</span>
          {showTenure && clientSince && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-semibold">{tenureText}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

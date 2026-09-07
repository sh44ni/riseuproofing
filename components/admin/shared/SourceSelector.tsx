'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Sparkles, ChevronDown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';

export interface SourceSelectorProps {
  sourceType?: 'website' | 'team_member';
  sourceDetail: string;
  userId?: number | string | null;
  onChange: (val: {
    sourceType: 'website' | 'team_member';
    sourceDetail: string;
    userId?: number | null;
  }) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  entityType?: 'lead' | 'client';
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

const TEAM_PRESETS = [
  'Sales Rep Outreach',
  'Referral / Word of Mouth',
  'Door Knocking',
  'Repeat Business',
  'Networking Event',
  'Direct Call Inbound',
];

export default function SourceSelector({
  sourceType = 'team_member',
  sourceDetail,
  userId,
  onChange,
  disabled = false,
  className = '',
  label,
  entityType = 'lead',
}: SourceSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReassign, setShowReassign] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [usersRes, profileRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/profile'),
        ]);

        let usersList: TeamMember[] = [];
        let profileUser: CurrentUser | null = null;

        if (usersRes.ok) {
          const uData = await usersRes.json();
          if (uData.users) usersList = uData.users;
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.user) profileUser = pData.user;
        }

        if (!isMounted) return;

        setTeamMembers(usersList);
        setCurrentUser(profileUser);

        // AUTOMATIC: Pre-select current logged-in user if not already set
        if (profileUser && !userId) {
          const smartPreset =
            profileUser.role === 'door_knocker' || profileUser.role === 'canvasser'
              ? 'Door Knocking'
              : 'Sales Rep Outreach';
          onChange({
            sourceType: 'team_member',
            sourceDetail: sourceDetail || smartPreset,
            userId: profileUser.id,
          });
        }
      } catch (err) {
        console.error('Failed to load user directory for attribution', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveUserId = userId || currentUser?.id;
  const selectedMember =
    teamMembers.find(m => String(m.id) === String(effectiveUserId)) ||
    (currentUser && String(currentUser.id) === String(effectiveUserId) ? currentUser : null);

  const isSelf = Boolean(currentUser && selectedMember && currentUser.id === selectedMember.id);
  const displayName = selectedMember?.name || currentUser?.name || 'Staff Member';
  const effectiveRole = selectedMember?.role || currentUser?.role;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header: Adding lead as {full_name} with role tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <UserCheck size={13} />
          </div>
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
            <span>Adding {entityType === 'client' ? 'client' : 'lead'} as</span>
            <span className="text-slate-900 font-black">
              {displayName}
            </span>
            {effectiveRole && (
              <RoleBadge role={effectiveRole} size="xs" />
            )}
            {isSelf && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                You
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <Sparkles size={10} className="text-emerald-500" />
          Auto-detected
        </span>
      </div>

      {/* Main Staff & Acquisition Card */}
      <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Attributed User Card */}
        {loading ? (
          <div className="text-xs text-slate-400 py-2 font-medium animate-pulse">
            Detecting current user session...
          </div>
        ) : selectedMember ? (
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <UserAvatar
              name={selectedMember.name}
              avatarUrl={selectedMember.avatar_url}
              role={selectedMember.role}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                <span>{selectedMember.name}</span>
                {isSelf && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    You
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{selectedMember.email}</div>
            </div>
            <RoleBadge role={selectedMember.role} size="xs" />
          </div>
        ) : null}

        {/* Change staff attribution toggle & select */}
        <div className="pt-0.5 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowReassign(!showReassign)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showReassign ? 'Hide team directory' : 'Change staff attribution'}</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${showReassign ? 'rotate-180' : ''}`}
            />
          </button>

          {showReassign && teamMembers.length > 0 && (
            <select
              disabled={disabled}
              value={effectiveUserId ? String(effectiveUserId) : ''}
              onChange={e => {
                const chosenId = e.target.value ? Number(e.target.value) : null;
                const chosenMember = teamMembers.find(m => m.id === chosenId);
                const smartDefault =
                  chosenMember?.role === 'door_knocker' || chosenMember?.role === 'canvasser'
                    ? 'Door Knocking'
                    : 'Sales Rep Outreach';
                onChange({
                  sourceType: 'team_member',
                  sourceDetail: sourceDetail || smartDefault,
                  userId: chosenId,
                });
              }}
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-medium text-slate-800 cursor-pointer"
            >
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} • {member.role.replace(/_/g, ' ').toUpperCase()} {currentUser?.id === member.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Acquisition Method */}
        <div className="pt-2 border-t border-slate-200/80">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Acquisition Method</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {TEAM_PRESETS.map(preset => (
              <button
                type="button"
                key={preset}
                disabled={disabled}
                onClick={() =>
                  onChange({
                    sourceType: 'team_member',
                    sourceDetail: preset,
                    userId: effectiveUserId ? Number(effectiveUserId) : null,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  sourceDetail === preset
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            disabled={disabled}
            value={sourceDetail || ''}
            onChange={e =>
              onChange({
                sourceType: 'team_member',
                sourceDetail: e.target.value,
                userId: effectiveUserId ? Number(effectiveUserId) : null,
              })
            }
            placeholder="Detail (e.g. Canvassed neighborhood, Neighbor referral)"
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-400 font-medium"
          />
        </div>

        {/* Account space hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
          <span>💡</span>
          <span>Door knockers, canvassers, and reps logged into their own accounts will automatically be tagged for their leads.</span>
        </div>
      </div>
    </div>
  );
}

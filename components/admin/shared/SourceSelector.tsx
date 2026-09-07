'use client';

import React, { useEffect, useState } from 'react';
import { Globe, UserCheck, Sparkles, Check, ChevronDown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';

export interface SourceSelectorProps {
  sourceType: 'website' | 'team_member';
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

const WEBSITE_PRESETS = [
  'Estimate Form',
  'Contact Form',
  'Google Organic / SEO',
  'Google Ads',
  'Social Media',
  'Direct Website',
];

const TEAM_PRESETS = [
  'Sales Rep Outreach',
  'Referral / Word of Mouth',
  'Door Knocking',
  'Repeat Business',
  'Networking Event',
  'Direct Call Inbound',
];

export default function SourceSelector({
  sourceType,
  sourceDetail,
  userId,
  onChange,
  disabled = false,
  className = '',
  label = 'Lead / Client Source Attribution',
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

        // AUTOMATIC: If userId is not selected yet, automatically pre-select the currently logged-in user!
        if (profileUser && !userId && sourceType === 'team_member') {
          onChange({
            sourceType: 'team_member',
            sourceDetail: sourceDetail || 'Sales Rep Outreach',
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

  const handleTypeChange = (newType: 'website' | 'team_member') => {
    if (disabled) return;
    if (newType === 'website') {
      onChange({
        sourceType: 'website',
        sourceDetail: sourceDetail || 'Estimate Form',
        userId: null,
      });
    } else {
      const activeId = userId || currentUser?.id || (teamMembers.length > 0 ? teamMembers[0].id : null);
      onChange({
        sourceType: 'team_member',
        sourceDetail: sourceDetail || 'Sales Rep Outreach',
        userId: activeId ? Number(activeId) : null,
      });
    }
  };

  const effectiveUserId = userId || currentUser?.id;
  const selectedMember =
    teamMembers.find(m => String(m.id) === String(effectiveUserId)) ||
    (currentUser && String(currentUser.id) === String(effectiveUserId) ? currentUser : null);

  const isSelf = Boolean(currentUser && selectedMember && currentUser.id === selectedMember.id);

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Automatic Origin</span>
        </div>
      )}

      {/* Primary Toggle: Website Inbound vs. Team Member */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleTypeChange('website')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            sourceType === 'website'
              ? 'bg-white text-sky-700 shadow-xs border border-sky-100 ring-1 ring-sky-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Globe size={14} className={sourceType === 'website' ? 'text-sky-600' : 'text-slate-400'} />
          <span>Website / Digital</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleTypeChange('team_member')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            sourceType === 'team_member'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200 ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <UserCheck size={14} className={sourceType === 'team_member' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Team Member</span>
        </button>
      </div>

      {/* Secondary Fields depending on selection */}
      {sourceType === 'website' ? (
        <div className="space-y-2 p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-sky-900">Digital Inbound Channel</label>
            <span className="text-[10px] text-sky-600 font-semibold bg-sky-100/70 px-2 py-0.5 rounded-md">
              Inbound Platform
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {WEBSITE_PRESETS.map(preset => (
              <button
                type="button"
                key={preset}
                disabled={disabled}
                onClick={() => onChange({ sourceType: 'website', sourceDetail: preset, userId: null })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  sourceDetail === preset
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-sky-100/70 border border-sky-200/60'
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
            onChange={e => onChange({ sourceType: 'website', sourceDetail: e.target.value, userId: null })}
            placeholder="Custom channel (e.g. Landing Page A, Yelp, Facebook Ad)"
            className="w-full px-3 py-1.5 text-xs bg-white border border-sky-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>
      ) : (
        <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          {/* Automatic Staff Member Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck size={13} className="text-emerald-600" />
                <span>Acquired & Sourced By</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles size={10} className="text-emerald-500" />
                Auto-detected
              </span>
            </div>

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

            {/* Quick dropdown to reassign or credit a different team member */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowReassign(!showReassign)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
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
                  onChange={e =>
                    onChange({
                      sourceType: 'team_member',
                      sourceDetail: sourceDetail || 'Sales Rep Outreach',
                      userId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-medium text-slate-800"
                >
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} {currentUser?.id === member.id ? '(You)' : `(${member.role.replace('_', ' ')})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
        </div>
      )}
    </div>
  );
}

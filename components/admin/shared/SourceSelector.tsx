'use client';

import React, { useEffect, useState } from 'react';
import { Globe, UserCheck, ChevronDown, Sparkles } from 'lucide-react';
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
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchTeam() {
      try {
        setLoadingUsers(true);
        const res = await fetch('/api/admin/users');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.users) {
          setTeamMembers(data.users);
        }
      } catch (err) {
        console.error('Failed to load team directory for attribution', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }
    fetchTeam();
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
      // Default to first user if none selected
      const firstUserId = userId || (teamMembers.length > 0 ? teamMembers[0].id : null);
      onChange({
        sourceType: 'team_member',
        sourceDetail: sourceDetail || 'Sales Rep Outreach',
        userId: firstUserId ? Number(firstUserId) : null,
      });
    }
  };

  const selectedMember = teamMembers.find(m => String(m.id) === String(userId));

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Source Tracking</span>
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
        <div className="space-y-2 p-3 bg-sky-50/50 rounded-2xl border border-sky-100">
          <label className="block text-[11px] font-bold text-sky-900">Inbound Channel / Channel Detail</label>
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
            placeholder="Custom source (e.g. Landing Page A, Yelp, Facebook Ad)"
            className="w-full px-3 py-1.5 text-xs bg-white border border-sky-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-medium"
          />
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          {/* Member Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Acquired / Sourced By Staff Member
            </label>
            {loadingUsers ? (
              <div className="text-xs text-slate-400 py-1.5 font-medium">Loading team directory...</div>
            ) : (
              <select
                disabled={disabled}
                value={userId ? String(userId) : ''}
                onChange={e =>
                  onChange({
                    sourceType: 'team_member',
                    sourceDetail: sourceDetail || 'Sales Rep Outreach',
                    userId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-400 font-medium"
              >
                <option value="">-- Select Team Member --</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            )}

            {selectedMember && (
              <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200">
                <UserAvatar
                  name={selectedMember.name}
                  avatarUrl={selectedMember.avatar_url}
                  role={selectedMember.role}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">{selectedMember.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{selectedMember.email}</div>
                </div>
                <RoleBadge role={selectedMember.role} size="xs" />
              </div>
            )}
          </div>

          {/* Acquisition Detail */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Acquisition Method</label>
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
                      userId: userId ? Number(userId) : null,
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
                  userId: userId ? Number(userId) : null,
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

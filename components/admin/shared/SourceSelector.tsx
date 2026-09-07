'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import RoleBadge from './RoleBadge';

export interface SourceSelectorProps {
  sourceType?: 'website' | 'team_member';
  sourceDetail?: string;
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

export default function SourceSelector({
  sourceType = 'team_member',
  sourceDetail,
  userId,
  onChange,
  disabled = false,
  className = '',
  entityType = 'lead',
}: SourceSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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

        // AUTOMATIC: Pre-select current logged-in user
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

  const displayName = selectedMember?.name || currentUser?.name || 'Staff Member';
  const effectiveRole = selectedMember?.role || currentUser?.role;

  return (
    <div className={`flex items-center gap-2.5 py-1 px-1 ${className}`}>
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
      </div>
    </div>
  );
}

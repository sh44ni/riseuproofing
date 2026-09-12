'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Phone,
  Mail,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  User,
} from 'lucide-react';

export interface RecentActivityItem {
  id: number;
  activity_type: string;
  title: string;
  description?: string | null;
  performed_by?: string | null;
  created_at: string;
  lead_name?: string | null;
}

interface DashboardRecentActivityProps {
  activities: RecentActivityItem[];
}

export default function DashboardRecentActivity({
  activities = [],
}: DashboardRecentActivityProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  const getActivityIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('call') || t.includes('phone')) {
      return <Phone size={13} className="text-blue-600" />;
    }
    if (t.includes('mail')) {
      return <Mail size={13} className="text-indigo-600" />;
    }
    if (t.includes('estimate') || t.includes('quote') || t.includes('proposal')) {
      return <FileText size={13} className="text-amber-600" />;
    }
    if (t.includes('meeting') || t.includes('calendar') || t.includes('visit')) {
      return <Calendar size={13} className="text-purple-600" />;
    }
    return <Activity size={13} className="text-emerald-600" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const d = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Activity size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">Recent Activity</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500">Live operational events across pipeline &amp; clients</p>
          </div>
        </div>

        <Link
          href="/admin/leads"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((act) => (
          <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs group hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5">
                {getActivityIcon(act.activity_type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800">{act.title}</span>
                  {act.lead_name && (
                    <span className="text-[11px] text-slate-500">
                      for <span className="font-semibold text-slate-700">{act.lead_name}</span>
                    </span>
                  )}
                </div>
                {act.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {act.description}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  by {act.performed_by || 'Staff'}
                </span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 font-medium pt-1">
              {formatRelativeTime(act.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

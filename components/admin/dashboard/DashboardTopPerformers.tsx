'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ChevronRight, TrendingUp, DollarSign } from 'lucide-react';
import UserAvatar from '@/components/admin/shared/UserAvatar';

export interface PerformerItem {
  id: number;
  name: string;
  role: string;
  avatar_url?: string | null;
  won_leads: number;
  total_revenue: number | string;
}

interface DashboardTopPerformersProps {
  performers: PerformerItem[];
}

export default function DashboardTopPerformers({
  performers,
}: DashboardTopPerformersProps) {
  if (!performers || performers.length === 0) {
    return null;
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Award size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">Top Performers</h2>
            <p className="text-[11px] text-slate-500">Won deals &amp; closed revenue this month</p>
          </div>
        </div>

        <Link
          href="/admin/reports"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Reports</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Flat Static Ranked List (No celebratory effects, clean & fast) */}
      <div className="divide-y divide-slate-100">
        {performers.map((rep, index) => {
          const rev = parseFloat(String(rep.total_revenue || '0'));
          return (
            <div
              key={rep.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank # */}
                <span
                  className={`w-5 text-center font-black text-xs ${
                    index === 0
                      ? 'text-amber-600'
                      : index === 1
                      ? 'text-slate-600'
                      : index === 2
                      ? 'text-amber-800'
                      : 'text-slate-400'
                  }`}
                >
                  #{index + 1}
                </span>

                <UserAvatar
                  name={rep.name}
                  avatarUrl={rep.avatar_url}
                  role={rep.role}
                  size="sm"
                />

                <div className="min-w-0">
                  <span className="font-bold text-[#0B1E33] block truncate">
                    {rep.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize block">
                    {rep.role.replace('_', ' ')} • {rep.won_leads}{' '}
                    {rep.won_leads === 1 ? 'Won Deal' : 'Won Deals'}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-mono text-xs font-bold text-[#0B1E33] block">
                  ${rev.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                  <TrendingUp size={10} />
                  <span>Closed</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: 'amber' | 'blue' | 'green' | 'purple' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

const COLOR_MAP = {
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    icon: 'bg-amber-100 text-amber-800',
    glow: 'shadow-[0_4px_16px_rgba(234,166,54,0.08)]',
    border: 'border-amber-200/80',
  },
  blue: {
    bg: 'from-sky-500/10 to-blue-500/5',
    icon: 'bg-sky-100 text-[#1878B8]',
    glow: 'shadow-[0_4px_16px_rgba(47,159,227,0.08)]',
    border: 'border-sky-200/80',
  },
  green: {
    bg: 'from-emerald-500/10 to-teal-500/5',
    icon: 'bg-emerald-100 text-emerald-800',
    glow: 'shadow-[0_4px_16px_rgba(16,185,129,0.08)]',
    border: 'border-emerald-200/80',
  },
  purple: {
    bg: 'from-purple-500/10 to-violet-500/5',
    icon: 'bg-purple-100 text-purple-800',
    glow: 'shadow-[0_4px_16px_rgba(168,85,247,0.08)]',
    border: 'border-purple-200/80',
  },
  red: {
    bg: 'from-rose-500/10 to-pink-500/5',
    icon: 'bg-rose-100 text-rose-800',
    glow: 'shadow-[0_4px_16px_rgba(244,63,94,0.08)]',
    border: 'border-rose-200/80',
  },
};

export default function KpiCard({
  title, value, sub, icon: Icon, color = 'amber', trend, trendLabel,
}: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className={`relative overflow-hidden admin-card rounded-[16px] bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-md hover:border-slate-300`}>
      {/* Subtle top decorative accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.bg}`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <p className="text-[#0B1E33] text-3xl font-black tabular-nums">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${c.icon} flex-shrink-0 shadow-2xs`}>
          <Icon size={22} />
        </div>
      </div>

      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-3 relative z-10">
          {trend === 'up' && <TrendingUp size={14} className="text-emerald-600" />}
          {trend === 'down' && <TrendingDown size={14} className="text-rose-600" />}
          {trend === 'neutral' && <Minus size={14} className="text-slate-500" />}
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-700' : trend === 'down' ? 'text-rose-700' : 'text-slate-500'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

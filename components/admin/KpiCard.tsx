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
    bg: 'from-[#d4a447]/15 to-[#c4923a]/8',
    icon: 'bg-[#d4a447]/15 text-[#d4a447]',
    glow: 'shadow-[0_4px_16px_rgba(212,164,71,0.08)]',
  },
  blue: {
    bg: 'from-blue-500/15 to-cyan-500/8',
    icon: 'bg-blue-500/15 text-blue-400',
    glow: 'shadow-[0_4px_16px_rgba(59,130,246,0.08)]',
  },
  green: {
    bg: 'from-emerald-500/15 to-green-500/8',
    icon: 'bg-emerald-500/15 text-emerald-400',
    glow: 'shadow-[0_4px_16px_rgba(16,185,129,0.08)]',
  },
  purple: {
    bg: 'from-purple-500/15 to-violet-500/8',
    icon: 'bg-purple-500/15 text-purple-400',
    glow: 'shadow-[0_4px_16px_rgba(168,85,247,0.08)]',
  },
  red: {
    bg: 'from-red-500/15 to-pink-500/8',
    icon: 'bg-red-500/15 text-red-400',
    glow: 'shadow-[0_4px_16px_rgba(239,68,68,0.08)]',
  },
};

export default function KpiCard({
  title, value, sub, icon: Icon, color = 'amber', trend, trendLabel,
}: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className={`relative overflow-hidden admin-card rounded-[16px] bg-gradient-to-br ${c.bg} border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-sm ${c.glow} transition-all duration-300 ease-out hover:scale-[1.015] hover:border-white/[0.12]`}>
      {/* Background glow blob */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl bg-current" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[#8a95a5] text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
          <p className="text-[#f0f2f5] text-3xl font-bold tabular-nums">{value}</p>
          {sub && <p className="text-[#5e6a7a] text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${c.icon} flex-shrink-0`}>
          <Icon size={22} />
        </div>
      </div>

      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-3 relative z-10">
          {trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
          {trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
          {trend === 'neutral' && <Minus size={14} className="text-[#8a95a5]" />}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#8a95a5]'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

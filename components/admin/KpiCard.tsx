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
    bg: 'from-amber-500/20 to-orange-500/10',
    icon: 'bg-amber-500/20 text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  blue: {
    bg: 'from-blue-500/20 to-cyan-500/10',
    icon: 'bg-blue-500/20 text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  green: {
    bg: 'from-emerald-500/20 to-green-500/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  purple: {
    bg: 'from-purple-500/20 to-violet-500/10',
    icon: 'bg-purple-500/20 text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  red: {
    bg: 'from-red-500/20 to-pink-500/10',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/10',
  },
};

export default function KpiCard({
  title, value, sub, icon: Icon, color = 'amber', trend, trendLabel,
}: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} border border-white/10 p-5 shadow-xl ${c.glow} transition-all duration-300 hover:scale-[1.02] hover:border-white/20`}>
      {/* Background glow blob */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl bg-current" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
          <p className="text-white text-3xl font-bold tabular-nums">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
          <Icon size={22} />
        </div>
      </div>

      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-3 relative z-10">
          {trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
          {trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
          {trend === 'neutral' && <Minus size={14} className="text-slate-400" />}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

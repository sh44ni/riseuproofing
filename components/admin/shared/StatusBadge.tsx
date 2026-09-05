import React from 'react';

export type LeadStatus = 'new' | 'contacted' | 'inspected' | 'quoted' | 'won' | 'lost' | string;
export type PriorityLevel = 'hot' | 'warm' | 'cool';

interface StatusBadgeProps {
  status?: LeadStatus;
  priority?: PriorityLevel;
  className?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'New' },
  contacted: { bg: 'bg-[#d4a447]/10', text: 'text-[#d4a447]', border: 'border-[#d4a447]/20', label: 'Contacted' },
  inspected: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', label: 'Inspected' },
  quoted: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Quoted' },
  won: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Won' },
  lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Lost' },
};

const PRIORITY_CONFIG: Record<PriorityLevel, { dot: string; label: string; text: string }> = {
  hot: { dot: 'bg-red-500 ring-2 ring-red-500/30 admin-pulse-gold', label: 'Hot', text: 'text-red-400' },
  warm: { dot: 'bg-[#d4a447]', label: 'Warm', text: 'text-[#d4a447]' },
  cool: { dot: 'bg-blue-500', label: 'Cool', text: 'text-blue-400' },
};

export default function StatusBadge({ status, priority, className = '', size = 'sm' }: StatusBadgeProps) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (priority) {
    const pCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.cool;
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-white/[0.06] bg-white/[0.03] ${pad} ${pCfg.text} admin-badge ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
        <span className="capitalize">{pCfg.label}</span>
      </span>
    );
  }

  if (status) {
    const sCfg = STATUS_CONFIG[status.toLowerCase()] ?? {
      bg: 'bg-[#5e6a7a]/10',
      text: 'text-[#a0aab8]',
      border: 'border-[#5e6a7a]/20',
      label: status,
    };
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full border ${sCfg.bg} ${sCfg.text} ${sCfg.border} ${pad} capitalize admin-badge ${className}`}
      >
        {sCfg.label}
      </span>
    );
  }

  return null;
}

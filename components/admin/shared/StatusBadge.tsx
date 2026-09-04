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
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'New' },
  contacted: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Contacted' },
  inspected: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'Inspected' },
  quoted: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Quoted' },
  won: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Won' },
  lost: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Lost' },
};

const PRIORITY_CONFIG: Record<PriorityLevel, { dot: string; label: string; text: string }> = {
  hot: { dot: 'bg-red-500 ring-2 ring-red-500/40 animate-pulse', label: 'Hot', text: 'text-red-400' },
  warm: { dot: 'bg-amber-500', label: 'Warm', text: 'text-amber-400' },
  cool: { dot: 'bg-blue-500', label: 'Cool', text: 'text-blue-400' },
};

export default function StatusBadge({ status, priority, className = '', size = 'sm' }: StatusBadgeProps) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (priority) {
    const pCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.cool;
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-white/10 bg-white/5 ${pad} ${pCfg.text} ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
        <span className="capitalize">{pCfg.label}</span>
      </span>
    );
  }

  if (status) {
    const sCfg = STATUS_CONFIG[status.toLowerCase()] ?? {
      bg: 'bg-slate-500/20',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
      label: status,
    };
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full border ${sCfg.bg} ${sCfg.text} ${sCfg.border} ${pad} capitalize ${className}`}
      >
        {sCfg.label}
      </span>
    );
  }

  return null;
}

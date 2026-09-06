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
  new: { bg: 'bg-sky-50', text: 'text-[#1878B8]', border: 'border-sky-200', label: 'New' },
  contacted: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Contacted' },
  inspected: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', label: 'Inspected' },
  quoted: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'Quoted' },
  won: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Won' },
  lost: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', label: 'Lost' },
};

const PRIORITY_CONFIG: Record<PriorityLevel, { dot: string; label: string; text: string }> = {
  hot: { dot: 'bg-rose-500 ring-2 ring-rose-200 admin-pulse-gold', label: 'Hot', text: 'text-rose-700' },
  warm: { dot: 'bg-amber-500', label: 'Warm', text: 'text-amber-800' },
  cool: { dot: 'bg-sky-500', label: 'Cool', text: 'text-sky-700' },
};

export default function StatusBadge({ status, priority, className = '', size = 'sm' }: StatusBadgeProps) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (priority) {
    const pCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.cool;
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-slate-200/80 bg-white shadow-2xs ${pad} ${pCfg.text} admin-badge ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
        <span className="capitalize">{pCfg.label}</span>
      </span>
    );
  }

  if (status) {
    const sCfg = STATUS_CONFIG[status.toLowerCase()] ?? {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
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

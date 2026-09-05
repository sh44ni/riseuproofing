'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  ArrowRightLeft,
  Zap,
  MapPin,
  Calendar,
} from 'lucide-react';

export interface Activity {
  id: number;
  entity_type: string;
  entity_id: number;
  activity_type: string;
  title: string;
  description?: string;
  performed_by?: string;
  call_duration?: number;
  metadata?: any;
  created_at: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Phone; color: string; bg: string; dotColor: string }
> = {
  call: { icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  status_change: { icon: ArrowRightLeft, color: 'text-[#d4a447]', bg: 'bg-[#d4a447]/10', dotColor: 'bg-[#d4a447]' },
  note: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', dotColor: 'bg-purple-400' },
  text: { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', dotColor: 'bg-cyan-400' },
  email: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10', dotColor: 'bg-blue-400' },
  visit: { icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-500/10', dotColor: 'bg-rose-400' },
  system: { icon: Zap, color: 'text-[#8a95a5]', bg: 'bg-slate-500/10', dotColor: 'bg-slate-500' },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  function formatTimestamp(d: string) {
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatDuration(sec?: number) {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center admin-card bg-opacity-40">
        <Clock size={28} className="mx-auto text-[#5e6a7a] mb-2" />
        <p className="text-[#8a95a5] text-sm font-medium">No activity recorded yet</p>
        <p className="text-[#5e6a7a] text-xs mt-0.5">Calls, notes, and status changes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/[0.06]">
      {activities.map((act) => {
        const cfg = TYPE_CONFIG[act.activity_type] ?? TYPE_CONFIG.note;
        const Icon = cfg.icon;

        return (
          <div key={act.id} className="relative group">
            {/* Timeline connector dot */}
            <span
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0c1117] ${cfg.dotColor} ring-4 ring-[#141b24] group-hover:scale-125 transition-transform`}
            />

            {/* Entry Card */}
            <div className="admin-card p-3.5 sm:p-4 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[#f0f2f5] font-semibold text-sm truncate">{act.title}</h4>
                    <p className="text-[#5e6a7a] text-xs">
                      {act.performed_by || 'Staff'} • {formatTimestamp(act.created_at)}
                    </p>
                  </div>
                </div>

                {act.call_duration ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {formatDuration(act.call_duration)}
                  </span>
                ) : null}
              </div>

              {act.description && (
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] text-xs text-[#a0aab8] leading-relaxed whitespace-pre-wrap">
                  {act.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

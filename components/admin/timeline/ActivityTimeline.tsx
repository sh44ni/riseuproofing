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
  call: { icon: Phone, color: 'text-emerald-700', bg: 'bg-emerald-50', dotColor: 'bg-emerald-500' },
  status_change: { icon: ArrowRightLeft, color: 'text-amber-800', bg: 'bg-amber-50', dotColor: 'bg-[#EAA636]' },
  note: { icon: FileText, color: 'text-purple-700', bg: 'bg-purple-50', dotColor: 'bg-purple-500' },
  text: { icon: MessageSquare, color: 'text-sky-700', bg: 'bg-sky-50', dotColor: 'bg-[#1878B8]' },
  email: { icon: Mail, color: 'text-blue-700', bg: 'bg-blue-50', dotColor: 'bg-blue-600' },
  visit: { icon: MapPin, color: 'text-rose-700', bg: 'bg-rose-50', dotColor: 'bg-rose-500' },
  system: { icon: Zap, color: 'text-slate-600', bg: 'bg-slate-100', dotColor: 'bg-slate-400' },
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
      <div className="py-8 text-center admin-card shadow-xs border-slate-200/80">
        <Clock size={28} className="mx-auto text-slate-400 mb-2" />
        <p className="text-[#0B1E33] text-sm font-semibold">No activity recorded yet</p>
        <p className="text-slate-500 text-xs mt-0.5">Calls, notes, and status changes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
      {activities.map((act) => {
        const cfg = TYPE_CONFIG[act.activity_type] ?? TYPE_CONFIG.note;
        const Icon = cfg.icon;

        return (
          <div key={act.id} className="relative group">
            {/* Timeline connector dot */}
            <span
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dotColor} ring-4 ring-slate-100 group-hover:scale-125 transition-transform`}
            />

            {/* Entry Card */}
            <div className="admin-card p-3.5 sm:p-4 transition-all shadow-xs border-slate-200/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[#0B1E33] font-semibold text-sm truncate">{act.title}</h4>
                    <p className="text-slate-500 text-xs">
                      {act.performed_by || 'Staff'} • {formatTimestamp(act.created_at)}
                    </p>
                  </div>
                </div>

                {act.call_duration ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    {formatDuration(act.call_duration)}
                  </span>
                ) : null}
              </div>

              {act.description && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
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

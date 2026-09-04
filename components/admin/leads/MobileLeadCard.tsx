'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Home, Clock, ChevronRight } from 'lucide-react';
import StatusBadge, { PriorityLevel } from '../shared/StatusBadge';

export interface MobileLeadData {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  service_type?: string;
  status: string;
  priority?: PriorityLevel;
  lead_score?: number;
  roof_sqf?: number;
  roof_type?: string;
  address?: string;
  zip?: string;
  city?: string;
  created_at: string;
  form_type?: string;
}

interface MobileLeadCardProps {
  lead: MobileLeadData;
  onStatusChange: (id: number, status: string) => void;
}

const STATUSES = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];

export default function MobileLeadCard({ lead, onStatusChange }: MobileLeadCardProps) {
  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // Extract city or fallback
  const locationLabel = lead.address || (lead.zip ? `ZIP ${lead.zip}` : null);

  return (
    <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 transition-all hover:border-white/20 active:scale-[0.99] shadow-sm">
      {/* Top Row: Avatar + Name + Priority/Status */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
              {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
            </div>
            {lead.priority === 'hot' && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base truncate flex items-center gap-1.5">
              {lead.full_name}
              <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="capitalize text-amber-400 font-medium">
                {lead.service_type || 'Roofing Inquiry'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock size={11} /> {timeAgo(lead.created_at)}
              </span>
            </div>
          </div>
        </Link>

        {/* Status Dropdown */}
        <select
          value={lead.status}
          onChange={e => onStatusChange(lead.id, e.target.value)}
          className="text-xs font-semibold px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-200 cursor-pointer outline-none focus:border-amber-400"
        >
          {STATUSES.map(s => (
            <option key={s} value={s} className="bg-slate-900 text-white capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Middle Specs Bar (Roof SQF, Location, Priority Score) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2 border-y border-white/5 text-xs text-slate-300">
        {lead.priority && (
          <StatusBadge priority={lead.priority} size="sm" />
        )}

        {lead.roof_sqf && lead.roof_sqf > 0 && (
          <span className="flex items-center gap-1 text-slate-300">
            <Home size={12} className="text-slate-500" />
            {lead.roof_sqf.toLocaleString()} sq ft
          </span>
        )}

        {locationLabel && (
          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[180px]">
            <MapPin size={12} className="text-slate-500" />
            {locationLabel}
          </span>
        )}
      </div>

      {/* Bottom Row: 1-Tap Quick Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-1">
        {lead.phone ? (
          <a
            href={`tel:${lead.phone.replace(/\D/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-colors"
          >
            <Phone size={13} />
            <span>Call {lead.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-500 italic">No phone provided</span>
        )}

        <Link
          href={`/admin/leads/${lead.id}`}
          className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

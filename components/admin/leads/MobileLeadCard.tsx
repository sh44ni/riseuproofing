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
    <div className="admin-card p-4 transition-all active:scale-[0.99]">
      {/* Top Row: Avatar + Name + Priority/Status */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a447] to-[#c4923a] flex items-center justify-center text-[#0c1117] font-bold text-sm shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
            </div>
            {lead.priority === 'hot' && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-[#141b24] animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[#f0f2f5] font-bold text-base truncate flex items-center gap-1.5">
              {lead.full_name}
              <ChevronRight size={14} className="text-[#5e6a7a] flex-shrink-0" />
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8a95a5]">
              <span className="capitalize text-[#d4a447] font-medium">
                {lead.service_type || 'Roofing Inquiry'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#5e6a7a]">
                <Clock size={11} /> {timeAgo(lead.created_at)}
              </span>
            </div>
          </div>
        </Link>

        {/* Status Dropdown */}
        <select
          value={lead.status}
          onChange={e => onStatusChange(lead.id, e.target.value)}
          className="text-xs font-semibold px-2 py-1 rounded-full border border-white/[0.06] bg-[#1a2332] text-[#f0f2f5] cursor-pointer outline-none focus:border-[#d4a447]"
        >
          {STATUSES.map(s => (
            <option key={s} value={s} className="bg-[#141b24] text-[#f0f2f5] capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Middle Specs Bar (Roof SQF, Location, Priority Score) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2 border-y border-white/[0.04] text-xs text-[#a0aab8]">
        {lead.priority && (
          <StatusBadge priority={lead.priority} size="sm" />
        )}

        {lead.roof_sqf && lead.roof_sqf > 0 && (
          <span className="flex items-center gap-1 text-[#a0aab8]">
            <Home size={12} className="text-[#5e6a7a]" />
            {lead.roof_sqf.toLocaleString()} sq ft
          </span>
        )}

        {locationLabel && (
          <span className="flex items-center gap-1 text-[#8a95a5] truncate max-w-[180px]">
            <MapPin size={12} className="text-[#5e6a7a]" />
            {locationLabel}
          </span>
        )}
      </div>

      {/* Bottom Row: 1-Tap Quick Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-1">
        {lead.phone ? (
          <a
            href={`tel:${lead.phone.replace(/\D/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-colors"
          >
            <Phone size={13} />
            <span>Call {lead.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-[#5e6a7a] italic">No phone provided</span>
        )}

        <Link
          href={`/admin/leads/${lead.id}`}
          className="py-2 px-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[#a0aab8] font-semibold text-xs transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

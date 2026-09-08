'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  MapPin,
  Home,
  Clock,
  ChevronRight,
  Eye,
  ExternalLink,
} from 'lucide-react';
import StatusBadge, { PriorityLevel } from '../shared/StatusBadge';
import SourceAttributionBadge from '../shared/SourceAttributionBadge';
import { Lead } from '../LeadsTable';

export type MobileLeadData = Lead;

interface MobileLeadCardProps {
  lead: Lead;
  onStatusChange: (id: number, status: string) => void;
  onQuickPeek?: (lead: Lead) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  new: { label: 'New Lead', bg: 'bg-sky-50', text: 'text-[#1878B8]', border: 'border-sky-200' },
  contacted: { label: 'Contacted', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  inspected: { label: 'Inspected', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  quoted: { label: 'Quoted', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  won: { label: 'Won', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  lost: { label: 'Lost', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

const STATUS_OPTIONS = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];

export default function MobileLeadCard({
  lead,
  onStatusChange,
  onQuickPeek,
}: MobileLeadCardProps) {
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

  function getAvatarGradient(lead: MobileLeadData) {
    if (lead.status === 'won') {
      return 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white ring-2 ring-emerald-200/80';
    }
    if (lead.priority === 'hot') {
      return 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-200 shadow-xs';
    }
    if (lead.priority === 'warm') {
      return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white';
    }
    return 'bg-gradient-to-br from-[#0B1E33] to-[#1878B8] text-white';
  }

  const estVal = Number(lead.estimated_value || 0);
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  const mapsUrl = lead.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${lead.address}, ${lead.city || ''} ${lead.zip || ''}`
      )}`
    : null;

  return (
    <div
      className="admin-card p-4 transition-all bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-3 hover:border-slate-300"
      onClick={() => onQuickPeek?.(lead)}
    >
      {/* Top Bar: Avatar + Name + Deal Value */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-2xs ${getAvatarGradient(
                lead
              )}`}
            >
              {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
            </div>
            {lead.priority === 'hot' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
            {lead.status === 'won' && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white text-[9px]">
                ✓
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[#0B1E33] font-bold text-base truncate">
                {lead.full_name}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0">
                #{lead.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="capitalize text-[#1878B8] font-bold truncate">
                {lead.service_type || 'Roofing Inquiry'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400 shrink-0">
                <Clock size={11} /> {timeAgo(lead.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Est. Deal Value */}
        <div className="text-right shrink-0">
          {estVal > 0 ? (
            <div>
              <div className="font-black text-[#0B1E33] text-sm tabular-nums">
                ${estVal.toLocaleString()}
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Est. Value
              </span>
            </div>
          ) : (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <select
                value={lead.status}
                onChange={e => onStatusChange(lead.id, e.target.value)}
                className={`text-[10px] font-bold pl-2 pr-5 py-0.5 rounded-full border cursor-pointer outline-none appearance-none ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-white text-slate-800 capitalize">
                    {STATUS_CONFIG[s]?.label || s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Middle Specs Bar (Roof SQF, Location, Priority Score) */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          {lead.priority && <StatusBadge priority={lead.priority} size="sm" />}

          {lead.roof_sqf && lead.roof_sqf > 0 ? (
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Home size={12} className="text-slate-400" />
              {lead.roof_sqf.toLocaleString()} sq ft
            </span>
          ) : null}

          {lead.roof_type ? (
            <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
              {lead.roof_type}
            </span>
          ) : null}
        </div>

        {/* Status Dropdown if estVal was shown above */}
        {estVal > 0 && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <select
              value={lead.status}
              onChange={e => onStatusChange(lead.id, e.target.value)}
              className={`text-[10px] font-bold pl-2 pr-5 py-0.5 rounded-full border cursor-pointer outline-none appearance-none ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} className="bg-white text-slate-800 capitalize">
                  {STATUS_CONFIG[s]?.label || s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Location & Attribution Row */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {lead.address || lead.zip || lead.city ? (
          <div className="flex items-center gap-1.5 text-slate-500 truncate min-w-0">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">
              {lead.address
                ? lead.address
                : lead.city
                ? lead.city
                : `ZIP ${lead.zip}`}
            </span>
          </div>
        ) : (
          <span className="text-slate-300 italic text-[11px]">San Diego County</span>
        )}

        <SourceAttributionBadge
          sourceType={lead.source_type}
          sourceDetail={lead.lead_source_detail}
          teamMemberName={lead.created_by_name}
          teamMemberRole={lead.created_by_role}
          teamMemberAvatar={lead.created_by_avatar}
          variant="compact"
        />
      </div>

      {/* Bottom Row: 1-Tap Quick Action Dock */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {lead.phone ? (
          <>
            <a
              href={`tel:${lead.phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-colors active:scale-95"
              title={`Call ${lead.phone}`}
            >
              <Phone size={13} className="text-emerald-600 shrink-0" />
              <span>Call</span>
            </a>
            <a
              href={`sms:${lead.phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs transition-colors active:scale-95"
              title={`Text ${lead.phone}`}
            >
              <MessageSquare size={13} className="text-sky-600 shrink-0" />
              <span>SMS</span>
            </a>
          </>
        ) : (
          <div className="col-span-2 py-2 text-center text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
            No Phone
          </div>
        )}

        {/* 1-Tap Quick Peek */}
        <button
          type="button"
          onClick={() => onQuickPeek?.(lead)}
          className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
          title="Quick Peek"
        >
          <Eye size={13} className="text-amber-600 shrink-0" />
          <span>Peek</span>
        </button>

        {/* Full Bio */}
        <Link
          href={`/admin/leads/${lead.id}`}
          className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-colors active:scale-95"
        >
          <span>Bio</span>
          <ChevronRight size={13} className="text-slate-400" />
        </Link>
      </div>
    </div>
  );
}

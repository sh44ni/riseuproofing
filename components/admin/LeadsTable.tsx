'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Clock,
  Home,
  MapPin,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Sparkles,
  Eye,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import StatusBadge, { PriorityLevel } from './shared/StatusBadge';
import SourceAttributionBadge from './shared/SourceAttributionBadge';

export interface Lead {
  id: number;
  form_type: string;
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  status: string;
  priority?: PriorityLevel;
  lead_score?: number;
  roof_sqf?: number;
  roof_type?: string;
  created_at: string;
  address?: string;
  zip?: string;
  city?: string;
  notes?: string;
  message?: string;
  subject?: string;
  source_type?: string;
  lead_source_detail?: string;
  created_by_name?: string;
  created_by_role?: string;
  created_by_avatar?: string;
  assigned_to_name?: string;
  estimated_value?: number | string;
  pipeline_stage?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: { label: 'New Lead', bg: 'bg-sky-50', text: 'text-[#1878B8]', border: 'border-sky-200', dot: 'bg-sky-500' },
  contacted: { label: 'Contacted', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  inspected: { label: 'Inspected', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  quoted: { label: 'Quoted', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  won: { label: 'Won', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  lost: { label: 'Lost', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400' },
};

const STATUS_OPTIONS = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: number, status: string) => void;
  onQuickPeek?: (lead: Lead) => void;
}

export default function LeadsTable({ leads, onStatusChange, onQuickPeek }: LeadsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function formatDate(d: string) {
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getAvatarGradient(lead: Lead) {
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card-blue transition-all">
      <table className="w-full text-left border-collapse text-sm min-w-[850px]">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-500">
            {/* Sticky Lead/Contact Header */}
            <th className="py-3.5 px-4 sticky left-0 bg-slate-50/95 backdrop-blur-xs z-20 shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)] min-w-[200px]">
              Lead / Homeowner
            </th>
            <th className="py-3.5 px-3 min-w-[110px]">Est. Value</th>
            <th className="py-3.5 px-3 min-w-[95px]">Priority</th>
            <th className="py-3.5 px-4 min-w-[160px]">Service &amp; Roof</th>
            <th className="py-3.5 px-4 min-w-[140px]">Source</th>
            <th className="py-3.5 px-4 min-w-[140px]">Location</th>
            <th className="py-3.5 px-3 min-w-[110px]">Received</th>
            <th className="py-3.5 px-3 min-w-[125px]">Status</th>
            <th className="py-3.5 px-4 text-right min-w-[130px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-slate-400 text-sm">
                No matching leads found
              </td>
            </tr>
          ) : (
            leads.map(lead => {
              const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
              const estVal = Number(lead.estimated_value || 0);

              return (
                <React.Fragment key={lead.id}>
                  <tr
                    className="hover:bg-sky-50/40 transition-colors cursor-pointer group relative"
                    onClick={() => {
                      if (onQuickPeek) onQuickPeek(lead);
                      else setExpanded(expanded === lead.id ? null : lead.id);
                    }}
                  >
                    {/* Sticky Lead/Contact Column */}
                    <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 transition-colors shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)]">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-2xs ${getAvatarGradient(
                              lead
                            )}`}
                          >
                            {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
                          </div>
                          {lead.priority === 'hot' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                          )}
                          {lead.status === 'won' && (
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white text-[8px]">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/leads/${lead.id}`}
                              onClick={e => e.stopPropagation()}
                              className="text-[#0B1E33] font-bold hover:text-[#1878B8] transition-colors truncate block group-hover:underline text-sm"
                            >
                              {lead.full_name}
                            </Link>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              #{lead.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone.replace(/\D/g, '')}`}
                                onClick={e => e.stopPropagation()}
                                className="hover:text-[#1878B8] flex items-center gap-1 transition-colors"
                              >
                                <Phone size={10} className="text-slate-400" />
                                <span>{lead.phone}</span>
                              </a>
                            ) : lead.email ? (
                              <span className="text-slate-400 truncate max-w-[130px]">
                                {lead.email}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No phone</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Deal Value */}
                    <td className="py-3 px-3">
                      {estVal > 0 ? (
                        <div>
                          <div className="font-black text-[#0B1E33] text-xs sm:text-sm tabular-nums flex items-center gap-0.5">
                            <span className="text-emerald-600 font-bold">$</span>
                            <span>{estVal.toLocaleString()}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Est. Value
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-3">
                      {lead.priority ? (
                        <StatusBadge priority={lead.priority} size="sm" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Service & Roof Specs */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 min-w-[130px]">
                        <p className="text-[#0B1E33] font-bold text-xs capitalize truncate">
                          {lead.service_type ?? 'Roofing Inquiry'}
                        </p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 truncate">
                          <Home size={10} className="text-slate-400 shrink-0" />
                          {lead.roof_sqf && lead.roof_sqf > 0 ? (
                            <span>{lead.roof_sqf.toLocaleString()} sq ft</span>
                          ) : null}
                          {lead.roof_type ? (
                            <span className="text-slate-400">({lead.roof_type})</span>
                          ) : null}
                          {!lead.roof_sqf && !lead.roof_type && (
                            <span className="text-slate-400 italic">Residential</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Source / Origin */}
                    <td className="py-3 px-4">
                      <SourceAttributionBadge
                        sourceType={lead.source_type}
                        sourceDetail={lead.lead_source_detail}
                        teamMemberName={lead.created_by_name}
                        teamMemberRole={lead.created_by_role}
                        teamMemberAvatar={lead.created_by_avatar}
                        variant="compact"
                      />
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      {lead.address || lead.zip || lead.city ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-[140px] truncate">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {lead.address
                              ? lead.address
                              : lead.city
                              ? lead.city
                              : `ZIP ${lead.zip}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Received Date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </td>

                    {/* Status Select Pill */}
                    <td className="py-3 px-3">
                      <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={e => onStatusChange(lead.id, e.target.value)}
                          className={`text-[11px] font-extrabold pl-2.5 pr-6 py-1 rounded-full border cursor-pointer outline-none transition-all appearance-none shadow-2xs ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 6px center',
                          }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-white text-slate-800 capitalize font-medium">
                              {STATUS_CONFIG[s]?.label || s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Actions & Quick Peek */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Tap Quick Peek Trigger */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (onQuickPeek) onQuickPeek(lead);
                            else setExpanded(expanded === lead.id ? null : lead.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1878B8] font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Quick Peek Drawer"
                        >
                          <Eye size={12} />
                          <span>Peek</span>
                        </button>

                        <Link
                          href={`/admin/leads/${lead.id}`}
                          onClick={e => e.stopPropagation()}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Full Profile"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>

                  {/* Fallback Accordion Quick Preview (if no onQuickPeek passed) */}
                  {!onQuickPeek && expanded === lead.id && (
                    <tr key={`${lead.id}-detail`} className="bg-slate-50/90">
                      <td colSpan={9} className="px-6 py-4 border-t border-slate-200/60">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 mb-0.5 font-bold uppercase tracking-wider text-[10px]">
                              Address &amp; Location
                            </p>
                            <p className="text-[#0B1E33] font-medium">
                              {lead.address || '—'}{lead.city ? `, ${lead.city}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5 font-bold uppercase tracking-wider text-[10px]">
                              Roof Material &amp; Area
                            </p>
                            <p className="text-[#0B1E33] font-medium">
                              {lead.roof_type || 'Shingle'} ({lead.roof_sqf ? `${lead.roof_sqf.toLocaleString()} sq ft` : 'Standard'})
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 mb-0.5 font-bold uppercase tracking-wider text-[10px]">
                              Submission Message
                            </p>
                            <p className="text-[#0B1E33] font-medium italic">
                              {lead.message || 'No submission notes'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

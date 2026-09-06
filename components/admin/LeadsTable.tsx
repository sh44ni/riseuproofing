'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Clock, Home, MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import StatusBadge, { PriorityLevel } from './shared/StatusBadge';

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
  notes?: string;
  message?: string;
  subject?: string;
}

const STATUSES = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: number, status: string) => void;
}

export default function LeadsTable({ leads, onStatusChange }: LeadsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function formatDate(d: string) {
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="overflow-x-auto rounded-[16px] admin-card border border-slate-200/80 bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/80">
            {['Lead / Contact', 'Priority', 'Service & Roof', 'Location', 'Date', 'Status', 'Actions'].map(h => (
              <th
                key={h}
                className="text-left px-4 py-3 text-slate-500 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap admin-section-label"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                No matching leads found
              </td>
            </tr>
          )}
          {leads.map(lead => (
            <React.Fragment key={lead.id}>
              <tr
                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
              >
                {/* Name & Contact */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2F9FE3] to-[#1878B8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
                        {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
                      </div>
                      {lead.priority === 'hot' && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white admin-pulse-gold" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[#0B1E33] font-bold hover:text-[#1878B8] transition-colors flex items-center gap-1"
                      >
                        <span>{lead.full_name}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lead.phone && (
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Phone size={10} className="text-slate-400" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="text-slate-400 text-xs truncate max-w-[140px]">
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  {lead.priority ? (
                    <StatusBadge priority={lead.priority} size="sm" />
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>

                {/* Service & Roof Specs */}
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <p className="text-[#0B1E33] capitalize font-semibold">{lead.service_type ?? 'Roofing'}</p>
                    {lead.roof_sqf && lead.roof_sqf > 0 && (
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <Home size={11} className="text-slate-400" />
                        {lead.roof_sqf.toLocaleString()} sq ft {lead.roof_type ? `(${lead.roof_type})` : ''}
                      </p>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3 text-slate-600">
                  {lead.address || lead.zip ? (
                    <div className="flex items-center gap-1 text-xs text-slate-500 max-w-[160px] truncate">
                      <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{lead.address ? `${lead.address}${lead.zip ? `, ${lead.zip}` : ''}` : `ZIP ${lead.zip}`}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap text-xs">
                    <Clock size={11} className="text-slate-400" />
                    <span>{formatDate(lead.created_at)}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={e => {
                      e.stopPropagation();
                      onStatusChange(lead.id, e.target.value);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer outline-none hover:border-slate-300"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-white text-slate-800 capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      onClick={e => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-[8px] bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200 text-xs font-bold transition-colors"
                    >
                      Detail
                    </Link>
                    <span className="text-slate-400 text-xs w-4 inline-block text-center">
                      {expanded === lead.id ? '▲' : '▼'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Accordion Quick Preview */}
              {expanded === lead.id && (
                <tr key={`${lead.id}-detail`} className="bg-slate-50/80">
                  <td colSpan={7} className="px-6 py-4 border-t border-slate-200/60">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {lead.address && (
                        <div>
                          <p className="text-slate-500 mb-0.5 font-bold uppercase tracking-wider text-[10px]">Address</p>
                          <p className="text-[#0B1E33] font-medium">{lead.address}{lead.zip ? `, ${lead.zip}` : ''}</p>
                        </div>
                      )}
                      {lead.roof_type && (
                        <div>
                          <p className="text-slate-500 mb-0.5 font-bold uppercase tracking-wider text-[10px]">Roof Material</p>
                          <p className="text-[#0B1E33] font-medium">{lead.roof_type}</p>
                        </div>
                      )}
                      {lead.notes && (
                        <div>
                          <p className="text-slate-500 mb-0.5 font-bold uppercase tracking-wider text-[10px]">Internal Notes</p>
                          <p className="text-[#0B1E33] font-medium">{lead.notes}</p>
                        </div>
                      )}
                      {lead.message && (
                        <div className="col-span-2">
                          <p className="text-slate-500 mb-0.5 font-bold uppercase tracking-wider text-[10px]">Client Submission Message</p>
                          <p className="text-[#0B1E33] font-medium">{lead.message}</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

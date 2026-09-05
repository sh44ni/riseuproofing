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
    <div className="overflow-x-auto rounded-[16px] admin-card border-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
            {['Lead / Contact', 'Priority', 'Service & Roof', 'Location', 'Date', 'Status', 'Actions'].map(h => (
              <th
                key={h}
                className="text-left px-4 py-3 text-[#8a95a5] font-semibold text-[11px] uppercase tracking-widest whitespace-nowrap admin-section-label"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-[#5e6a7a] text-sm">
                No matching leads found
              </td>
            </tr>
          )}
          {leads.map(lead => (
            <React.Fragment key={lead.id}>
              <tr
                className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
              >
                {/* Name & Contact */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a447] to-[#c4923a] flex items-center justify-center text-[#0c1117] font-bold text-xs flex-shrink-0">
                        {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
                      </div>
                      {lead.priority === 'hot' && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#0c1117] admin-pulse-gold" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[#f0f2f5] font-medium hover:text-[#d4a447] transition-colors flex items-center gap-1"
                      >
                        <span>{lead.full_name}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8a95a5]" />
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lead.phone && (
                          <span className="text-[#8a95a5] text-xs flex items-center gap-1">
                            <Phone size={10} className="text-[#5e6a7a]" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="text-[#5e6a7a] text-xs truncate max-w-[140px]">
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
                    <span className="text-[#5e6a7a] text-xs">—</span>
                  )}
                </td>

                {/* Service & Roof Specs */}
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <p className="text-[#f0f2f5] capitalize font-medium">{lead.service_type ?? 'Roofing'}</p>
                    {lead.roof_sqf && lead.roof_sqf > 0 && (
                      <p className="text-[#8a95a5] text-xs flex items-center gap-1">
                        <Home size={11} className="text-[#5e6a7a]" />
                        {lead.roof_sqf.toLocaleString()} sq ft {lead.roof_type ? `(${lead.roof_type})` : ''}
                      </p>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3 text-[#a0aab8]">
                  {lead.address || lead.zip ? (
                    <div className="flex items-center gap-1 text-xs text-[#8a95a5] max-w-[160px] truncate">
                      <MapPin size={11} className="text-[#5e6a7a] flex-shrink-0" />
                      <span className="truncate">{lead.address ? `${lead.address}${lead.zip ? `, ${lead.zip}` : ''}` : `ZIP ${lead.zip}`}</span>
                    </div>
                  ) : (
                    <span className="text-[#5e6a7a] text-xs">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-[#8a95a5] whitespace-nowrap text-xs">
                    <Clock size={11} className="text-[#5e6a7a]" />
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
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/[0.06] bg-[#1a2332] text-[#f0f2f5] cursor-pointer outline-none hover:border-white/[0.12]"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-[#141b24] text-[#f0f2f5] capitalize">
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
                      className="px-2.5 py-1 rounded-[8px] bg-[#d4a447]/10 hover:bg-[#d4a447]/20 text-[#d4a447] text-xs font-semibold transition-colors"
                    >
                      Detail
                    </Link>
                    <span className="text-[#5e6a7a] text-xs w-4 inline-block text-center">
                      {expanded === lead.id ? '▲' : '▼'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Accordion Quick Preview */}
              {expanded === lead.id && (
                <tr key={`${lead.id}-detail`} className="bg-[#141b24]/50">
                  <td colSpan={7} className="px-6 py-4 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {lead.address && (
                        <div>
                          <p className="text-[#5e6a7a] mb-0.5 font-medium">Address</p>
                          <p className="text-[#f0f2f5]">{lead.address}{lead.zip ? `, ${lead.zip}` : ''}</p>
                        </div>
                      )}
                      {lead.roof_type && (
                        <div>
                          <p className="text-[#5e6a7a] mb-0.5 font-medium">Roof Material</p>
                          <p className="text-[#f0f2f5]">{lead.roof_type}</p>
                        </div>
                      )}
                      {lead.notes && (
                        <div>
                          <p className="text-[#5e6a7a] mb-0.5 font-medium">Internal Notes</p>
                          <p className="text-[#f0f2f5]">{lead.notes}</p>
                        </div>
                      )}
                      {lead.message && (
                        <div className="col-span-2">
                          <p className="text-[#5e6a7a] mb-0.5 font-medium">Client Submission Message</p>
                          <p className="text-[#f0f2f5]">{lead.message}</p>
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

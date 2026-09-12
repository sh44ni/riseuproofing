'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Home,
  ChevronRight,
  ExternalLink,
  Hammer,
  DollarSign,
  User,
  Sparkles,
  ClipboardCheck,
  UserX,
  AlertCircle,
} from 'lucide-react';
import { ClientListItem } from './MobileClientCard';
import { formatPhone } from '@/lib/crm-clients-utils';
import SourceAttributionBadge from '../shared/SourceAttributionBadge';

interface ClientsTableProps {
  clients: ClientListItem[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  function getLifecycleBadge(category?: string, status?: string, lostReason?: string | null, estimateTotal?: number | null) {
    if (category === 'existing_client' || status === 'active_job' || status === 'completed' || status === 'repeat') {
      return {
        label: 'Existing Client',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: Hammer,
        iconColor: 'text-emerald-600',
        detail: status === 'active_job' ? 'Active Jobsite in Production' : status === 'repeat' ? 'Repeat Customer' : 'Contract Executed / Complete',
      };
    }
    if (category === 'lost_lead' || status === 'lost') {
      return {
        label: 'Lost Lead',
        bg: 'bg-rose-50 text-rose-800 border-rose-300',
        icon: UserX,
        iconColor: 'text-rose-600',
        detail: lostReason ? `Lost: ${lostReason}` : 'Lost pre-contract',
      };
    }
    if (category === 'new_client' || status === 'opportunity') {
      return {
        label: 'New Client',
        bg: 'bg-purple-50 text-purple-800 border-purple-300',
        icon: ClipboardCheck,
        iconColor: 'text-purple-600',
        detail: estimateTotal ? `Proposal Out ($${Number(estimateTotal).toLocaleString()})` : 'In Inspection / Proposal',
      };
    }
    return {
      label: 'Lead',
      bg: 'bg-sky-50 text-sky-800 border-sky-300',
      icon: Sparkles,
      iconColor: 'text-sky-600',
      detail: 'Inbound Inquiry',
    };
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card-blue transition-all">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4 sticky left-0 bg-slate-50/95 backdrop-blur-xs z-20 shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)] min-w-[220px]">Client Name &amp; Contact</th>
            <th className="py-3.5 px-4">Property &amp; Roof Specs</th>
            <th className="py-3.5 px-4">Lifecycle Stage</th>
            <th className="py-3.5 px-4">Lifetime Value</th>
            <th className="py-3.5 px-4">Assigned To</th>
            <th className="py-3.5 px-4">Last Activity</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {clients.map(c => {
            const lifecycle = getLifecycleBadge(c.client_category, c.status, c.lost_reason, c.latest_estimate_total);
            const LifecycleIcon = lifecycle.icon;
            const ltv = Number(c.total_revenue || 0);

            return (
              <tr
                key={c.id}
                className="hover:bg-sky-50/30 transition-colors group"
              >
                {/* Name & Contact (Sticky Left) */}
                <td className="py-3.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 transition-colors shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-2xs ${
                      c.client_category === 'lost_lead'
                        ? 'bg-gradient-to-br from-slate-600 to-rose-700'
                        : c.client_category === 'existing_client'
                        ? 'bg-gradient-to-br from-teal-700 to-emerald-600'
                        : 'bg-gradient-to-br from-[#0B1E33] to-[#1878B8]'
                    }`}>
                      {c.full_name ? c.full_name[0].toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="font-bold text-[#0B1E33] hover:text-[#0284C7] transition-colors flex items-center gap-1 group-hover:underline"
                      >
                        {c.full_name}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-[#0284C7] flex items-center gap-1 transition-colors"
                          >
                            <Phone size={11} className="text-slate-400" />
                            {formatPhone(c.phone)}
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="hover:text-[#0284C7] truncate max-w-[140px] flex items-center gap-1 transition-colors"
                            title={c.email}
                          >
                            <Mail size={11} className="text-slate-400" />
                            {c.email}
                          </a>
                        )}
                      </div>
                      <div className="mt-1">
                        <SourceAttributionBadge
                          sourceType={c.source_type}
                          sourceDetail={c.lead_source_detail}
                          teamMemberName={c.acquired_by_name}
                          teamMemberRole={c.acquired_by_role}
                          teamMemberAvatar={c.acquired_by_avatar}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Property & Roof Specs */}
                <td className="py-3.5 px-4">
                  <div className="text-xs">
                    <div className="font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {c.city ? `${c.city}${c.zip ? `, ${c.zip}` : ''}` : c.address || '—'}
                      </span>
                    </div>
                    {(c.roof_type || (c.roof_sqf && c.roof_sqf > 0)) && (
                      <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                        {c.roof_type && <span>{c.roof_type}</span>}
                        {c.roof_type && c.roof_sqf ? <span>•</span> : null}
                        {c.roof_sqf ? <span>{c.roof_sqf.toLocaleString()} sq ft</span> : null}
                      </div>
                    )}
                  </div>
                </td>

                {/* Lifecycle Stage Badge */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${lifecycle.bg}`}>
                        <LifecycleIcon size={12} className={lifecycle.iconColor} />
                        {lifecycle.label}
                      </span>
                      {c.status === 'active_job' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black text-[9px] tracking-wider uppercase">
                          Active Job
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={lifecycle.detail}>
                      {lifecycle.detail}
                    </span>
                  </div>
                </td>

                {/* LTV & Jobs Count */}
                <td className="py-3.5 px-4">
                  <div>
                    <span className="font-black text-slate-800 text-sm">
                      ${ltv.toLocaleString()}
                    </span>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Hammer size={11} className="text-slate-400" />
                      <span>{c.total_jobs_count || 0} {(c.total_jobs_count === 1 ? 'project' : 'projects')}</span>
                    </div>
                  </div>
                </td>

                {/* Assigned Staff */}
                <td className="py-3.5 px-4">
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>{c.assigned_to_name || 'Unassigned'}</span>
                  </div>
                </td>

                {/* Last Activity */}
                <td className="py-3.5 px-4 text-xs text-slate-500">
                  {formatDate(c.updated_at || c.created_at)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>View 360°</span>
                    <ChevronRight size={13} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

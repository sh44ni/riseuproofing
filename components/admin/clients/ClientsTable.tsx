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
} from 'lucide-react';
import { ClientListItem } from './MobileClientCard';
import { formatPhone } from '@/lib/crm-clients-utils';

interface ClientsTableProps {
  clients: ClientListItem[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active_job':
        return { label: 'Active Job', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'repeat':
        return { label: 'Repeat Client', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'completed':
        return { label: 'Completed', bg: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'opportunity':
        return { label: 'Proposal Out', bg: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'lead':
      default:
        return { label: 'Lead', bg: 'bg-sky-50 text-sky-800 border-sky-300' };
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-4">Client Name & Contact</th>
            <th className="py-3.5 px-4">Property & Roof Specs</th>
            <th className="py-3.5 px-4">CRM Status</th>
            <th className="py-3.5 px-4">Lifetime Value</th>
            <th className="py-3.5 px-4">Assigned To</th>
            <th className="py-3.5 px-4">Last Activity</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {clients.map(c => {
            const badge = getStatusBadge(c.status);
            const ltv = Number(c.total_revenue || 0);

            return (
              <tr
                key={c.id}
                className="hover:bg-sky-50/30 transition-colors group"
              >
                {/* Name & Contact */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B1E33] to-[#1878B8] flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-2xs">
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

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {c.tags && c.tags.length > 0 && c.tags[0] !== 'New Lead' && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {c.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
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

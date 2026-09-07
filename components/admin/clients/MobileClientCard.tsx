'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  MapPin,
  Home,
  ChevronRight,
  DollarSign,
  Hammer,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { formatPhone } from '@/lib/crm-clients-utils';
import SourceAttributionBadge from '../shared/SourceAttributionBadge';

export interface ClientListItem {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  roof_type?: string | null;
  roof_sqf?: number | null;
  status: string;
  tags?: string[];
  total_revenue?: number | string;
  total_jobs_count?: number;
  updated_at: string;
  created_at: string;
  assigned_to_name?: string | null;
  source_type?: string | null;
  lead_source_detail?: string | null;
  client_since?: string | null;
  acquired_by_name?: string | null;
  acquired_by_role?: string | null;
  acquired_by_avatar?: string | null;
}

interface MobileClientCardProps {
  client: ClientListItem;
}

export default function MobileClientCard({ client }: MobileClientCardProps) {
  const ltv = Number(client.total_revenue || 0);

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

  const badge = getStatusBadge(client.status);
  const location = client.city
    ? `${client.city}${client.zip ? `, ${client.zip}` : ''}`
    : client.address || 'San Diego County';

  const mapsUrl = client.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${client.address}, ${client.city || ''} ${client.zip || ''}`
      )}`
    : null;

  return (
    <div className="admin-card p-4 transition-all active:scale-[0.99] bg-white border border-slate-200/80 shadow-xs">
      {/* Top Bar: Avatar + Name + Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <Link
          href={`/admin/clients/${client.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B1E33] to-[#1878B8] flex items-center justify-center text-white font-black text-base shadow-xs">
              {client.full_name ? client.full_name[0].toUpperCase() : 'C'}
            </div>
            {client.status === 'active_job' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[#0B1E33] font-bold text-base truncate flex items-center gap-1.5">
              {client.full_name}
              <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="truncate">{location}</span>
            </div>
          </div>
        </Link>

        {/* Status Chip */}
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} flex-shrink-0`}
        >
          {badge.label}
        </span>
      </div>

      {/* Middle Specs & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-y border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          {client.roof_type && (
            <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
              <Home size={12} className="text-slate-400" />
              {client.roof_type}
            </span>
          )}

          {client.roof_sqf && client.roof_sqf > 0 && (
            <span className="text-slate-500 font-medium">
              {client.roof_sqf.toLocaleString()} sq ft
            </span>
          )}
        </div>

        {/* LTV or Jobs Count */}
        <div className="flex items-center gap-2">
          {ltv > 0 && (
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-0.5">
              ${ltv.toLocaleString()}
            </span>
          )}
          {client.total_jobs_count && client.total_jobs_count > 0 ? (
            <span className="text-slate-500 font-semibold flex items-center gap-0.5">
              <Hammer size={12} className="text-slate-400" />
              {client.total_jobs_count} {client.total_jobs_count === 1 ? 'job' : 'jobs'}
            </span>
          ) : null}
        </div>
      </div>

      {/* Attribution Strip */}
      <div className="pt-2 flex items-center justify-between">
        <SourceAttributionBadge
          sourceType={client.source_type}
          sourceDetail={client.lead_source_detail}
          teamMemberName={client.acquired_by_name}
          teamMemberRole={client.acquired_by_role}
          teamMemberAvatar={client.acquired_by_avatar}
          variant="compact"
        />
      </div>

      {/* Bottom Action Bar: Native Call, SMS, Directions, and View 360 */}
      <div className="flex items-center justify-between gap-2 pt-2.5">
        <div className="flex items-center gap-2">
          {client.phone && (
            <>
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 text-xs font-bold transition-colors active:scale-95 cursor-pointer"
                title="Call Client"
              >
                <Phone size={13} />
                <span>Call</span>
              </a>

              <a
                href={`sms:${client.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors active:scale-95 cursor-pointer"
                title="Text Client"
              >
                <MessageSquare size={13} />
                <span>Text</span>
              </a>
            </>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium transition-colors active:scale-95 cursor-pointer"
              title="Navigate with GPS"
            >
              <MapPin size={13} />
            </a>
          )}
        </div>

        <Link
          href={`/admin/clients/${client.id}`}
          className="text-xs font-extrabold text-[#0284C7] hover:text-[#0369A1] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-sky-50 transition-colors"
        >
          View 360°
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

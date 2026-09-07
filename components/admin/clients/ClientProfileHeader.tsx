'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Plus,
  Edit2,
  ExternalLink,
  DollarSign,
  AlertCircle,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Hammer,
} from 'lucide-react';
import { formatPhone } from '@/lib/crm-clients-utils';
import SourceAttributionBadge from '../shared/SourceAttributionBadge';

interface ClientProfileHeaderProps {
  client: any;
  onEditSpecs: () => void;
  onLogActivity: () => void;
}

export default function ClientProfileHeader({
  client,
  onEditSpecs,
  onLogActivity,
}: ClientProfileHeaderProps) {
  const router = useRouter();

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active_job':
        return { label: 'Active Jobsite', bg: 'bg-amber-500 text-white border-amber-600' };
      case 'repeat':
        return { label: 'Repeat Client', bg: 'bg-emerald-600 text-white border-emerald-700' };
      case 'completed':
        return { label: 'Past Completed Client', bg: 'bg-blue-600 text-white border-blue-700' };
      case 'opportunity':
        return { label: 'Proposal Out', bg: 'bg-purple-600 text-white border-purple-700' };
      case 'lead':
      default:
        return { label: 'Active Lead', bg: 'bg-[#2F9FE3] text-white border-[#1878B8]' };
    }
  }

  const badge = getStatusBadge(client.status);
  const ltv = Number(client.total_revenue || 0);
  const balanceDue = Number(client.balance_due || 0);

  const mapsUrl = client.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${client.address}, ${client.city || ''} ${client.zip || ''}`
      )}`
    : null;

  return (
    <div className="bg-white border-b border-slate-200/80 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-5 mb-6 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      {/* Top back navigation & status row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B1E33] transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={14} />
          <span>All Clients</span>
        </Link>

        <div className="flex items-center gap-2">
          {balanceDue > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <AlertCircle size={12} className="text-amber-600" />
              Balance Due: ${balanceDue.toLocaleString()}
            </span>
          )}

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs border ${badge.bg}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Main Profile Info Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0B1E33] to-[#1878B8] flex items-center justify-center text-white font-black text-xl shadow-xs flex-shrink-0">
            {client.full_name ? client.full_name[0].toUpperCase() : 'C'}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
                {client.full_name}
              </h1>

              {ltv > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  ${ltv.toLocaleString()} LTV
                </span>
              )}
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="hover:text-[#0284C7] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Phone size={12} className="text-[#2F9FE3]" />
                  {formatPhone(client.phone)}
                </a>
              )}

              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="hover:text-[#0284C7] flex items-center gap-1 transition-colors"
                >
                  <Mail size={12} className="text-[#2F9FE3]" />
                  {client.email}
                </a>
              )}

              {(client.address || client.city) && (
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin size={12} className="text-slate-400" />
                  <span>
                    {client.address ? `${client.address}, ` : ''}
                    {client.city || 'San Diego County'}
                    {client.zip ? ` ${client.zip}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Source Attribution & Tenure */}
            <div className="mt-2 flex items-center gap-2">
              <SourceAttributionBadge
                sourceType={client.source_type}
                sourceDetail={client.lead_source_detail}
                teamMemberName={client.acquired_by_name}
                teamMemberRole={client.acquired_by_role}
                teamMemberAvatar={client.acquired_by_avatar}
                clientSince={client.client_since || client.created_at}
                showTenure={true}
                variant="badge"
              />
            </div>
          </div>
        </div>

        {/* Quick Action Triggers (Mobile & Desktop) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
          {client.phone && (
            <>
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Call Client"
              >
                <Phone size={14} />
                <span>Call</span>
              </a>

              <a
                href={`sms:${client.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Send SMS"
              >
                <MessageSquare size={14} />
                <span>Text</span>
              </a>
            </>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Navigate to Address"
            >
              <MapPin size={14} />
              <span className="hidden sm:inline">Directions</span>
            </a>
          )}

          <button
            onClick={onLogActivity}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Note / Call</span>
          </button>

          <button
            onClick={onEditSpecs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Edit Client Information"
          >
            <Edit2 size={13} />
            <span className="hidden sm:inline">Edit Specs</span>
          </button>
        </div>
      </div>
    </div>
  );
}

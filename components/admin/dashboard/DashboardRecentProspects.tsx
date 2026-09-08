'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Phone, MessageSquare, ChevronRight, Flame } from 'lucide-react';

export interface ProspectItem {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  service_type?: string | null;
  status: string;
  priority?: string | null;
  lead_score?: number | null;
  estimated_value?: number | string | null;
  created_at?: string;
}

interface DashboardRecentProspectsProps {
  leads: ProspectItem[];
}

export default function DashboardRecentProspects({ leads }: DashboardRecentProspectsProps) {
  if (!leads || leads.length === 0) {
    return null;
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1878B8] flex items-center justify-center font-bold">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">Recent Prospects</h2>
            <p className="text-[11px] text-slate-500">Inbound inquiries &amp; estimate requests</p>
          </div>
        </div>

        <Link
          href="/admin/leads"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Leads CRM</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {leads.map((lead) => {
          const isHot = lead.priority === 'hot' || (lead.lead_score !== undefined && lead.lead_score !== null && lead.lead_score >= 70);
          const phone = lead.phone?.replace(/\D/g, '');

          return (
            <div
              key={lead.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isHot
                  ? 'bg-amber-50/50 border-amber-200/80 shadow-2xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="font-bold text-xs text-[#0B1E33] hover:text-[#1878B8] transition-colors truncate"
                  >
                    {lead.full_name}
                  </Link>
                  {isHot && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black uppercase">
                      <Flame size={10} className="text-rose-600" />
                      <span>HOT</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">#{lead.id}</span>
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {lead.service_type || 'Residential Roofing'} • {lead.city || 'San Diego'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {phone && (
                  <>
                    <a
                      href={`tel:${phone}`}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      title="Call Lead"
                    >
                      <Phone size={12} />
                    </a>
                    <a
                      href={`sms:${phone}`}
                      className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200 transition-colors"
                      title="Text Lead"
                    >
                      <MessageSquare size={12} />
                    </a>
                  </>
                )}
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-[#0B1E33] hover:bg-slate-200 border border-slate-200 transition-colors"
                  title="View Lead Details"
                >
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

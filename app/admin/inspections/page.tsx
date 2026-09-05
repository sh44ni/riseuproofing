'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Calendar,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import { InspectionsSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface InspectionItem {
  id: number;
  lead_id?: number;
  job_id?: number;
  inspection_number: string;
  inspector_name: string;
  inspection_date: string;
  roof_health_score: number;
  findings: any[];
  urgent_action_required: boolean;
  estimated_remaining_years: number;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  service_type?: string;
  job_number?: string;
}

interface SummaryStats {
  totalCount: number;
  avgHealthScore: number;
  urgentCount: number;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalCount: 0,
    avgHealthScore: 85,
    urgentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInspections = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inspections${filterUrgent ? '?urgent=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setInspections(data.inspections || []);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load inspections', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterUrgent]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const filtered = inspections.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.inspection_number.toLowerCase().includes(q) ||
      (i.customer_name && i.customer_name.toLowerCase().includes(q)) ||
      (i.address && i.address.toLowerCase().includes(q)) ||
      (i.city && i.city.toLowerCase().includes(q)) ||
      (i.inspector_name && i.inspector_name.toLowerCase().includes(q))
    );
  });

  if (loading && inspections.length === 0) {
    return <InspectionsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-[#d4a447]/10 border border-[#d4a447]/20 text-[#d4a447]">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#f0f2f5]">
              Roof Health &amp; Damage Inspections
            </h1>
            <p className="text-xs sm:text-sm text-[#8a95a5]">
              12-point in-field drone and physical walk roof inspection reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchInspections();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-[#141b24] hover:bg-[#1a2332] text-xs font-semibold text-[#a0aab8] transition-all duration-300 ease-out cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#d4a447]' : ''} />
            Refresh
          </button>

          <Link
            href="/admin/inspections/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-[#e8c06a] hover:to-[#c4923a] text-[#0c1117] font-bold text-xs shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out cursor-pointer"
          >
            <Plus size={15} /> New Roof Inspection
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Inspections Done</span>
            <ClipboardCheck size={15} className="text-[#d4a447]" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.totalCount}</div>
          <div className="text-xs text-[#8a95a5] mt-1">Field reports generated</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Avg Roof Health</span>
            <Shield size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.avgHealthScore}%</div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">Overall territory condition</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Urgent Action Needed</span>
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.urgentCount}</div>
          <div className="text-xs text-rose-400 font-semibold mt-1">Critical leak or rot risks</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Close Rate Driver</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">+42%</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">Proposal win lift with report</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-[16px] admin-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUrgent(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
              !filterUrgent
                ? 'bg-[#d4a447] text-[#0c1117] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
            }`}
          >
            All Inspections
          </button>
          <button
            onClick={() => setFilterUrgent(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer flex items-center gap-1.5 ${
              filterUrgent
                ? 'bg-rose-500 text-[#f0f2f5] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
            }`}
          >
            <AlertTriangle size={12} /> Urgent Leaks Only
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a95a5]" />
          <input
            type="text"
            placeholder="Search report #, customer, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] placeholder-slate-400 text-xs focus:outline-none focus:border-[#d4a447]"
          />
        </div>
      </div>

      {/* Inspections Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#5e6a7a] gap-3">
          <RefreshCw size={24} className="animate-spin text-[#d4a447]" />
          <span className="text-xs font-semibold">Loading inspection reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-[16px] border border-white/[0.04] bg-[#141b24]/40 space-y-3">
          <ClipboardCheck size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-[#f0f2f5]">No Inspection Reports Found</h3>
          <p className="text-xs text-[#8a95a5] max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search query.'
              : 'Perform your first 12-point roof inspection to generate an instant health score.'}
          </p>
          <Link
            href="/admin/inspections/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4a447] text-[#0c1117] text-xs font-bold shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
          >
            <Plus size={14} /> Start 12-Point Inspection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(insp => {
            const score = insp.roof_health_score;
            const isGood = score >= 80;
            const isFair = score >= 55 && score < 80;

            return (
              <div
                key={insp.id}
                className="p-5 rounded-[20px] admin-card space-y-4 hover:border-white/[0.12] transition-all duration-300 ease-out shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Inspection # and Health Score Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#d4a447]">
                        {insp.inspection_number}
                      </span>
                      <h3 className="text-base font-black text-[#f0f2f5] mt-0.5">
                        {insp.customer_name || 'Homeowner Property'}
                      </h3>
                      <p className="text-xs text-[#8a95a5] flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-[#5e6a7a] flex-shrink-0" />
                        <span className="truncate">{insp.address || 'San Diego County, CA'}</span>
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={`text-center px-3 py-1.5 rounded-[16px] border ${
                        isGood
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isFair
                          ? 'bg-[#d4a447]/12 text-[#d4a447] border-[#d4a447]/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <span className="text-xl font-black block leading-none">{score}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider">Health</span>
                    </div>
                  </div>

                  {/* Urgent Warning if needed */}
                  {insp.urgent_action_required && (
                    <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-rose-400 flex-shrink-0" />
                      Critical Leak Hazard / Dry Rot Detected
                    </div>
                  )}

                  {/* Remaining Lifespan */}
                  <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#0a0f14] border border-white/[0.04]">
                      <span className="text-[10px] text-[#5e6a7a] uppercase font-semibold">Est. Lifespan</span>
                      <div className="font-bold text-[#c8cfd8] mt-0.5">
                        ~{insp.estimated_remaining_years} Years Left
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0a0f14] border border-white/[0.04]">
                      <span className="text-[10px] text-[#5e6a7a] uppercase font-semibold">Inspector</span>
                      <div className="font-bold text-[#c8cfd8] mt-0.5 truncate">
                        {insp.inspector_name.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Inspection Date */}
                  <div className="pt-2 text-[11px] text-[#5e6a7a] flex items-center gap-1">
                    <Calendar size={11} /> Inspected on {insp.inspection_date}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                  <Link
                    href={`/inspection/${insp.inspection_number}`}
                    target="_blank"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1a2332] hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out"
                  >
                    View Report <ExternalLink size={11} />
                  </Link>

                  {insp.lead_id && (
                    <Link
                      href={`/admin/estimates/new?lead_id=${insp.lead_id}`}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-[#e8c06a] hover:to-[#c4923a] text-[#0c1117] text-xs font-bold shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out flex items-center gap-1"
                    >
                      <FileText size={12} /> Quote
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

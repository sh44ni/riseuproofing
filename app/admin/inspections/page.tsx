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
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Roof Health &amp; Damage Inspections
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
            Refresh
          </button>

          <Link
            href="/admin/inspections/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus size={15} /> New Roof Inspection
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Inspections Done</span>
            <ClipboardCheck size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Field reports generated</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Avg Roof Health</span>
            <Shield size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.avgHealthScore}%</div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">Overall territory condition</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Urgent Action Needed</span>
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.urgentCount}</div>
          <div className="text-xs text-rose-400 font-semibold mt-1">Critical leak or rot risks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Close Rate Driver</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">+42%</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">Proposal win lift with report</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUrgent(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !filterUrgent
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Inspections
          </button>
          <button
            onClick={() => setFilterUrgent(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterUrgent
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <AlertTriangle size={12} /> Urgent Leaks Only
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report #, customer, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/90 border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Inspections Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw size={24} className="animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Loading inspection reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/5 bg-slate-900/40 space-y-3">
          <ClipboardCheck size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No Inspection Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search query.'
              : 'Perform your first 12-point roof inspection to generate an instant health score.'}
          </p>
          <Link
            href="/admin/inspections/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
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
                className="p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-4 hover:border-white/20 transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Inspection # and Health Score Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {insp.inspection_number}
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {insp.customer_name || 'Homeowner Property'}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-500 flex-shrink-0" />
                        <span className="truncate">{insp.address || 'San Diego County, CA'}</span>
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={`text-center px-3 py-1.5 rounded-2xl border ${
                        isGood
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isFair
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
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
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Est. Lifespan</span>
                      <div className="font-bold text-slate-200 mt-0.5">
                        ~{insp.estimated_remaining_years} Years Left
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Inspector</span>
                      <div className="font-bold text-slate-200 mt-0.5 truncate">
                        {insp.inspector_name.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Inspection Date */}
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar size={11} /> Inspected on {insp.inspection_date}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <Link
                    href={`/inspection/${insp.inspection_number}`}
                    target="_blank"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View Report <ExternalLink size={11} />
                  </Link>

                  {insp.lead_id && (
                    <Link
                      href={`/admin/estimates/new?lead_id=${insp.lead_id}`}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1"
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

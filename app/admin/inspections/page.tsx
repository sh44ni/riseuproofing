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
          <div className="p-2.5 rounded-[16px] bg-sky-50 border border-sky-200 text-[#1878B8]">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Roof Health &amp; Damage Inspections
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 shadow-xs transition-all duration-300 ease-out cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#2F9FE3]' : ''} />
            Refresh
          </button>

          <Link
            href="/admin/inspections/new"
            className="admin-btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all duration-300 ease-out cursor-pointer"
          >
            <Plus size={15} /> New Roof Inspection
          </Link>
        </div>
      </div>

      {/* KPI Cards — Apple Liquid Glass */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="admin-card p-4 sm:p-4.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Inspections Done</span>
            <ClipboardCheck size={16} className="text-[#2F9FE3]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33]">{summary.totalCount}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Field reports generated</div>
        </div>

        <div className="admin-card p-4 sm:p-4.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Roof Health</span>
            <Shield size={16} className="text-[#0284C7]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33]">{summary.avgHealthScore}%</div>
          <div className="text-xs text-[#0284C7] font-semibold mt-1">Overall territory condition</div>
        </div>

        <div className="admin-card p-4 sm:p-4.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Urgent Action</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{summary.urgentCount}</div>
          <div className="text-xs text-rose-600 font-semibold mt-1">Critical leak or rot risks</div>
        </div>

        <div className="admin-card p-4 sm:p-4.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Close Rate Driver</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">+42%</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Proposal win lift with report</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-card p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUrgent(false)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer apple-spring-press ${
              !filterUrgent
                ? 'admin-glass-pill-gold-active shadow-xs'
                : 'admin-glass-pill text-slate-600 hover:text-[#0B1E33]'
            }`}
          >
            All Inspections
          </button>
          <button
            onClick={() => setFilterUrgent(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 apple-spring-press ${
              filterUrgent
                ? 'bg-rose-600 text-white shadow-xs border border-rose-600'
                : 'admin-glass-pill text-slate-600 hover:text-rose-600'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Urgent Only ({summary.urgentCount})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report #, customer, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F9FE3]/20 focus:border-[#2F9FE3]"
          />
        </div>
      </div>

      {/* Inspections Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw size={24} className="animate-spin text-[#2F9FE3]" />
          <span className="text-xs font-semibold">Loading inspection reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-[16px] border border-slate-200 bg-white shadow-xs space-y-3">
          <ClipboardCheck size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-[#0B1E33]">No Inspection Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search query.'
              : 'Perform your first 12-point roof inspection to generate an instant health score.'}
          </p>
          <Link
            href="/admin/inspections/new"
            className="admin-btn-gold inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs"
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
                className="p-5 rounded-[20px] bg-white border border-slate-200/80 space-y-4 hover:border-slate-300 transition-all duration-300 ease-out shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Inspection # and Health Score Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1878B8]">
                        {insp.inspection_number}
                      </span>
                      <h3 className="text-base font-black text-[#0B1E33] mt-0.5">
                        {insp.customer_name || 'Homeowner Property'}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{insp.address || 'San Diego County, CA'}</span>
                      </p>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={`text-center px-3 py-1.5 rounded-[16px] border ${
                        isGood
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isFair
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className="text-xl font-black block leading-none">{score}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider">Health</span>
                    </div>
                  </div>

                  {/* Urgent Warning if needed */}
                  {insp.urgent_action_required && (
                    <div className="mt-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                      Critical Leak Hazard / Dry Rot Detected
                    </div>
                  )}

                  {/* Remaining Lifespan */}
                  <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. Lifespan</span>
                      <div className="font-bold text-[#0B1E33] mt-0.5">
                        ~{insp.estimated_remaining_years} Years Left
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Inspector</span>
                      <div className="font-bold text-[#0B1E33] mt-0.5 truncate">
                        {insp.inspector_name.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Inspection Date */}
                  <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar size={11} /> Inspected on {insp.inspection_date}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/inspection/${insp.inspection_number}`}
                    target="_blank"
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out"
                  >
                    View Report <ExternalLink size={11} />
                  </Link>

                  {insp.lead_id && (
                    <Link
                      href={`/admin/estimates/new?lead_id=${insp.lead_id}`}
                      className="admin-btn-gold py-2 px-3 rounded-xl text-xs font-bold shadow-xs transition-all duration-300 ease-out flex items-center gap-1"
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

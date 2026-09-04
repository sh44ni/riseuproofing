'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Hammer,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Award,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  conversionPct: number | string;
  dropoffPct: number | string;
}

interface TerritoryItem {
  city: string;
  jobCount: number;
  totalRevenue: number;
  avgTicket: number;
  completedCount: number;
}

interface ServiceItem {
  materialType: string;
  jobCount: number;
  totalRevenue: number;
  avgContract: number;
}

interface CashForecast {
  overdue: number;
  next30: number;
  days31to60: number;
  days61to90: number;
  totalForecast: number;
}

interface ReportData {
  funnel: FunnelStage[];
  territory: TerritoryItem[];
  territoryLeads: { city: string; leadCount: number }[];
  services: ServiceItem[];
  cashFlowForecast: CashForecast;
  summary: {
    totalLeads: number;
    totalJobs: number;
    totalContractValue: number;
    totalCollected: number;
    totalPending: number;
    totalExpenses: number;
    totalProfit: number;
    realizedMarginPct: number;
    winRatePct: number | string;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-500 gap-3">
        <RefreshCw size={28} className="animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Generating Executive Reports...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalLeads: 0,
    totalJobs: 0,
    totalContractValue: 0,
    totalCollected: 0,
    totalPending: 0,
    totalExpenses: 0,
    totalProfit: 0,
    realizedMarginPct: 0,
    winRatePct: 0,
  };

  const funnel = data?.funnel || [];
  const territory = data?.territory || [];
  const services = data?.services || [];
  const forecast = data?.cashFlowForecast || {
    overdue: 0,
    next30: 0,
    days31to60: 0,
    days61to90: 0,
    totalForecast: 0,
  };

  const totalServiceRev = services.reduce((acc, s) => acc + s.totalRevenue, 0) || 1;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Executive Analytics & Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Pipeline conversion funnel, territory market share & cash flow forecasting
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchReports();
          }}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
          Reload Data
        </button>
      </div>

      {/* Top Level Executive Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Total Booked</span>
            <DollarSign size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${summary.totalContractValue.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">
            ${summary.totalCollected.toLocaleString()} collected
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Win / Close Rate</span>
            <Award size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary.winRatePct}%
          </div>
          <div className="text-xs text-amber-400 font-semibold mt-1">
            {summary.totalJobs} signed from {summary.totalLeads} leads
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Realized Margin</span>
            <TrendingUp size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary.realizedMarginPct}%
          </div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">
            Target: 38% - 42% gross
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Net Job Profit</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${summary.totalProfit.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            After ${summary.totalExpenses.toLocaleString()} expenses
          </div>
        </div>
      </div>

      {/* Section 1: Sales Conversion Funnel */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-400" />
              Roofing Sales & Production Pipeline Funnel
            </h2>
            <p className="text-xs text-slate-400">
              Lead progression through qualification, inspection, quote closing, and project sign-off
            </p>
          </div>
          <div className="text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full self-start border border-amber-400/20">
            Overall Win Rate: {summary.winRatePct}%
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {funnel.map((stage, idx) => {
            const widthPct = Math.max(12, Math.min(100, Number(stage.conversionPct)));
            const isBottleneck = parseFloat(String(stage.dropoffPct)) > 50 && idx > 0;

            return (
              <div key={stage.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span>{stage.stage}</span>
                    {isBottleneck && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertTriangle size={10} /> {stage.dropoffPct}% Drop
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white font-bold">{stage.count}</span>
                    <span className="text-slate-400 text-[11px] w-12 text-right">
                      {stage.conversionPct}%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : idx === 1
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500'
                        : idx === 2
                        ? 'bg-gradient-to-r from-teal-500 to-amber-500'
                        : idx === 3
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : idx === 4
                        ? 'bg-gradient-to-r from-orange-500 to-emerald-500'
                        : 'bg-gradient-to-r from-emerald-500 to-green-400'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Cash Flow Forecast & Projections */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-amber-400" />
              Cash Flow Forecast (30 / 60 / 90 Days)
            </h2>
            <p className="text-xs text-slate-400">
              Anticipated cash inflows from milestone invoicing across active jobs in progress
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full self-start border border-emerald-500/20">
            Total Pipeline: ${forecast.totalForecast.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {/* Overdue */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/20">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Overdue / Past Due
            </span>
            <div className="text-xl font-black text-white mt-1">
              ${forecast.overdue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Immediate follow-up needed</div>
          </div>

          {/* Next 30 Days */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Next 30 Days
            </span>
            <div className="text-xl font-black text-white mt-1">
              ${forecast.next30.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tear-off & dry-in stages</div>
          </div>

          {/* 31-60 Days */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              31 – 60 Days
            </span>
            <div className="text-xl font-black text-white mt-1">
              ${forecast.days31to60.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Final inspection passings</div>
          </div>

          {/* 61-90 Days */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              61 – 90 Days
            </span>
            <div className="text-xl font-black text-white mt-1">
              ${forecast.days61to90.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Future starts & warranty signoffs</div>
          </div>
        </div>
      </div>

      {/* Section 3: Territory & Service Type Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory / City Market Share */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin size={17} className="text-amber-400" />
              Territory & City Revenue Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Contract value and completed jobs across San Diego & Riverside County
            </p>
          </div>

          {territory.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              No city revenue logged yet. Start converting estimates to jobs!
            </div>
          ) : (
            <div className="space-y-3">
              {territory.map(t => {
                return (
                  <div
                    key={t.city}
                    className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{t.city}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({t.jobCount} project{t.jobCount !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="font-bold text-amber-400 font-mono">
                        ${t.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Avg Ticket: ${t.avgTicket.toLocaleString()}</span>
                      <span className="text-emerald-400">{t.completedCount} completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Roofing Service / Material Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={17} className="text-amber-400" />
              Service & Material Mix
            </h2>
            <p className="text-xs text-slate-400">
              Revenue distribution across shingles, tile, flat roofs & repairs
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              No material breakdown available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map(s => {
                const pct = Math.round((s.totalRevenue / totalServiceRev) * 100) || 0;
                return (
                  <div
                    key={s.materialType}
                    className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{s.materialType}</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        ${s.totalRevenue.toLocaleString()} ({pct}%)
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{s.jobCount} project{s.jobCount !== 1 ? 's' : ''}</span>
                      <span>Avg: ${s.avgContract.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

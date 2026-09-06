import React from 'react';
import { Skeleton } from '@/components/shared/Skeleton';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  HardHat,
  ShieldCheck,
  BarChart3,
  Calendar,
  Users,
  Search,
  Filter,
  Layers,
} from 'lucide-react';

/* ── 1. DASHBOARD SKELETON ── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-5 rounded-full bg-sky-100 admin-shimmer" />
            <Skeleton className="w-36 h-4 rounded-full admin-shimmer" />
          </div>
          <Skeleton className="w-72 sm:w-96 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-48 h-3.5 admin-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-28 h-9 rounded-xl admin-shimmer" />
          <Skeleton className="w-32 h-9 rounded-xl bg-sky-100 admin-shimmer" />
        </div>
      </div>

      {/* 4 Revenue & Operations KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: DollarSign, color: 'text-emerald-700 bg-emerald-100' },
          { icon: TrendingUp, color: 'text-cyan-700 bg-cyan-100' },
          { icon: ClipboardCheck, color: 'text-amber-800 bg-amber-100' },
          { icon: HardHat, color: 'text-purple-700 bg-purple-100' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-3.5 admin-shimmer" />
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={16} />
              </div>
            </div>
            <Skeleton className="w-32 h-8 rounded-xl admin-shimmer" />
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <Skeleton className="w-20 h-3 admin-shimmer" />
              <Skeleton className="w-12 h-4 rounded-full bg-emerald-100 admin-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* 7-Stage Kanban Distribution Bar */}
      <div className="p-4 sm:p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-36 h-4 admin-shimmer" />
            <Skeleton className="w-16 h-5 rounded-full bg-sky-100 admin-shimmer" />
          </div>
          <Skeleton className="w-24 h-3 admin-shimmer" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 h-3 rounded-lg overflow-hidden bg-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <Skeleton key={s} className="h-full rounded-none" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {[
            'Permit Pending',
            'Material Order',
            'Scheduled',
            'In Progress',
            'Punch List',
            'Final Inspection',
            'Complete',
          ].map((label, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
              <Skeleton className="w-12 h-3 admin-shimmer" />
              <Skeleton className="w-6 h-4 admin-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Urgent Alerts & Today's Field Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Alerts */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={14} />
              </div>
              <Skeleton className="w-36 h-5 admin-shimmer" />
            </div>
            <Skeleton className="w-16 h-5 rounded-full bg-rose-100 admin-shimmer" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl admin-card bg-white border border-rose-200/80 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1.5 w-3/4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-20 h-4 rounded-full bg-rose-100 admin-shimmer" />
                    <Skeleton className="w-28 h-4 admin-shimmer" />
                  </div>
                  <Skeleton className="w-48 h-3 admin-shimmer" />
                </div>
                <Skeleton className="w-16 h-7 rounded-xl bg-slate-100 admin-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Today's Operations Feed */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#1878B8] flex items-center justify-center">
                <HardHat size={14} />
              </div>
              <Skeleton className="w-44 h-5 admin-shimmer" />
            </div>
            <Skeleton className="w-20 h-4 admin-shimmer" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1.5 w-3/4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-24 h-4 rounded-full bg-cyan-100 admin-shimmer" />
                    <Skeleton className="w-36 h-4 admin-shimmer" />
                  </div>
                  <Skeleton className="w-56 h-3 admin-shimmer" />
                </div>
                <Skeleton className="w-12 h-6 rounded-lg bg-slate-100 admin-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-Width Recent Leads Table Skeleton */}
      <div className="p-4 sm:p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-36 h-5 admin-shimmer" />
          <Skeleton className="w-24 h-4 admin-shimmer" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full bg-sky-100 admin-shimmer" />
                <div className="space-y-1">
                  <Skeleton className="w-36 h-4 admin-shimmer" />
                  <Skeleton className="w-48 h-3 admin-shimmer" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <Skeleton className="w-20 h-5 rounded-full admin-shimmer" />
                <Skeleton className="w-16 h-5 rounded-full bg-sky-100 admin-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 2. LEADS TABLE SKELETON ── */
export function LeadsTableSkeleton() {
  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header & KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="w-44 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-64 h-3.5 mt-1.5 admin-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-10 rounded-xl bg-sky-100 admin-shimmer" />
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-3 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex-1 min-w-[240px]">
          <Skeleton className="w-full h-10 rounded-xl admin-shimmer" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="w-28 h-10 rounded-xl admin-shimmer" />
          <Skeleton className="w-28 h-10 rounded-xl admin-shimmer" />
          <Skeleton className="w-28 h-10 rounded-xl admin-shimmer" />
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'New', 'Contacted', 'Qualified', 'Won', 'Lost'].map((t, idx) => (
          <Skeleton key={idx} className="w-20 h-8 rounded-xl" />
        ))}
      </div>

      {/* Leads Table Rows (Desktop) */}
      <div className="rounded-2xl border border-slate-200/80 admin-card bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <Skeleton className="w-24 h-4 admin-shimmer" />
          <Skeleton className="w-24 h-4 admin-shimmer" />
          <Skeleton className="w-24 h-4 admin-shimmer" />
          <Skeleton className="w-24 h-4 admin-shimmer" />
          <Skeleton className="w-16 h-4 admin-shimmer" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-sky-100 admin-shimmer" />
                <div className="space-y-1">
                  <Skeleton className="w-40 h-4 admin-shimmer" />
                  <Skeleton className="w-28 h-3 admin-shimmer" />
                </div>
              </div>
              <Skeleton className="w-36 h-3.5 hidden sm:block admin-shimmer" />
              <Skeleton className="w-24 h-5 rounded-full admin-shimmer" />
              <Skeleton className="w-16 h-5 rounded-full bg-sky-100 admin-shimmer" />
              <Skeleton className="w-8 h-8 rounded-lg admin-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 3. KANBAN BOARD SKELETON ── */
export function KanbanSkeleton() {
  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-64 h-3.5 mt-1.5 admin-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-28 h-10 rounded-xl admin-shimmer" />
          <Skeleton className="w-36 h-10 rounded-xl bg-sky-100 admin-shimmer" />
        </div>
      </div>

      {/* 7 Columns Kanban Grid (Desktop Horizontal Scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {[
          'Permit Pending',
          'Material Order',
          'Scheduled',
          'In Progress',
          'Punch List',
          'Final Inspection',
          'Complete',
        ].map((col, idx) => (
          <div
            key={idx}
            className="w-72 flex-shrink-0 rounded-2xl admin-card bg-slate-100/70 border border-slate-200/80 p-3.5 space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <Skeleton className="w-28 h-4 admin-shimmer" />
              <Skeleton className="w-6 h-5 rounded-full bg-white admin-shimmer" />
            </div>

            {/* 2 Job Card Skeletons per column */}
            {[1, 2].map((card) => (
              <div
                key={card}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="w-20 h-4 rounded-md admin-shimmer" />
                  <Skeleton className="w-16 h-4 rounded-md bg-sky-100 admin-shimmer" />
                </div>
                <Skeleton className="w-36 h-4 admin-shimmer" />
                <Skeleton className="w-full h-3 admin-shimmer" />
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Skeleton className="w-20 h-3 admin-shimmer" />
                  <Skeleton className="w-16 h-4 rounded-md bg-slate-100 admin-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. FINANCES SKELETON ── */
export function FinancesSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-64 h-3.5 mt-1.5 admin-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-36 h-10 rounded-xl bg-sky-100 admin-shimmer" />
        </div>
      </div>

      {/* 4 Cash Flow KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-3">
            <Skeleton className="w-24 h-3.5 admin-shimmer" />
            <Skeleton className="w-32 h-8 rounded-xl admin-shimmer" />
            <Skeleton className="w-20 h-3 admin-shimmer" />
          </div>
        ))}
      </div>

      {/* Milestone Invoices Table */}
      <div className="rounded-2xl border border-slate-200/80 admin-card bg-white shadow-xs overflow-hidden space-y-4 p-5">
        <Skeleton className="w-48 h-5 admin-shimmer" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
            >
              <div className="space-y-1 w-1/3">
                <Skeleton className="w-32 h-4 admin-shimmer" />
                <Skeleton className="w-44 h-3 admin-shimmer" />
              </div>
              <Skeleton className="w-24 h-5 rounded-full bg-cyan-100 admin-shimmer" />
              <Skeleton className="w-20 h-5 admin-shimmer" />
              <Skeleton className="w-16 h-6 rounded-full bg-emerald-100 admin-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 5. CREW ROSTER SKELETON ── */
export function CrewRosterSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-64 h-3.5 mt-1.5 admin-shimmer" />
        </div>
        <Skeleton className="w-36 h-10 rounded-xl bg-sky-100 admin-shimmer" />
      </div>

      {/* 4 Crew KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-2">
            <Skeleton className="w-20 h-3 admin-shimmer" />
            <Skeleton className="w-16 h-7 rounded-lg admin-shimmer" />
          </div>
        ))}
      </div>

      {/* 6 Responsive Crew Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <div
            key={card}
            className="p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-sky-100 admin-shimmer" />
                  <div className="space-y-1">
                    <Skeleton className="w-28 h-4 admin-shimmer" />
                    <Skeleton className="w-20 h-3 admin-shimmer" />
                  </div>
                </div>
                <Skeleton className="w-16 h-5 rounded-full bg-blue-100 admin-shimmer" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <Skeleton className="w-20 h-3 admin-shimmer" />
                <Skeleton className="w-36 h-4 admin-shimmer" />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Skeleton className="w-1/2 h-9 rounded-xl admin-shimmer" />
              <Skeleton className="w-1/2 h-9 rounded-xl bg-sky-100 admin-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 6. INSPECTIONS & ESTIMATES CARD SKELETON ── */
export function InspectionsSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
        <Skeleton className="w-36 h-10 rounded-xl bg-sky-100 admin-shimmer" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="w-28 h-4 admin-shimmer" />
              <Skeleton className="w-12 h-6 rounded-full bg-emerald-100 admin-shimmer" />
            </div>
            <Skeleton className="w-44 h-5 admin-shimmer" />
            <Skeleton className="w-full h-3 admin-shimmer" />
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Skeleton className="w-20 h-3 admin-shimmer" />
              <Skeleton className="w-24 h-8 rounded-xl bg-slate-100 admin-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EstimatesSkeleton() {
  return <InspectionsSkeleton />;
}

/* ── 7. ANALYTICS HUB SKELETON ── */
export function AnalyticsHubSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
          <Skeleton className="w-64 h-3.5 mt-1.5 admin-shimmer" />
        </div>
        <Skeleton className="w-28 h-9 rounded-xl admin-shimmer" />
      </div>

      {/* 3-Tab Switcher */}
      <div className="flex gap-2 p-1 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs w-fit">
        <Skeleton className="w-28 h-9 rounded-xl bg-sky-100 admin-shimmer" />
        <Skeleton className="w-28 h-9 rounded-xl admin-shimmer" />
        <Skeleton className="w-28 h-9 rounded-xl admin-shimmer" />
      </div>

      {/* Scorecards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-2">
            <Skeleton className="w-24 h-3 admin-shimmer" />
            <Skeleton className="w-20 h-7 rounded-lg admin-shimmer" />
          </div>
        ))}
      </div>

      {/* Chart Canvas Area */}
      <div className="p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-36 h-5 admin-shimmer" />
          <Skeleton className="w-24 h-4 admin-shimmer" />
        </div>
        <Skeleton className="w-full h-64 rounded-xl admin-shimmer" />
      </div>
    </div>
  );
}

/* ── 8. WARRANTIES SKELETON ── */
export function WarrantiesSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-8 rounded-xl admin-shimmer" />
        <Skeleton className="w-36 h-10 rounded-xl bg-sky-100 admin-shimmer" />
      </div>
      <div className="rounded-2xl border border-slate-200/80 admin-card bg-white shadow-xs p-5 space-y-3">
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
          >
            <div className="space-y-1 w-1/3">
              <Skeleton className="w-36 h-4 admin-shimmer" />
              <Skeleton className="w-48 h-3 admin-shimmer" />
            </div>
            <Skeleton className="w-24 h-5 rounded-full bg-sky-100 admin-shimmer" />
            <Skeleton className="w-20 h-4 admin-shimmer" />
            <Skeleton className="w-20 h-8 rounded-xl bg-slate-100 admin-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

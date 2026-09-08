'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Hammer,
  Users,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  FileText,
  Clock,
  HardHat,
  ArrowRight,
  RefreshCw,
  Plus,
  ChevronRight,
  Globe,
  CheckCircle2,
} from 'lucide-react';

import { AuthUser, ROLE_CONFIG, hasPermission } from '@/lib/rbac';
import RoleBadge from '@/components/admin/shared/RoleBadge';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import { DashboardSkeleton } from '@/components/admin/shared/AdminSkeletons';

import DashboardNeedsFollowUp, { StaleLeadItem } from '@/components/admin/dashboard/DashboardNeedsFollowUp';
import DashboardTasksWidget, { TaskItem } from '@/components/admin/dashboard/DashboardTasksWidget';
import DashboardCalendarSnapshot from '@/components/admin/dashboard/DashboardCalendarSnapshot';
import DashboardActiveJobs, { ActiveJobItem } from '@/components/admin/dashboard/DashboardActiveJobs';
import DashboardTopPerformers, { PerformerItem } from '@/components/admin/dashboard/DashboardTopPerformers';
import DashboardRecentProspects, { ProspectItem } from '@/components/admin/dashboard/DashboardRecentProspects';

interface StatsResponse {
  userRole: string;
  userId: number;
  userName: string;
  followUpThresholdHours: number;
  kpis: {
    newLeadsThisWeek: number;
    activeJobs: number;
    pendingEstimates: number;
    revenueMtd: number;
  };
  needsFollowUp: StaleLeadItem[];
  myTasks: TaskItem[];
  activeJobs: ActiveJobItem[];
  recentLeads: ProspectItem[];
  topPerformers: PerformerItem[];
  trafficSummary: {
    visitorsToday: number;
    visitors7d: number;
  };
  jobsStageMap: Record<string, number>;
}

const STAGES = [
  { id: 'permit_pending', label: 'Permit Pending', color: 'text-cyan-800', bg: 'bg-cyan-50' },
  { id: 'material_order', label: 'Material Order', color: 'text-blue-800', bg: 'bg-blue-50' },
  { id: 'scheduled', label: 'Scheduled', color: 'text-amber-800', bg: 'bg-amber-50' },
  { id: 'in_progress', label: 'In Progress', color: 'text-orange-800', bg: 'bg-orange-50' },
  { id: 'punch_list', label: 'Punch List', color: 'text-purple-800', bg: 'bg-purple-50' },
  { id: 'final_inspection', label: 'Final Inspection', color: 'text-yellow-800', bg: 'bg-yellow-50' },
  { id: 'complete', label: 'Complete', color: 'text-emerald-800', bg: 'bg-emerald-50' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setCurrentUser(d.user);
        }
      })
      .catch(() => {});
  }, []);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-[#EAA636] flex items-center justify-center mb-3">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-[#0B1E33] font-bold text-lg">Unable to Load Dashboard Data</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">
          The dashboard metrics service was temporarily unavailable or encountered a connection error.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats()}
            className="admin-btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
          <Link
            href="/admin/leads"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium text-xs transition shadow-2xs"
          >
            View Leads
          </Link>
        </div>
      </div>
    );
  }

  const role = currentUser?.role || stats.userRole || 'owner';

  // Dynamic permission checks (§10)
  const canViewLeads = hasPermission(currentUser, 'leads.view') || hasPermission(currentUser, 'leads:view');
  const canViewJobs = hasPermission(currentUser, 'jobs.view') || hasPermission(currentUser, 'jobs:view');
  const canViewFinances = hasPermission(currentUser, 'finances.view') || hasPermission(currentUser, 'finances:view_invoices') || hasPermission(currentUser, 'finances:view_profit_ledger');
  const canViewReports = hasPermission(currentUser, 'reports.view') || hasPermission(currentUser, 'reports:view');
  const canCreateEstimates = hasPermission(currentUser, 'estimates.create') || hasPermission(currentUser, 'estimates:create');
  const canCreateInspections = hasPermission(currentUser, 'inspections.create') || hasPermission(currentUser, 'inspections:create');

  // Role layout variants derived from permissions
  const isForeman = !canViewLeads && !canViewFinances;
  const isSales = canViewLeads && !canViewFinances;
  const isOwner = canViewReports && canViewFinances;
  const isPM = canViewJobs && canViewLeads && !isOwner;

  const kpis = stats.kpis;
  const stageMap = stats.jobsStageMap || {};

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-7xl mx-auto px-3.5 sm:px-6">
      {/* Executive Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {currentUser && (
            <UserAvatar
              name={currentUser.name}
              avatarUrl={currentUser.avatar_url}
              role={currentUser.role}
              size="lg"
              showStatus
              showRoleBadge
              className="hidden sm:inline-flex flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RoleBadge role={role} size="xs" />
              {currentUser && (
                <span className="hidden sm:inline text-xs text-slate-500">
                  Welcome back, <span className="text-[#0B1E33] font-semibold">{currentUser.name}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight leading-tight">
              {isForeman ? (
                <>Jobsite &amp; Field Operations Hub</>
              ) : isSales ? (
                <>Sales &amp; Estimating Pipeline</>
              ) : isPM ? (
                <>Production &amp; Project Operations</>
              ) : (
                <>Executive Roofing Command Center</>
              )}
            </h1>
            {currentUser && (
              <p className="sm:hidden text-[11px] text-slate-500 mt-0.5 truncate">
                Welcome back, <span className="text-slate-800 font-semibold">{currentUser.name.split(' ')[0]}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            title="Refresh metrics"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#1878B8]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {!isForeman && (
            <Link
              href="/admin/estimates/new"
              className="admin-btn-gold h-9 px-3 sm:px-4 sm:py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Estimate</span>
            </Link>
          )}

          {isForeman && (
            <Link
              href="/admin/inspections/new"
              className="admin-btn-gold h-9 px-3 sm:px-4 sm:py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <ClipboardCheck size={14} strokeWidth={2.5} />
              <span>Inspection</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top KPI Strip (Tailored by Role) */}
      {isForeman ? (
        /* Field Foreman Metric Cards (Zero Sensitive Financial Margins) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/admin/jobs"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-amber-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Today's Active Roofs</span>
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-800 group-hover:scale-105 transition-transform">
                <Hammer size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {stats.activeJobs.length}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-800 font-semibold mt-1">
              <span>View Jobsite Work Orders</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/inspections"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-emerald-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>12-Pt Inspections</span>
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 group-hover:scale-105 transition-transform">
                <ClipboardCheck size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              Active
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1">
              <span>Run Field Checklists</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/calendar"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-blue-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Field Schedule</span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-800 group-hover:scale-105 transition-transform">
                <Calendar size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1 flex items-center gap-1">
              <span>View Dispatches</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/tasks"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-purple-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>My Tasks</span>
              <div className="p-1.5 rounded-xl bg-purple-50 text-purple-800 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {stats.myTasks.filter(t => !t.completed_at).length}
            </div>
            <div className="text-xs text-purple-800 font-semibold mt-1 flex items-center gap-1">
              <span>Open Punchlist Items</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      ) : (
        /* Owner, PM, Sales Rep Standard KPI Strip */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: New Leads (This Week) */}
          <Link
            href="/admin/leads"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-blue-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>{isSales ? 'My Leads (This Week)' : 'New Leads (This Week)'}</span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-[#1878B8] group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {kpis.newLeadsThisWeek}
            </div>
            <div className="flex items-center gap-1 text-xs text-[#1878B8] font-semibold mt-1">
              <span>Inquiry Pipeline</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 2: Active Jobs */}
          <Link
            href="/admin/jobs"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-amber-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>{isSales ? 'My Active Jobs' : 'Active Jobs in Field'}</span>
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-800 group-hover:scale-105 transition-transform">
                <Hammer size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {kpis.activeJobs}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-800 font-semibold mt-1">
              <span>Roofs in Production</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 3: Pending Estimates */}
          <Link
            href="/admin/estimates"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-sky-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Pending Estimates</span>
              <div className="p-1.5 rounded-xl bg-sky-50 text-sky-800 group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {kpis.pendingEstimates}
            </div>
            <div className="flex items-center gap-1 text-xs text-sky-800 font-semibold mt-1">
              <span>Awaiting Decision</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 4: Revenue MTD */}
          <Link
            href="/admin/finances"
            className="p-4 sm:p-5 rounded-2xl admin-card hover:border-emerald-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Revenue (MTD)</span>
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 group-hover:scale-105 transition-transform">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              ${kpis.revenueMtd.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-800 font-semibold mt-1">
              <span>Paid &amp; Invoiced</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      )}

      {/* 7-Stage Jobs Kanban Pulse (Owner & PM & Sales) */}
      {!isForeman && (
        <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer size={17} className="text-orange-600" />
              <h2 className="text-sm font-bold text-[#0B1E33]">Roofing Production Pulse (7 Stages)</h2>
            </div>
            <Link
              href="/admin/jobs"
              className="text-xs text-[#1878B8] hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors"
            >
              Open Kanban <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {STAGES.map((s) => {
              const count = stageMap[s.id] || 0;
              return (
                <Link
                  key={s.id}
                  href={`/admin/jobs?stage=${s.id}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#1878B8]/40 transition-all text-center group shadow-2xs"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 line-clamp-1 block">
                    {s.label}
                  </span>
                  <div className={`text-xl font-black mt-1 ${s.color}`}>
                    {count}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 group-hover:text-slate-600">
                    {count === 1 ? '1 Job' : `${count} Jobs`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {!isForeman ? (
          <>
            <Link
              href="/admin/leads?new=true"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1878B8] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  New Lead
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Log inquiry</span>
              </div>
            </Link>

            <Link
              href="/admin/estimates/new"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  Create Estimate
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Proposal builder</span>
              </div>
            </Link>

            <Link
              href="/admin/calendar"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Calendar size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  Dispatch Calendar
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Deliveries &amp; builds</span>
              </div>
            </Link>

            <Link
              href="/admin/tasks"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  Tasks Board
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Team follow-ups</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/admin/inspections/new"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardCheck size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  12-Pt Inspection
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Field checklist</span>
              </div>
            </Link>

            <Link
              href="/admin/jobs"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Hammer size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  Today's Roofs
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Assigned jobsites</span>
              </div>
            </Link>

            <Link
              href="/admin/calendar"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Calendar size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  Field Calendar
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Dispatches</span>
              </div>
            </Link>

            <Link
              href="/admin/tasks"
              className="p-3.5 rounded-xl admin-card bg-white hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={17} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8] truncate">
                  My Tasks
                </span>
                <span className="text-[10px] text-slate-500 block truncate">Punch list items</span>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Operational Flow & Production */}
        <div className="lg:col-span-7 space-y-6">
          {/* Needs Follow-Up (Stale Leads) - Hidden for Field Crew */}
          {!isForeman && (
            <DashboardNeedsFollowUp
              leads={stats.needsFollowUp}
              thresholdHours={stats.followUpThresholdHours}
              onRefresh={() => fetchStats(true)}
            />
          )}

          {/* Active Jobs in Field (Role filtered) */}
          <DashboardActiveJobs
            jobs={stats.activeJobs}
            isFieldCrew={isForeman}
            totalActiveCount={kpis.activeJobs}
          />
        </div>

        {/* Right Column (5 cols): Personal Tasks, Calendar Snapshot, Top Performers, Prospects */}
        <div className="lg:col-span-5 space-y-6">
          {/* My Tasks Widget */}
          <DashboardTasksWidget
            tasks={stats.myTasks}
            userId={stats.userId}
            userName={stats.userName}
            onRefresh={() => fetchStats(true)}
          />

          {/* Calendar Snapshot Widget (7-Day) */}
          <DashboardCalendarSnapshot
            userId={stats.userId}
            userRole={role}
          />

          {/* Top Performers Widget (Owner Role ONLY) */}
          {isOwner && stats.topPerformers && stats.topPerformers.length > 0 && (
            <DashboardTopPerformers
              performers={stats.topPerformers}
            />
          )}

          {/* Recent Prospects Feed (Hidden for Field Crew) */}
          {!isForeman && stats.recentLeads && stats.recentLeads.length > 0 && (
            <DashboardRecentProspects
              leads={stats.recentLeads}
            />
          )}
        </div>
      </div>

      {/* Collapsed Single-Line Marketing Teaser (Owner/PM/Sales) */}
      {!isForeman && (
        <div className="p-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe size={16} className="text-[#1878B8] flex-shrink-0" />
            <span className="text-slate-600 truncate">
              Web &amp; Marketing Hub &rarr;{' '}
              <strong className="text-[#0B1E33] font-bold">
                {stats.trafficSummary?.visitorsToday || 0}
              </strong>{' '}
              visitors today
              {stats.trafficSummary?.visitors7d ? (
                <span className="text-slate-500"> ({stats.trafficSummary.visitors7d} past 7 days)</span>
              ) : null}
            </span>
          </div>

          <Link
            href="/admin/analytics"
            className="text-[11px] text-[#1878B8] font-bold hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <span>Analytics</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

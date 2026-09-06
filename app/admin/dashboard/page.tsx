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
  Phone,
  Calendar,
  ClipboardCheck,
  FileText,
  Clock,
  CheckCircle2,
  HardHat,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  Plus,
  ShieldCheck,
  ChevronRight,
  Activity,
  Globe,
  Star,
  MapPin,
} from 'lucide-react';

import { AuthUser, ROLE_CONFIG } from '@/lib/rbac';
import RoleBadge from '@/components/admin/shared/RoleBadge';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import { DashboardSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface StatsResponse {
  revenue: {
    activePipelineValue: number;
    collectedThisMonth: number;
    pendingInvoicesAmount: number;
    pendingInvoicesCount: number;
    winRate: number;
    activeJobsTotal: number;
  };
  urgentAlerts: {
    hotLeads: any[];
    urgentInspections: any[];
    overdueInvoices: any[];
    escalatedReviews: any[];
    tasksToday: any[];
    totalUrgentItems: number;
  };
  jobsStageMap: Record<string, number>;
  todayOperations: {
    inspections: any[];
    activeJobs: any[];
    crewDispatched: number;
    crewTotal: number;
  };
  recentLeads: any[];
  trafficSummary: {
    visitorsToday: number;
    visitors7d: number;
  };
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
        <div className="w-14 h-14 rounded-[16px] bg-amber-50 border border-amber-200 text-[#EAA636] flex items-center justify-center mb-3">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-[#0B1E33] font-bold text-lg">Unable to Load Dashboard Data</h2>
        <p className="text-slate-500 text-xs mt-1 mb-5">
          The dashboard metrics service was temporarily unavailable or encountered a connection error.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats()}
            className="admin-btn-gold px-4 py-2.5 rounded-[16px] text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
          <Link
            href="/admin/leads"
            className="px-4 py-2.5 rounded-[16px] bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium text-xs transition shadow-2xs"
          >
            View Leads
          </Link>
        </div>
      </div>
    );
  }

  const rev = stats.revenue;
  const alerts = stats.urgentAlerts;
  const ops = stats.todayOperations;

  const role = currentUser?.role || 'owner';
  const roleCfg = ROLE_CONFIG[role];
  const isForeman = role === 'field_foreman';
  const isSales = role === 'sales_rep';

  return (
    <div className="space-y-5 pb-20 md:pb-10 max-w-7xl mx-auto px-3.5 sm:px-6">
      {/* Remastered Executive Header */}
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
            <h1 className="text-xl sm:text-3xl font-black text-[#0B1E33] tracking-tight leading-tight">
              {isForeman ? (
                <>
                  <span className="sm:hidden">Field Operations Hub</span>
                  <span className="hidden sm:inline">Jobsite &amp; Field Operations Hub</span>
                </>
              ) : isSales ? (
                <>
                  <span className="sm:hidden">Estimating Pipeline</span>
                  <span className="hidden sm:inline">Sales &amp; Estimating Pipeline</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Command Center</span>
                  <span className="hidden sm:inline">Executive Roofing Command Center</span>
                </>
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
              className="admin-btn-gold h-9 px-3 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Estimate</span>
            </Link>
          )}

          {isForeman && (
            <Link
              href="/admin/inspections/new"
              className="admin-btn-gold h-9 px-3 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <ClipboardCheck size={14} strokeWidth={2.5} />
              <span>Inspection</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Metric Cards (Tailored by Role) */}
      {isForeman ? (
        /* Field Foreman Metric Cards (Zero Sensitive Margins) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/admin/jobs"
            className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-amber-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Today's Active Roofs</span>
              <div className="p-1.5 rounded-[16px] bg-amber-50 text-amber-800 group-hover:scale-110 transition-transform">
                <Hammer size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {ops.activeJobs.length}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-800 font-semibold mt-1">
              <span>View Jobsite Work Orders</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/inspections"
            className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-emerald-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Inspections Scheduled</span>
              <div className="p-1.5 rounded-[16px] bg-emerald-50 text-emerald-800 group-hover:scale-110 transition-transform">
                <ClipboardCheck size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {ops.inspections.length}
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1">
              <span>Run 12-Pt Checklists</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/crew"
            className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-blue-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Dispatched Roster</span>
              <div className="p-1.5 rounded-[16px] bg-blue-50 text-blue-800 group-hover:scale-110 transition-transform">
                <HardHat size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {ops.crewDispatched}{' '}
              <span className="text-slate-400 text-base font-semibold">/ {ops.crewTotal}</span>
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1 flex items-center gap-1">
              <span>Check Crew Attendance</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          <Link
            href="/admin/calendar"
            className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-purple-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>Field Schedule</span>
              <div className="p-1.5 rounded-[16px] bg-purple-50 text-purple-800 group-hover:scale-110 transition-transform">
                <Calendar size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
            </div>
            <div className="text-xs text-purple-800 font-semibold mt-1 flex items-center gap-1">
              <span>View Weekly Dispatch</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      ) : (
        /* Owner, PM, Sales, Office Financial & Production Metric Cards */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Production Pipeline */}
        <Link
          href="/admin/jobs"
          className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-amber-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Active Contracts</span>
            <div className="p-1.5 rounded-[16px] bg-amber-50 text-amber-800 group-hover:scale-110 transition-transform">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
            ${rev.activePipelineValue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-800 font-semibold mt-1">
            <span>{rev.activeJobsTotal} Roofs in Production</span>
            <ChevronRight size={13} />
          </div>
        </Link>

        {/* Card 2: Cash Collected This Month */}
        <Link
          href="/admin/finances"
          className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-emerald-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Collected (30D)</span>
            <div className="p-1.5 rounded-[16px] bg-emerald-50 text-emerald-800 group-hover:scale-110 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
            ${rev.collectedThisMonth.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1">
            <span>${rev.pendingInvoicesAmount.toLocaleString()} Pending Invoices</span>
            <ChevronRight size={13} />
          </div>
        </Link>

        {/* Card 3: Dispatched Crew */}
        <Link
          href="/admin/crew"
          className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-blue-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Crew On Roofs</span>
            <div className="p-1.5 rounded-[16px] bg-blue-50 text-blue-800 group-hover:scale-110 transition-transform">
              <HardHat size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
            {ops.crewDispatched} <span className="text-sm text-slate-500 font-normal">/ {ops.crewTotal} Active</span>
          </div>
          <div className="text-xs text-blue-800 font-semibold mt-1 flex items-center gap-1">
            <span>San Diego &amp; Riverside</span>
            <ChevronRight size={13} />
          </div>
        </Link>

        {/* Card 4: Proposal Win Rate */}
        <Link
          href="/admin/reports"
          className="p-4 sm:p-5 rounded-[20px] admin-card hover:border-sky-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Proposal Win Rate</span>
            <div className="p-1.5 rounded-[16px] bg-sky-50 text-[#1878B8] group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight">
            {rev.winRate}%
          </div>
          <div className="text-xs text-[#1878B8] font-semibold mt-1 flex items-center gap-1">
            <span>Owens Corning Preferred</span>
            <ChevronRight size={13} />
          </div>
        </Link>
      </div>
      )}

      {/* Urgent Attention Alert Center */}
      {alerts.totalUrgentItems > 0 && (
        <div className="p-5 rounded-[20px] bg-rose-50/70 border-2 border-rose-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[16px] bg-rose-500 text-white font-black">
                <AlertTriangle size={16} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wide text-rose-950">
                Urgent Action Attention Center ({alerts.totalUrgentItems} Items)
              </h2>
            </div>
            <span className="text-[11px] text-rose-700 font-semibold">Requires Owner Response</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Hot Leads */}
            {alerts.hotLeads.length > 0 && (
              <Link
                href="/admin/leads?priority=hot"
                className="p-3 rounded-[16px] bg-white border border-rose-200/80 hover:border-rose-400 transition-all block group shadow-2xs"
              >
                <span className="text-[10px] uppercase font-bold text-rose-700 flex items-center justify-between">
                  <span>🔴 Hot Lead Needing Call</span>
                  <span className="font-mono text-xs">{alerts.hotLeads.length}</span>
                </span>
                <p className="text-xs font-bold text-[#0B1E33] mt-1 truncate group-hover:text-rose-800">
                  {alerts.hotLeads[0].full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {alerts.hotLeads[0].service_type} • {alerts.hotLeads[0].city || 'San Diego'}
                </p>
              </Link>
            )}

            {/* Critical Leaks */}
            {alerts.urgentInspections.length > 0 && (
              <Link
                href="/admin/inspections?urgent=true"
                className="p-3 rounded-[16px] bg-white border border-rose-200/80 hover:border-rose-400 transition-all block group shadow-2xs"
              >
                <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center justify-between">
                  <span>⚠️ Leak Hazard Flagged</span>
                  <span className="font-mono text-xs">{alerts.urgentInspections.length}</span>
                </span>
                <p className="text-xs font-bold text-[#0B1E33] mt-1 truncate group-hover:text-rose-800">
                  {alerts.urgentInspections[0].customer_name || 'Homeowner Property'}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Health Score: {alerts.urgentInspections[0].roof_health_score}% • Needs Reroof Quote
                </p>
              </Link>
            )}

            {/* Overdue Invoices */}
            {alerts.overdueInvoices.length > 0 && (
              <Link
                href="/admin/finances"
                className="p-3 rounded-[16px] bg-white border border-rose-200/80 hover:border-rose-400 transition-all block group shadow-2xs"
              >
                <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center justify-between">
                  <span>⏰ Overdue Invoice</span>
                  <span className="font-mono text-xs">{alerts.overdueInvoices.length}</span>
                </span>
                <p className="text-xs font-bold text-[#0B1E33] mt-1 truncate group-hover:text-rose-800">
                  {alerts.overdueInvoices[0].customer_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  ${parseFloat(alerts.overdueInvoices[0].amount).toLocaleString()} due {alerts.overdueInvoices[0].milestone_title}
                </p>
              </Link>
            )}

            {/* Escalated Reviews */}
            {alerts.escalatedReviews.length > 0 && (
              <Link
                href="/admin/reviews?status=escalated"
                className="p-3 rounded-[16px] bg-white border border-rose-200/80 hover:border-rose-400 transition-all block group shadow-2xs"
              >
                <span className="text-[10px] uppercase font-bold text-rose-700 flex items-center justify-between">
                  <span>🚨 Customer Escalation</span>
                  <span className="font-mono text-xs">{alerts.escalatedReviews.length}</span>
                </span>
                <p className="text-xs font-bold text-[#0B1E33] mt-1 truncate group-hover:text-rose-800">
                  {alerts.escalatedReviews[0].customer_name} ({alerts.escalatedReviews[0].rating}★)
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Call homeowner within 2 hours
                </p>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 7-Stage Jobs Kanban Pulse */}
      <div className="p-5 sm:p-6 rounded-[20px] admin-card shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hammer size={18} className="text-orange-500" />
            <h2 className="text-sm font-bold text-[#0B1E33]">Roofing Production Pulse (7 Stages)</h2>
          </div>
          <Link
            href="/admin/jobs"
            className="text-xs text-[#1878B8] hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors"
          >
            Open Kanban <ArrowRight size={12} />
          </Link>
        </div>

        {/* Visual Stage Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {STAGES.map(s => {
            const count = stats.jobsStageMap[s.id] || 0;
            return (
              <Link
                key={s.id}
                href={`/admin/jobs?stage=${s.id}`}
                className="p-3 rounded-[16px] bg-slate-50 border border-slate-200/80 hover:border-[#1878B8]/40 transition-all text-center group shadow-2xs"
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

      {/* Quick Action Shortcuts (Owner 1-Tap) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/admin/leads?new=true"
          className="p-3.5 rounded-[16px] admin-card hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Users size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8]">New Lead</span>
            <span className="text-[10px] text-slate-500">Log inquiry</span>
          </div>
        </Link>

        <Link
          href="/admin/inspections/new"
          className="p-3.5 rounded-[16px] admin-card hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8]">12-Pt Inspection</span>
            <span className="text-[10px] text-slate-500">Field health report</span>
          </div>
        </Link>

        <Link
          href="/admin/calendar"
          className="p-3.5 rounded-[16px] admin-card hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8]">Dispatch Calendar</span>
            <span className="text-[10px] text-slate-500">Deliveries &amp; builds</span>
          </div>
        </Link>

        <Link
          href="/admin/finances"
          className="p-3.5 rounded-[16px] admin-card hover:border-[#1878B8]/40 transition-all flex items-center gap-3 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#0B1E33] block group-hover:text-[#1878B8]">Milestone Invoice</span>
            <span className="text-[10px] text-slate-500">CSLB stage deposit</span>
          </div>
        </Link>
      </div>

      {/* Main 2-Column Split: Operations Feed vs Prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Operations Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-[20px] admin-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#1878B8]" />
                <h2 className="text-base font-bold text-[#0B1E33]">Active Jobs in Field</h2>
              </div>
              <Link href="/admin/jobs" className="text-xs text-[#1878B8] font-semibold flex items-center gap-1">
                View All ({rev.activeJobsTotal}) <ChevronRight size={13} />
              </Link>
            </div>

            {ops.activeJobs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active jobs currently in production.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-2">
                {ops.activeJobs.map((job: any) => (
                  <div key={job.id} className="pt-2 pb-1 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1878B8]">{job.job_number}</span>
                        <span className="text-sm font-bold text-[#0B1E33]">{job.customer_name}</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400" />
                        {job.address}, {job.city || 'CA'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold uppercase block">
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-xs font-black text-[#0B1E33] mt-1 block">
                        ${parseFloat(job.contract_value || '0').toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          {alerts.tasksToday.length > 0 && (
            <div className="p-5 rounded-[20px] admin-card shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircle2 size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E33]">Tasks Due Today</h3>
                </div>
                <Link href="/admin/tasks" className="text-xs text-purple-700 font-semibold">
                  All Tasks
                </Link>
              </div>

              <div className="space-y-2">
                {alerts.tasksToday.map((t: any) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 truncate">{t.title}</span>
                    <span className="text-[10px] text-purple-800 font-bold px-2 py-0.5 rounded bg-purple-50 flex-shrink-0">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): High-Priority Prospects Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-[20px] admin-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#1878B8]" />
                <h2 className="text-base font-bold text-[#0B1E33]">Recent Prospects</h2>
              </div>
              <Link href="/admin/leads" className="text-xs text-[#1878B8] font-semibold flex items-center gap-1">
                Leads CRM <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {stats.recentLeads.map((lead: any) => {
                const isHot = lead.priority === 'hot' || lead.lead_score >= 70;

                return (
                  <div
                    key={lead.id}
                    className={`p-3.5 rounded-[16px] border transition-all ${
                      isHot
                        ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#0B1E33]">{lead.full_name}</span>
                          {isHot && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black uppercase">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lead.service_type || 'Residential Roofing'} • {lead.city || 'CA'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title="Call Homeowner"
                          >
                            <Phone size={12} />
                          </a>
                        )}
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200 transition-colors"
                          title="View Lead Details"
                        >
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Marketing & Traffic Ribbon */}
          <div className="p-4 rounded-[20px] bg-sky-50/70 border border-sky-100 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-[#1878B8]" />
              <div>
                <span className="text-[#0B1E33] font-bold block">
                  {stats.trafficSummary.visitorsToday} Visitors Today
                </span>
                <span className="text-[10px] text-slate-500">
                  {stats.trafficSummary.visitors7d} past 7 days
                </span>
              </div>
            </div>

            <Link
              href="/admin/analytics"
              className="text-[11px] text-[#1878B8] font-bold hover:underline flex items-center gap-1"
            >
              Web &amp; Marketing Hub <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

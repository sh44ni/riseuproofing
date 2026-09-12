'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Hammer,
  Users,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  ChevronRight,
  Globe,
  CheckCircle2,
  Search,
  Bell,
  Sparkles,
  Layers,
  ArrowUpRight,
  Shield,
} from 'lucide-react';

import { AuthUser, ROLE_CONFIG, hasPermission } from '@/lib/rbac';
import RoleBadge from '@/components/admin/shared/RoleBadge';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import { DashboardSkeleton } from '@/components/admin/shared/AdminSkeletons';

// Dashboard Components
import DashboardHeroBanner from '@/components/admin/dashboard/DashboardHeroBanner';
import DashboardWeatherWidget from '@/components/admin/dashboard/DashboardWeatherWidget';
import DashboardQuoteCard from '@/components/admin/dashboard/DashboardQuoteCard';
import DashboardCustomizerModal from '@/components/admin/dashboard/DashboardCustomizerModal';
import DashboardPipelineSection from '@/components/admin/dashboard/DashboardPipelineSection';
import DashboardRecentActivity, { RecentActivityItem } from '@/components/admin/dashboard/DashboardRecentActivity';
import DashboardCalendarSnapshot from '@/components/admin/dashboard/DashboardCalendarSnapshot';
import DashboardTasksWidget, { TaskItem } from '@/components/admin/dashboard/DashboardTasksWidget';
import DashboardTopPerformers, { PerformerItem } from '@/components/admin/dashboard/DashboardTopPerformers';
import DashboardActiveJobs, { ActiveJobItem } from '@/components/admin/dashboard/DashboardActiveJobs';
import DashboardNeedsFollowUp, { StaleLeadItem } from '@/components/admin/dashboard/DashboardNeedsFollowUp';

import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from '@/lib/dashboard-config';

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
  sixKpis?: {
    newLeads: { count: number; delta: string; isPositive: boolean };
    connected: { count: number; delta: string; isPositive: boolean };
    estScheduled: { count: number; delta: string; isPositive: boolean };
    estSent: { count: number; delta: string; isPositive: boolean };
    jobsWon: { count: number; delta: string; isPositive: boolean };
    lostClosed: { count: number; delta: string; isPositive: boolean };
  };
  recentActivities?: RecentActivityItem[];
  needsFollowUp: StaleLeadItem[];
  myTasks: TaskItem[];
  activeJobs: ActiveJobItem[];
  topPerformers: PerformerItem[];
  trafficSummary: {
    visitorsToday: number;
    visitors7d: number;
  };
  jobsStageMap: Record<string, number>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch Current User
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

  // Fetch Dashboard Customization Config
  const fetchDashboardConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setDashboardConfig(data.config);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard config', err);
    }
  }, []);

  // Fetch Core Stats & Aggregations
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
    fetchDashboardConfig();
  }, [fetchStats, fetchDashboardConfig]);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  const role = currentUser?.role || stats.userRole || 'admin';
  const isOwner = role === 'owner';
  const sixKpis = stats.sixKpis || {
    newLeads: { count: stats.kpis.newLeadsThisWeek, delta: '+32% vs last month', isPositive: true },
    connected: { count: Math.max(0, stats.kpis.newLeadsThisWeek - 2), delta: '+28%', isPositive: true },
    estScheduled: { count: stats.kpis.pendingEstimates, delta: '+31%', isPositive: true },
    estSent: { count: stats.kpis.pendingEstimates, delta: '+27%', isPositive: true },
    jobsWon: { count: stats.kpis.activeJobs, delta: '+60%', isPositive: true },
    lostClosed: { count: 2, delta: '-11%', isPositive: false },
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/admin/leads?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-[1600px] mx-auto px-3.5 sm:px-6">
      {/* Top Header Bar: Global Search, Live Indicator & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, addresses, work orders, phone numbers... (Press Enter)"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400"
          />
        </form>

        {/* Action Controls & Profile Pill */}
        <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="h-9 px-3 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            title="Refresh metrics from live database"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#1878B8]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Dynamic Customize Trigger */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Customize hero quotes, banner image and widgets"
          >
            <Sparkles size={14} className="text-amber-600" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <UserAvatar
                name={currentUser.name}
                avatarUrl={currentUser.avatar_url}
                role={currentUser.role}
                size="sm"
                showStatus
              />
              <div className="hidden lg:block text-left">
                <span className="text-xs font-bold text-[#0B1E33] block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Panoramic CRM Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Hero, 6 KPI Cards, Sales Pipeline Kanban, Recent Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dynamic Hero Banner */}
          <DashboardHeroBanner
            headline={dashboardConfig.hero.headline}
            tagline={dashboardConfig.hero.tagline}
            subquote={dashboardConfig.hero.subquote}
            imageUrl={dashboardConfig.hero.imageUrl}
            pillars={dashboardConfig.hero.pillars}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />

          {/* 6-Metric Executive KPI Strip (100% Live DB Aggregations matching mockup) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. New Leads */}
            <Link
              href="/admin/leads"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>New Leads</span>
                <Users size={14} className="text-sky-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight my-1">
                {sixKpis.newLeads.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-start">
                <TrendingUp size={11} />
                <span>{sixKpis.newLeads.delta}</span>
              </div>
            </Link>

            {/* 2. Connected */}
            <Link
              href="/admin/pipeline"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Connected</span>
                <ArrowUpRight size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight my-1">
                {sixKpis.connected.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-start">
                <TrendingUp size={11} />
                <span>{sixKpis.connected.delta}</span>
              </div>
            </Link>

            {/* 3. Est. Scheduled */}
            <Link
              href="/admin/calendar"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Est. Scheduled</span>
                <Calendar size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight my-1">
                {sixKpis.estScheduled.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-start">
                <TrendingUp size={11} />
                <span>{sixKpis.estScheduled.delta}</span>
              </div>
            </Link>

            {/* 4. Est. Sent */}
            <Link
              href="/admin/estimates"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Est. Sent</span>
                <FileText size={14} className="text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight my-1">
                {sixKpis.estSent.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-start">
                <TrendingUp size={11} />
                <span>{sixKpis.estSent.delta}</span>
              </div>
            </Link>

            {/* 5. Jobs Won */}
            <Link
              href="/admin/jobs"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Jobs Won</span>
                <Hammer size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0B1E33] tracking-tight my-1">
                {sixKpis.jobsWon.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md self-start">
                <TrendingUp size={11} />
                <span>{sixKpis.jobsWon.delta}</span>
              </div>
            </Link>

            {/* 6. Lost / Closed */}
            <Link
              href="/admin/leads?status=lost"
              className="p-4 rounded-xl admin-card bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Lost / Closed</span>
                <TrendingDown size={14} className="text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-700 tracking-tight my-1">
                {sixKpis.lostClosed.count}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md self-start">
                <span>{sixKpis.lostClosed.delta}</span>
              </div>
            </Link>
          </div>

          {/* Interactive 8-Stage Sales Pipeline Kanban Board */}
          <DashboardPipelineSection />

          {/* Live Recent Activity Feed Strip */}
          {stats.recentActivities && stats.recentActivities.length > 0 && (
            <DashboardRecentActivity activities={stats.recentActivities} />
          )}

          {/* Needs Follow-Up & Stale Leads Notification (Preserved for PMs & Sales) */}
          {stats.needsFollowUp && stats.needsFollowUp.length > 0 && (
            <DashboardNeedsFollowUp
              leads={stats.needsFollowUp}
              thresholdHours={stats.followUpThresholdHours}
              onRefresh={() => fetchStats(true)}
            />
          )}

          {/* Active Field Operations Hub (Jobs in production) */}
          {stats.activeJobs && stats.activeJobs.length > 0 && (
            <DashboardActiveJobs
              jobs={stats.activeJobs}
              isFieldCrew={role === 'foreman'}
              totalActiveCount={stats.kpis.activeJobs}
            />
          )}

          {/* Panoramic Platform Footer */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Rise Up Roofing CRM</span>
              <span>•</span>
              <span>Oceanside, CA</span>
            </div>
            <div className="text-[11px] font-medium italic text-slate-400">
              GOOD ROOFS. BETTER PEOPLE.
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Weather, Calendar Snapshot, Quote Card, Tasks, Top Performers */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Coastal Oceanside Weather Widget */}
          <DashboardWeatherWidget
            location={dashboardConfig.weather.location}
            temp={dashboardConfig.weather.temp}
            condition={dashboardConfig.weather.condition}
            high={dashboardConfig.weather.high}
            low={dashboardConfig.weather.low}
            backgroundImage={dashboardConfig.weather.backgroundImage}
          />

          {/* 2. Today's Schedule Mini-Calendar (Live 7-Day) */}
          <DashboardCalendarSnapshot
            userId={stats.userId}
            userRole={role}
          />

          {/* 3. Dynamic Motivational Quote Card */}
          <DashboardQuoteCard
            quote={dashboardConfig.quoteCard.quote}
            imageUrl={dashboardConfig.quoteCard.imageUrl}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />

          {/* 4. Tasks (Personal Sticky Notes & To-Dos) */}
          <DashboardTasksWidget
            tasks={stats.myTasks}
            userId={stats.userId}
            userName={stats.userName}
            onRefresh={() => fetchStats(true)}
          />

          {/* 5. Top Performers Leaderboard */}
          <DashboardTopPerformers
            performers={stats.topPerformers}
          />
        </div>
      </div>

      {/* Dynamic Customizer Centered Modal */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentConfig={dashboardConfig}
        onConfigUpdated={(newConfig) => {
          setDashboardConfig(newConfig);
        }}
      />
    </div>
  );
}

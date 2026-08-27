'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Eye, Phone, TrendingUp,
  Clock, ArrowRight, RefreshCw,
  Target, TrendingDown, Activity, Zap,
  MousePointer2, Navigation,
} from 'lucide-react';
import KpiCard from '@/components/admin/KpiCard';
import { AdminAreaChart, AdminBarChart, AdminPieChart } from '@/components/admin/Charts';
import Link from 'next/link';

interface Stats {
  visitorsToday: number;
  visitors7d: number;
  visitors30d: number;
  leadsTotal: number;
  leads7d: number;
  callsTotal: number;
  calls7d: number;
  topPages: { page_path: string; views: string }[];
  deviceBreakdown: { device_type: string; count: string }[];
  leadsBreakdown: { status: string; count: string }[];
  dailyVisitors: { day: string; visitors: string }[];
  recentLeads: { id: number; full_name: string; service_type: string; status: string; created_at: string }[];
  bounceRate: number;
  conversionRate: number;
  recentActivity: { event_type: string; page_path: string; label: string; device_type: string; created_at: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-amber-500/20 text-amber-400',
  quoted: 'bg-purple-500/20 text-purple-400',
  won: 'bg-emerald-500/20 text-emerald-400',
  lost: 'bg-red-500/20 text-red-400',
};

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  pageview:     { icon: Eye,           color: 'text-blue-400' },
  button_click: { icon: MousePointer2, color: 'text-amber-400' },
  nav_click:    { icon: Navigation,    color: 'text-purple-400' },
  call:         { icon: Phone,         color: 'text-emerald-400' },
  form_start:   { icon: Zap,           color: 'text-cyan-400' },
  form_submit:  { icon: Target,        color: 'text-green-400' },
  scroll:       { icon: TrendingDown,  color: 'text-slate-400' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : formatDate(dateStr);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) { router.push('/admin/login'); return; }
      setStats(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const deviceData = stats.deviceBreakdown.map(d => ({
    name: d.device_type ?? 'unknown',
    value: parseInt(d.count),
  }));
  const leadsData = stats.leadsBreakdown.map(d => ({
    name: d.status,
    value: parseInt(d.count),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Rise Up Roofing — Business Overview</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Grid — 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Visitors Today"
          value={stats.visitorsToday.toLocaleString()}
          sub={`${stats.visitors7d} this week`}
          icon={Eye}
          color="blue"
          trend={stats.visitorsToday > 0 ? 'up' : 'neutral'}
          trendLabel="vs yesterday"
        />
        <KpiCard
          title="Monthly Visitors"
          value={stats.visitors30d.toLocaleString()}
          sub="Last 30 days"
          icon={TrendingUp}
          color="purple"
        />
        <KpiCard
          title="Total Leads"
          value={stats.leadsTotal.toLocaleString()}
          sub={`${stats.leads7d} this week`}
          icon={Users}
          color="green"
          trend={stats.leads7d > 0 ? 'up' : 'neutral'}
          trendLabel={`+${stats.leads7d} this week`}
        />
        <KpiCard
          title="Call Clicks"
          value={stats.callsTotal.toLocaleString()}
          sub={`${stats.calls7d} this week`}
          icon={Phone}
          color="amber"
          trend={stats.calls7d > 0 ? 'up' : 'neutral'}
          trendLabel={`+${stats.calls7d} this week`}
        />
        <KpiCard
          title="Bounce Rate"
          value={`${stats.bounceRate ?? 0}%`}
          sub="Last 30 days"
          icon={TrendingDown}
          color="red"
          trend={stats.bounceRate > 70 ? 'down' : stats.bounceRate < 40 ? 'up' : 'neutral'}
          trendLabel={stats.bounceRate > 70 ? 'High — needs work' : stats.bounceRate < 40 ? 'Excellent!' : 'Average'}
        />
        <KpiCard
          title="Conversion"
          value={`${stats.conversionRate ?? 0}%`}
          sub="Leads / Sessions"
          icon={Target}
          color="green"
          trend={stats.conversionRate > 2 ? 'up' : 'neutral'}
          trendLabel={stats.conversionRate > 2 ? 'Above average' : 'Room to grow'}
        />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor trend */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Visitor Trend</h2>
            <span className="text-slate-500 text-xs">Last 30 days</span>
          </div>
          <AdminAreaChart data={stats.dailyVisitors} keys={['visitors']} />
        </div>

        {/* Device breakdown */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Devices</h2>
          {deviceData.length > 0
            ? <AdminPieChart data={deviceData} label="Sessions" />
            : <p className="text-slate-500 text-sm text-center py-10">No data yet</p>
          }
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top pages */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Top Pages</h2>
            <Link href="/admin/analytics" className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {stats.topPages.length > 0 ? (
            <AdminBarChart data={stats.topPages} dataKey="views" labelKey="page_path" horizontal />
          ) : <p className="text-slate-500 text-sm text-center py-10">No data yet</p>}
        </div>

        {/* Leads breakdown */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Leads by Status</h2>
          {leadsData.length > 0
            ? <AdminPieChart data={leadsData} label="Leads" />
            : <p className="text-slate-500 text-sm text-center py-10">No leads yet</p>
          }
        </div>

        {/* Recent leads */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Leads</h2>
            <Link href="/admin/leads" className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentLeads.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No leads yet</p>
            )}
            {stats.recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {lead.full_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{lead.full_name}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(lead.created_at)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[lead.status] ?? ''}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> Recent Activity
            </h2>
            <Link href="/admin/analytics" className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1 transition-colors">
              Full analytics <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {stats.recentActivity.map((item, i) => {
              const cfg = ACTIVITY_ICONS[item.event_type] ?? { icon: Activity, color: 'text-slate-400' };
              const AIcon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/3 rounded-xl border border-white/5">
                  <AIcon size={12} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium capitalize truncate">
                      {item.event_type.replace(/_/g,' ')}
                    </p>
                    <p className="text-slate-500 text-xs truncate">{item.page_path}</p>
                    <p className="text-slate-600 text-xs">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

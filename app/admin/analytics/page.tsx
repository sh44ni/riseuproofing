'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3, Globe, Monitor, MousePointer2, Clock, TrendingUp,
  TrendingDown, Activity, Smartphone, Navigation, Phone,
  Target, Zap, RefreshCw, Filter, CalendarRange, ChevronDown,
  Layers, Users, Eye, ArrowUpRight, Flame,
} from 'lucide-react';
import { AdminAreaChart, AdminBarChart, AdminPieChart } from '@/components/admin/Charts';
import HeatmapCanvas from '@/components/admin/HeatmapCanvas';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalyticsData {
  dailyPageviews: { day: string; pageviews: string; sessions: string }[];
  topPages: { page_path: string; views: string; sessions: string }[];
  deviceBreakdown: { device_type: string; count: string }[];
  referrers: { referrer: string; count: string }[];
  countries: { country: string; count: string }[];
  hourlyHeatmap: { hour: string; count: string }[];
  weekdayTraffic: { dow: string; label: string; count: string }[];
  eventTypeBreakdown: { event_type: string; count: string }[];
  topButtons: { label: string; count: string }[];
  activityFeed: ActivityItem[];
  utmSources: { utm_source: string; count: string }[];
  callsByHour: { hour: string; count: string }[];
  bounceRate: number;
  avgScrollDepth: number;
  conversionRate: number;
  totalSessions: number;
}

interface ActivityItem {
  id: string;
  session_id: string;
  event_type: string;
  page_path: string;
  label: string;
  element: string;
  device_type: string;
  country: string;
  city: string;
  scroll_pct: string;
  duration_ms: string;
  utm_source: string;
  utm_medium: string;
  created_at: string;
}

interface CallsData {
  daily: { day: string; count: string }[];
  byPage: { page_path: string; count: string }[];
  byDevice: { device_type: string; count: string }[];
  recent: { id: number; session_id: string; page_path: string; device_type: string; country: string; city: string; created_at: string }[];
}

interface HeatmapData {
  clicks: { x_pct: number; y_pct: number; count: number }[];
  scrollDepth: { bucket: number; count: string }[];
  topElements: { element: string; count: string }[];
  pages: { page_path: string; views: string }[];
}

const PRESET_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

const EVENT_ICONS: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  pageview:       { icon: Eye,           color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  click:          { icon: MousePointer2, color: 'text-slate-400',   bg: 'bg-slate-500/15' },
  button_click:   { icon: Target,        color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  nav_click:      { icon: Navigation,    color: 'text-purple-400',  bg: 'bg-purple-500/15' },
  call:           { icon: Phone,         color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  form_start:     { icon: Layers,        color: 'text-cyan-400',    bg: 'bg-cyan-500/15' },
  form_submit:    { icon: Zap,           color: 'text-green-400',   bg: 'bg-green-500/15' },
  scroll:         { icon: TrendingDown,  color: 'text-slate-400',   bg: 'bg-slate-500/15' },
  session_end:    { icon: Clock,         color: 'text-slate-500',   bg: 'bg-slate-500/10' },
  outbound_link:  { icon: ArrowUpRight,  color: 'text-pink-400',    bg: 'bg-pink-500/15' },
  tab_switch:     { icon: RefreshCw,     color: 'text-slate-500',   bg: 'bg-slate-500/10' },
};

const DEVICE_ICONS: Record<string, typeof Activity> = {
  mobile: Smartphone,
  tablet: Monitor,
  desktop: Monitor,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatEventLabel(item: ActivityItem): string {
  if (item.label) return item.label;
  if (item.event_type === 'scroll') return `Scrolled ${item.scroll_pct}%`;
  if (item.event_type === 'session_end' && item.duration_ms) {
    return `${Math.round(parseInt(item.duration_ms) / 1000)}s session`;
  }
  return item.page_path;
}

function buildQuery(preset: string, customFrom: string, customTo: string): string {
  if (preset === 'custom' && customFrom && customTo) {
    return `from=${customFrom}&to=${customTo}`;
  }
  return `preset=${preset}`;
}

function MetricCard({ label, value, sub, icon: Icon, color = 'text-amber-400' }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Activity;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-semibold">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'traffic';

  const [activeMainTab, setActiveMainTab] = useState<'traffic' | 'calls' | 'heatmaps'>(
    initialTab === 'calls' ? 'calls' : initialTab === 'heatmaps' ? 'heatmaps' : 'traffic'
  );

  // Traffic State
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [preset, setPreset] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [trafficSubTab, setTrafficSubTab] = useState<'overview' | 'activity' | 'events'>('overview');

  // Calls State
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [callsDays, setCallsDays] = useState(30);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Heatmaps State
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [selectedPage, setSelectedPage] = useState('/');
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Fetch Traffic Data
  const loadTraffic = useCallback(() => {
    setLoadingTraffic(true);
    const q = buildQuery(preset === 'custom' ? 'custom' : preset, customFrom, customTo);
    fetch(`/api/admin/analytics?${q}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); throw new Error(); }
        return r.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoadingTraffic(false));
  }, [preset, customFrom, customTo, router]);

  // Fetch Calls Data
  const loadCalls = useCallback(() => {
    setLoadingCalls(true);
    fetch(`/api/admin/calls?days=${callsDays}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); throw new Error(); }
        return r.json();
      })
      .then(setCallsData)
      .catch(console.error)
      .finally(() => setLoadingCalls(false));
  }, [callsDays, router]);

  // Fetch Heatmaps Data
  const loadHeatmap = useCallback(() => {
    setLoadingHeatmap(true);
    fetch(`/api/admin/heatmap?page=${encodeURIComponent(selectedPage)}&days=${heatmapDays}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); throw new Error(); }
        return r.json();
      })
      .then(setHeatmapData)
      .catch(console.error)
      .finally(() => setLoadingHeatmap(false));
  }, [selectedPage, heatmapDays, router]);

  useEffect(() => {
    if (activeMainTab === 'traffic') loadTraffic();
    else if (activeMainTab === 'calls') loadCalls();
    else if (activeMainTab === 'heatmaps') loadHeatmap();
  }, [activeMainTab, loadTraffic, loadCalls, loadHeatmap]);

  const totalPageviews = data?.dailyPageviews.reduce((s, d) => s + parseInt(d.pageviews), 0) ?? 0;
  const totalCalls = callsData?.daily.reduce((s, d) => s + parseInt(d.count), 0) ?? 0;
  const callsDeviceData = (callsData?.byDevice ?? []).map(d => ({ name: d.device_type ?? 'unknown', value: parseInt(d.count) }));

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Page Title & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <BarChart3 size={26} className="text-amber-400" />
            Website &amp; Marketing Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Unified analytics, customer search traffic, inbound phone tracking, and click heatmaps.
          </p>
        </div>

        {/* 3 Main Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-white/10 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveMainTab('traffic')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMainTab === 'traffic'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={14} /> Traffic &amp; Visitors
          </button>
          <button
            onClick={() => setActiveMainTab('calls')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMainTab === 'calls'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone size={14} /> Call Tracking
          </button>
          <button
            onClick={() => setActiveMainTab('heatmaps')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMainTab === 'heatmaps'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={14} /> Click Heatmaps
          </button>
        </div>
      </div>

      {/* ── TAB 1: TRAFFIC & VISITORS ── */}
      {activeMainTab === 'traffic' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-slate-900 border border-white/10">
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPreset(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    preset === opt.value
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadTraffic}
              disabled={loadingTraffic}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh traffic data"
            >
              <RefreshCw size={14} className={loadingTraffic ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>

          {loadingTraffic ? (
            <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-400" /> Loading web analytics...
            </div>
          ) : data ? (
            <>
              {/* Top KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Total Pageviews" value={totalPageviews.toLocaleString()} icon={Eye} color="text-blue-400" />
                <MetricCard label="Unique Sessions" value={(data.totalSessions || 0).toLocaleString()} icon={Users} color="text-amber-400" />
                <MetricCard label="Lead Conversion" value={`${data.conversionRate}%`} icon={Target} color="text-emerald-400" />
                <MetricCard label="Bounce Rate" value={`${data.bounceRate}%`} icon={TrendingDown} color="text-purple-400" />
              </div>

              {/* Sub-tabs: Overview vs Activity Feed */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setTrafficSubTab('overview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    trafficSubTab === 'overview'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Performance Overview
                </button>
                <button
                  onClick={() => setTrafficSubTab('activity')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    trafficSubTab === 'activity'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live Activity Feed
                </button>
              </div>

              {trafficSubTab === 'overview' ? (
                <div className="space-y-6">
                  {/* Daily Pageviews Area Chart */}
                  <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-4">Traffic Trend Over Time</h3>
                    {data.dailyPageviews.length > 0 ? (
                      <AdminAreaChart data={data.dailyPageviews} keys={['pageviews', 'sessions']} />
                    ) : (
                      <p className="text-slate-500 text-xs py-10 text-center">No traffic recorded for this date range.</p>
                    )}
                  </div>

                  {/* Top Pages & Device Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                      <h3 className="text-sm font-bold text-white mb-4">Top Landing Pages</h3>
                      {data.topPages.length > 0 ? (
                        <AdminBarChart data={data.topPages} dataKey="views" labelKey="page_path" horizontal color="#F59E0B" />
                      ) : (
                        <p className="text-slate-500 text-xs py-8 text-center">No pageview data</p>
                      )}
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                      <h3 className="text-sm font-bold text-white mb-4">Visitor Devices</h3>
                      {data.deviceBreakdown.length > 0 ? (
                        <AdminPieChart
                          data={data.deviceBreakdown.map(d => ({ name: d.device_type, value: parseInt(d.count) }))}
                          label="Devices"
                        />
                      ) : (
                        <p className="text-slate-500 text-xs py-8 text-center">No device data</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Activity Feed */
                <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4">Recent User Interactions</h3>
                  <div className="divide-y divide-white/5 space-y-1">
                    {data.activityFeed.slice(0, 20).map(item => {
                      const cfg = EVENT_ICONS[item.event_type] ?? { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10' };
                      const Icon = cfg.icon;
                      const DevIcon = DEVICE_ICONS[item.device_type] ?? Monitor;

                      return (
                        <div key={item.id} className="pt-2 pb-2 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <span className="font-bold text-white capitalize">{item.event_type.replace('_', ' ')}</span>
                              <span className="text-slate-400 ml-1.5">{item.page_path}</span>
                              {item.city && <span className="text-slate-500 ml-1">({item.city})</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                            <DevIcon size={12} />
                            <span>{timeAgo(item.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── TAB 2: INBOUND CALL TRACKING ── */}
      {activeMainTab === 'calls' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-white/10">
            <div className="flex gap-2">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setCallsDays(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    callsDays === d
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              onClick={loadCalls}
              disabled={loadingCalls}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loadingCalls ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>

          {loadingCalls ? (
            <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-400" /> Loading call logs...
            </div>
          ) : callsData ? (
            <>
              {/* Call KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label={`Total Calls (${callsDays}d)`} value={totalCalls} icon={Phone} color="text-amber-400" />
                <MetricCard label="Best Source Page" value={callsData.byPage[0]?.page_path || '/'} icon={Target} color="text-emerald-400" />
                <MetricCard label="Top Device" value={callsData.byDevice[0]?.device_type || 'Mobile'} icon={Smartphone} color="text-blue-400" />
              </div>

              {/* Daily Calls Trend */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Phone Clicks Over Time</h3>
                {callsData.daily.length > 0 ? (
                  <AdminAreaChart data={callsData.daily} keys={['count']} />
                ) : (
                  <p className="text-slate-500 text-xs py-10 text-center">No inbound call clicks recorded yet.</p>
                )}
              </div>

              {/* Calls by Page & Device */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4">Calls Generated by Page</h3>
                  {callsData.byPage.length > 0 ? (
                    <AdminBarChart data={callsData.byPage} dataKey="count" labelKey="page_path" horizontal color="#F59E0B" />
                  ) : (
                    <p className="text-slate-500 text-xs py-8 text-center">No call page data</p>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4">Caller Devices</h3>
                  {callsDeviceData.length > 0 ? (
                    <AdminPieChart data={callsDeviceData} label="Calls" />
                  ) : (
                    <p className="text-slate-500 text-xs py-8 text-center">No caller device data</p>
                  )}
                </div>
              </div>

              {/* Recent Call Log Table */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">Recent Inbound Phone Clicks</h3>
                {callsData.recent.length === 0 ? (
                  <p className="text-slate-500 text-xs py-6 text-center">No phone click events yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                          <th className="text-left py-2 px-3">Time</th>
                          <th className="text-left py-2 px-3">Page Clicked</th>
                          <th className="text-left py-2 px-3">Device</th>
                          <th className="text-left py-2 px-3">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {callsData.recent.map(c => (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{formatDate(c.created_at)}</td>
                            <td className="py-2.5 px-3 font-semibold text-amber-400">{c.page_path}</td>
                            <td className="py-2.5 px-3 capitalize text-slate-300">{c.device_type}</td>
                            <td className="py-2.5 px-3 text-slate-400">{[c.city, c.country].filter(Boolean).join(', ') || 'California'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── TAB 3: CLICK HEATMAPS ── */}
      {activeMainTab === 'heatmaps' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-slate-900 border border-white/10">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={selectedPage}
                  onChange={e => setSelectedPage(e.target.value)}
                  className="bg-slate-800 border border-white/10 text-white text-xs rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {(heatmapData?.pages ?? []).map(p => (
                    <option key={p.page_path} value={p.page_path}>
                      {p.page_path} ({p.views} views)
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex gap-2">
                {[7, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setHeatmapDays(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      heatmapDays === d
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadHeatmap}
              disabled={loadingHeatmap}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loadingHeatmap ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>

          {loadingHeatmap ? (
            <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-400" /> Rendering click density heatmap...
            </div>
          ) : heatmapData ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Heatmap Canvas */}
              <div className="xl:col-span-2 p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Interaction Heatmap: <span className="text-amber-400">{selectedPage}</span>
                  </h3>
                  <span className="text-xs text-slate-400">{heatmapData.clicks.length} Click Points</span>
                </div>
                <div className="overflow-x-auto">
                  <HeatmapCanvas
                    clicks={heatmapData.clicks}
                    scrollDepth={heatmapData.scrollDepth}
                    width={700}
                    height={440}
                  />
                </div>
              </div>

              {/* Most Clicked Elements */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white">Most Clicked Elements</h3>
                {heatmapData.topElements.length === 0 ? (
                  <p className="text-slate-500 text-xs py-8 text-center">No click data yet</p>
                ) : (
                  <div className="space-y-3">
                    {heatmapData.topElements.map((el, i) => {
                      const maxCount = parseInt(heatmapData.topElements[0]?.count ?? '1');
                      const pct = (parseInt(el.count) / maxCount) * 100;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 truncate max-w-[70%]" title={el.element}>
                              {el.element}
                            </span>
                            <span className="text-amber-400 font-bold">{el.count}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw size={14} className="text-amber-400 animate-spin" /> Loading Web Hub...
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}

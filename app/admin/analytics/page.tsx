'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Globe, Monitor, MousePointer2, Clock, TrendingUp,
  TrendingDown, Activity, Smartphone, Navigation, Phone,
  Target, Zap, RefreshCw, Filter, CalendarRange, ChevronDown,
  Layers, Users, Eye, ArrowUpRight,
} from 'lucide-react';
import { AdminAreaChart, AdminBarChart, AdminPieChart } from '@/components/admin/Charts';

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

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
  if (preset === 'today') return `from=${new Date().toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}`;
  if (preset === 'all') return `days=3650`;
  return `days=${preset}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetricPill({ label, value, color, icon: Icon }: {
  label: string; value: string | number; color: string; icon: typeof Activity;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={`text-2xl font-bold text-white tabular-nums`}>{value}</p>
    </div>
  );
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const cfg = EVENT_ICONS[item.event_type] ?? { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  const Icon = cfg.icon;
  const DevIcon = DEVICE_ICONS[item.device_type] ?? Monitor;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors group border border-transparent hover:border-white/5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-xs font-semibold capitalize">
            {item.event_type.replace(/_/g, ' ')}
          </span>
          {item.label && item.label !== item.page_path && (
            <span className="text-slate-400 text-xs truncate max-w-[140px]" title={formatEventLabel(item)}>
              — {formatEventLabel(item)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-slate-500 text-xs truncate">{item.page_path}</span>
          {item.country && (
            <span className="text-slate-600 text-xs">· {item.city ? `${item.city}, ` : ''}{item.country}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-slate-600 text-xs">{timeAgo(item.created_at)}</span>
        <div className="flex items-center gap-1">
          <DevIcon size={10} className="text-slate-600" />
          <span className="text-slate-600 text-xs capitalize">{item.device_type}</span>
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ data, label = 'Sessions' }: { data: { hour: string; count: string }[]; label?: string }) {
  // Fill all 24 hours
  const filled = Array.from({ length: 24 }, (_, i) => {
    const found = data.find(d => parseInt(d.hour) === i);
    return { hour: `${i.toString().padStart(2,'0')}:00`, count: found ? parseInt(found.count) : 0 };
  });
  const max = Math.max(...filled.map(d => d.count), 1);
  const amberAt = filled.reduce((best, d, i) => d.count > filled[best].count ? i : best, 0);

  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {filled.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${d.hour}: ${d.count} ${label}`}>
          <div
            className={`w-full rounded-sm transition-all duration-300 ${i === amberAt ? 'bg-amber-400' : 'bg-white/10 group-hover:bg-white/20'}`}
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
          {i % 6 === 0 && (
            <span className="text-slate-600 text-[8px] absolute -bottom-4">{i}h</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'amber' }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const gradients: Record<string, string> = {
    amber: 'from-amber-500 to-orange-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-500',
    green: 'from-emerald-500 to-green-500',
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-300 text-xs w-36 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradients[color] ?? gradients.amber} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right text-slate-400">{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'events'>('overview');
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    const q = buildQuery(preset === 'custom' ? 'custom' : preset, customFrom, customTo);
    fetch(`/api/admin/analytics?${q}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); throw new Error('unauth'); }
        return r.json();
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, [preset, customFrom, customTo, router]);

  useEffect(() => { load(); }, [load]);

  const totalPageviews = data?.dailyPageviews.reduce((s, d) => s + parseInt(d.pageviews), 0) ?? 0;

  const deviceData = (data?.deviceBreakdown ?? []).map(d => ({
    name: d.device_type ?? 'unknown', value: parseInt(d.count),
  }));

  const eventData = (data?.eventTypeBreakdown ?? [])
    .filter(e => !['click'].includes(e.event_type)) // dedupe raw clicks
    .slice(0, 8)
    .map(e => ({ name: e.event_type.replace(/_/g, ' '), value: parseInt(e.count) }));

  // Fill weekday array
  const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weekdayData = DOW_LABELS.map((label, i) => {
    const found = data?.weekdayTraffic.find(d => parseInt(d.dow) === i);
    return { label, count: found ? parseInt(found.count) : 0 };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={22} className="text-amber-400" /> Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Full activity tracking — traffic, events, conversions & more</p>
        </div>

        {/* Time range controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-900/60 border border-white/10 rounded-xl p-1">
            {PRESET_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => { setPreset(opt.value); setShowCustom(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${preset === opt.value && !showCustom
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <button
            onClick={() => { setShowCustom(!showCustom); setPreset('custom'); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
              ${showCustom ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-slate-400 border-white/10 hover:text-white hover:border-white/20'}`}>
            <CalendarRange size={13} />
            Custom
            <ChevronDown size={12} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
          </button>

          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Custom date pickers */}
      {showCustom && (
        <div className="flex items-center gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex-wrap">
          <Filter size={14} className="text-purple-400" />
          <span className="text-slate-400 text-sm">From</span>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50 cursor-pointer" />
          <span className="text-slate-400 text-sm">To</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50 cursor-pointer" />
          <button onClick={load}
            className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-semibold transition-all cursor-pointer">
            Apply
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-slate-500 text-sm">Loading analytics…</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* ── KPI Row ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricPill label="Pageviews" value={totalPageviews.toLocaleString()} color="bg-amber-500/15 text-amber-400" icon={Eye} />
            <MetricPill label="Sessions" value={data.totalSessions.toLocaleString()} color="bg-blue-500/15 text-blue-400" icon={Users} />
            <MetricPill label="Bounce Rate" value={`${data.bounceRate}%`} color="bg-red-500/15 text-red-400" icon={TrendingDown} />
            <MetricPill label="Conversion" value={`${data.conversionRate}%`} color="bg-green-500/15 text-green-400" icon={Target} />
            <MetricPill label="Avg Scroll" value={`${data.avgScrollDepth}%`} color="bg-purple-500/15 text-purple-400" icon={TrendingUp} />
            <MetricPill label="Top Country" value={data.countries[0]?.country || '—'} color="bg-cyan-500/15 text-cyan-400" icon={Globe} />
            <MetricPill label="Top Source" value={(data.referrers[0]?.referrer || 'Direct').slice(0,12)} color="bg-orange-500/15 text-orange-400" icon={ArrowUpRight} />
            <MetricPill label="Events" value={data.eventTypeBreakdown.reduce((s,e) => s+parseInt(e.count),0).toLocaleString()} color="bg-violet-500/15 text-violet-400" icon={Activity} />
          </div>

          {/* ── Tab Bar ────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-slate-900/60 border border-white/10 rounded-2xl p-1 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'activity', label: 'Activity Feed', icon: Activity },
              { id: 'events', label: 'Event Details', icon: Zap },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
                    ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Traffic over time */}
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400" /> Pageviews & Sessions Over Time
                </h2>
                <AdminAreaChart
                  data={data.dailyPageviews.map(d => ({ ...d, pageviews: Number(d.pageviews), sessions: Number(d.sessions) }))}
                  keys={['pageviews', 'sessions']}
                />
              </div>

              {/* Hourly + Weekday */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" /> Traffic by Hour of Day
                  </h2>
                  <p className="text-slate-500 text-xs mb-4">Peak hour highlighted in amber</p>
                  <HourlyChart data={data.hourlyHeatmap} />
                  <div className="mt-6" />
                </div>
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-amber-400" /> Traffic by Day of Week
                  </h2>
                  <AdminBarChart
                    data={weekdayData}
                    dataKey="count"
                    labelKey="label"
                    color="#F59E0B"
                  />
                </div>
              </div>

              {/* Top Pages + Devices */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-amber-400" /> Top Pages
                  </h2>
                  {data.topPages.length > 0
                    ? <AdminBarChart data={data.topPages} dataKey="views" labelKey="page_path" horizontal />
                    : <p className="text-slate-500 text-sm text-center py-8">No data yet</p>}
                </div>
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Monitor size={16} className="text-amber-400" /> Devices
                  </h2>
                  {deviceData.length > 0
                    ? <AdminPieChart data={deviceData} label="Sessions" />
                    : <p className="text-slate-500 text-sm text-center py-8">No data</p>}
                </div>
              </div>

              {/* Sources + Countries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4">Traffic Sources</h2>
                  <div className="space-y-3">
                    {data.referrers.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No data yet</p>}
                    {data.referrers.map((r, i) => (
                      <ProgressBar key={i} label={r.referrer} value={parseInt(r.count)}
                        max={parseInt(data.referrers[0]?.count ?? '1')} color="amber" />
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4">Countries</h2>
                  <div className="space-y-3">
                    {data.countries.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No geo data yet</p>}
                    {data.countries.map((c, i) => (
                      <ProgressBar key={i} label={c.country || 'Unknown'} value={parseInt(c.count)}
                        max={parseInt(data.countries[0]?.count ?? '1')} color="blue" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Calls by hour */}
              {data.callsByHour.length > 0 && (
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Phone size={16} className="text-emerald-400" /> Call Clicks by Hour
                  </h2>
                  <p className="text-slate-500 text-xs mb-4">When visitors click to call — shows peak call hours</p>
                  <HourlyChart data={data.callsByHour} label="Calls" />
                  <div className="mt-6" />
                </div>
              )}
            </>
          )}

          {/* ══ ACTIVITY FEED TAB ═════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Activity size={16} className="text-amber-400" /> Live Activity Feed
                </h2>
                <span className="text-slate-500 text-xs">Last {data.activityFeed.length} events</span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-white/5">
                {Object.entries(EVENT_ICONS).slice(0, 8).map(([type, cfg]) => {
                  const LIcon = cfg.icon;
                  return (
                    <div key={type} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${cfg.bg}`}>
                      <LIcon size={10} className={cfg.color} />
                      <span className={`${cfg.color} capitalize`}>{type.replace(/_/g,' ')}</span>
                    </div>
                  );
                })}
              </div>

              {data.activityFeed.length === 0 ? (
                <div className="text-center py-16">
                  <Activity size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No activity recorded yet in this time range.</p>
                  <p className="text-slate-600 text-xs mt-1">Make sure the migration has been run (/api/admin/migrate).</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1">
                  {data.activityFeed.map(item => (
                    <ActivityFeedItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ EVENT DETAILS TAB ═════════════════════════════════════════ */}
          {activeTab === 'events' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event type breakdown */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" /> Event Type Breakdown
                  </h2>
                  {eventData.length > 0
                    ? <AdminPieChart data={eventData} label="Events" />
                    : <p className="text-slate-500 text-sm text-center py-8">No events yet</p>}
                </div>

                {/* Top CTA buttons */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Target size={16} className="text-amber-400" /> Top Clicked CTAs
                  </h2>
                  <div className="space-y-3">
                    {data.topButtons.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No button clicks tracked yet</p>}
                    {data.topButtons.map((b, i) => (
                      <ProgressBar key={i} label={b.label} value={parseInt(b.count)}
                        max={parseInt(data.topButtons[0]?.count ?? '1')} color="amber" />
                    ))}
                  </div>
                </div>
              </div>

              {/* UTM sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <ArrowUpRight size={16} className="text-amber-400" /> UTM Sources
                  </h2>
                  <div className="space-y-3">
                    {data.utmSources.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No UTM data yet</p>}
                    {data.utmSources.map((s, i) => (
                      <ProgressBar key={i} label={s.utm_source} value={parseInt(s.count)}
                        max={parseInt(data.utmSources[0]?.count ?? '1')} color="purple" />
                    ))}
                  </div>
                </div>

                {/* Event table */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-amber-400" /> All Event Counts
                  </h2>
                  <div className="space-y-2">
                    {data.eventTypeBreakdown.map((e, i) => {
                      const cfg = EVENT_ICONS[e.event_type] ?? { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10' };
                      const EIcon = cfg.icon;
                      return (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <EIcon size={12} className={cfg.color} />
                          </div>
                          <span className="text-slate-300 text-xs capitalize flex-1">{e.event_type.replace(/_/g,' ')}</span>
                          <span className="text-white text-xs font-bold tabular-nums">{parseInt(e.count).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

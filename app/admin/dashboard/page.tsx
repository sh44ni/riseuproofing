'use client';

import './crm-dashboard.css';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  House, UsersRound, GitMerge, UserRound, FileText, CalendarDays,
  CheckCheck, ImageIcon, BarChart3, Settings, ShieldCheck,
  Search, Bell, RefreshCw, Sparkles, Plus, ArrowRight, X,
  ChevronRight, ChevronDown, Menu,
  Phone, Trophy, Frown, ArrowUp, ArrowDown,
  Mail, CircleCheck,
  Crown, MapPin, Globe,
  Pickaxe, Flag, CheckSquare,
} from 'lucide-react';

import { canAccessPath } from '@/lib/rbac';
import { DashboardSkeleton } from '@/components/admin/shared/AdminSkeletons';
import DashboardHeroBanner from '@/components/admin/dashboard/DashboardHeroBanner';
import DashboardWeatherWidget from '@/components/admin/dashboard/DashboardWeatherWidget';
import DashboardQuoteCard from '@/components/admin/dashboard/DashboardQuoteCard';
import DashboardCustomizerModal from '@/components/admin/dashboard/DashboardCustomizerModal';
import DashboardPipelineSection from '@/components/admin/dashboard/DashboardPipelineSection';
import DashboardCalendarSnapshot from '@/components/admin/dashboard/DashboardCalendarSnapshot';
import DashboardNeedsFollowUp, { StaleLeadItem } from '@/components/admin/dashboard/DashboardNeedsFollowUp';
import DashboardActiveJobs, { ActiveJobItem } from '@/components/admin/dashboard/DashboardActiveJobs';
import { RecentActivityItem } from '@/components/admin/dashboard/DashboardRecentActivity';
import { TaskItem } from '@/components/admin/dashboard/DashboardTasksWidget';
import { PerformerItem } from '@/components/admin/dashboard/DashboardTopPerformers';
import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from '@/lib/dashboard-config';
import type { AuthUser } from '@/lib/rbac';

// ── Types ──────────────────────────────────────────────────
interface StatsResponse {
  userRole: string;
  userId: number;
  userName: string;
  followUpThresholdHours: number;
  kpis: { newLeadsThisWeek: number; activeJobs: number; pendingEstimates: number; revenueMtd: number };
  sixKpis?: {
    newLeads:     { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
    connected:    { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
    estScheduled: { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
    estSent:      { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
    jobsWon:      { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
    lostClosed:   { count: number; delta: string; isPositive: boolean; sparkPoints?: number[] };
  };
  recentActivities?: RecentActivityItem[];
  needsFollowUp: StaleLeadItem[];
  myTasks: TaskItem[];
  activeJobs: ActiveJobItem[];
  topPerformers: PerformerItem[];
  trafficSummary: { visitorsToday: number; visitors7d: number };
  jobsStageMap: Record<string, number>;
}

// ── Nav definition ─────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ fill?: string; strokeWidth?: number; size?: number; className?: string }>;
  fill: boolean;
  future?: boolean;
}
const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard',   label: 'Dashboard',        Icon: House,       fill: true  },
  { href: '/admin/leads',       label: 'Leads',            Icon: UsersRound,  fill: true  },
  { href: '/admin/pipeline',    label: 'Pipeline',         Icon: GitMerge,    fill: false },
  { href: '/admin/clients',     label: 'Clients',          Icon: UserRound,   fill: true  },
  { href: '/admin/estimates',   label: 'Estimates',        Icon: FileText,    fill: false },
  { href: '/admin/calendar',    label: 'Calendar',         Icon: CalendarDays,fill: false },
  { href: '/admin/tasks',       label: 'Tasks',            Icon: CheckCheck,  fill: false },
  { href: '',                   label: 'Content Creation', Icon: ImageIcon,   fill: false, future: true },
  { href: '/admin/reports',     label: 'Reports',          Icon: BarChart3,   fill: false },
  { href: '/admin/settings',    label: 'Settings',         Icon: Settings,    fill: false },
  { href: '/admin/users',       label: 'Users',            Icon: ShieldCheck, fill: true  },
];

// ── KPI config ─────────────────────────────────────────────
type KpiKey = 'newLeads' | 'connected' | 'estScheduled' | 'estSent' | 'jobsWon' | 'lostClosed';
interface KpiDef {
  label: string;
  key: KpiKey;
  Icon: React.ComponentType<{ fill?: string; strokeWidth?: number; size?: number }>;
  fill: boolean;
  color: string;
  href: string;
}
const KPI_DEFS: KpiDef[] = [
  { label: 'New Leads',      key: 'newLeads',     Icon: UsersRound,   fill: true,  color: '',       href: '/admin/leads' },
  { label: 'Connected',      key: 'connected',    Icon: Phone,        fill: true,  color: '',       href: '/admin/pipeline' },
  { label: 'Est. Scheduled', key: 'estScheduled', Icon: CalendarDays, fill: false, color: 'indigo', href: '/admin/calendar' },
  { label: 'Est. Sent',      key: 'estSent',      Icon: FileText,     fill: false, color: 'green',  href: '/admin/estimates' },
  { label: 'Jobs Won',       key: 'jobsWon',      Icon: Trophy,       fill: true,  color: '',       href: '/admin/jobs' },
  { label: 'Lost / Closed',  key: 'lostClosed',   Icon: Frown,        fill: false, color: 'amber',  href: '/admin/leads?status=lost' },
];

// ── Sparkline SVG — renders real weekly data points ────────
function Sparkline({ id, points }: { id: number; points?: number[] }) {
  const toPolyline = (pts: number[]): string => {
    const max = Math.max(...pts, 1);
    const w = 100 / (pts.length - 1 || 1);
    return pts
      .map((v, i) => `${(i * w).toFixed(1)},${(26 - (v / max) * 24).toFixed(1)}`)
      .join(' ');
  };

  const hasPts = points && points.length >= 2;
  const polyline = hasPts ? toPolyline(points!) : null;
  const area     = hasPts ? `${polyline} 100,27 0,27` : null;

  return (
    <svg className="crm-sparkline" viewBox="0 0 100 27" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`crm-sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00b8fa" stopOpacity=".5" />
          <stop offset="1" stopColor="#00b8fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {hasPts ? (
        <>
          <polygon points={area!} fill={`url(#crm-sg-${id})`} />
          <polyline points={polyline!} fill="none" stroke="#00b3ef" strokeWidth="2.3" strokeLinejoin="round" />
        </>
      ) : (
        <line x1="0" y1="22" x2="100" y2="22" stroke="#00b3ef" strokeWidth="2" strokeDasharray="4 3" opacity=".5" />
      )}
    </svg>
  );
}


// ── Activity icon map ───────────────────────────────────────
function activityIcon(type: string) {
  if (type === 'estimate') return FileText;
  if (type === 'contract' || type === 'completed' || type === 'job') return CircleCheck;
  if (type === 'email') return Mail;
  return UserRound;
}

// ── Role display map ────────────────────────────────────────
const ROLE_DISPLAY: Record<string, string> = {
  owner: 'Owner / Estimator', admin: 'Admin', sales_rep: 'Sales Rep',
  foreman: 'Foreman', office: 'Office Manager', viewer: 'Viewer',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function taskDueLabel(task: TaskItem): string {
  if (!task.due_at) return 'Anytime';
  const d = new Date(task.due_at);
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function isTaskToday(task: TaskItem): boolean {
  if (!task.due_at) return false;
  const d = new Date(task.due_at);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// ── Main Component ─────────────────────────────────────────
export default function DashboardPage() {
  const router    = useRouter();
  const pathname  = usePathname();

  const [stats,    setStats]    = useState<StatsResponse | null>(null);
  const [config,   setConfig]   = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [user,     setUser]     = useState<AuthUser | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const [toast,    setToast]    = useState('');
  const [activeDay, setActiveDay] = useState(() => {
    const dow = new Date().getDay(); // 0=Sun…6=Sat
    if (dow === 0 || dow === 6) return 0; // weekends → Monday
    return dow - 1; // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4
  });
  const [search,   setSearch]   = useState('');
  const [calEvents, setCalEvents] = useState<Array<{
    id: string; title: string; time?: string; date: string; event_type: string;
    address?: string; customer?: string; is_all_day: boolean;
  }>>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K shortcut
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setShowNotif(false); setShowProfile(false); setMobileNav(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Auth user
  useEffect(() => {
    fetch('/api/admin/auth').then(r => r.json())
      .then(d => { if (d.authenticated && d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  // Config
  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/dashboard-config');
      if (r.ok) { const d = await r.json(); if (d.config) setConfig(d.config); }
    } catch {}
  }, []);

  // Stats
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const r = await fetch('/api/admin/stats');
      if (r.status === 401) { router.push('/admin/login'); return; }
      if (r.ok) setStats(await r.json());
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => { fetchStats(); fetchConfig(); }, [fetchStats, fetchConfig]);

  // Fetch calendar events once on mount
  useEffect(() => {
    fetch('/api/admin/calendar')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.events) setCalEvents(data.events); })
      .catch(() => {});
  }, []);


  // ── MUST be before any early return — Rules of Hooks ──────
  // Real Mon–Fri of the current week
  const weekDays = React.useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { abbr: ABBR[i], full: FULL[i], num: d.getDate(), date: d };
    });
  }, []);

  if (loading || !stats) return <DashboardSkeleton />;

  const role      = user?.role ?? stats.userRole ?? 'admin';
  const userName  = user?.name ?? stats.userName ?? '';
  const roleLabel = ROLE_DISPLAY[role] ?? role;
  const userInitials = initials(userName);

  // sixKpis always returned by the API — only fallback if somehow absent (network race)
  const kpis = stats.sixKpis ?? {
    newLeads:     { count: stats.kpis.newLeadsThisWeek, delta: '—', isPositive: true },
    connected:    { count: 0,                           delta: '—', isPositive: true },
    estScheduled: { count: stats.kpis.pendingEstimates, delta: '—', isPositive: true },
    estSent:      { count: stats.kpis.pendingEstimates, delta: '—', isPositive: true },
    jobsWon:      { count: stats.kpis.activeJobs,       delta: '—', isPositive: true },
    lostClosed:   { count: 0,                           delta: '—', isPositive: false },
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/admin/leads?search=${encodeURIComponent(search.trim())}`);
  };

  // Index of today in the week strip (0=Mon…4=Fri; weekend → 0) — plain IIFE, not a hook
  const todayWeekIdx = (() => {
    const dow = new Date().getDay();
    if (dow === 0 || dow === 6) return 0;
    return dow - 1;
  })();

  // Color per event type (matches the template dot colors)
  const EVENT_COLORS: Record<string, string> = {
    roof_install:    '#00bd80',
    roof_inspection: '#ffb300',
    task:            '#008eff',
    boom_delivery:   '#ff6b35',
    city_permit:     '#9b59b6',
    warranty_checkin:'#ff171f',
  };

  // Filter calendar events to the selected weekday
  const selectedDate = weekDays[activeDay]?.date;
  const todayAppts = selectedDate
    ? calEvents.filter(ev => {
        const evDate = new Date(ev.date + 'T12:00:00');
        return (
          evDate.getFullYear() === selectedDate.getFullYear() &&
          evDate.getMonth()    === selectedDate.getMonth() &&
          evDate.getDate()     === selectedDate.getDate()
        );
      })
    : [];


  return (
    <div className="crm-shell">

      {/* ══ MOBILE OVERLAY ══════════════════════════════════ */}
      {mobileNav && <button className="crm-nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      {/* ══ LEFT SIDEBAR ════════════════════════════════════ */}
      <aside className={`crm-sidebar${mobileNav ? ' open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="crm-brand-area">
          <div className="crm-brand-logo">
            <Link href="/admin/dashboard" onClick={() => setMobileNav(false)}>
              <Image src="/logo.svg" alt="Rise Up Roofing" width={110} height={34} priority className="object-contain" style={{ height: 32, width: 'auto' }} />
            </Link>
            <span className="crm-brand-badge">CRM</span>
          </div>
          <span className="crm-tagline">Discipline Builds Freedom.</span>
        </div>

        {/* Nav */}
        <nav className="crm-nav">
          {NAV_ITEMS.map(({ href, label, Icon, fill, future }) => {
            if (future) {
              return (
                <span key={label} className="crm-nav-item crm-nav-future">
                  <Icon fill="none" strokeWidth={2.4} />
                  <span className="crm-nav-label">{label}</span>
                  <span className="crm-nav-soon">Soon</span>
                </span>
              );
            }
            if (!canAccessPath(user, href)) return null;
            const isActive = href === '/admin/dashboard'
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`crm-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setMobileNav(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon fill={fill ? 'currentColor' : 'none'} strokeWidth={2.4} />
                <span className="crm-nav-label">{label}</span>
                <ChevronRight className="crm-nav-chevron" />
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-footer-brand">GOOD ROOFS.<br />BETTER PEOPLE.</div>
          <div className="crm-sidebar-social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://riseuprac.com" target="_blank" rel="noreferrer" title="Website">
              <Globe size={14} />
            </a>
            <a href="https://yelp.com" target="_blank" rel="noreferrer" title="Yelp">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12.076 19.003l-1.935.42c-1.538.336-1.805-.742-1.539-1.668l.92-3.274c.266-.928 1.044-1.258 1.82-.514l1.544 1.462c.776.736.667 3.232-.81 3.574zm.81-12.35L11.342 5.19c-.776-.736-1.554-.413-1.82.514l-.92 3.274c-.267.928 0 2.005 1.538 1.67l1.935-.42c1.477-.343 1.587-2.838.81-3.575zm7.18 8.516l-1.77-1.168c-.804-.53-1.63-.196-1.704.74l-.24 3.075c-.075.937.938 1.373 1.673.742l1.524-1.316c.766-.66.32-1.573-.483-2.073zm-3.267-9.022c.804-.53.858-1.505.053-2.036l-1.77-1.168c-.804-.53-1.688-.099-1.762.838l-.24 3.075c-.075.937.702 1.571 1.773.876l1.946-1.585zm1.33 4.753l-3.01-.36c-.938-.113-1.552.645-1.226 1.644l.97 2.974c.326.998 1.302 1.098 1.943.183l1.643-2.292c.642-.913.619-2.036-.32-2.149z"/></svg>
            </a>
          </div>
          <div className="crm-sidebar-footer-meta">RISEUPRAC.COM<br />Oceanside, CA</div>
        </div>
      </aside>

      {/* ══ MAIN WORKSPACE ══════════════════════════════════ */}
      <main className="crm-main">
        {/* Mobile hamburger */}
        <button className="crm-hamburger" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">
          <Menu size={17} />
        </button>

        {/* ─ Top Bar ─ */}
        <div className="crm-top-bar">
          <form onSubmit={handleSearch} className="crm-search">
            <Search size={17} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads, customers, jobs, addresses..."
              aria-label="Global search"
            />
            {search
              ? <button type="button" className="crm-search-clear" onClick={() => setSearch('')}><X size={15} /></button>
              : <kbd>⌘ K</kbd>
            }
          </form>

          <div className="crm-top-actions">
            <button className="crm-btn" onClick={() => fetchStats(true)} disabled={refreshing} title="Refresh metrics">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="crm-btn crm-btn-amber" onClick={() => setCustOpen(true)} title="Customize dashboard">
              <Sparkles size={14} />
              <span>Customize</span>
            </button>
            <Link href="/admin/leads/new" className="crm-btn crm-btn-primary">
              <Plus size={15} />
              <span>New Lead</span>
            </Link>

            {/* Notification Bell */}
            <div className="crm-floating-wrap">
              <button
                className="crm-notif-btn"
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                aria-label="Notifications"
                aria-expanded={showNotif}
              >
                <Bell fill="currentColor" size={17} />
              </button>
              {showNotif && (
                <div className="crm-floating-panel crm-notif-panel">
                  <strong>Notifications</strong>
                  <p style={{ fontSize: 11, color: '#94a3b8', padding: '12px 4px', textAlign: 'center', margin: 0 }}>
                    No new notifications
                  </p>
                  <button style={{ justifyContent: 'center', fontSize: 11 }} onClick={() => { setShowNotif(false); router.push('/admin/tasks'); }}>
                    <CalendarDays size={13} />
                    <span className="crm-notif-item-body">View tasks due today</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ Hero Banner ─ */}
        <div className="crm-hero">
          <DashboardHeroBanner
            headline={config.hero.headline}
            tagline={config.hero.tagline}
            subquote={config.hero.subquote}
            imageUrl={config.hero.imageUrl}
            pillars={config.hero.pillars}
            onOpenCustomizer={() => setCustOpen(true)}
          />
        </div>

        {/* ─ 6 KPI Cards ─ */}
        <section className="crm-stats-grid" aria-label="Performance metrics this month">
          {KPI_DEFS.map(({ label, key, Icon, fill, color, href }, i) => {
            const kpi = kpis[key];
            return (
              <Link key={key} href={href} className="crm-stat-card">
                <div className={`crm-stat-icon${color ? ' ' + color : ''}`}>
                  <Icon fill={fill ? 'currentColor' : 'none'} strokeWidth={fill ? 1 : 2.2} />
                </div>
                <div className="crm-stat-copy">
                  <span className="crm-stat-label">{label}</span>
                  <div className="crm-stat-numbers">
                    <strong>{kpi.count}</strong>
                    <span className={`crm-stat-change ${kpi.isPositive ? 'crm-positive' : 'crm-negative'}`}>
                      {kpi.isPositive ? <ArrowUp /> : <ArrowDown />}
                      {kpi.delta.replace(/^[+-]/, '')}
                    </span>
                  </div>
                  {kpi.sparkPoints && kpi.sparkPoints.length >= 2
                    ? <Sparkline id={i} points={kpi.sparkPoints} />
                    : <small className="crm-stat-sub">vs last month</small>
                  }
                </div>
              </Link>
            );
          })}
        </section>

        {/* ─ Sales Pipeline ─ */}
        <section className="crm-pipeline-section">
          <DashboardPipelineSection />
        </section>

        {/* ─ Recent Activity ─ */}
        {stats.recentActivities && stats.recentActivities.length > 0 && (
          <section className="crm-activity-section">
            <div className="crm-section-heading">
              <h2>Recent Activity</h2>
              <Link href="/admin/leads" className="crm-section-view-all">
                View All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="crm-activity-grid">
              {stats.recentActivities.slice(0, 4).map((a, i) => {
                const ActIcon = activityIcon(a.activity_type);
                const isGreen = a.activity_type === 'contract' || a.activity_type === 'completed' || i > 1;
                return (
                  <button key={a.id} className="crm-activity-item">
                    <span className={`crm-activity-icon${isGreen ? ' green' : ''}`}>
                      <ActIcon fill="currentColor" />
                    </span>
                    <span className="crm-activity-copy">
                      <small>{a.title}</small>
                      <span>{a.lead_name ?? a.description ?? ''}</span>
                    </span>
                    <time className="crm-activity-time">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ─ Needs Follow-up ─ */}
        {stats.needsFollowUp && stats.needsFollowUp.length > 0 && (
          <div style={{ margin: '10px 10px 0 1px' }}>
            <DashboardNeedsFollowUp
              leads={stats.needsFollowUp}
              thresholdHours={stats.followUpThresholdHours}
              onRefresh={() => fetchStats(true)}
            />
          </div>
        )}

        {/* ─ Active Field Jobs ─ */}
        {stats.activeJobs && stats.activeJobs.length > 0 && (
          <div style={{ margin: '10px 10px 0 1px' }}>
            <DashboardActiveJobs
              jobs={stats.activeJobs}
              isFieldCrew={role === 'foreman'}
              totalActiveCount={stats.kpis.activeJobs}
            />
          </div>
        )}

        {/* ─ Footer ─ */}
        <footer className="crm-workspace-footer">
          <span className="crm-footer-loc"><MapPin fill="currentColor" size={17} />Oceanside, CA</span>
          <span className="crm-footer-web"><Globe size={17} />riseuprac.com</span>
          <span className="crm-footer-divider" aria-hidden="true" />
          <span className="crm-footer-tagline">ROOFING TODAY FOR A STRONGER TOMORROW.</span>
        </footer>
      </main>

      {/* ══ RIGHT SIDEBAR ════════════════════════════════════ */}
      <aside className="crm-right-sidebar" aria-label="Your day at a glance">

        {/* ① Profile Card */}
        <div className="crm-profile-area crm-floating-wrap">
          <button
            className="crm-profile-btn"
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            aria-expanded={showProfile}
          >
            <span className="crm-avatar">{userInitials}</span>
            <span className="crm-profile-info">
              <span className="crm-profile-name">{userName}</span>
              <span className="crm-profile-role">{roleLabel}</span>
            </span>
            <ChevronDown className="crm-profile-chevron" />
          </button>
          {showProfile && (
            <div className="crm-floating-panel crm-profile-panel">
              <strong>{userName}</strong>
              <small className="crm-profile-subtitle">{roleLabel} · Rise Up</small>
              <button onClick={() => { setShowProfile(false); router.push('/admin/settings'); }}>
                <Settings />Workspace settings
              </button>
              <button onClick={() => { setShowProfile(false); router.push('/admin/users'); }}>
                <ShieldCheck />View your team
              </button>
            </div>
          )}
        </div>

        {/* ② Live Weather Widget */}
        <DashboardWeatherWidget
          location={config.weather?.location ?? 'Oceanside, CA'}
          backgroundImage={config.weather?.backgroundImage}
        />

        {/* ③ Today / Calendar Panel */}
        <section className="crm-side-panel crm-today-panel crm-today-panel-wrap">
          <div className="crm-today-heading">
            <h2>Today</h2>
            <span className="crm-today-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <Link href="/admin/calendar" className="crm-view-cal">
              View Calendar <ArrowRight size={11} />
            </Link>
          </div>
          <div className="crm-week-strip">
            {weekDays.map((d, i) => (
              <button
                key={d.abbr}
                className={`crm-week-btn${activeDay === i ? ' active' : ''}`}
                onClick={() => setActiveDay(i)}
                aria-label={`${d.full} ${d.num}`}
                aria-pressed={activeDay === i}
              >
                <span>{d.abbr}</span>
                <strong>{d.num}</strong>
              </button>
            ))}
          </div>
          <div className="crm-appt-list">
            {todayAppts.length === 0 ? (
              <p style={{ fontSize: 11, color: '#94a3b8', padding: '12px 4px', textAlign: 'center' }}>
                No events scheduled
              </p>
            ) : todayAppts.map(ev => (
              <button key={ev.id} className="crm-appt" onClick={() => router.push('/admin/calendar')}>
                <time className="crm-appt-time">
                  {ev.is_all_day ? 'All Day' : (ev.time ?? 'All Day')}
                </time>
                <div
                  className="crm-appt-dot"
                  style={{ background: EVENT_COLORS[ev.event_type] ?? '#6366f1' }}
                />
                <span className="crm-appt-body">
                  <strong>{ev.title}</strong>
                  <small>{ev.address ?? ev.customer ?? ''}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ④ Quote Card */}
        <DashboardQuoteCard
          quote={config.quoteCard.quote}
          imageUrl={config.quoteCard.imageUrl}
          onOpenCustomizer={() => setCustOpen(true)}
        />

        {/* ⑤ Tasks Panel */}
        <section className="crm-side-panel crm-tasks-panel crm-tasks-panel-wrap">
          <div className="crm-section-heading">
            <h2>Tasks ({stats.myTasks.length - doneTasks.size})</h2>
            <Link href="/admin/tasks" className="crm-section-view-all">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="crm-task-list">
            {stats.myTasks.slice(0, 5).map((task, i) => {
              const isDone = doneTasks.has(task.id);
              const due = taskDueLabel(task);
              return (
                <label key={task.id} className={`crm-task-row${isDone ? ' done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => setDoneTasks(prev => {
                      const next = new Set(prev);
                      if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                      return next;
                    })}
                  />
                  <span className="crm-task-name">{task.title}</span>
                  <small className={`crm-task-due${isTaskToday(task) ? ' today' : ''}`}>{due}</small>
                </label>
              );
            })}
          </div>
        </section>

        {/* ⑥ Top Performers */}
        <section className="crm-side-panel crm-performers-panel crm-performers-panel-wrap">
          <div className="crm-performers-heading">
            <Trophy className="crm-trophy-icon" fill="currentColor" />
            <div className="crm-performers-heading-text">
              <h2>Top Performers</h2>
              <span>This Month</span>
            </div>
            <Crown className="crm-crown-icon" fill="currentColor" />
          </div>
          <div className="crm-performer-list">
            {stats.topPerformers.length === 0 ? (
              <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 4px', textAlign: 'center' }}>
                No performance data yet
              </p>
            ) : stats.topPerformers.map((p, i) => (
              <button key={p.id} className="crm-performer" onClick={() => router.push(`/admin/leads?rep=${p.id}`)}>
                <span className={`crm-rank${i === 0 ? ' first' : ''}`}>{i + 1}</span>
                <span className="crm-p-avatar">{initials(p.name)}</span>
                <span className="crm-p-name">{p.name}</span>
                <small className="crm-p-jobs">{p.won_leads} jobs</small>
              </button>
            ))}
          </div>
        </section>

        {/* ⑦ License Footer */}
        <footer className="crm-license">
          CSLB #1096492 <span>|</span> B <span>|</span> C39 <span>|</span> C46
        </footer>
      </aside>

      {/* ══ CUSTOMIZER MODAL ════════════════════════════════ */}
      <DashboardCustomizerModal
        isOpen={custOpen}
        onClose={() => setCustOpen(false)}
        currentConfig={config}
        onConfigUpdated={setConfig}
      />

      {/* ══ TOAST ═══════════════════════════════════════════ */}
      {toast && (
        <div role="status" className="crm-toast">
          <CircleCheck size={20} />
          {toast}
          <button className="crm-toast-close" onClick={() => setToast('')} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}

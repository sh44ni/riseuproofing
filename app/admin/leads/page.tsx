'use client';

import '@/app/admin/dashboard/crm-dashboard.css';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UsersRound,
  Download,
  Filter,
  Plus,
  Sparkles,
  GitMerge,
  LayoutList,
  LayoutGrid,
  Phone,
  FileText,
  Trophy,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  UserX,
  X,
  ArrowRight,
} from 'lucide-react';
import LeadsTable, { Lead } from '@/components/admin/LeadsTable';
import MobileLeadCard from '@/components/admin/leads/MobileLeadCard';
import LeadQuickDrawer from '@/components/admin/leads/LeadQuickDrawer';
import AddLeadSheet from '@/components/admin/leads/AddLeadSheet';
import MoveToLostModal from '@/components/admin/shared/MoveToLostModal';
import { LeadsTableSkeleton } from '@/components/admin/shared/AdminSkeletons';
import CrmSidebar from '@/components/admin/layout/CrmSidebar';
import CrmTopBar from '@/components/admin/layout/CrmTopBar';
import CrmSparkline from '@/components/admin/shared/CrmSparkline';
import type { AuthUser } from '@/lib/rbac';

const STATUSES = ['all', 'new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];
const PRIORITIES = ['all', 'hot', 'warm', 'cool'];

interface KpiItem {
  count: number | string;
  delta: string;
  isPositive: boolean;
  sparkPoints?: number[];
}

interface LeadsApiResponse {
  leads: Lead[];
  total: number;
  page: number;
  daily: { day: string; count: string }[];
  kpis?: {
    totalLeads: KpiItem;
    newLeads: KpiItem;
    inContact: KpiItem;
    scheduledQuoted: KpiItem;
    wonDeals: KpiItem;
    winRate: KpiItem;
  };
  filterOptions?: {
    sources: string[];
    services: string[];
    reps: string[];
  };
}

export default function LeadsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & layout state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Dynamic filter options & KPIs
  const [sourcesList, setSourcesList] = useState<string[]>([]);
  const [repsList, setRepsList] = useState<string[]>([]);
  const [servicesList, setServicesList] = useState<string[]>([]);
  const [kpis, setKpis] = useState<LeadsApiResponse['kpis'] | null>(null);

  // Modals & Drawers
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [pendingLostLead, setPendingLostLead] = useState<{
    id: number;
    fullName: string;
    phone?: string | null;
    serviceType?: string | null;
    address?: string | null;
    estimatedValue?: number | string | null;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riseup_crm_leads_view');
      if (saved === 'table' || saved === 'cards') {
        setViewMode(saved);
      } else if (window.innerWidth < 1024) {
        setViewMode('cards');
      }
    }
  }, []);

  // Fetch current authenticated user
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  function handleToggleView(mode: 'table' | 'cards') {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('riseup_crm_leads_view', mode);
    }
  }

  // Load leads with all filters
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams({ page: String(page) });
        if (status !== 'all') params.set('status', status);
        if (priority !== 'all') params.set('priority', priority);
        if (sourceFilter !== 'all') params.set('source', sourceFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/admin/leads?${params}`);
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (!res.ok) {
          console.error('Failed to load leads:', res.status, res.statusText);
          return;
        }
        const d: LeadsApiResponse = await res.json();
        setLeads(d.leads ?? []);
        setTotal(d.total ?? 0);

        if (d.kpis) setKpis(d.kpis);
        if (d.filterOptions) {
          if (d.filterOptions.sources) setSourcesList(d.filterOptions.sources);
          if (d.filterOptions.services) setServicesList(d.filterOptions.services);
          if (d.filterOptions.reps) setRepsList(d.filterOptions.reps);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, priority, sourceFilter, search, page, router]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Listen to FAB "crm:open-add-lead" event or ?new=1
  useEffect(() => {
    function handleOpenAdd() {
      setShowAddSheet(true);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === '1' || params.get('action') === 'new') {
        setShowAddSheet(true);
      }
    }
    window.addEventListener('crm:open-add-lead', handleOpenAdd);
    return () => window.removeEventListener('crm:open-add-lead', handleOpenAdd);
  }, []);

  async function handleStatusChange(
    id: number,
    newStatus: string,
    meta?: { lostReason?: string; notes?: string }
  ) {
    if (newStatus === 'lost' && !meta?.lostReason) {
      const target = leads.find((l) => l.id === id);
      if (target) {
        setPendingLostLead({
          id: target.id,
          fullName: target.full_name,
          phone: target.phone,
          serviceType: target.service_type,
          address: target.address,
          estimatedValue: target.estimated_value,
        });
        return;
      }
    }

    if (newStatus === 'lost') {
      if (status !== 'lost') {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
      }
      if (drawerLead && drawerLead.id === id) {
        setDrawerLead(null);
      }
      setToastMessage('Lead archived to Lost Leads in Clients 360');
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    }

    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: newStatus,
        lost_reason: meta?.lostReason,
        notes: meta?.notes,
        performedBy: user?.name || 'Staff User',
      }),
    });

    // Refresh KPI counts silently
    load(true);
  }

  async function handleConfirmLost({ reason, notes }: { reason: string; notes: string }) {
    if (!pendingLostLead) return;
    const targetId = Number(pendingLostLead.id);
    setPendingLostLead(null);
    await handleStatusChange(targetId, 'lost', { lostReason: reason, notes });
  }

  function exportCsv() {
    const header = ['ID', 'Name', 'Phone', 'Email', 'Service', 'Priority', 'Score', 'Address', 'Status', 'Date'];
    const rows = leads.map((l) => [
      l.id,
      l.full_name,
      l.phone,
      l.email,
      l.service_type,
      l.priority ?? 'cool',
      l.lead_score ?? 0,
      l.address,
      l.status,
      l.created_at,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `rise-up-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // Filter client-side by rep / service if selected
  const displayedLeads = leads.filter((lead) => {
    if (repFilter !== 'all' && lead.assigned_to_name !== repFilter) return false;
    if (serviceFilter !== 'all' && lead.service_type !== serviceFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(total / 20);

  // 6 KPI strip definitions
  const kpiCards = [
    {
      id: 0,
      label: 'Total Leads',
      data: kpis?.totalLeads ?? { count: total, delta: '—', isPositive: true },
      Icon: UsersRound,
      color: '#008fff',
    },
    {
      id: 1,
      label: 'New Leads',
      data: kpis?.newLeads ?? { count: '—', delta: '—', isPositive: true },
      Icon: Sparkles,
      color: '#00b8fa',
    },
    {
      id: 2,
      label: 'In Contact',
      data: kpis?.inContact ?? { count: '—', delta: '—', isPositive: true },
      Icon: Phone,
      color: '#f59e0b',
    },
    {
      id: 3,
      label: 'Est. Scheduled',
      data: kpis?.scheduledQuoted ?? { count: '—', delta: '—', isPositive: true },
      Icon: FileText,
      color: '#8b5cf6',
    },
    {
      id: 4,
      label: 'Won Deals',
      data: kpis?.wonDeals ?? { count: '—', delta: '—', isPositive: true },
      Icon: Trophy,
      color: '#10b981',
    },
    {
      id: 5,
      label: 'Win Rate',
      data: kpis?.winRate ?? { count: '—', delta: '—', isPositive: true },
      Icon: CheckCheck,
      color: '#06b6d4',
    },
  ];

  return (
    <div className="crm-shell crm-shell-full">
      {/* ══ LEFT SIDEBAR ════════════════════════════════════ */}
      <CrmSidebar user={user} mobileNav={mobileNav} setMobileNav={setMobileNav} />

      {/* ══ MAIN WORKSPACE ══════════════════════════════════ */}
      <main className="crm-main">
        {/* ─ Top Bar ─ */}
        <CrmTopBar
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search homeowner name, phone, address, or service..."
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onNewLeadClick={() => setShowAddSheet(true)}
          user={user}
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
          extraActions={
            <>
              <Link
                href="/admin/pipeline"
                className="crm-btn"
                title="Switch to 5-Stage Kanban Pipeline"
              >
                <GitMerge size={14} />
                <span>Sales Pipeline</span>
              </Link>
              <button
                type="button"
                className="crm-btn"
                onClick={exportCsv}
                title="Export filtered leads to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </>
          }
        />

        {/* ─ 6-Metric Executive KPI Strip ─ */}
        <div className="crm-stats-grid">
          {kpiCards.map((kpi) => {
            const Icon = kpi.Icon;
            return (
              <div key={kpi.id} className="crm-stat-card">
                <div
                  className="crm-stat-icon"
                  style={{
                    color: kpi.color,
                    background: `${kpi.color}14`,
                    borderColor: `${kpi.color}30`,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div className="crm-stat-info">
                  <span className="crm-stat-label">{kpi.label}</span>
                  <div className="crm-stat-numbers">
                    <strong>{kpi.data.count}</strong>
                    {kpi.data.delta && kpi.data.delta !== '—' && (
                      <span className={`crm-stat-badge ${kpi.data.isPositive ? 'pos' : 'neg'}`}>
                        {kpi.data.isPositive ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                        {kpi.data.delta}
                      </span>
                    )}
                  </div>
                </div>
                <CrmSparkline id={`kpi-${kpi.id}`} points={kpi.data.sparkPoints} color={kpi.color} />
              </div>
            );
          })}
        </div>

        {/* ─ Main Content Area ─ */}
        <div className="crm-leads-content">
          {/* Filter & Command Toolbar */}
          <div className="crm-filter-toolbar">
            <div className="crm-filter-group">
              {/* Status Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter size={13} className="text-slate-400 mr-1 shrink-0" />
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatus(s);
                      setPage(1);
                    }}
                    className={`crm-filter-chip capitalize ${status === s ? 'active' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1 ml-2 border-l border-slate-200/80 pl-2 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPriority(p);
                      setPage(1);
                    }}
                    className={`crm-filter-chip capitalize ${
                      priority === p
                        ? p === 'hot'
                          ? 'active-rose'
                          : p === 'warm'
                          ? 'active-amber'
                          : 'active'
                        : ''
                    }`}
                  >
                    {p === 'all' ? 'All Priority' : `${p === 'hot' ? '🔴' : p === 'warm' ? '🟡' : '🔵'} ${p}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Filters & View Switcher */}
            <div className="crm-filter-group">
              {/* Source Dropdown */}
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="crm-select"
                aria-label="Filter by Lead Source"
              >
                <option value="all">All Sources</option>
                {sourcesList.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>

              {/* Rep Dropdown */}
              {repsList.length > 0 && (
                <select
                  value={repFilter}
                  onChange={(e) => setRepFilter(e.target.value)}
                  className="crm-select"
                  aria-label="Filter by Assigned Rep"
                >
                  <option value="all">All Reps</option>
                  {repsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}

              {/* Services Dropdown */}
              {servicesList.length > 0 && (
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="crm-select"
                  aria-label="Filter by Service"
                >
                  <option value="all">All Services</option>
                  {servicesList.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              )}

              {/* View Toggle */}
              <div className="inline-flex rounded-lg border border-[#cce7ff] bg-[#eef7ff] p-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleView('table')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-[#0B1E33] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1E33]'
                  }`}
                  title="Table View (Dense & Sortable)"
                >
                  <LayoutList size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleView('cards')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#0B1E33] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1E33]'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main List Views */}
          {loading ? (
            <LeadsTableSkeleton />
          ) : displayedLeads.length === 0 ? (
            <div className="crm-table-wrap py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#0B1E33]">No leads match your filter</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Try clearing your search query, adjusting your priority, or changing the lead source.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus('all');
                  setPriority('all');
                  setSourceFilter('all');
                  setRepFilter('all');
                  setServiceFilter('all');
                  setSearch('');
                  setPage(1);
                }}
                className="crm-btn crm-btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="crm-table-wrap">
              {viewMode === 'cards' ? (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {displayedLeads.map((lead) => (
                    <MobileLeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={handleStatusChange}
                      onQuickPeek={setDrawerLead}
                    />
                  ))}
                </div>
              ) : (
                <LeadsTable
                  leads={displayedLeads}
                  onStatusChange={handleStatusChange}
                  onQuickPeek={setDrawerLead}
                />
              )}

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="crm-pagination">
                  <span>
                    Showing {displayedLeads.length} of {total} leads (Page {page} of {totalPages})
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`crm-page-btn ${p === page ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ══ DRAWERS & MODALS ════════════════════════════════ */}
      {/* Quick Peek Slide-over Drawer */}
      <LeadQuickDrawer
        lead={drawerLead}
        isOpen={Boolean(drawerLead)}
        onClose={() => setDrawerLead(null)}
        onStatusChange={(id, newSt) => {
          handleStatusChange(id, newSt);
          setDrawerLead((prev) => (prev ? { ...prev, status: newSt } : null));
        }}
      />

      {/* Add Lead Bottom Sheet */}
      <AddLeadSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onCreated={() => load(true)}
      />

      {/* Branded Move-to-Lost Confirmation Modal */}
      <MoveToLostModal
        isOpen={Boolean(pendingLostLead)}
        onClose={() => setPendingLostLead(null)}
        onConfirm={handleConfirmLost}
        lead={pendingLostLead}
      />

      {/* Floating Status Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#0B1E33] text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
            <UserX size={16} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">{toastMessage}</p>
            <Link
              href="/admin/clients"
              className="text-sky-400 hover:text-sky-300 hover:underline font-semibold text-[11px] inline-flex items-center gap-1 mt-0.5"
            >
              <span>View in Clients 360 Lost Leads</span>
              <ArrowRight size={11} />
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

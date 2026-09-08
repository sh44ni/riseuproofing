'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Download,
  Filter,
  Search,
  Plus,
  Sparkles,
  RefreshCw,
  GitFork,
  ArrowRight,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import LeadsTable, { Lead } from '@/components/admin/LeadsTable';
import MobileLeadCard from '@/components/admin/leads/MobileLeadCard';
import LeadQuickDrawer from '@/components/admin/leads/LeadQuickDrawer';
import AddLeadSheet from '@/components/admin/leads/AddLeadSheet';
import { AdminAreaChart } from '@/components/admin/Charts';
import { LeadsTableSkeleton } from '@/components/admin/shared/AdminSkeletons';

const STATUSES = ['all', 'new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];
const PRIORITIES = ['all', 'hot', 'warm', 'cool'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [daily, setDaily] = useState<{ day: string; count: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Layout Mode
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);

  const router = useRouter();

  // Load view preference or adapt to viewport
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

  function handleToggleView(mode: 'table' | 'cards') {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('riseup_crm_leads_view', mode);
    }
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== 'all') params.set('status', status);
      if (priority !== 'all') params.set('priority', priority);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const d = await res.json();
      setLeads(d.leads ?? []);
      setTotal(d.total ?? 0);
      setDaily(d.daily ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, priority, search, page, router]);

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

  async function handleStatusChange(id: number, newStatus: string) {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)));
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, performedBy: 'Admin Staff' }),
    });
  }

  function exportCsv() {
    const header = ['ID', 'Type', 'Name', 'Phone', 'Email', 'Service', 'Priority', 'Score', 'Address', 'Status', 'Date'];
    const rows = leads.map(l => [
      l.id,
      l.form_type,
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
    const csv = [header, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / 20);

  if (loading && leads.length === 0) {
    return <LeadsTableSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 5-Stage Sales Pipeline Announcement Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-amber-300/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
            <GitFork size={18} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Looking for the Unified Sales Pipeline?</span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                5-Stage Journey
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              Track leads through the official Rise Up 5 stages with unassigned hopper, 24–48h SLA countdowns, and 1-click self-claiming.
            </p>
          </div>
        </div>
        <Link
          href="/admin/pipeline"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
        >
          <span>Open Pipeline</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E33] flex items-center gap-2">
            <Users size={24} className="text-[#1878B8]" />
            <span>Leads CRM</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {total} total homeowner & commercial inquiries tracked
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Refresh Leads"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#1878B8]' : ''} />
          </button>

          <button
            onClick={exportCsv}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => setShowAddSheet(true)}
            className="admin-btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Sticky Filters */}
      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-[16px] border border-slate-200/80 shadow-xs">
        {/* Search Bar & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by homeowner name, phone, address, city, or service..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0B1E33] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View (Dense & Sortable)"
            >
              <LayoutList size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#0B1E33] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View (Visual Touch)"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={14} className="text-slate-400 flex-shrink-0 ml-1 mr-1" />
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                status === s
                  ? 'bg-sky-50 text-[#1878B8] border border-sky-200 shadow-xs'
                  : 'text-slate-600 border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B1E33]'
              }`}
            >
              {s}
            </button>
          ))}

          {/* Priority filter separator */}
          <span className="text-slate-300 mx-1">|</span>

          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => {
                setPriority(p);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                priority === p
                  ? p === 'hot'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                    : 'bg-sky-50 text-[#1878B8] border border-sky-200 shadow-xs'
                  : 'text-slate-600 border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B1E33]'
              }`}
            >
              {p === 'all' ? 'All Priority' : `${p === 'hot' ? '🔴' : p === 'warm' ? '🟡' : '🔵'} ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Daily trend summary on desktop */}
      {daily.length > 0 && (
        <div className="hidden lg:block bg-white border border-slate-200/80 rounded-[16px] p-5 shadow-xs">
          <h2 className="text-[#0B1E33] font-bold text-sm mb-3">Inbound Leads Velocity (30 Days)</h2>
          <AdminAreaChart data={daily} keys={['count']} />
        </div>
      )}

      {/* Main List Views */}
      {loading ? (
        <div className="rounded-[16px] border border-slate-200/80 bg-white overflow-hidden divide-y divide-slate-100 shadow-xs">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4 admin-shimmer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 rounded bg-slate-200" />
                  <div className="w-24 h-3 rounded bg-slate-200" />
                </div>
              </div>
              <div className="w-32 h-3.5 rounded bg-slate-200 hidden sm:block" />
              <div className="w-20 h-5 rounded-full bg-slate-200" />
              <div className="w-16 h-5 rounded-full bg-sky-100" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-[16px] border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-[16px] bg-amber-50 text-[#EAA636] border border-amber-200 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#0B1E33]">No leads match this filter</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Try adjusting your search query or clear the status filter to see all active inquiries.
          </p>
          <button
            onClick={() => {
              setStatus('all');
              setPriority('all');
              setSearch('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {leads.map(lead => (
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
              leads={leads}
              onStatusChange={handleStatusChange}
              onQuickPeek={setDrawerLead}
            />
          )}
        </>
      )}

      {/* Quick Peek Slide-over Drawer */}
      <LeadQuickDrawer
        lead={drawerLead}
        isOpen={Boolean(drawerLead)}
        onClose={() => setDrawerLead(null)}
        onStatusChange={(id, newSt) => {
          handleStatusChange(id, newSt);
          setDrawerLead(prev => (prev ? { ...prev, status: newSt } : null));
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                p === page
                  ? 'bg-sky-50 text-[#1878B8] border border-sky-300 font-bold shadow-xs'
                  : 'text-slate-600 border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B1E33]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Add Lead Bottom Sheet */}
      <AddLeadSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onCreated={() => load(true)}
      />
    </div>
  );
}

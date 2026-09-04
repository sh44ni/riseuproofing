'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Download, Filter, Search, Plus, Sparkles, RefreshCw } from 'lucide-react';
import LeadsTable, { Lead } from '@/components/admin/LeadsTable';
import MobileLeadCard from '@/components/admin/leads/MobileLeadCard';
import AddLeadSheet from '@/components/admin/leads/AddLeadSheet';
import { AdminAreaChart } from '@/components/admin/Charts';

const STATUSES = ['all', 'new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];
const PRIORITIES = ['all', 'hot', 'warm', 'cool'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [daily, setDaily] = useState<{ day: string; count: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const router = useRouter();

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

  // Listen to FAB "crm:open-add-lead" event
  useEffect(() => {
    function handleOpenAdd() {
      setShowAddSheet(true);
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users size={24} className="text-amber-400" />
            <span>Leads CRM</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            {total} total homeowner & commercial inquiries tracked
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-amber-400' : ''} />
          </button>

          <button
            onClick={exportCsv}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Sticky Filters */}
      <div className="space-y-3 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/10">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by homeowner name, phone, address, city, or service..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter Chips (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={14} className="text-slate-500 flex-shrink-0 ml-1 mr-1" />
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                status === s
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner'
                  : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}

          {/* Priority filter separator */}
          <span className="text-slate-700 mx-1">|</span>

          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => {
                setPriority(p);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                priority === p
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Priority' : `${p === 'hot' ? '🔴' : p === 'warm' ? '🟡' : '🔵'} ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Daily trend summary on desktop */}
      {daily.length > 0 && (
        <div className="hidden lg:block bg-slate-900/40 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Inbound Leads Velocity (30 Days)</h2>
          <AdminAreaChart data={daily} keys={['count']} />
        </div>
      )}

      {/* Main List Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading roofing leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">No leads match this filter</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Try adjusting your search query or clear the status filter to see all active inquiries.
          </p>
          <button
            onClick={() => {
              setStatus('all');
              setPriority('all');
              setSearch('');
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Mobile View: High-density touch cards */}
          <div className="lg:hidden space-y-3">
            {leads.map(lead => (
              <MobileLeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
            ))}
          </div>

          {/* Desktop View: Full data table */}
          <div className="hidden lg:block">
            <LeadsTable leads={leads} onStatusChange={handleStatusChange} />
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                p === page
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner'
                  : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
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

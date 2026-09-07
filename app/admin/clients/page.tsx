'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Hammer,
  DollarSign,
  Sparkles,
  Award,
  Filter,
} from 'lucide-react';
import MobileClientCard, { ClientListItem } from '@/components/admin/clients/MobileClientCard';
import ClientsTable from '@/components/admin/clients/ClientsTable';
import AddClientSheet from '@/components/admin/clients/AddClientSheet';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Clients' },
  { id: 'lead', label: 'Inquiries / Leads' },
  { id: 'opportunity', label: 'Proposals Out' },
  { id: 'active_job', label: 'Active Jobs' },
  { id: 'repeat', label: 'Repeat Customers' },
  { id: 'completed', label: 'Completed' },
];

export default function ClientsDirectoryPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [summary, setSummary] = useState({
    totalClients: 0,
    activeProjects: 0,
    leadCount: 0,
    totalLtv: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const fetchClients = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          sort,
        });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/admin/clients?${params.toString()}`);
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
          setSummary(data.summary || { totalClients: 0, activeProjects: 0, leadCount: 0, totalLtv: 0 });
        }
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, sort, statusFilter, search, router]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Handle URL ?new=1 or FAB trigger event
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
    window.addEventListener('crm:open-add-client', handleOpenAdd);
    return () => window.removeEventListener('crm:open-add-client', handleOpenAdd);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0B1E33] tracking-tight">Clients Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284C7] text-xs font-black border border-sky-200">
              360° Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete customer history, roof specs, estimates, jobs, invoices, and warranties
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchClients(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh clients list"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowAddSheet(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2F9FE3] to-[#1878B8] text-white font-bold text-xs shadow-xs hover:opacity-95 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Total Clients</span>
            <Users size={16} className="text-[#2F9FE3]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.totalClients.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime customer profiles</span>
        </div>

        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
            <span>Active Roofs</span>
            <Hammer size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.activeProjects}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Jobsites in production</span>
        </div>

        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-sky-700 text-xs font-bold mb-1">
            <span>Active Inquiries</span>
            <Sparkles size={16} className="text-[#2F9FE3]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.leadCount}
          </div>
          <span className="text-[11px] text-sky-600 font-medium mt-0.5 block">New leads & prospects</span>
        </div>

        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>Total Customer LTV</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            ${summary.totalLtv.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Cumulative collected cash</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, phone, email, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-[#0B1E33] placeholder:text-slate-400 shadow-2xs focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] outline-none"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs outline-none focus:border-[#2F9FE3] cursor-pointer"
            >
              <option value="recent">Recently Updated</option>
              <option value="ltv">Highest Lifetime Value ($)</option>
              <option value="name">Client Name (A-Z)</option>
              <option value="jobs">Most Projects</option>
              <option value="created">Newest Added</option>
            </select>
          </div>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-sky-50 text-[#0284C7] font-bold border border-sky-200 shadow-2xs'
                  : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Content: Mobile Cards + Desktop Table */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <RefreshCw size={24} className="mx-auto text-slate-400 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading clients directory...</p>
        </div>
      ) : clients.length > 0 ? (
        <>
          {/* Mobile Card Grid (screens < 1024px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3.5">
            {clients.map(client => (
              <MobileClientCard key={client.id} client={client} />
            ))}
          </div>

          {/* Desktop Table (screens >= 1024px) */}
          <div className="hidden lg:block">
            <ClientsTable clients={clients} />
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <Users size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">No clients found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {search || statusFilter !== 'all'
              ? 'Try changing your search query or status filter.'
              : 'When leads arrive from the website or are added in the CRM, their client profiles appear here automatically.'}
          </p>
          <button
            onClick={() => setShowAddSheet(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100"
          >
            <Plus size={14} />
            <span>Add New Client Profile</span>
          </button>
        </div>
      )}

      {/* Add Client Slide-out Bottom Sheet */}
      <AddClientSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onCreated={newClient => {
          fetchClients();
          if (newClient?.id) {
            router.push(`/admin/clients/${newClient.id}`);
          }
        }}
      />
    </div>
  );
}

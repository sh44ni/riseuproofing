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
  ClipboardCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import MobileClientCard, { ClientListItem } from '@/components/admin/clients/MobileClientCard';
import ClientsTable from '@/components/admin/clients/ClientsTable';
import AddClientSheet from '@/components/admin/clients/AddClientSheet';
import CustomSelect from '@/components/admin/shared/CustomSelect';

const LIFECYCLE_TABS = [
  { id: 'all', label: 'All Profiles', icon: Users, countKey: 'totalClients' },
  { id: 'leads', label: 'Leads', icon: Sparkles, countKey: 'leadsCount' },
  { id: 'new_clients', label: 'New Clients', icon: ClipboardCheck, countKey: 'newClientsCount' },
  { id: 'existing_clients', label: 'Existing Clients', icon: Hammer, countKey: 'existingClientsCount' },
  { id: 'lost_leads', label: 'Lost Leads', icon: UserX, countKey: 'lostLeadsCount' },
] as const;

export default function ClientsDirectoryPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [summary, setSummary] = useState({
    totalClients: 0,
    existingClientsCount: 0,
    newClientsCount: 0,
    leadsCount: 0,
    lostLeadsCount: 0,
    activeProjects: 0,
    leadCount: 0,
    totalLtv: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lifecycle stage tab & filters
  const [activeTab, setActiveTab] = useState<typeof LIFECYCLE_TABS[number]['id']>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const fetchClients = useCallback(
    async (silent = false, triggerSync = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          sort,
        });
        if (triggerSync) params.set('sync', 'true');
        if (activeTab !== 'all') params.set('category', activeTab);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/admin/clients?${params.toString()}`);
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
          setSummary(data.summary || {
            totalClients: 0,
            existingClientsCount: 0,
            newClientsCount: 0,
            leadsCount: 0,
            lostLeadsCount: 0,
            activeProjects: 0,
            leadCount: 0,
            totalLtv: 0,
          });
          if (triggerSync) {
            setSyncToast('Clients Directory dataflow synchronized in real-time');
            setTimeout(() => setSyncToast(null), 4000);
          }
        }
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, sort, activeTab, search, router]
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

  function handleTabClick(tabId: typeof activeTab) {
    setActiveTab(tabId);
    setPage(1);
  }

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
            4-tier customer lifecycle: inbound leads, active proposals, active job contracts, and lost leads
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchClients(true, true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Reconcile & Refresh Clients Dataflow"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#1878B8]' : ''} />
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

      {/* KPI Overview Ribbon (Structured across 4 lifecycle stages) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Existing Clients */}
        <div
          onClick={() => handleTabClick('existing_clients')}
          className={`admin-card p-4 sm:p-5 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all hover:border-emerald-300 ${
            activeTab === 'existing_clients' ? 'ring-2 ring-emerald-500/30 border-emerald-400 bg-emerald-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>Existing Clients</span>
            <Hammer size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.existingClientsCount.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-600 font-medium mt-1">
            <span>{summary.activeProjects} active jobsites</span>
            <span className="font-extrabold">${summary.totalLtv.toLocaleString()} LTV</span>
          </div>
        </div>

        {/* 2. New Clients */}
        <div
          onClick={() => handleTabClick('new_clients')}
          className={`admin-card p-4 sm:p-5 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all hover:border-purple-300 ${
            activeTab === 'new_clients' ? 'ring-2 ring-purple-500/30 border-purple-400 bg-purple-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold mb-1">
            <span>New Clients</span>
            <ClipboardCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.newClientsCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block truncate">
            Proposals out &amp; inspections scheduled
          </span>
        </div>

        {/* 3. Inbound Leads */}
        <div
          onClick={() => handleTabClick('leads')}
          className={`admin-card p-4 sm:p-5 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all hover:border-sky-300 ${
            activeTab === 'leads' ? 'ring-2 ring-sky-500/30 border-sky-400 bg-sky-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700 text-xs font-bold mb-1">
            <span>Inbound Leads</span>
            <Sparkles size={16} className="text-[#2F9FE3]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.leadsCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-sky-600 font-medium mt-1 block truncate">
            New inquiries awaiting inspection
          </span>
        </div>

        {/* 4. Lost Leads */}
        <div
          onClick={() => handleTabClick('lost_leads')}
          className={`admin-card p-4 sm:p-5 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all hover:border-rose-300 ${
            activeTab === 'lost_leads' ? 'ring-2 ring-rose-500/30 border-rose-400 bg-rose-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1">
            <span>Lost Leads</span>
            <UserX size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">
            {summary.lostLeadsCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block truncate">
            Disqualified or lost pre-contract
          </span>
        </div>
      </div>

      {/* Primary Lifecycle Stage Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-200/80">
        {LIFECYCLE_TABS.map(tab => {
          const Icon = tab.icon;
          const count = summary[tab.countKey as keyof typeof summary] || 0;
          const isActive = activeTab === tab.id;

          let activeStyle = 'bg-[#0B1E33] text-white border-[#0B1E33] shadow-2xs';
          let countBadgeStyle = 'bg-white/20 text-white';

          if (isActive) {
            if (tab.id === 'existing_clients') {
              activeStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-2xs';
              countBadgeStyle = 'bg-emerald-800 text-emerald-100';
            } else if (tab.id === 'new_clients') {
              activeStyle = 'bg-purple-600 text-white border-purple-700 shadow-2xs';
              countBadgeStyle = 'bg-purple-800 text-purple-100';
            } else if (tab.id === 'lost_leads') {
              activeStyle = 'bg-rose-600 text-white border-rose-700 shadow-2xs';
              countBadgeStyle = 'bg-rose-800 text-rose-100';
            } else if (tab.id === 'leads') {
              activeStyle = 'bg-[#0284C7] text-white border-sky-700 shadow-2xs';
              countBadgeStyle = 'bg-sky-800 text-sky-100';
            }
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? activeStyle
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                  isActive ? countBadgeStyle : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by client name, phone, email, or city..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-[#0B1E33] placeholder:text-slate-400 shadow-2xs focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] outline-none"
          />
        </div>

        {/* Sort selection */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <div className="w-48">
            <CustomSelect
              value={sort}
              onChange={val => {
                setSort(val);
                setPage(1);
              }}
              size="sm"
              variant="compact"
              options={[
                { value: 'recent', label: 'Recently Updated' },
                { value: 'ltv', label: 'Highest Lifetime Value ($)' },
                { value: 'name', label: 'Client Name (A-Z)' },
                { value: 'jobs', label: 'Most Projects' },
                { value: 'created', label: 'Newest Added' },
              ]}
            />
          </div>
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
          {activeTab === 'lost_leads' ? (
            <UserX size={32} className="mx-auto text-rose-300 mb-3" />
          ) : (
            <Users size={32} className="mx-auto text-slate-300 mb-3" />
          )}
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            {activeTab === 'lost_leads'
              ? 'No lost leads found'
              : activeTab === 'new_clients'
              ? 'No new clients in proposal/inspection stage'
              : activeTab === 'existing_clients'
              ? 'No existing clients found'
              : activeTab === 'leads'
              ? 'No inbound leads found'
              : 'No clients found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {search
              ? 'Try changing your search query.'
              : activeTab === 'lost_leads'
              ? 'When a lead is marked as lost before a contract is signed, it will appear here.'
              : activeTab === 'new_clients'
              ? 'Prospects with scheduled inspections or proposals sent will automatically appear here.'
              : activeTab === 'existing_clients'
              ? 'Clients with active jobsites, executed contracts, or completed work appear here.'
              : 'When leads arrive from the website or CRM, their customer profiles appear here automatically.'}
          </p>
          <button
            onClick={() => setShowAddSheet(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 cursor-pointer"
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

      {/* Real-Time Sync Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#0B1E33] text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xs font-bold text-white">
            {syncToast}
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

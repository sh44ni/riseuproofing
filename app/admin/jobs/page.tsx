'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Hammer,
  Search,
  Plus,
  RefreshCw,
  Home,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Truck,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import { KanbanSkeleton } from '@/components/admin/shared/AdminSkeletons';

export const STAGES = [
  { id: 'permit_pending', label: 'Permit Pending', color: 'border-sky-200 text-[#1878B8] bg-sky-50' },
  { id: 'material_order', label: 'Material Order', color: 'border-purple-200 text-purple-700 bg-purple-50' },
  { id: 'scheduled', label: 'Scheduled', color: 'border-cyan-200 text-cyan-700 bg-cyan-50' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-200 text-amber-800 bg-amber-50' },
  { id: 'punch_list', label: 'Punch List', color: 'border-orange-200 text-orange-800 bg-orange-50' },
  { id: 'final_inspection', label: 'Final Inspection', color: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
  { id: 'complete', label: 'Complete', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
];

interface Job {
  id: number;
  job_number: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  service_type?: string;
  contract_value: number;
  scheduled_start?: string;
  estimated_days?: number;
  crew_lead?: string;
  permit_status?: string;
  material_status?: string;
  created_at: string;
}

interface Summary {
  totalCount: number;
  activeCount: number;
  totalValue: number;
  activeValue: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [kanban, setKanban] = useState<Record<string, Job[]>>({});
  const [summary, setSummary] = useState<Summary>({ totalCount: 0, activeCount: 0, totalValue: 0, activeValue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual job form
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualService, setManualService] = useState('Residential Roofing');
  const [manualValue, setManualValue] = useState('18500');
  const [manualLead, setManualLead] = useState('Carlos');
  const [creating, setCreating] = useState(false);

  const router = useRouter();

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/jobs?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setKanban(data.kanban ?? {});
      setSummary(data.summary ?? { totalCount: 0, activeCount: 0, totalValue: 0, activeValue: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, router]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function handleStageChange(jobId: number, newStage: string) {
    // Optimistic update
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: newStage } : j)));
    setKanban(prev => {
      const copy: Record<string, Job[]> = {};
      for (const s of Object.keys(prev)) {
        copy[s] = prev[s].filter(j => j.id !== jobId);
      }
      const target = jobs.find(j => j.id === jobId);
      if (target) {
        if (!copy[newStage]) copy[newStage] = [];
        copy[newStage].push({ ...target, status: newStage });
      }
      return copy;
    });

    await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStage }),
    });

    loadJobs(true);
  }

  async function handleCreateManualJob(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: manualName,
          customerPhone: manualPhone,
          address: manualAddress,
          city: manualCity,
          serviceType: manualService,
          contractValue: manualValue,
          crewLead: manualLead,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setManualName('');
        setManualPhone('');
        setManualAddress('');
        loadJobs(true);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading && jobs.length === 0) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33] flex items-center gap-2">
            <Hammer size={24} className="text-[#2F9FE3]" />
            <span>Jobs Kanban Board</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Post-sale roofing operations: permits, supplier deliveries, scheduling &amp; inspections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadJobs(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-500 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#2F9FE3]' : ''} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="admin-btn-gold flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-[16px] p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Projects</p>
          <p className="text-2xl font-extrabold text-[#0B1E33] mt-1 tabular-nums">
            {summary.activeCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[16px] p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Work Value</p>
          <p className="text-2xl font-extrabold text-[#EAA636] mt-1 tabular-nums">
            ${Math.round(summary.activeValue).toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[16px] p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Jobs</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
            {summary.totalCount - summary.activeCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[16px] p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Contract Volume</p>
          <p className="text-2xl font-extrabold text-[#1878B8] mt-1 tabular-nums">
            ${Math.round(summary.totalValue).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Mobile Stage Selector */}
      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-[16px] border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, job number, address, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[#0B1E33] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F9FE3]/20 focus:border-[#2F9FE3]"
          />
        </div>

        {/* Mobile Stage Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-50 text-[#1878B8] border border-sky-200 shadow-xs'
                : 'text-slate-600 border border-slate-200 hover:text-[#0B1E33] bg-white'
            }`}
          >
            All Stages ({jobs.length})
          </button>
          {STAGES.map(s => {
            const count = kanban[s.id]?.length || 0;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === s.id
                    ? 'bg-sky-50 text-[#1878B8] border border-sky-200 shadow-xs'
                    : 'text-slate-600 border border-slate-200 hover:text-[#0B1E33] bg-white'
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Kanban Board ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading roofing jobs...</p>
        </div>
      ) : (
        <>
          {/* Mobile View: High density list filtered by stage tab */}
          <div className="lg:hidden space-y-3">
            {jobs
              .filter(j => activeTab === 'all' || j.status === activeTab)
              .map(job => (
                <JobCard key={job.id} job={job} onStageChange={handleStageChange} />
              ))}
            {jobs.filter(j => activeTab === 'all' || j.status === activeTab).length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-[16px] border border-slate-200/80">
                No jobs in this stage.
              </div>
            )}
          </div>

          {/* Desktop View: 7-Column Horizontal Kanban */}
          <div className="hidden lg:grid grid-cols-7 gap-3 overflow-x-auto min-w-[1300px] pb-4">
            {STAGES.map(stage => {
              const stageJobs = kanban[stage.id] || [];

              return (
                <div
                  key={stage.id}
                  className="bg-slate-100/60 border border-slate-200/80 rounded-[16px] p-3 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3">
                    <span className="text-xs font-bold text-slate-700 truncate">{stage.label}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200/80 text-[#1878B8] shadow-2xs">
                      {stageJobs.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageJobs.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-[11px] text-slate-400 italic">
                        Empty
                      </div>
                    ) : (
                      stageJobs.map(job => (
                        <JobCard key={job.id} job={job} onStageChange={handleStageChange} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Manual Job Modal */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Roofing Project"
        subtitle="Manually create an active job or project outside standard proposals"
      >
        <form onSubmit={handleCreateManualJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Gonzalez"
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              className="admin-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="(760) 000-0000"
                value={manualPhone}
                onChange={e => setManualPhone(e.target.value)}
                className="admin-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contract Value ($)</label>
              <input
                type="number"
                value={manualValue}
                onChange={e => setManualValue(e.target.value)}
                className="admin-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input
                type="text"
                placeholder="1234 Main St"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                className="admin-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
              <input
                type="text"
                placeholder="Carlsbad"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                className="admin-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service</label>
              <select
                value={manualService}
                onChange={e => setManualService(e.target.value)}
                className="admin-input text-sm"
              >
                <option value="Residential Roofing">Residential Roofing</option>
                <option value="Tile Roof Relay">Tile Roof Relay</option>
                <option value="Commercial TPO">Commercial TPO</option>
                <option value="Leak Repair">Leak Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Crew Lead</label>
              <input
                type="text"
                value={manualLead}
                onChange={e => setManualLead(e.target.value)}
                className="admin-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="admin-btn-gold w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Hammer size={16} />
            {creating ? 'Creating Job...' : 'Create Job Record'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}

function JobCard({
  job,
  onStageChange,
}: {
  job: Job;
  onStageChange: (id: number, newStage: string) => void;
}) {
  return (
    <div className="bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 rounded-[16px] p-3.5 space-y-2.5 shadow-xs transition-all group">
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[10px] font-bold text-[#1878B8] tracking-wide">
          {job.job_number}
        </span>
        <select
          value={job.status}
          onChange={e => onStageChange(job.id, e.target.value)}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer outline-none focus:border-[#2F9FE3]"
        >
          {STAGES.map(s => (
            <option key={s.id} value={s.id} className="bg-white text-[#0B1E33]">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Link href={`/admin/jobs/${job.id}`} className="block">
        <h4 className="text-[#0B1E33] font-bold text-sm truncate group-hover:text-[#1878B8] transition-colors">
          {job.customer_name}
        </h4>
        {job.address && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {job.address}{job.city ? `, ${job.city}` : ''}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <span className="font-black text-[#0B1E33] tabular-nums">
          ${Number(job.contract_value).toLocaleString()}
        </span>

        {job.crew_lead && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <User size={10} className="text-[#EAA636]" />
            {job.crew_lead}
          </span>
        )}
      </div>
    </div>
  );
}

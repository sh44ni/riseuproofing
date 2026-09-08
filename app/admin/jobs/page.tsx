'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  GitFork,
  ArrowRight,
  Info,
  AlertCircle,
  ChevronsUpDown,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import { KanbanSkeleton } from '@/components/admin/shared/AdminSkeletons';
import CustomSelect from '@/components/admin/shared/CustomSelect';

export const STAGES = [
  { id: 'permit_pending', label: 'Permit Pending', color: 'border-sky-200 text-[#1878B8] bg-sky-50' },
  { id: 'material_order', label: 'Material Order', color: 'border-purple-200 text-purple-700 bg-purple-50' },
  { id: 'scheduled', label: 'Scheduled', color: 'border-cyan-200 text-cyan-700 bg-cyan-50' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-200 text-amber-800 bg-amber-50' },
  { id: 'punch_list', label: 'Punch List', color: 'border-orange-200 text-orange-800 bg-orange-50' },
  { id: 'final_inspection', label: 'Final Inspection', color: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
  { id: 'complete', label: 'Complete', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
];

const SERVICE_OPTIONS = [
  { value: 'Residential Roofing', label: 'Residential Roofing', badge: 'Shingle/Tile', badgeColor: 'sky' as const },
  { value: 'Tile Roof Relay', label: 'Tile Roof Relay', badge: 'Specialty', badgeColor: 'amber' as const },
  { value: 'Commercial TPO', label: 'Commercial TPO', badge: 'Commercial', badgeColor: 'purple' as const },
  { value: 'Leak Repair', label: 'Leak Repair', badge: 'Service', badgeColor: 'rose' as const },
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

interface LeadOption {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  service_type: string | null;
  estimated_value: number;
  pipeline_stage: string;
  lead_score: number;
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

  // Manual job form with mandatory lead selection
  const [leadsList, setLeadsList] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [jobFormError, setJobFormError] = useState<string | null>(null);

  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualService, setManualService] = useState('Residential Roofing');
  const [manualValue, setManualValue] = useState('18500');
  const [manualLead, setManualLead] = useState('Carlos');
  const [creating, setCreating] = useState(false);

  const router = useRouter();

  // Load leads when opening the Add Job modal
  useEffect(() => {
    if (!showAddModal) {
      setSelectedLead(null);
      setLeadSearch('');
      setLeadDropdownOpen(false);
      setJobFormError(null);
      return;
    }

    setLoadingLeads(true);
    fetch('/api/admin/leads?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.leads) {
          setLeadsList(data.leads);
        }
      })
      .catch(err => console.error('Failed to load leads for job creation', err))
      .finally(() => setLoadingLeads(false));
  }, [showAddModal]);

  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leadsList;
    const q = leadSearch.toLowerCase().trim();
    return leadsList.filter(l =>
      (l.full_name && l.full_name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q)) ||
      (l.address && l.address.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      String(l.id).includes(q)
    );
  }, [leadsList, leadSearch]);

  function handleSelectLead(lead: LeadOption) {
    setSelectedLead(lead);
    setManualName(lead.full_name || '');
    setManualPhone(lead.phone || '');
    setManualAddress(lead.address || '');
    setManualCity(lead.city || 'San Diego');
    if (lead.service_type) setManualService(lead.service_type);
    if (lead.estimated_value && Number(lead.estimated_value) > 0) {
      setManualValue(String(lead.estimated_value));
    }
    setLeadDropdownOpen(false);
    setLeadSearch('');
    setJobFormError(null);
  }

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
    if (!selectedLead) {
      setJobFormError('Please select a sales pipeline lead first.');
      return;
    }
    if (!manualName) return;

    setCreating(true);
    setJobFormError(null);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          customerName: manualName,
          customerPhone: manualPhone,
          address: manualAddress,
          city: manualCity,
          serviceType: manualService,
          contractValue: manualValue,
          crewLead: manualLead,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJobFormError(data.error || 'Failed to create job');
        return;
      }

      setShowAddModal(false);
      setSelectedLead(null);
      setManualName('');
      setManualPhone('');
      setManualAddress('');
      loadJobs(true);
    } catch (err: any) {
      setJobFormError(err.message || 'Server error creating job');
    } finally {
      setCreating(false);
    }
  }

  if (loading && jobs.length === 0) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 5-Stage Sales Pipeline Announcement Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-sky-500/10 border border-emerald-300/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs shrink-0">
            <GitFork size={18} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Looking for the Unified Sales & Operations Pipeline?</span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              View the end-to-end customer journey from Inbound Lead to Initial Contact, 12-Pt Estimate, Closing, and Production.
            </p>
          </div>
        </div>
        <Link
          href="/admin/pipeline"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
        >
          <span>Open Sales Pipeline</span>
          <ArrowRight size={14} />
        </Link>
      </div>

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
          {/* Tip Callout */}
          <div className="p-3 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Required Step:</span> Every roofing project must be linked to an existing Sales Pipeline lead to guarantee customer history, proposal correlation, and client revenue tracking. Please select a lead first.
            </div>
          </div>

          {/* Form Error Notice */}
          {jobFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{jobFormError}</span>
            </div>
          )}

          {/* Step 1: Lead Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>1. Select Sales Pipeline Lead <span className="text-rose-500">*</span></span>
              {selectedLead && (
                <span className="text-[10px] font-normal text-slate-500">
                  Lead #{selectedLead.id} selected
                </span>
              )}
            </label>

            {selectedLead ? (
              <div className="p-3 bg-sky-500/10 border border-sky-300/80 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-[#0B1E33] truncate">
                      {selectedLead.full_name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                      #{selectedLead.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {selectedLead.phone || 'No phone'} • {selectedLead.address || selectedLead.city || 'San Diego'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLead(null);
                    setLeadDropdownOpen(true);
                  }}
                  className="shrink-0 text-xs font-semibold text-[#1878B8] hover:text-[#0B1E33] underline cursor-pointer"
                >
                  Change Lead
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, address, or lead #..."
                    value={leadSearch}
                    onChange={e => {
                      setLeadSearch(e.target.value);
                      setLeadDropdownOpen(true);
                    }}
                    onFocus={() => setLeadDropdownOpen(true)}
                    className="admin-input pl-9 text-xs"
                  />
                </div>

                {leadDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                    {loadingLeads ? (
                      <div className="p-3 text-center text-xs text-slate-400">Loading pipeline leads...</div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-slate-500 space-y-1.5">
                        <p>No leads matched &ldquo;{leadSearch}&rdquo;.</p>
                        <Link
                          href="/admin/leads?new=true"
                          className="inline-block text-xs font-bold text-[#1878B8] hover:underline"
                        >
                          + Create New Lead First
                        </Link>
                      </div>
                    ) : (
                      filteredLeads.map((l: LeadOption) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => handleSelectLead(l)}
                          className="w-full text-left p-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0B1E33] truncate flex items-center gap-1.5">
                              <span>{l.full_name}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">#{l.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {l.phone || 'No phone'} {l.address ? `• ${l.address}` : ''}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {l.estimated_value && Number(l.estimated_value) > 0 ? (
                              <div className="text-[11px] font-bold text-emerald-700">
                                ${Number(l.estimated_value).toLocaleString()}
                              </div>
                            ) : null}
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                              {l.pipeline_stage ? l.pipeline_stage.replace('stage_', 'S') : 'Lead'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Auto-populated / Editable Job Parameters */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
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
                <CustomSelect
                  label="Service"
                  value={manualService}
                  onChange={setManualService}
                  options={SERVICE_OPTIONS}
                  size="sm"
                />
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
          </div>

          <button
            type="submit"
            disabled={!selectedLead || creating}
            className="admin-btn-gold w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Hammer size={16} />
            {creating ? 'Creating Job...' : !selectedLead ? 'Select a Lead Above to Create Job' : 'Create Job Record'}
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
        <div className="relative">
          <select
            value={job.status}
            onChange={e => onStageChange(job.id, e.target.value)}
            className="text-[10px] font-bold pl-2.5 pr-6 py-0.5 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 cursor-pointer outline-none focus:border-[#2F9FE3] transition-colors appearance-none shadow-2xs"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            {STAGES.map(s => (
              <option key={s.id} value={s.id} className="bg-white text-[#0B1E33]">
                {s.label}
              </option>
            ))}
          </select>
        </div>
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

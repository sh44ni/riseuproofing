'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GitFork,
  Search,
  RefreshCw,
  Zap,
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Hammer,
  CheckCircle2,
  LayoutGrid,
  ListFilter,
  Calendar,
  Phone,
  FileText,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PipelineLead, PipelineStage, PIPELINE_STAGES } from '@/app/api/admin/pipeline/route';
import PipelineCard from '@/components/admin/pipeline/PipelineCard';
import StageTransitionModal from '@/components/admin/pipeline/StageTransitionModal';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge from '@/components/admin/shared/RoleBadge';

interface StageMeta {
  id: PipelineStage;
  stageNum: number;
  title: string;
  subtitle: string;
  badgeColor: string;
  columnBg: string;
  borderColor: string;
  headerBg: string;
}

const STAGE_CONFIGS: StageMeta[] = [
  {
    id: 'stage_1_lead_gen',
    stageNum: 1,
    title: 'Lead Generation',
    subtitle: 'Social, Ads, Canvassing, Referrals & Website',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    columnBg: 'bg-sky-50/30',
    borderColor: 'border-sky-200',
    headerBg: 'bg-gradient-to-r from-sky-50 to-sky-100/60',
  },
  {
    id: 'stage_2_initial_contact',
    stageNum: 2,
    title: 'Initial Contact',
    subtitle: '24–48h SLA: Call/SMS, Address & Book Visit',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    columnBg: 'bg-cyan-50/30',
    borderColor: 'border-cyan-200',
    headerBg: 'bg-gradient-to-r from-cyan-50 to-cyan-100/60',
  },
  {
    id: 'stage_3_site_visit_estimate',
    stageNum: 3,
    title: 'Site Visit + Estimate',
    subtitle: '12-Point Roof Inspection & Detailed Quote',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    columnBg: 'bg-purple-50/30',
    borderColor: 'border-purple-200',
    headerBg: 'bg-gradient-to-r from-purple-50 to-purple-100/60',
  },
  {
    id: 'stage_4_closing',
    stageNum: 4,
    title: 'Closing',
    subtitle: '48h Follow-up, Discounts, Financing & Agreement',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    columnBg: 'bg-amber-50/30',
    borderColor: 'border-amber-200',
    headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100/60',
  },
  {
    id: 'stage_5_completion_followup',
    stageNum: 5,
    title: 'Job Completion',
    subtitle: 'Production, Photos, 50-Yr Warranty & 5★ Review',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    columnBg: 'bg-emerald-50/30',
    borderColor: 'border-emerald-200',
    headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/60',
  },
];

export default function PipelinePage() {
  const router = useRouter();

  // Data states
  const [stages, setStages] = useState<Record<PipelineStage, PipelineLead[]>>({
    stage_1_lead_gen: [],
    stage_2_initial_contact: [],
    stage_3_site_visit_estimate: [],
    stage_4_closing: [],
    stage_5_completion_followup: [],
  });

  const [summary, setSummary] = useState({
    total_leads: 0,
    total_pipeline_value: 0,
    unassigned_count: 0,
    sla_health_pct: 100,
    active_installations: 0,
  });

  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; role: string; avatar_url: string | null }>>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters and views
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'unassigned'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & drop state
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalLead, setActiveModalLead] = useState<PipelineLead | null>(null);
  const [modalActionType, setModalActionType] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch pipeline data
  const loadPipeline = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();

      if (activeTab === 'unassigned') {
        params.set('assigned_to', 'unassigned');
      } else if (activeTab === 'my') {
        params.set('assigned_to', 'me');
      } else if (selectedStaffId !== 'all') {
        params.set('assigned_to', selectedStaffId);
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/pipeline?${params.toString()}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setStages(data.stages);
        setSummary(data.summary);
        setUsers(data.users || []);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      }
    } catch (err) {
      console.error('Error fetching pipeline data:', err);
      showToast('Failed to load pipeline data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedStaffId, searchQuery, router]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  // 1-Click Claim handler
  const handleClaim = async (leadId: number) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Lead successfully claimed & assigned to you! ⚡');
        loadPipeline(true);
      } else {
        showToast(data.error || 'Failed to claim lead', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error claiming lead', 'error');
    }
  };

  // Assign / Reassign handler
  const handleAssign = async (leadId: number, targetUserId: number | null) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(targetUserId ? `Assigned to ${data.assigned_to?.name || 'Staff'}` : 'Moved to Unassigned Pool');
        loadPipeline(true);
      } else {
        showToast(data.error || 'Failed to assign lead', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error assigning lead', 'error');
    }
  };

  // Stage change handler (Drag & Drop or button)
  const handleStageChange = async (leadId: number, newStage: PipelineStage, metadata?: any) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stage: newStage, metadata }),
      });
      const data = await res.json();
      if (data.ok) {
        const claimNote = data.auto_claimed ? ' (auto-claimed to you)' : '';
        const jobNote = data.job ? ` • Job #${data.job.job_number} created!` : '';
        showToast(`Moved to ${newStage.replace(/stage_\d+_/, '').replace(/_/g, ' ')}${claimNote}${jobNote}`);
        loadPipeline(true);
      } else {
        showToast(data.error || 'Failed to update stage', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating stage', 'error');
    }
  };

  // Action execution handler
  const handleExecuteAction = async (leadId: number, actionType: string, payload: any) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, payload }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Action executed successfully!`);
        loadPipeline(true);
      } else {
        showToast(data.error || 'Failed to execute action', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing action', 'error');
    }
  };

  const handleOpenActionModal = (lead: PipelineLead, actionType: string) => {
    setActiveModalLead(lead);
    setModalActionType(actionType);
    setModalOpen(true);
  };

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Flattened leads for table view
  const allLeadsList = Object.values(stages).flat();

  return (
    <div className="space-y-5 pb-16">
      {/* ── TOAST ALERT BANNER ── */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── EXECUTIVE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Sales & Operations Pipeline
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Official 5-Stage Customer Journey &bull; Unassigned Hopper &bull; 24–48h SLA Enforcement
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Table View
            </button>
          </div>

          <button
            onClick={() => loadPipeline(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── EXECUTIVE METRICS STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Pipeline Value */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pipeline Value</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900">
            {formatMoney(summary.total_pipeline_value)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across <strong>{summary.total_leads}</strong> active customer journeys
          </div>
        </div>

        {/* Metric 2: 24-48h SLA Health */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">24–48h SLA Health</span>
            <div className={`p-1.5 rounded-lg ${summary.sla_health_pct >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl md:text-2xl font-black ${summary.sla_health_pct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {summary.sla_health_pct}%
            </span>
            <span className="text-xs font-semibold text-slate-400">On Track</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.sla_health_pct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${summary.sla_health_pct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Unassigned Inbound Hopper */}
        <div
          onClick={() => setActiveTab('unassigned')}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            activeTab === 'unassigned'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
              : summary.unassigned_count > 0
              ? 'bg-amber-50/60 border-amber-200 text-amber-950 hover:bg-amber-100/60'
              : 'bg-white border-slate-200/90 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'unassigned' ? 'text-white' : 'text-amber-800'}`}>
              Unassigned Pool
            </span>
            <div className={`p-1.5 rounded-lg ${activeTab === 'unassigned' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-black ${activeTab === 'unassigned' ? 'text-white' : 'text-amber-900'}`}>
            {summary.unassigned_count}
          </div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'unassigned' ? 'text-amber-100' : 'text-amber-700'}`}>
            {summary.unassigned_count > 0 ? '⚡ Needs rep self-claim or dispatch' : 'All leads assigned'}
          </div>
        </div>

        {/* Metric 4: Stage 5 Installations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Installations</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Hammer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900">
            {summary.active_installations}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Stage 5 roofs under active field production
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedStaffId('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' && selectedStaffId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Prospects ({summary.total_leads})
          </button>

          <button
            onClick={() => {
              setActiveTab('my');
              setSelectedStaffId('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Assigned Leads
          </button>

          <button
            onClick={() => {
              setActiveTab('unassigned');
              setSelectedStaffId('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/70'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Unassigned Pool ({summary.unassigned_count})
          </button>
        </div>

        {/* Staff Filter Dropdown & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              setActiveTab('all');
            }}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 font-semibold focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Filter by Staff Member...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role?.replace('_', ' ')})
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads, address, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none w-48 lg:w-60"
            />
          </div>
        </div>
      </div>

      {/* ── VIEW MODE: 5-COLUMN KANBAN BOARD ── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 items-start">
          {STAGE_CONFIGS.map((stageMeta) => {
            const stageLeads = stages[stageMeta.id] || [];
            const stageTotalValue = stageLeads.reduce(
              (acc, l) => acc + (l.contract_value || l.estimate_total || l.estimated_value || 12500),
              0
            );
            const isTarget = dragOverStage === stageMeta.id;

            return (
              <div
                key={stageMeta.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stageMeta.id) {
                    setDragOverStage(stageMeta.id);
                  }
                }}
                onDragLeave={() => {
                  setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  try {
                    const payload = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (payload.leadId && payload.currentStage !== stageMeta.id) {
                      handleStageChange(payload.leadId, stageMeta.id);
                    }
                  } catch (err) {
                    console.error('Drag drop error:', err);
                  }
                }}
                className={`rounded-2xl border transition-all duration-200 flex flex-col min-h-[600px] ${
                  stageMeta.borderColor
                } ${stageMeta.columnBg} ${
                  isTarget ? 'ring-2 ring-amber-500 bg-amber-50/40 border-amber-400' : ''
                }`}
              >
                {/* Stage Header */}
                <div className={`p-3.5 rounded-t-2xl border-b ${stageMeta.borderColor} ${stageMeta.headerBg}`}>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${stageMeta.badgeColor}`}>
                        {stageMeta.stageNum}
                      </span>
                      <h2 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                        {stageMeta.title}
                      </h2>
                    </div>

                    <span className="text-xs font-black text-slate-700 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                    {stageMeta.subtitle}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 font-semibold text-slate-600">
                    <span>Volume</span>
                    <span className="text-slate-900 font-bold">{formatMoney(stageTotalValue)}</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageLeads.length === 0 ? (
                    <div className="h-40 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                      <p className="font-semibold">No prospects</p>
                      <p className="text-[10px] mt-0.5">Drag cards here to advance</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <PipelineCard
                        key={lead.id}
                        lead={lead}
                        users={users}
                        currentUserId={currentUser?.id}
                        onClaim={handleClaim}
                        onAssign={handleAssign}
                        onStageChange={handleStageChange}
                        onOpenActionModal={handleOpenActionModal}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW MODE: DENSE TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider border-b border-slate-200">
                  <th className="p-3.5">Homeowner</th>
                  <th className="p-3.5">Pipeline Stage</th>
                  <th className="p-3.5">Assigned Staff</th>
                  <th className="p-3.5">Sourced By</th>
                  <th className="p-3.5">SLA / Status</th>
                  <th className="p-3.5 text-right">Value ($)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allLeadsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                      No customer journeys match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  allLeadsList.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Homeowner Name & Contact */}
                      <td className="p-3.5">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="font-bold text-slate-900 hover:text-amber-600"
                        >
                          {lead.full_name}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {lead.phone || lead.email || 'No contact'} &bull; {lead.city || 'Bay Area'}
                        </div>
                      </td>

                      {/* Pipeline Stage Picker */}
                      <td className="p-3.5">
                        <select
                          value={lead.pipeline_stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                          className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 focus:outline-none"
                        >
                          {STAGE_CONFIGS.map((s) => (
                            <option key={s.id} value={s.id}>
                              Stage {s.stageNum}: {s.title}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Assigned Staff with 1-click Claim */}
                      <td className="p-3.5">
                        {!lead.assigned_to_user_id ? (
                          <button
                            onClick={() => handleClaim(lead.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all shadow-2xs"
                          >
                            <Zap className="w-3 h-3 fill-white" />
                            Claim Lead
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={lead.assigned_to_name}
                              avatarUrl={lead.assigned_to_avatar}
                              role={lead.assigned_to_role}
                              size="xs"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{lead.assigned_to_name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {lead.assigned_to_role?.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Sourced By */}
                      <td className="p-3.5 text-slate-600">
                        {lead.source_type === 'team_member' ? (
                          <span className="font-medium text-blue-700">
                            🚪 {lead.created_by_name || 'Door Knocker'}
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            🌐 {lead.lead_source_detail || 'Website Inbound'}
                          </span>
                        )}
                      </td>

                      {/* SLA / Status */}
                      <td className="p-3.5">
                        {lead.pipeline_stage === 'stage_2_initial_contact' ? (
                          lead.initial_contacted_at ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              Contacted
                            </span>
                          ) : lead.sla_status === 'breached' ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded animate-pulse">
                              SLA Breached
                            </span>
                          ) : (
                            <span className="text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">
                              {lead.sla_hours_remaining}h SLA
                            </span>
                          )
                        ) : (
                          <span className="capitalize text-slate-500 font-medium">
                            {lead.status}
                          </span>
                        )}
                      </td>

                      {/* Value */}
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatMoney(lead.contract_value || lead.estimate_total || lead.estimated_value || 12500)}
                      </td>

                      {/* Quick Action Button */}
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                        >
                          View 360 <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTION MODAL ── */}
      <StageTransitionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveModalLead(null);
          setModalActionType(null);
        }}
        lead={activeModalLead}
        actionType={modalActionType}
        users={users}
        onExecuteAction={handleExecuteAction}
      />
    </div>
  );
}

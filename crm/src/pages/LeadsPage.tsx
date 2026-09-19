import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  Eye,
  TrendingUp,
  Download,
  Users,
  Zap,
  PhoneCall,
  CalendarCheck,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Home,
  CheckCircle2,
  Calendar,
  LayoutList,
  LayoutGrid,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  Lock,
  ArrowUpRight,
  Send,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CreateLeadModal, CreateLeadPayload } from '@/components/pipeline/CreateLeadModal';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';
import { useLeads } from '@/hooks/useLeads';

export interface Lead {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  service: string;
  serviceColor: 'sky' | 'amber' | 'blue' | 'coral' | 'purple' | 'emerald';
  score?: number; // deprecated
  status: 'new_lead' | 'contacted' | 'inspection_scheduled' | 'proposal_sent' | 'contract_won' | 'lost';
  source: string; // 'website' | 'manual'
  sourceLabel: string;
  leadSourceDetail?: string;
  isClaimed?: boolean;
  claimedBy?: string;
  createdByName?: string;
  value: number; // estimated deal value
  squares?: number; // roof squares
  pitch?: string; // pitch slope e.g. 6/12
  assignedRep: string;
  repInitials: string;
  createdAt: string;
  speedToCall?: string; // initial response time
  lossReason?: 'competitor_price' | 'ghosted' | 'postponed' | 'diy_handyman' | 'financing_denied' | 'out_of_area';
  lossNotes?: string;
  lostDate?: string;
  tags?: string[];
  notes?: string;
}

const LOSS_REASONS: Record<
  string,
  { label: string; icon: string; badgeClass: string; desc: string }
> = {
  competitor_price: {
    label: 'Competitor Price',
    icon: '📉',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    desc: 'Lost to lower bidding roofing contractor',
  },
  ghosted: {
    label: 'Ghosted / Unresponsive',
    icon: '👻',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300/80',
    desc: 'Homeowner ceased communication after outreach',
  },
  postponed: {
    label: 'Project Postponed',
    icon: '⏸',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    desc: 'Delayed due to budget, solar install, or timing',
  },
  diy_handyman: {
    label: 'DIY / Handyman',
    icon: '🔨',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
    desc: 'Decided to patch without certified roofer',
  },
  financing_denied: {
    label: 'Financing Denied',
    icon: '💳',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    desc: 'Home improvement roofing loan rejected',
  },
  out_of_area: {
    label: 'Out of Area',
    icon: '📍',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    desc: 'Beyond operating service radius in North County',
  },
};

export function LeadsPage() {
  const { user } = useAuth();
  const {
    leads,
    totalCount,
    counts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    createLead,
    advanceStage,
    markAsLost,
    reactivateLead,
    addNote,
  } = useLeads();
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedLossReason, setSelectedLossReason] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'value' | 'speed'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals & Inspection Drawer
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'source' | 'rep' | 'service' | 'loss' | 'sort' | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Outside click for filter dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K focuses search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate statistics from full dataset API counts (falling back to in-memory leads array)
  const totalLeads = counts?.all || totalCount || leads.length;
  const activeLeadsCount = counts?.leads ?? leads.filter((l) => l.status !== 'lost').length;
  const lostLeadsCount = counts?.lost_leads ?? leads.filter((l) => l.status === 'lost').length;
  const wonCount = counts?.new_clients ?? leads.filter((l) => l.status === 'contract_won').length;

  const activeLeads = leads.filter((l) => l.status !== 'lost');
  const lostLeads = leads.filter((l) => l.status === 'lost');
  const totalIntakeValue = activeLeads.reduce((acc, l) => acc + l.value, 0);
  const totalLostValue = lostLeads.reduce((acc, l) => acc + l.value, 0);
  const inspectionBookedCount = leads.filter((l) => l.status === 'inspection_scheduled').length;
  const lostRate = totalLeads > 0 ? Math.round((lostLeadsCount / totalLeads) * 100) : 0;
  // Avg deal value only from leads with a real estimated value
  const leadsWithValue = activeLeads.filter((l) => l.value > 0);
  const avgDealValue = leadsWithValue.length > 0 ? Math.round(totalIntakeValue / leadsWithValue.length) : 0;
  const wonRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  // Derive rep list from real DB data (no hardcoded names)
  const repOptions = useMemo(() => [
    'all',
    ...Array.from(new Set(leads.map((l) => l.assignedRep).filter(Boolean))).sort(),
  ], [leads]);

  // Derive service list from real DB data (no hardcoded list)
  const serviceOptions = useMemo(() => [
    'all',
    ...Array.from(new Set(leads.map((l) => l.service).filter(Boolean))).sort(),
  ], [leads]);

  // Filtered Leads
  const filteredLeads = leads
    .filter((lead) => {
      // Stage filter
      if (activeStage === 'lost' && lead.status !== 'lost') return false;
      if (activeStage !== 'all' && activeStage !== 'lost' && lead.status !== activeStage) return false;

      // Source filter
      if (selectedSource !== 'all') {
        if (selectedSource === 'website' && lead.source !== 'website') return false;
        if (selectedSource === 'manual' && lead.source !== 'manual') return false;
        if (selectedSource !== 'website' && selectedSource !== 'manual' && lead.source !== selectedSource) return false;
      }

      // Rep filter
      if (selectedRep !== 'all' && lead.assignedRep !== selectedRep) return false;

      // Service filter
      if (selectedService !== 'all' && lead.service !== selectedService) return false;

      // Loss Reason filter
      if (selectedLossReason !== 'all') {
        if (lead.status !== 'lost' || lead.lossReason !== selectedLossReason) return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesPhone = lead.phone.toLowerCase().includes(query);
        const matchesEmail = lead.email.toLowerCase().includes(query);
        const matchesCity = lead.city.toLowerCase().includes(query);
        const matchesAddress = lead.address.toLowerCase().includes(query);
        const matchesService = lead.service.toLowerCase().includes(query);
        const matchesSource = lead.sourceLabel.toLowerCase().includes(query);
        const matchesLoss = lead.lossReason && LOSS_REASONS[lead.lossReason]?.label.toLowerCase().includes(query);
        return (
          matchesName ||
          matchesPhone ||
          matchesEmail ||
          matchesCity ||
          matchesAddress ||
          matchesService ||
          matchesSource ||
          matchesLoss
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      if (sortBy === 'speed') return (a.speedToCall || '').localeCompare(b.speedToCall || '');
      return 0; // default order
    });

  // Keep inspectLead in sync with live leads updates
  useEffect(() => {
    if (inspectLead) {
      const found = leads.find((l) => l.id === inspectLead.id);
      if (found) {
        setInspectLead(found);
      }
    }
  }, [leads]);

  // Action: Add Lead (created once in CreateLeadModal, refresh live store)
  const handleCreateLead = async (_payload: CreateLeadPayload) => {
    try {
      await refresh();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to refresh leads after creation:', err);
    }
  };

  // Action: Mark as Lost
  const handleMarkAsLost = async (
    leadId: string | number,
    reason: NonNullable<Lead['lossReason']>,
    lossNotes?: string
  ) => {
    try {
      await markAsLost(leadId, reason, lossNotes);
    } catch (err) {
      console.error('Failed to mark lead as lost:', err);
    }
  };

  // Action: Reactivate Lead
  const handleReactivateLead = async (leadId: string | number) => {
    try {
      await reactivateLead(leadId);
    } catch (err) {
      console.error('Failed to reactivate lead:', err);
    }
  };

  // Action: Advance Stage
  const handleAdvanceStage = async (leadId: string | number, nextStage: Lead['status']) => {
    try {
      await advanceStage(leadId, nextStage);
    } catch (err) {
      console.error('Failed to advance stage:', err);
    }
  };

  // Action: Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'Address',
      'City',
      'Service',
      'Status',
      'Source',
      'Value',
      'Assigned Rep',
      'Loss Reason',
      'Created At',
    ];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.address}"`,
      `"${l.city}"`,
      `"${l.service}"`,
      l.status,
      `"${l.sourceLabel}"`,
      l.value,
      `"${l.assignedRep}"`,
      l.lossReason ? `"${LOSS_REASONS[l.lossReason]?.label || l.lossReason}"` : '""',
      `"${l.createdAt}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rise_up_leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper colors for service badges
  const getServiceBadgeClass = (color: string) => {
    switch (color) {
      case 'sky':
        return 'bg-sky-100/90 text-[#0284c7] border border-sky-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'amber':
        return 'bg-amber-100/90 text-amber-900 border border-[#F9C500]/70 font-bold shadow-2xs backdrop-blur-xs';
      case 'blue':
        return 'bg-blue-100/90 text-blue-900 border border-blue-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'coral':
        return 'bg-rose-100/90 text-rose-900 border border-rose-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'purple':
        return 'bg-purple-100/90 text-purple-900 border border-purple-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'emerald':
        return 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 font-bold shadow-2xs backdrop-blur-xs';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300 font-bold shadow-2xs';
    }
  };

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto select-none pb-12">
      {/* ========================================================
          1. HERO INTAKE BANNER WITH INTEGRATED SEARCH & ACTIONS
          ======================================================== */}
      <CrmPageHero
        pageId="leads"
        defaultEyebrow="Intake & Conversion Pipeline • North County San Diego"
        defaultTitle="LEADS & INTAKE DIRECTORY"
        defaultSubtitle="Live homeowner inquiries, fast dispatch SLAs, and loss root-cause intelligence."
        showSearch={true}
        searchPlaceholder="Search leads, phones, addresses, cities, loss reasons..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        searchRef={searchInputRef}
        topRightActions={
          <div className="flex items-center gap-2">
            {/* Refresh Live Data */}
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isRefreshing}
              title="Refresh leads from PostgreSQL backend"
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl liquid-glass-btn text-xs font-bold text-slate-800 shadow-2xs hover:border-sky-400 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-slate-600 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl liquid-glass-btn text-xs font-bold text-slate-800 shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
            >
              <Download size={13} className="text-slate-600" />
              <span>Export CSV</span>
            </button>

            {/* New Lead Button */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-[#1878B8] via-[#0284c7] to-[#38bdf8] text-white text-xs font-bold shadow-md shadow-sky-500/25 hover:shadow-lg hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-sky-300/40"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>New Lead</span>
            </button>
          </div>
        }
        bottomRightBadges={
          <>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Live: {leads.length} Leads</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>FastAPI Backend: Synced</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/90 border border-indigo-200/90 text-[10px] font-bold text-indigo-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Active Intake: {activeLeads.length}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50/90 border border-rose-200/90 text-[10px] font-bold text-rose-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Lost Archive: {lostLeads.length} Tracked</span>
            </div>
          </>
        }
      />

      {/* ========================================================
          2. EXECUTIVE STATISTICS ROW (6 Interactive UniversalStatCards)
          ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <UniversalStatCard
          label="Total Inbound"
          value={totalLeads}
          icon={Users}
          iconGradient="from-[#1878B8] to-[#55C4F5]"
          color="#0284c7"
          hoverBorderColor="hover:border-sky-400"
          blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
          footnoteLeft={`${activeLeadsCount} active`}
          footnoteRight={<span className="text-[#1878B8] font-bold">{lostLeadsCount} lost</span>}
          sharePct={totalLeads > 0 ? Math.round((activeLeadsCount / totalLeads) * 100) : 100}
          shareLabel="Active share"
          stageLabel="Lead Generation"
          miniSvgPath="M 2 22 Q 18 20, 30 14 T 54 10 T 73 3"
        />

        <UniversalStatCard
          label="Active Pipeline"
          value={activeLeadsCount}
          icon={Zap}
          iconGradient="from-emerald-600 to-teal-400"
          color="#10b981"
          hoverBorderColor="hover:border-emerald-400"
          blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
          footnoteLeft={`${leads.filter((l) => l.status === 'new_lead').length} new`}
          footnoteRight={<span className="text-emerald-700 font-bold">{leads.filter((l) => l.status === 'contacted').length} contacted</span>}
          sharePct={totalLeads > 0 ? Math.round((activeLeadsCount / totalLeads) * 100) : 100}
          shareLabel="Active share"
          stageLabel="In Pipeline"
          miniSvgPath="M 2 8 Q 18 12, 34 16 T 56 22 T 73 24"
        />

        <UniversalStatCard
          label="Won Rate"
          value={`${wonRate}%`}
          icon={PhoneCall}
          iconGradient="from-[#0284C7] to-[#38BDF8]"
          color="#06b6d4"
          hoverBorderColor="hover:border-cyan-400"
          blurColor="bg-cyan-400/15 group-hover:bg-cyan-400/25"
          footnoteLeft={`${wonCount} contracts`}
          footnoteRight={<span className="text-cyan-700 font-bold">of {totalLeads} leads</span>}
          sharePct={wonRate || 0}
          shareLabel="Win rate"
          stageLabel="Conversions"
          miniSvgPath="M 2 24 Q 16 16, 32 18 T 52 11 T 73 4"
        />

        <UniversalStatCard
          label="Inspections Booked"
          value={inspectionBookedCount}
          icon={CalendarCheck}
          iconGradient="from-[#7C3AED] to-[#A855F7]"
          color="#8b5cf6"
          hoverBorderColor="hover:border-purple-400"
          blurColor="bg-purple-400/15 group-hover:bg-purple-400/25"
          footnoteLeft={totalLeads > 0 ? `${Math.round((inspectionBookedCount / totalLeads) * 100)}% conversion` : 'No data'}
          footnoteRight={<span className="text-purple-700 font-bold">{leads.filter((l) => l.status === 'proposal_sent').length} proposals out</span>}
          sharePct={totalLeads > 0 ? Math.round((inspectionBookedCount / totalLeads) * 100) : 0}
          shareLabel="Booking share"
          stageLabel="Site Survey"
          miniSvgPath="M 2 20 Q 20 18, 38 12 T 60 7 T 73 3"
        />

        <UniversalStatCard
          label="Pipeline Value"
          value={totalIntakeValue > 0 ? `$${(totalIntakeValue / 1000).toFixed(0)}k` : '—'}
          icon={DollarSign}
          iconGradient="from-[#D97706] to-[#FBBF24]"
          color="#f59e0b"
          hoverBorderColor="hover:border-amber-400"
          blurColor="bg-amber-400/15 group-hover:bg-amber-400/25"
          footnoteLeft={avgDealValue > 0 ? `Avg $${(avgDealValue / 1000).toFixed(1)}k` : 'Estimates pending'}
          footnoteRight={<span className="text-amber-700 font-bold">{wonCount} won</span>}
          sharePct={leadsWithValue.length > 0 ? Math.round((leadsWithValue.length / totalLeads) * 100) : 0}
          shareLabel="Have estimates"
          stageLabel="Pipeline Intake"
          miniSvgPath="M 2 24 Q 22 20, 36 12 T 58 8 T 73 2"
        />

        <UniversalStatCard
          label="Lost Opportunities"
          value={`${lostLeads.length} Lost`}
          deltaLabel={totalLeads > 0 ? `${lostRate}% rate` : undefined}
          icon={AlertTriangle}
          iconGradient="from-rose-600 to-rose-400"
          color="#f43f5e"
          hoverBorderColor="hover:border-rose-400"
          blurColor="bg-rose-400/15 group-hover:bg-rose-400/25"
          footnoteLeft={totalLostValue > 0 ? `$${(totalLostValue / 1000).toFixed(0)}k lost value` : 'No value data'}
          footnoteRight={<span className="text-rose-600 font-bold">{lostRate}% loss rate</span>}
          sharePct={lostRate || 0}
          shareLabel="Loss percentage"
          stageLabel="Loss Prevention"
          miniSvgPath="M 2 6 Q 20 10, 38 18 T 60 22 T 73 26"
        />
      </div>

      {/* ========================================================
          3. FILTER BAR & STAGE PILLS (INCLUDING LOST LEADS TAB)
          ======================================================== */}
      <div ref={filterBarRef} className="space-y-2">
        {/* ── Unified Tab Bar ── */}
        <div className="light-glass-card rounded-2xl border border-white/85 shadow-2xs backdrop-blur-2xl overflow-hidden">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {/* All Inquiries */}
            {([
              { id: 'all', label: 'All Inquiries', count: totalLeads, icon: <Users size={12} />, activeClass: 'bg-[#1878B8] text-white' },
              { id: 'new_lead', label: 'New Leads', count: leads.filter((l) => l.status === 'new_lead').length, icon: <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />, activeClass: 'bg-sky-600 text-white' },
              { id: 'contacted', label: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length, icon: <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />, activeClass: 'bg-blue-600 text-white' },
              { id: 'inspection_scheduled', label: 'Inspection', count: leads.filter((l) => l.status === 'inspection_scheduled').length, icon: <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />, activeClass: 'bg-purple-600 text-white' },
              { id: 'proposal_sent', label: 'Proposal Sent', count: leads.filter((l) => l.status === 'proposal_sent').length, icon: <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />, activeClass: 'bg-amber-600 text-white' },
              { id: 'contract_won', label: 'Contract Won', count: leads.filter((l) => l.status === 'contract_won').length, icon: <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />, activeClass: 'bg-emerald-600 text-white' },
            ] as const).map((tab, i, arr) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStage(tab.id as string)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  i < arr.length - 1 ? 'border-r border-slate-200/60' : ''
                } ${
                  activeStage === tab.id
                    ? `${tab.activeClass} shadow-xs`
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ml-0.5 ${
                    activeStage === tab.id
                      ? 'bg-black/20 text-white'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
                {activeStage === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 rounded-full" />
                )}
              </button>
            ))}

            {/* Divider before Lost */}
            <div className="w-px bg-slate-200/60 self-stretch mx-1" />

            {/* Lost Leads — dedicated rose tab */}
            <button
              type="button"
              onClick={() => setActiveStage('lost')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeStage === 'lost'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50/80 hover:text-rose-900'
              }`}
            >
              <AlertTriangle size={11} className={activeStage === 'lost' ? 'text-white' : 'text-rose-500'} />
              <span>Lost Leads</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ml-0.5 ${
                  activeStage === 'lost'
                    ? 'bg-black/20 text-white'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {lostLeads.length}
              </span>
              {activeStage === 'lost' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Controls Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Source Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'source' ? null : 'source')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl light-glass-card hover:border-sky-400 text-slate-700 font-semibold shadow-2xs border border-white/85 transition-all cursor-pointer"
              >
                <span className="text-slate-400 font-normal">Source:</span>
                <span className="font-bold text-slate-800">
                  {selectedSource === 'all'
                    ? 'All Sources'
                    : selectedSource === 'website'
                    ? 'Website'
                    : selectedSource === 'manual'
                    ? 'Manual Entries'
                    : selectedSource}
                </span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${openDropdown === 'source' ? 'rotate-180 text-sky-600' : ''}`} />
              </button>
              {openDropdown === 'source' && (
                <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-1.5 space-y-0.5">
                  {[
                    { id: 'all', label: 'All Sources' },
                    { id: 'website', label: 'Website' },
                    { id: 'manual', label: 'Manual Entries' },
                  ].map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => {
                        setSelectedSource(src.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        selectedSource === src.id ? 'bg-sky-50 text-[#1878B8] font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{src.label}</span>
                      {selectedSource === src.id && <Check size={12} className="text-[#1878B8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Rep Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'rep' ? null : 'rep')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl light-glass-card hover:border-sky-400 text-slate-700 font-semibold shadow-2xs border border-white/85 transition-all cursor-pointer"
              >
                <span className="text-slate-400 font-normal">Rep:</span>
                <span className="font-bold text-slate-800">{selectedRep === 'all' ? 'All Reps' : selectedRep}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${openDropdown === 'rep' ? 'rotate-180 text-sky-600' : ''}`} />
              </button>
              {openDropdown === 'rep' && (
                <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-1.5 space-y-0.5">
                  {repOptions.map((rep) => (
                    <button
                      key={rep}
                      type="button"
                      onClick={() => {
                        setSelectedRep(rep);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        selectedRep === rep ? 'bg-sky-50 text-[#1878B8] font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{rep === 'all' ? 'All Reps' : rep}</span>
                      {selectedRep === rep && <Check size={12} className="text-[#1878B8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Service Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl light-glass-card hover:border-sky-400 text-slate-700 font-semibold shadow-2xs border border-white/85 transition-all cursor-pointer"
              >
                <span className="text-slate-400 font-normal">Service:</span>
                <span className="font-bold text-slate-800">{selectedService === 'all' ? 'All Services' : selectedService}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${openDropdown === 'service' ? 'rotate-180 text-sky-600' : ''}`} />
              </button>
              {openDropdown === 'service' && (
                <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-1.5 space-y-0.5">
                  {serviceOptions.map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => {
                        setSelectedService(srv);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        selectedService === srv ? 'bg-sky-50 text-[#1878B8] font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{srv === 'all' ? 'All Services' : srv}</span>
                      {selectedService === srv && <Check size={12} className="text-[#1878B8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Loss Reason Filter (Shown on Lost tab or if lost leads exist) */}
            {(activeStage === 'lost' || activeStage === 'all') && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'loss' ? null : 'loss')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl light-glass-card hover:border-rose-400 text-rose-800 font-semibold shadow-2xs border border-rose-200/80 transition-all cursor-pointer bg-rose-50/50"
                >
                  <span className="text-rose-500 font-normal">Loss Reason:</span>
                  <span className="font-bold">
                    {selectedLossReason === 'all'
                      ? 'All Reasons'
                      : LOSS_REASONS[selectedLossReason]?.label || selectedLossReason}
                  </span>
                  <ChevronDown size={12} className={`text-rose-400 transition-transform ${openDropdown === 'loss' ? 'rotate-180 text-rose-600' : ''}`} />
                </button>
                {openDropdown === 'loss' && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLossReason('all');
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        selectedLossReason === 'all' ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>All Loss Reasons</span>
                      {selectedLossReason === 'all' && <Check size={12} className="text-rose-600" />}
                    </button>
                    {Object.entries(LOSS_REASONS).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedLossReason(key);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                          selectedLossReason === key ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {selectedLossReason === key && <Check size={12} className="text-rose-600 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reset Filters */}
            {(selectedSource !== 'all' || selectedRep !== 'all' || selectedService !== 'all' || selectedLossReason !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSource('all');
                  setSelectedRep('all');
                  setSelectedService('all');
                  setSelectedLossReason('all');
                  setSearch('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 underline px-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px]">
              Showing <strong className="text-slate-800">{filteredLeads.length}</strong> of {leads.length}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 font-semibold shadow-2xs hover:bg-white transition-all cursor-pointer"
              >
                <span className="text-slate-400">Sort:</span>
                <span className="font-bold text-slate-900">
                  {sortBy === 'newest'
                    ? 'Newest First'
                    : sortBy === 'value'
                    ? 'Deal Value ($)'
                    : 'Speed to Call'}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute top-full right-0 mt-1 z-50 w-44 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl p-1.5 space-y-0.5">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'value', label: 'Deal Value ($ High)' },
                    { id: 'speed', label: 'Speed to Call' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSortBy(s.id as any);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        sortBy === s.id ? 'bg-sky-50 text-[#1878B8] font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <Check size={12} className="text-[#1878B8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle: [Table] [Cards] */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs ml-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs border border-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutList size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Cards View"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs border border-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. LEADS DIRECTORY VIEW: TABLE OR CARDS
          ======================================================== */}
      {error && leads.length === 0 ? (
        <div className="light-glass-card rounded-2xl p-12 text-center border border-rose-200/80 bg-rose-50/40 backdrop-blur-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Database Connection Notice</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1878B8] hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="light-glass-card rounded-2xl p-6 border border-white/85 shadow-sm backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-200/80 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200/80 rounded animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-14 bg-slate-100/80 rounded-xl animate-pulse flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3.5 bg-slate-200 rounded" />
                    <div className="w-24 h-2.5 bg-slate-200/60 rounded" />
                  </div>
                </div>
                <div className="w-24 h-4 bg-slate-200 rounded hidden md:block" />
                <div className="w-20 h-4 bg-slate-200 rounded hidden sm:block" />
                <div className="w-20 h-6 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* High-Density Glossy Liquid Glass Table */
        <div className="light-glass-card rounded-2xl overflow-hidden border border-white/85 shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Homeowner & Property</th>
                  <th className="px-3 py-3">Direct Contact</th>
                  <th className="px-3 py-3">Roofing Service</th>
                  {activeStage === 'lost' && (
                    <th className="px-3 py-3 text-center">Loss Root Cause</th>
                  )}
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Estimator</th>
                  <th className="px-3 py-3 text-right">Value</th>
                  <th className="px-3 py-3">Stage</th>
                  <th className="px-3 py-3">Received / SLA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={activeStage === 'lost' ? 10 : 9} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-slate-300" />
                        <div className="text-sm font-bold text-slate-700">No leads match your active filters</div>
                        <div className="text-xs text-slate-400">Try adjusting your search keywords or resetting filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isLost = lead.status === 'lost';
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-white/80 transition-colors group cursor-pointer ${
                          isLost ? 'bg-rose-50/20' : ''
                        }`}
                        onClick={() => setInspectLead(lead)}
                      >
                        {/* 1. Homeowner & Property */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                                isLost
                                  ? 'bg-slate-200 text-slate-500'
                                  : 'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sky-500/20'
                              }`}
                            >
                              {lead.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1F1F1F] group-hover:text-[#1878B8] transition-colors flex items-center gap-1.5">
                                <span className="truncate">{lead.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                <MapPin size={9} className="text-slate-400 shrink-0" />
                                <span>{lead.address}, {lead.city}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Direct Contact Buttons */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.phone.replace(/\D/g, '')}`}
                              title={`Call ${lead.name}`}
                              className="w-7 h-7 rounded-lg bg-sky-50 text-[#1878B8] hover:bg-[#1878B8] hover:text-white transition-colors flex items-center justify-center shadow-2xs border border-sky-200/60 cursor-pointer"
                            >
                              <Phone size={12} />
                            </a>
                            <a
                              href={`sms:${lead.phone.replace(/\D/g, '')}`}
                              title={`SMS ${lead.name}`}
                              className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center shadow-2xs border border-emerald-200/60 cursor-pointer"
                            >
                              <Zap size={12} />
                            </a>
                            <a
                              href={`mailto:${lead.email}`}
                              title={`Email ${lead.email}`}
                              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center shadow-2xs border border-slate-200 cursor-pointer"
                            >
                              <Mail size={12} />
                            </a>
                          </div>
                        </td>

                        {/* 3. Roofing Service */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${getServiceBadgeClass(
                              lead.serviceColor
                            )}`}
                          >
                            <span className="truncate">{lead.service}</span>
                            {lead.squares && (
                              <span className="opacity-70 font-normal">({lead.squares} sq)</span>
                            )}
                          </span>
                        </td>

                        {/* 4. Loss Root Cause (Only displayed when on Lost tab) */}
                        {activeStage === 'lost' && (
                          <td className="px-3 py-3 text-center">
                            {lead.lossReason ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  LOSS_REASONS[lead.lossReason]?.badgeClass || 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <span>{LOSS_REASONS[lead.lossReason]?.icon}</span>
                                <span className="truncate">{LOSS_REASONS[lead.lossReason]?.label}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[10px]">Unspecified</span>
                            )}
                          </td>
                        )}

                        {/* 5. Source Attribution (Website shows both Website and Claimed By; Manual shows creator name) */}
                        <td className="px-3 py-3">
                          {lead.source === 'website' ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200/80 shadow-2xs">
                                <Globe size={10} className="text-sky-600" />
                                <span>Website Lead</span>
                              </span>
                              {lead.leadSourceDetail && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[9.5px]">
                                  {lead.leadSourceDetail}
                                </span>
                              )}
                              {(lead.isClaimed || (lead.assignedRep && lead.assignedRep !== 'Unassigned')) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9.5px] border border-emerald-200/80">
                                  Claimed: {lead.assignedRep}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/60">
                              <span>{lead.sourceLabel}</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Estimator */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-700 text-[9px] flex items-center justify-center">
                              {lead.repInitials}
                            </span>
                            <span className="text-slate-800 font-medium text-[11px] truncate">
                              {lead.assignedRep}
                            </span>
                          </div>
                        </td>

                        {/* 7. Value */}
                        <td className="px-3 py-3 text-right font-black text-slate-900 text-xs">
                          {lead.value > 0 ? `$${lead.value.toLocaleString()}` : <span className="text-slate-400 font-medium">TBD</span>}
                        </td>

                        {/* 8. Stage Status */}
                        <td className="px-3 py-3">
                          <span
                            className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                              lead.status === 'new_lead'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : lead.status === 'contacted'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : lead.status === 'inspection_scheduled'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : lead.status === 'proposal_sent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : lead.status === 'contract_won'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {lead.status === 'lost' ? 'Lost / Dead' : lead.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* 9. Received / SLA */}
                        <td className="px-3 py-3">
                          <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                            {lead.createdAt}
                          </div>
                          <div className="text-[9.5px] text-slate-400 font-medium flex items-center gap-0.5">
                            <Clock size={8.5} />
                            <span>{lead.speedToCall || 'Inbound'}</span>
                          </div>
                        </td>

                        {/* 10. Actions */}
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isLost ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateLead(lead.id)}
                                title="Reactivate Lead"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all font-bold text-[10px] cursor-pointer shadow-2xs"
                              >
                                <RotateCcw size={10} />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setInspectLead(lead)}
                                  title="Inspect Lead"
                                  className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  <Eye size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsLost(lead.id, 'competitor_price')}
                                  title="Quick Mark as Lost"
                                  className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs border border-rose-100"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="light-glass-card rounded-2xl p-12 text-center border border-white/85 shadow-sm backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-2">
            <Search size={28} className="text-slate-300" />
            <div className="text-sm font-bold text-slate-700">No leads match your active filters</div>
            <div className="text-xs text-slate-400">Try adjusting your search keywords or resetting filters</div>
          </div>
        </div>
      ) : (
        /* Visual Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLeads.map((lead) => {
            const isLost = lead.status === 'lost';
            return (
              <div
                key={lead.id}
                onClick={() => setInspectLead(lead)}
                className={`light-glass-card rounded-2xl p-4 border border-white/85 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                  isLost ? 'bg-rose-50/20 border-rose-200/60' : ''
                }`}
              >
                {/* Card Top: Avatar, Name, Status & Value */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                        isLost ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-tr from-[#1878B8] to-[#55C4F5] text-white'
                      }`}
                    >
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span>{lead.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                        <MapPin size={10} className="text-slate-400 shrink-0" />
                        <span>{lead.address}, {lead.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">${lead.value.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{lead.squares || 30} squares</div>
                  </div>
                </div>

                {/* Card Middle: Service Badge & Source / Loss Reason */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold ${getServiceBadgeClass(
                      lead.serviceColor
                    )}`}
                  >
                    <span>{lead.service}</span>
                  </span>

                  {isLost && lead.lossReason ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        LOSS_REASONS[lead.lossReason]?.badgeClass || 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span>{LOSS_REASONS[lead.lossReason]?.icon}</span>
                      <span>{LOSS_REASONS[lead.lossReason]?.label}</span>
                    </span>
                  ) : lead.source === 'website' ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200/80 shadow-2xs">
                        <Globe size={10} className="text-sky-600" />
                        <span>Website Lead</span>
                      </span>
                      {lead.leadSourceDetail && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[9.5px]">
                          {lead.leadSourceDetail}
                        </span>
                      )}
                      {(lead.isClaimed || (lead.assignedRep && lead.assignedRep !== 'Unassigned')) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9.5px] border border-emerald-200/80">
                          Claimed: {lead.assignedRep}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200/60">
                      {lead.sourceLabel}
                    </span>
                  )}
                </div>

                {/* Notes Preview */}
                {lead.notes && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white/50 p-2 rounded-xl border border-slate-200/50">
                    {lead.notes}
                  </p>
                )}

                {/* Card Bottom: Contact triggers & Rep */}
                <div
                  className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${lead.phone.replace(/\D/g, '')}`}
                      className="w-7 h-7 rounded-lg bg-sky-50 text-[#1878B8] hover:bg-[#1878B8] hover:text-white transition-colors flex items-center justify-center border border-sky-200/60 shadow-2xs"
                      title="Call"
                    >
                      <Phone size={12} />
                    </a>
                    <a
                      href={`sms:${lead.phone.replace(/\D/g, '')}`}
                      className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center border border-emerald-200/60 shadow-2xs"
                      title="SMS"
                    >
                      <Zap size={12} />
                    </a>
                    <a
                      href={`mailto:${lead.email}`}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center border border-slate-200 shadow-2xs"
                      title="Email"
                    >
                      <Mail size={12} />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLost ? (
                      <button
                        type="button"
                        onClick={() => handleReactivateLead(lead.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 font-bold text-[10.5px] cursor-pointer transition-all"
                      >
                        <RotateCcw size={11} />
                        <span>Reactivate</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">
                        Rep: <strong className="text-slate-800">{lead.assignedRep}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          5. INTERACTIVE LEAD INSPECTION & LOST LIFECYCLE MODAL
          ======================================================== */}
      {inspectLead && (
        <LeadInspectModal
          lead={inspectLead}
          onClose={() => setInspectLead(null)}
          onMarkLost={(reason, notes) => handleMarkAsLost(inspectLead.id, reason, notes)}
          onReactivate={() => handleReactivateLead(inspectLead.id)}
          onAdvance={(stage) => handleAdvanceStage(inspectLead.id, stage)}
          onAddNote={async (note) => {
            await addNote(inspectLead.id, note);
            setInspectLead((prev) => (prev ? { ...prev, notes: prev.notes ? `${prev.notes}\n\n${note}` : note } : null));
          }}
          getServiceBadgeClass={getServiceBadgeClass}
        />
      )}

      {/* ========================================================
          6. CREATE NEW LEAD MODAL (Full Viewport Masking)
          ======================================================== */}
      {showCreateModal && (
        <CreateLeadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmitLead={handleCreateLead}
          initialStageId="new_leads"
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: LeadInspectModal with Lost Lifecycle Support
// ────────────────────────────────────────────────────────────

interface LeadInspectModalProps {
  lead: Lead;
  onClose: () => void;
  onMarkLost: (reason: Lead['lossReason'], notes?: string) => void;
  onReactivate: () => void;
  onAdvance?: (stage: Lead['status']) => void;
  onAddNote?: (note: string) => Promise<void> | void;
  getServiceBadgeClass: (color: string) => string;
}

function LeadInspectModal({
  lead,
  onClose,
  onMarkLost,
  onReactivate,
  onAdvance,
  onAddNote,
  getServiceBadgeClass,
}: LeadInspectModalProps) {
  const [showLostPicker, setShowLostPicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState<Lead['lossReason']>('competitor_price');
  const [lossNoteInput, setLossNoteInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [generalNoteText, setGeneralNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveGeneralNote = async () => {
    const trimmed = generalNoteText.trim();
    if (!trimmed || isSavingNote) return;
    setIsSavingNote(true);
    try {
      if (onAddNote) {
        await onAddNote(trimmed);
        triggerToast('Note saved');
      }
      setGeneralNoteText('');
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const isLost = lead.status === 'lost';

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleConfirmLost = () => {
    onMarkLost(selectedReason, lossNoteInput);
    setShowLostPicker(false);
    triggerToast('Lead successfully marked as Lost opportunity');
  };

  const handleConfirmReactivate = () => {
    onReactivate();
    triggerToast('Lead reactivated! Moved to Contacted stage');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white/95 backdrop-blur-3xl rounded-3xl border border-white/95 shadow-[0_25px_90px_rgba(0,0,0,0.40)] overflow-hidden flex flex-col max-h-[90vh] text-slate-800 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-sm shrink-0 ${
                isLost ? 'bg-slate-400' : 'bg-gradient-to-tr from-[#1878B8] to-[#55C4F5]'
              }`}
            >
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 leading-tight truncate">{lead.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getServiceBadgeClass(
                    lead.serviceColor
                  )}`}
                >
                  {lead.service}
                </span>
                {isLost && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                    ❌ Lost Lead
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-slate-400 shrink-0" />
                <span>{lead.address}, {lead.city}, CA {lead.zip}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-4 text-xs">
          {/* LOST LEAD BANNER */}
          {isLost && lead.lossReason && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-rose-800">
                  <span className="text-base">{LOSS_REASONS[lead.lossReason]?.icon}</span>
                  <span>Reason for Loss: {LOSS_REASONS[lead.lossReason]?.label}</span>
                </div>
                {lead.lostDate && (
                  <span className="text-[10px] font-semibold text-rose-600">Marked Lost: {lead.lostDate}</span>
                )}
              </div>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                {lead.lossNotes || LOSS_REASONS[lead.lossReason]?.desc}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmReactivate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition-all cursor-pointer text-xs"
                >
                  <RotateCcw size={12} />
                  <span>Reactivate Lead / Return to Active Pipeline</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/\D/g, '')}`}
                className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-[#1878B8] flex items-center justify-center gap-2 font-bold transition-colors text-center"
              >
                <Phone size={14} />
                <span>Call ({lead.phone})</span>
              </a>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 flex items-center justify-center gap-2 font-bold text-center opacity-60 cursor-not-allowed">
                <Phone size={14} />
                <span>No Phone</span>
              </div>
            )}
            {lead.phone ? (
              <a
                href={`sms:${lead.phone.replace(/\D/g, '')}`}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 flex items-center justify-center gap-2 font-bold transition-colors text-center"
              >
                <Zap size={14} />
                <span>Send Quick SMS</span>
              </a>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 flex items-center justify-center gap-2 font-bold text-center opacity-60 cursor-not-allowed">
                <Zap size={14} />
                <span>No Phone</span>
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Value</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {lead.value > 0 ? `$${lead.value.toLocaleString()}` : <span className="text-slate-400 font-medium">TBD</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Roof Size</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {lead.squares && lead.squares > 0 ? `${lead.squares} Squares` : <span className="text-slate-400 font-medium">—</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Pitch Slope</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {lead.pitch ? `${lead.pitch} Pitch` : <span className="text-slate-400 font-medium">—</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Rep</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{lead.assignedRep}</div>
            </div>
          </div>

          {/* Lead Attribution */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Globe size={12} className="text-slate-400" />
              <span>Lead Source Attribution</span>
            </span>
            <div className="flex items-center gap-2">
              {lead.source === 'website' ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10.5px] border border-sky-200/80 shadow-2xs">
                    <Globe size={11} className="text-sky-600" />
                    <span>Website Lead</span>
                  </span>
                  {lead.leadSourceDetail && (
                    <span className="text-slate-600 font-semibold bg-slate-200/70 px-2 py-0.5 rounded-md text-[10px]">
                      {lead.leadSourceDetail}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {lead.sourceLabel}
                </span>
              )}
            </div>
          </div>

          {/* Stage Progression Stepper — Locked & Auto-Synced with Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={11} className="text-slate-400" />
                <span>Pipeline Stage Progression</span>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-200/70 border border-slate-300/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock size={9} />
                <span>Auto-Synced with Pipeline (Read-Only)</span>
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'new_lead', label: '1. New' },
                { id: 'contacted', label: '2. Contacted' },
                { id: 'inspection_scheduled', label: '3. Inspection' },
                { id: 'proposal_sent', label: '4. Proposal' },
                { id: 'contract_won', label: '5. Won' },
              ].map((step) => {
                const isCurrent = lead.status === step.id;
                return (
                  <div
                    key={step.id}
                    className={`py-1.5 px-1 text-center rounded-lg font-bold text-[10px] select-none transition-all cursor-default ${
                      isCurrent
                        ? 'bg-[#1878B8] text-white shadow-xs font-black'
                        : 'text-slate-400 bg-transparent font-medium'
                    }`}
                    title={isCurrent ? `Current Stage: ${step.label} (Synced from Pipeline)` : `Stage: ${step.label} (Locked)`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
            <div className="mt-1 text-[9.5px] text-slate-400 font-medium text-right italic">
              Stage progression is locked here • Update stages by moving leads in the Pipeline or Dashboard
            </div>
          </div>

          {/* General Notes Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-[#1878B8]" />
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  General Notes
                </span>
              </div>
            </div>

            {/* Note Composer */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-2.5">
              <textarea
                rows={3}
                value={generalNoteText}
                onChange={(e) => setGeneralNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveGeneralNote();
                  }
                }}
                placeholder="Add a general note for this lead..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1878B8] focus:ring-2 focus:ring-sky-400/20 resize-none transition-all font-medium leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono">⌘/Ctrl+Enter</kbd> to save
                </span>

                <button
                  type="button"
                  onClick={handleSaveGeneralNote}
                  disabled={!generalNoteText.trim() || isSavingNote}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1878B8] hover:bg-sky-600 active:scale-[0.98] disabled:opacity-40 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  {isSavingNote ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} className="stroke-[2.5]" />
                      <span>Save Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Existing Notes Display */}
            {lead.notes && lead.notes.trim() ? (
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium shadow-2xs max-h-48 overflow-y-auto">
                {lead.notes}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                No general notes recorded yet
              </div>
            )}
          </div>

          {/* MARK AS LOST DRAWER / PICKER */}
          {!isLost && (
            <div className="border-t border-slate-200/80 pt-3">
              {!showLostPicker ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Lead no longer pursuing proposal?</span>
                  <button
                    type="button"
                    onClick={() => setShowLostPicker(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold transition-colors cursor-pointer"
                  >
                    <AlertTriangle size={12} />
                    <span>Mark as Lost / Inactive</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-rose-600" />
                      <span>Select Reason for Lost Opportunity</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLostPicker(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(LOSS_REASONS).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedReason(key as any)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          selectedReason === key
                            ? 'bg-white border-rose-400 shadow-2xs font-bold text-rose-900'
                            : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <span>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Loss Explanation Notes (Why did they pass?)
                    </label>
                    <input
                      type="text"
                      value={lossNoteInput}
                      onChange={(e) => setLossNoteInput(e.target.value)}
                      placeholder="e.g. Customer selected competitor who bid $3k lower on underlayment"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowLostPicker(false)}
                      className="px-3 py-1 rounded-lg text-slate-600 font-bold hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLost}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Confirm Mark Lost
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium">
            Source: <strong className="text-slate-700">{lead.sourceLabel}</strong> • ID: {lead.id}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href="/pipeline"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1878B8] to-[#55C4F5] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Manage in Pipeline</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

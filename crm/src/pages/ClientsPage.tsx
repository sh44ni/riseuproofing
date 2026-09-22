import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  Edit3,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Download,
  X,
  LayoutGrid,
  List,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Client360Record, TimelineEvent, RoofSpecs } from '@/types/client360Types';
import { useClients } from '@/hooks/useClients';
import { useDashboardStats } from '@/lib/dashboardStatsStore';
import { CreateClientModal } from '@/components/clients/CreateClientModal';
import { useAuth } from '@/context/AuthContext';
import { ClientHeroBanner } from '@/components/clients/ClientHeroBanner';
import { ClientSpecsCard } from '@/components/clients/ClientSpecsCard';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';
import { ClientBillingCard } from '@/components/clients/ClientBillingCard';
import { ClientWarrantyCard } from '@/components/clients/ClientWarrantyCard';
import { ClientRemindersCard } from '@/components/clients/ClientRemindersCard';
import { ClientTimelineTab } from '@/components/clients/ClientTimelineTab';
import { ClientQuotesJobsTab } from '@/components/clients/ClientQuotesJobsTab';
import { ClientBillingTab } from '@/components/clients/ClientBillingTab';
import { ClientWarrantiesTab } from '@/components/clients/ClientWarrantiesTab';
import { ClientLogModal } from '@/components/clients/ClientLogModal';
import { ClientEditSpecsModal } from '@/components/clients/ClientEditSpecsModal';

export function ClientsPage() {
  const { user } = useAuth();
  const { stats } = useDashboardStats();
  const {
    clients,
    setClients,
    summary,
    selectedClientId,
    setSelectedClientId,
    currentClient,
    loading,
    detailLoading,
    error,
    saveSpecs,
    logActivity,
    reactivateClient,
    createNewClient,
    refetch,
    createClientTask,
    toggleClientTask,
  } = useClients();

  const [viewMode, setViewMode] = useState<'profile' | 'directory'>('directory');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'quotes' | 'billing' | 'warranties' | 'tasks'
  >('overview');

  // Directory filter & search
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'active_job' | 'completed' | 'closed_lost'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryDisplayMode, setDirectoryDisplayMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditSpecsOpen, setIsEditSpecsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler: Log activity
  const handleSaveActivity = async (newEvent: Omit<TimelineEvent, 'id'>) => {
    if (!currentClient) return;
    try {
      await logActivity(currentClient.id, newEvent);
      showToast('Activity successfully logged to 360 timeline!');
    } catch (err: any) {
      showToast('Failed to log activity to database.');
    }
  };

  // Handler: Edit Specs
  const handleSaveSpecs = async (updatedSpecs: RoofSpecs) => {
    if (!currentClient) return;
    try {
      await saveSpecs(currentClient.id, updatedSpecs);
      showToast('Property and roof specs updated!');
    } catch (err: any) {
      showToast('Failed to update specs on database.');
    }
  };

  // Handler: Toggle Task
  const handleToggleTask = async (taskId: string) => {
    if (!currentClient) return;
    try {
      await toggleClientTask(currentClient.id, taskId);
      showToast('Task status updated!');
      refetch();
    } catch (err: any) {
      showToast('Failed to update task.');
    }
  };

  // Handler: Add simple task
  const handleAddTask = async () => {
    const title = prompt('Enter task or reminder description:');
    if (!title || !title.trim() || !currentClient) return;
    
    try {
      await createClientTask(currentClient.id, { 
        title: title.trim(), 
        description: 'Follow-up task scheduled.' 
      });
      showToast('Reminder task added to client schedule!');
      refetch();
    } catch (err: any) {
      showToast('Failed to add task.');
    }
  };

  // Handler: Reactivate lost deal
  const handleReactivateDeal = async () => {
    if (!currentClient) return;
    if (!confirm(`Reactivate ${currentClient.name} back into active Sales Pipeline?`)) return;
    try {
      await reactivateClient(currentClient.id);
      showToast(`${currentClient.name} successfully reactivated into the active pipeline!`);
    } catch (err: any) {
      showToast('Failed to reactivate client on server.');
    }
  };

  // Filtered clients for directory list
  const filteredClients = clients.filter((c) => {
    const matchesFilter = directoryFilter === 'all' || c.status === directoryFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roofSpecs.roofMaterial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedRep.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Dynamic status badges
  const getStatusBadge = (client: Client360Record) => {
    switch (client.status) {
      case 'active_job':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
            <span>Existing Client • Active Jobsite</span>
          </span>
        );
      case 'closed_lost':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-200" />
            <span>Closed Lost • Win-Back Opportunity</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
            <ShieldCheck size={13} />
            <span>Lifetime Client • 50-Year Warranty</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-xs">
            <span>Pipeline Prospect</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto select-none pb-12">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles size={14} className="text-[#2F9FE3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECTORY VIEW: Client Registry Table & Cards (Liquid Glass 3.0)          */}
      {/* ========================================================================= */}
      {viewMode === 'directory' ? (
        <div className="space-y-3.5">
          {/* 1. HERO INTAKE BANNER WITH PANORAMA BACKGROUND */}
          <CrmPageHero
            pageId="clients"
            defaultEyebrow="CLIENT 360 REGISTRY • HOMEOWNER INTELLIGENCE"
            defaultTitle="Unified Homeowner Records & 360 Directory"
            defaultSubtitle="Comprehensive homeowner profiles, active jobsites, 50-year warranty certificates, and closed lost win-back cadences."
            showSearch={true}
            searchPlaceholder="Search by client name, street address, material, or assigned rep..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={() => setSearchQuery('')}
            searchRef={searchInputRef}
            topRightActions={
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-[#1878B8] via-sky-500 to-[#55C4F5] text-white font-bold text-xs shadow-xs hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>New Homeowner</span>
              </button>
            }
            bottomRightBadges={
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{clients.length} Verified Records</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs shrink-0">
                  <ShieldCheck size={11} className="text-sky-600" />
                  <span>CSLB #1084221</span>
                </span>
              </div>
            }
          />

          {/* 2. KPI METRICS ROW (Interactive UniversalStatCards driven by backend summary) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <UniversalStatCard
              label="Total Homeowners"
              value={summary?.totalClients ?? clients.length}
              icon={Users}
              iconGradient="from-[#1878B8] to-[#55C4F5]"
              color="#0284c7"
              hoverBorderColor="hover:border-sky-400"
              blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
              footnoteLeft={`${summary?.activeProjects ?? clients.filter((c) => c.status === 'active_job').length} active jobs`}
              footnoteRight={`${summary?.existingClientsCount ?? clients.filter((c) => c.status === 'completed').length} warrantied`}
              sharePct={100}
              shareLabel="Client directory"
              stageLabel="Homeowner Base"
              sparklineData={stats?.sparklines?.newLeads}
            />

            <UniversalStatCard
              label="Active Jobsites"
              value={summary?.activeProjects ?? clients.filter((c) => c.status === 'active_job').length}
              icon={Building2}
              iconGradient="from-emerald-600 to-emerald-400"
              color="#10b981"
              hoverBorderColor="hover:border-emerald-400"
              blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
              footnoteLeft={`${summary?.activeProjects ?? clients.filter((c) => c.status === 'active_job').length} crews deployed`}
              footnoteRight="Work in progress"
              sharePct={clients.length > 0 ? Math.round(((summary?.activeProjects ?? clients.filter((c) => c.status === 'active_job').length) / (summary?.totalClients || clients.length || 1)) * 100) : 0}
              shareLabel="Site share"
              stageLabel="Production"
              sparklineData={stats?.sparklines?.jobsWon}
            />

            <UniversalStatCard
              label="Lifetime Warrantied"
              value={summary?.existingClientsCount ?? clients.filter((c) => c.status === 'completed').length}
              icon={ShieldCheck}
              iconGradient="from-teal-600 to-teal-400"
              color="#0d9488"
              hoverBorderColor="hover:border-teal-400"
              blurColor="bg-teal-400/15 group-hover:bg-teal-400/25"
              footnoteLeft="50-Yr Eagle System"
              footnoteRight={`${summary?.existingClientsCount ?? clients.filter((c) => c.status === 'completed').length} certificates issued`}
              sharePct={clients.length > 0 ? Math.round(((summary?.existingClientsCount ?? clients.filter((c) => c.status === 'completed').length) / (summary?.totalClients || clients.length || 1)) * 100) : 0}
              shareLabel="Warranty share"
              stageLabel="Protected Roofs"
              sparklineData={stats?.sparklines?.jobsWon}
            />

            <UniversalStatCard
              label="Lost & Win-Backs"
              value={summary?.lostLeadsCount ?? clients.filter((c) => c.status === 'closed_lost').length}
              icon={Flame}
              iconGradient="from-rose-600 to-rose-400"
              color="#f43f5e"
              hoverBorderColor="hover:border-rose-400"
              blurColor="bg-rose-400/15 group-hover:bg-rose-400/25"
              footnoteLeft="Win-back radar active"
              footnoteRight={`${clients.filter((c) => c.lossPostMortem?.canReactivate).length} reactivatable`}
              sharePct={clients.length > 0 ? Math.round(((summary?.lostLeadsCount ?? clients.filter((c) => c.status === 'closed_lost').length) / (summary?.totalClients || clients.length || 1)) * 100) : 0}
              shareLabel="Lost share"
              stageLabel="Win-Back Radar"
              sparklineData={stats?.sparklines?.lostClosed}
            />
          </div>

          {/* 3. FILTER TOOLBAR (Light Glass Panel) */}
          <div className="light-glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'all', label: 'All Records', count: clients.length },
                  { id: 'active_job', label: 'Active Jobsites', count: clients.filter((c) => c.status === 'active_job').length },
                  { id: 'completed', label: 'Completed', count: clients.filter((c) => c.status === 'completed').length },
                  { id: 'closed_lost', label: 'Closed Lost & Win-Backs', count: clients.filter((c) => c.status === 'closed_lost').length },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDirectoryFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    directoryFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                      directoryFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Display toggle */}
            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setDirectoryDisplayMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  directoryDisplayMode === 'grid' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setDirectoryDisplayMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  directoryDisplayMode === 'table' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* 4. CLIENT REGISTRY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setViewMode('profile');
                  setActiveTab('overview');
                }}
                className="light-glass-card rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B1E33] to-[#162C46] text-white font-black text-base flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 group-hover:text-[#0284C7] transition-colors">
                        {client.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#0284C7]" />
                        <span className="truncate">{client.roofSpecs.address}, {client.city}</span>
                      </div>
                    </div>
                  </div>

                  <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0284C7] text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                    <ChevronRight size={14} />
                  </span>
                </div>

                {/* Specs tile */}
                <div className="liquid-glass-tile rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Roof Material:</span>
                    <span className="font-bold text-slate-900">{client.roofSpecs.roofMaterial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Roof Area:</span>
                    <span className="font-bold text-slate-900">{client.roofSpecs.roofAreaSqFt.toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Assigned Rep:</span>
                    <span className="font-bold text-slate-900">{client.assignedRep.name}</span>
                  </div>
                  {client.lossPostMortem && (
                    <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200/60">
                      <span>Lost Reason:</span>
                      <span className="truncate max-w-[180px]">{client.lossPostMortem.lossReason}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  {getStatusBadge(client)}
                  <span className="text-[#0284C7] font-bold flex items-center gap-1 group-hover:underline">
                    <span>Open 360</span>
                    <ExternalLink size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* PROFILE VIEW: 1:1 Client 360 Profile (Luxury Liquid Glass 3.0)            */
        /* ========================================================================= */
        <div className="space-y-3.5">
          {/* Breadcrumb & Client Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setViewMode('directory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-slate-700 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
            >
              <ArrowLeft size={14} />
              <span>All Clients</span>
            </button>

            {/* Quick Switcher */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold hidden sm:inline">Switch Client:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300/80 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status === 'active_job' ? 'Active' : c.status === 'closed_lost' ? 'Lost' : 'Completed'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* CLIENT 360 HEADER (Exact Mockup Layout in Light Glass Panel)            */}
          {/* ======================================================================= */}
          <div className="light-glass-panel rounded-3xl p-5 md:p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)] select-none">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Side: Avatar + Client Name + Contact Metadata + Rep Badge */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0B1E33] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                  {currentClient.name.charAt(0)}
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {currentClient.name}
                  </h1>

                  {/* Phone, Email, Address Info Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold">
                    <a
                      href={`tel:${currentClient.phone}`}
                      className="flex items-center gap-1 hover:text-[#0284C7] transition-colors"
                    >
                      <Phone size={13} className="text-slate-400" />
                      <span>{currentClient.phone}</span>
                    </a>

                    <a
                      href={`mailto:${currentClient.email}`}
                      className="flex items-center gap-1 hover:text-[#0284C7] transition-colors"
                    >
                      <Mail size={13} className="text-slate-400" />
                      <span>{currentClient.email}</span>
                    </a>

                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${currentClient.address}, ${currentClient.city} ${currentClient.zip}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-[#0284C7] transition-colors"
                    >
                      <MapPin size={13} className="text-slate-400" />
                      <span>
                        {currentClient.address}, {currentClient.city} {currentClient.zip}
                      </span>
                    </a>
                  </div>

                  {/* Assigned Rep & Source Pill */}
                  <div className="inline-flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/90 text-xs shadow-2xs">
                      {currentClient.assignedRep.avatar ? (
                        <img
                          src={currentClient.assignedRep.avatar}
                          alt={currentClient.assignedRep.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] flex items-center justify-center font-bold">
                          {currentClient.assignedRep.name.charAt(0)}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{currentClient.assignedRep.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        {currentClient.assignedRep.badge}
                      </span>
                      <span className="text-slate-300 text-[11px] hidden sm:inline">•</span>
                      <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">{currentClient.originSource}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Status Badge + Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                {getStatusBadge(currentClient)}

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${currentClient.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all"
                  >
                    <Phone size={13} className="text-slate-500" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`sms:${currentClient.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all"
                  >
                    <Mail size={13} className="text-slate-500" />
                    <span>Text</span>
                  </a>

                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${currentClient.address}, ${currentClient.city} ${currentClient.zip}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all"
                  >
                    <MapPin size={13} className="text-slate-500" />
                    <span>Directions</span>
                  </a>

                  {/* Primary Action: + Log Note / Call */}
                  <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Plus size={14} />
                    <span>Log Note / Call</span>
                  </button>

                  <button
                    onClick={() => setIsEditSpecsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all"
                  >
                    <Edit3 size={13} className="text-slate-500" />
                    <span>Edit Specs</span>
                  </button>

                  {/* Reactivate button for lost clients */}
                  {currentClient.status === 'closed_lost' && (
                    <button
                      onClick={handleReactivateDeal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <RotateCcw size={13} />
                      <span>Reactivate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* MAIN NAVIGATION TABS                                                  */}
            {/* ===================================================================== */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-200/70 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                360° Overview
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'timeline'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span>Timeline</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {currentClient.timeline.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quotes')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'quotes'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span>Quotes & Jobs</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'quotes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {currentClient.quotes.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'billing'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                Billing & Invoices
              </button>

              <button
                onClick={() => setActiveTab('warranties')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'warranties'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                Warranties & Inspections
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'tasks'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span>Tasks</span>
                {currentClient.tasks.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {currentClient.tasks.filter((t) => !t.completed).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* TAB 1: 360° OVERVIEW                                                    */}
          {/* ======================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Dynamic Hero Banner */}
              <ClientHeroBanner
                client={currentClient}
                onManageJob={() => setActiveTab('quotes')}
                onReactivate={handleReactivateDeal}
                onOpenWinBack={() => setActiveTab('tasks')}
              />

              {/* 3-Card Grid Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ClientSpecsCard
                  specs={currentClient.roofSpecs}
                  onEdit={() => setIsEditSpecsOpen(true)}
                />

                <ClientBillingCard
                  billing={currentClient.billingSummary}
                  onViewAll={() => setActiveTab('billing')}
                  onOpenHub={() => setActiveTab('billing')}
                />

                <ClientWarrantyCard
                  warranty={currentClient.warrantySummary}
                  onViewAll={() => setActiveTab('warranties')}
                  onOpenHub={() => setActiveTab('warranties')}
                />
              </div>

              {/* Bottom Row: Next Follow-ups & Reminders */}
              <ClientRemindersCard
                tasks={currentClient.tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onViewAllTasks={() => setActiveTab('tasks')}
              />
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <ClientTimelineTab
              timeline={currentClient.timeline}
              onLogActivity={() => setIsLogModalOpen(true)}
            />
          )}

          {/* TAB 3: QUOTES & JOBS */}
          {activeTab === 'quotes' && <ClientQuotesJobsTab client={currentClient} />}

          {/* TAB 4: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <ClientBillingTab
              billing={currentClient.billingSummary}
            />
          )}

          {/* TAB 5: WARRANTIES & INSPECTIONS */}
          {activeTab === 'warranties' && (
            <ClientWarrantiesTab
              warranty={currentClient.warrantySummary}
              specs={currentClient.roofSpecs}
            />
          )}

          {/* TAB 6: TASKS */}
          {activeTab === 'tasks' && (
            <div className="light-glass-panel rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#0284C7]" />
                  <h3 className="font-bold text-sm text-slate-900">Task Management & Win-Back Callbacks</h3>
                </div>
                <button
                  onClick={handleAddTask}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus size={14} />
                  <span>New Task</span>
                </button>
              </div>

              <ClientRemindersCard
                tasks={currentClient.tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
              />
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {currentClient && (
        <>
          <ClientLogModal
            isOpen={isLogModalOpen}
            onClose={() => setIsLogModalOpen(false)}
            onSave={handleSaveActivity}
            clientName={currentClient.name}
            isLostClient={currentClient.status === 'closed_lost'}
          />

          <ClientEditSpecsModal
            isOpen={isEditSpecsOpen}
            onClose={() => setIsEditSpecsOpen(false)}
            specs={currentClient.roofSpecs}
            onSave={handleSaveSpecs}
          />
        </>
      )}

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createNewClient}
      />
    </div>
  );
}

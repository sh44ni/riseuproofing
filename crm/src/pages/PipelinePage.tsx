import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Filter,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Camera,
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  XCircle,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Users,
  Layers,
  Sparkles,
  Kanban,
  ListFilter,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  Zap,
  X,
  PhoneCall,
  RotateCcw,
  Maximize2,
  Minimize2,
  Columns,
  Grid,
  Loader2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';
import {
  PipelineStageId,
  PIPELINE_STAGES,
  PipelineDealItem,
  LOSS_REASONS,
  THREE_OUTCOMES,
} from '@/components/pipeline/pipelineTypes';
import { PipelineProcessTimeline } from '@/components/pipeline/PipelineProcessTimeline';
import { PipelineDealModal } from '@/components/pipeline/PipelineDealModal';
import { CreateLeadModal, CreateLeadPayload } from '@/components/pipeline/CreateLeadModal';
import {
  MoveLeadModal,
  MoveModalCard,
  MoveModalColumn,
} from '@/components/pipeline/MoveLeadModal';
import { LogFollowUpModal } from '@/components/pipeline/LogFollowUpModal';
import {
  EstimateSentGatedModal,
  GatedLeadCard,
} from '@/components/pipeline/EstimateSentGatedModal';
import {
  fetchPipelineDeals,
  updatePipelineDealStage,
  setDealOutcome,
  logDealFollowUp,
  claimLead,
  PipelineSummary,
} from '@/api/pipelineApi';
import { useDragAutoScroll } from '@/hooks/useDragAutoScroll';
import { useDashboardStats } from '@/lib/dashboardStatsStore';

export function PipelinePage() {
  const { user } = useAuth();
  const { stats } = useDashboardStats();

  // Live real data state (100% database driven - zero mock data)
  const [deals, setDeals] = useState<PipelineDealItem[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // View & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'table' | 'calendar'>('kanban');
  const [highlightedStage, setHighlightedStage] = useState<string | null>(null);

  const [selectedEstimator, setSelectedEstimator] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedSlaFilter, setSelectedSlaFilter] = useState<string>('all');

  const [activeDealModal, setActiveDealModal] = useState<PipelineDealItem | null>(null);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [followUpModalDeal, setFollowUpModalDeal] = useState<PipelineDealItem | null>(null);
  const [gatedEstimateDeal, setGatedEstimateDeal] = useState<GatedLeadCard | null>(null);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState<boolean>(false);

  // Scroll tracking state for 8-step mode
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleStepsText, setVisibleStepsText] = useState('Steps 1–5 of 8');
  const [visibleRange, setVisibleRange] = useState<[number, number]>([1, 5]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // DRAG & DROP PIPELINE SYSTEM (Exact mirror of Dashboard workflow)
  // ──────────────────────────────────────────────────────────────────────────
  const dragCardRef = useRef<{ dealId: string; fromStageId: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [dropIntent, setDropIntent] = useState<{
    card: MoveModalCard;
    fromCol: MoveModalColumn;
    toCol: MoveModalColumn;
    targetStageId: PipelineStageId;
  } | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING & SYNCHRONIZATION
  // ──────────────────────────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<any>(null);

  const loadPipelineData = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const [res, analyticsData] = await Promise.all([
        fetchPipelineDeals(),
        import('@/api/pipelineApi').then(m => m.fetchPipelineAnalytics()).catch(() => null)
      ]);
      setDeals(res.deals);
      if (res.summary) {
        setSummary(res.summary);
      }
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err: any) {
      console.error('Failed to load real pipeline deals:', err);
      setLoadError(err.message || 'Failed to connect to backend pipeline service');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update scroll bounds on resize & mount
  const handleKanbanScroll = () => {
    if (!kanbanScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = kanbanScrollRef.current;
    setCanScrollLeft(scrollLeft > 25);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 25);

    const colWidth = 315;
    const firstVisible = Math.min(8, Math.max(1, Math.floor(scrollLeft / colWidth) + 1));
    const countVisible = Math.min(8, Math.ceil(clientWidth / colWidth));
    const lastVisible = Math.min(8, firstVisible + countVisible - 1);
    setVisibleRange([firstVisible, lastVisible]);
    setVisibleStepsText(`Steps ${firstVisible}–${lastVisible} of 8`);
  };

  useEffect(() => {
    handleKanbanScroll();
  }, [deals]);

  // Scroll carousel helpers
  const scrollBoard = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollDelta = direction === 'left' ? -620 : 620;
      kanbanScrollRef.current.scrollBy({ left: scrollDelta, behavior: 'smooth' });
    }
  };

  const jumpToColumnGroup = (target: 'start' | 'end') => {
    if (kanbanScrollRef.current) {
      const targetLeft = target === 'start' ? 0 : kanbanScrollRef.current.scrollWidth;
      kanbanScrollRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  };

  // 60fps edge auto-scroll when dragging cards near screen / container boundaries
  useDragAutoScroll({
    containerRef: kanbanScrollRef,
    isDragging,
    edgeThreshold: 180,
    maxSpeed: 28,
    minSpeed: 4,
    onScroll: handleKanbanScroll,
  });

  // Click-to-Scroll Stage Minimap
  const scrollToStage = (stageId: string) => {
    const targetStage = PIPELINE_STAGES.find((s) => s.id === stageId);
    if (!targetStage) return;

    const el = document.getElementById(`stage-col-${stageId}`);
    if (el && kanbanScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setHighlightedStage(stageId);
      setTimeout(() => setHighlightedStage(null), 2200);
    }
  };



  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Estimator filter
      if (selectedEstimator !== 'all' && deal.estimator.name !== selectedEstimator) {
        return false;
      }
      // Service filter
      if (selectedService !== 'all' && !deal.service.toLowerCase().includes(selectedService.toLowerCase())) {
        return false;
      }
      // SLA filter
      if (selectedSlaFilter === 'due_today' && deal.slaStatus !== 'due_today') {
        return false;
      }
      if (selectedSlaFilter === 'overdue' && deal.slaStatus !== 'overdue') {
        return false;
      }
      if (selectedSlaFilter === 'high_value' && deal.value < 25000) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = deal.name.toLowerCase().includes(q);
        const matchAddress = deal.address.toLowerCase().includes(q) || deal.city.toLowerCase().includes(q);
        const matchPhone = deal.phone.includes(q);
        const matchService = deal.service.toLowerCase().includes(q);
        const matchEstimator = deal.estimator.name.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchPhone && !matchService && !matchEstimator) {
          return false;
        }
      }
      return true;
    });
  }, [deals, selectedEstimator, selectedService, selectedSlaFilter, searchQuery]);

  // Estimators list for filter
  const availableEstimators = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.estimator?.name) set.add(d.estimator.name);
    });
    return Array.from(set);
  }, [deals]);

  // ──────────────────────────────────────────────────────────────────────────
  // DRAG & DROP HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleDragStart = (dealId: string, fromStageId: string) => {
    dragCardRef.current = { dealId, fromStageId };
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverStageId(null);
    dragCardRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = (stageId: string) => {
    setDragOverStageId((prev) => (prev === stageId ? null : prev));
  };

  const handleDropOnStage = (e: React.DragEvent, targetStageId: PipelineStageId) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOverStageId(null);
    const drag = dragCardRef.current;
    dragCardRef.current = null;
    if (!drag) return;
    if (drag.fromStageId === targetStageId) return; // same stage — no-op

    const deal = deals.find((d) => d.id === drag.dealId);
    if (!deal) return;

    const fromDef = PIPELINE_STAGES.find((s) => s.id === drag.fromStageId) || {
      id: drag.fromStageId as PipelineStageId,
      shortTitle: drag.fromStageId.replace(/_/g, ' ').toUpperCase(),
      title: drag.fromStageId,
      accentColor: '#0284c7',
      pillBg: 'bg-sky-500/15 border-sky-500/30',
      pillText: 'text-sky-700',
    };

    const toDef = PIPELINE_STAGES.find((s) => s.id === targetStageId) || {
      id: targetStageId,
      shortTitle: targetStageId.replace(/_/g, ' ').toUpperCase(),
      title: targetStageId,
      accentColor: '#10b981',
      pillBg: 'bg-emerald-500/15 border-emerald-500/30',
      pillText: 'text-emerald-700',
    };

    // Gated stage check: Estimate Sent is automated and cannot be manually dropped into
    if (targetStageId === 'estimate_sent') {
      setGatedEstimateDeal({
        id: deal.id,
        name: deal.name,
        location: `${deal.address}, ${deal.city}`,
        address: deal.address,
        city: deal.city,
        service: deal.service,
        serviceColor: deal.serviceColor,
        phone: deal.phone,
        email: deal.email,
        value: deal.value,
        currentStageName: fromDef.shortTitle,
      });
      return;
    }

    setDropIntent({
      card: {
        id: deal.id,
        name: deal.name,
        location: `${deal.address}, ${deal.city}`,
        service: deal.service,
        serviceColor: deal.serviceColor,
        phone: deal.phone,
        email: deal.email,
      },
      fromCol: {
        id: fromDef.id,
        title: fromDef.shortTitle,
        accentColor: fromDef.accentColor,
        pillClass: `${fromDef.pillBg} ${fromDef.pillText} font-black border`,
      },
      toCol: {
        id: toDef.id,
        title: toDef.shortTitle,
        accentColor: toDef.accentColor,
        pillClass: `${toDef.pillBg} ${toDef.pillText} font-black border`,
      },
      targetStageId,
    });
  };

  const handleConfirmMove = async (notes: string) => {
    if (!dropIntent) return;
    setIsMoving(true);
    const { card, targetStageId } = dropIntent;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === card.id
          ? {
              ...d,
              stageId: targetStageId,
              daysInStage: 0,
              slaStatus: 'on_track',
              slaText: 'Active in stage',
            }
          : d
      )
    );

    try {
      await updatePipelineDealStage(card.id, targetStageId, notes, {
        authorName: user?.name,
        authorRole: user?.role,
      });
    } catch (err) {
      console.error('Failed to move stage on server:', err);
    } finally {
      setIsMoving(false);
      setDropIntent(null);
      loadPipelineData(true);
    }
  };

  const handleCancelMove = () => {
    setDropIntent(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // MANUAL ADVANCE & OUTCOME ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  const handleAdvanceDeal = async (dealId: string, nextStage: PipelineStageId) => {
    if (nextStage === 'estimate_sent') {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        setGatedEstimateDeal({
          id: deal.id,
          name: deal.name,
          location: `${deal.address}, ${deal.city}`,
          address: deal.address,
          city: deal.city,
          service: deal.service,
          serviceColor: deal.serviceColor,
          phone: deal.phone,
          email: deal.email,
          value: deal.value,
        });
      }
      return;
    }

    const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === nextStage);
    const nextStageDef = stageIndex >= 0 ? PIPELINE_STAGES[stageIndex] : null;

    setDeals((prev) =>
      prev.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              stageId: nextStage,
              daysInStage: 0,
              slaStatus: 'on_track',
              slaText: nextStageDef ? `${nextStageDef.shortTitle} in progress` : 'Active',
            }
      )
    );

    try {
      await updatePipelineDealStage(dealId, nextStage, 'Quick advance via arrow button', {
        authorName: user?.name,
        authorRole: user?.role,
      });
    } catch (err) {
      console.error('Failed to advance deal:', err);
    } finally {
      loadPipelineData(true);
    }
  };

  const handleUpdateDeal = (updated: PipelineDealItem) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleMarkOutcome = async (
    dealId: string,
    outcome: 'closed_won' | 'closed_lost' | 'future_followup'
  ) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        if (outcome === 'closed_won') {
          return { ...d, stageId: 'closed_won', slaStatus: 'on_track', slaText: 'Job Sold 🎉' };
        }
        if (outcome === 'closed_lost') {
          return { ...d, stageId: 'closed_lost', slaStatus: 'on_track', slaText: 'Archived • Lost' };
        }
        return { ...d, stageId: 'future_followup', slaStatus: 'on_track', slaText: 'Scheduled Callback' };
      })
    );

    try {
      await setDealOutcome(dealId, outcome, {
        notes: `Marked as ${outcome} from deal actions`,
      });
    } catch (err) {
      console.error('Failed to update deal outcome:', err);
    } finally {
      loadPipelineData(true);
    }
  };

  const handleCreateLead = async (_lead: CreateLeadPayload) => {
    // Lead is created in database by CreateLeadModal; refresh pipeline data
    setShowCreateLeadModal(false);
    loadPipelineData(true);
  };

  const handleLogFollowUpSubmit = async (payload: {
    method: 'call' | 'sms' | 'email' | 'in_person';
    notes: string;
    outcome?: string;
  }) => {
    if (!followUpModalDeal) return;
    setIsSavingFollowUp(true);
    try {
      await logDealFollowUp(followUpModalDeal.id, payload);
      setFollowUpModalDeal(null);
      await loadPipelineData(true);
    } catch (err) {
      console.error('Failed to log follow up:', err);
      alert('Failed to log follow-up. Please try again.');
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleClaimLead = async (dealId: string) => {
    try {
      await claimLead(dealId);
      await loadPipelineData(true);
    } catch (err) {
      console.error('Failed to claim lead:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Homeowner', 'Phone', 'Email', 'Address', 'City', 'Service', 'Value', 'Stage', 'Estimator', 'SLA Status'];
    const rows = filteredDeals.map((d) => [
      d.id,
      `"${d.name}"`,
      `"${d.phone}"`,
      `"${d.email}"`,
      `"${d.address}"`,
      `"${d.city}"`,
      `"${d.service}"`,
      d.value,
      d.stageId,
      `"${d.estimator.name}"`,
      d.slaStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rise_up_pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const pillGradients: Record<number, string> = {
    1: 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]',
    2: 'bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee]',
    3: 'bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7]',
    4: 'bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#818cf8]',
    5: 'bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24]',
    6: 'bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399]',
    7: 'bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#2dd4bf]',
    8: 'bg-gradient-to-r from-[#db2777] via-[#ec4899] to-[#f472b6]',
    9: 'bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c]',
    10: 'bg-gradient-to-r from-[#475569] via-[#64748b] to-[#94a3b8]',
    11: 'bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#22c55e]',
  };

  // Real KPI calculations
  const totalPipelineVal = summary?.totalPipelineValue ?? deals.filter((d) => d.stageId !== 'closed_lost').reduce((sum, d) => sum + d.value, 0);

  const weightedForecastVal = Math.round(
    deals.reduce((sum, d) => {
      if (d.stageId === 'closed_won') return sum + d.value;
      if (d.stageId === 'closed_lost') return sum;
      
      let prob = 0.2;
      if (analytics?.probabilities && analytics.probabilities[d.stageId] !== undefined) {
        prob = analytics.probabilities[d.stageId];
      } else {
        const stageIdx = PIPELINE_STAGES.findIndex((s) => s.id === d.stageId);
        prob = stageIdx >= 0 ? (stageIdx + 1) / 12 : 0.2;
      }
      return sum + d.value * prob;
    }, 0)
  );

  const closedWonDeals = deals.filter((d) => d.stageId === 'closed_won');
  const closedLostDeals = deals.filter((d) => d.stageId === 'closed_lost');

  // Off-screen deals calculation for 8-step mode radar
  const offscreenEndDeals = useMemo(() => {
    return filteredDeals.filter((d) => ['follow_up', 'closed_won'].includes(d.stageId));
  }, [filteredDeals]);

  const offscreenEndVal = offscreenEndDeals.reduce((sum, d) => sum + d.value, 0);

  // Unified high-fidelity Deal Card with 48h review window countdown,
  // bold red overdue styling for 7+ days uncontacted, and instant follow-up contact logger
  const renderDealCard = (
    deal: PipelineDealItem,
    stage: (typeof PIPELINE_STAGES)[number],
    nextStageDef?: (typeof PIPELINE_STAGES)[number]
  ) => {
    const isOverdue = Boolean(deal.isFollowupOverdue);
    const isEstimateSent = deal.stageId === 'estimate_sent';
    const isFollowUpStage = deal.stageId === 'follow_up';

    return (
      <div
        key={deal.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          handleDragStart(deal.id, stage.id);
        }}
        onDragEnd={handleDragEnd}
        onClick={() => setActiveDealModal(deal)}
        style={{
          borderLeftWidth: isOverdue ? '4px' : '3.5px',
          borderLeftColor: isOverdue ? '#ef4444' : stage.accentColor,
        }}
        className={`rounded-xl p-2.5 space-y-1.5 cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 group shadow-2xs hover:shadow-md transition-all select-none ${
          isOverdue
            ? 'bg-red-50/85 border-2 border-red-500 ring-2 ring-red-400/25 shadow-red-100/50'
            : 'liquid-glass-tile'
        }`}
      >
        {/* Overdue Urgent Alert Banner (Bold Red) */}
        {isOverdue && (
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-red-600 text-white font-black text-[9px] tracking-wide animate-pulse shadow-2xs">
            <span className="flex items-center gap-1">
              <AlertTriangle size={10} className="shrink-0" />
              <span>OVERDUE • 7+ Days Without Contact</span>
            </span>
            <span className="bg-white/25 px-1 py-0.2 rounded text-[7.5px]">URGENT</span>
          </div>
        )}

        {/* 48-Hour Review Countdown for Estimate Sent */}
        {isEstimateSent && (
          <div className="flex items-center justify-between text-[9px] px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/90 text-amber-900 font-bold">
            <span className="flex items-center gap-1">
              <Clock size={9} className="text-amber-600 animate-pulse shrink-0" />
              <span>48h Review:</span>
            </span>
            <span className="font-extrabold text-amber-700">
              {deal.hoursUntilAutoMove !== null && deal.hoursUntilAutoMove !== undefined
                ? deal.hoursUntilAutoMove > 0
                  ? `${deal.hoursUntilAutoMove}h until Follow-Up`
                  : 'Auto-moving to Follow-Up'
                : '48h window active'}
            </span>
          </div>
        )}

        {/* Follow-Up Cadence SLA Info (if not overdue) */}
        {isFollowUpStage && !isOverdue && (
          <div className="flex items-center justify-between text-[9px] px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/90 text-purple-900 font-bold">
            <span className="flex items-center gap-1">
              <Clock size={9} className="text-purple-600 shrink-0" />
              <span>Next Follow-Up:</span>
            </span>
            <span className="font-extrabold text-purple-700">
              {deal.followupDaysRemaining !== undefined
                ? deal.followupDaysRemaining > 0
                  ? `${deal.followupDaysRemaining}d remaining`
                  : `${deal.followupHoursRemaining ?? 0}h remaining`
                : 'Within 7 days'}
            </span>
          </div>
        )}

        {/* Name & Source Badge */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <div className="font-bold text-xs text-[#1F1F1F] group-hover:text-[#1878B8] transition-colors leading-snug truncate">
              {deal.name}
            </div>
            <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-medium mt-0.5 truncate">
              <MapPin size={8.5} className="text-slate-400 shrink-0" />
              <span className="truncate">{deal.address}, {deal.city}</span>
            </div>
          </div>
          {deal.leadSource === 'website' ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
              Website
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0 truncate max-w-[100px]" title={deal.createdByName || deal.leadSourceDetail || 'Manual'}>
              {deal.createdByName || deal.leadSourceDetail || 'Manual'}
            </span>
          )}
        </div>

        {/* Service Badge & Deal Value */}
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md truncate max-w-[170px] ${getServiceBadgeClass(deal.serviceColor)}`}>
            {deal.service}
          </span>
          <span className="text-xs font-black text-[#1F1F1F] shrink-0">
            {deal.value > 0 ? `$${deal.value.toLocaleString()}` : <span className="text-slate-400 font-medium text-[10px]">TBD</span>}
          </span>
        </div>

        {/* SLA Status & Photos */}
        <div className="flex items-center justify-between text-[9.5px] pt-1 border-t border-slate-200/50">
          <span
            className={`font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate max-w-[170px] ${
              isOverdue || deal.slaStatus === 'overdue'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : deal.slaStatus === 'due_today'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Clock size={8.5} className="shrink-0" />
            <span className="truncate">{isOverdue ? 'Overdue Contact' : deal.slaText}</span>
          </span>

          {deal.photosCount > 0 && (
            <span className="text-indigo-700 font-bold flex items-center gap-0.5 shrink-0">
              <Camera size={9} />
              <span>{deal.photosCount}</span>
            </span>
          )}
        </div>

        {/* Claim Lead CTA for unassigned leads in Cold Lead / New Leads step */}
        {deal.stageId === 'cold_lead' && (!deal.assignedToUserId || !deal.estimator.name || deal.estimator.name === 'Unassigned') && (
          <div onClick={(e) => e.stopPropagation()} className="pt-1">
            <button
              type="button"
              onClick={() => handleClaimLead(deal.id)}
              className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <UserCheck size={11} />
              <span>Claim Lead</span>
            </button>
          </div>
        )}

        {/* Follow-Up Action CTA (Resets SLA timer to +7 days) */}
        {isFollowUpStage && (
          <div onClick={(e) => e.stopPropagation()}>
            {isOverdue ? (
              <button
                type="button"
                onClick={() => setFollowUpModalDeal(deal)}
                className="w-full mt-0.5 py-1.5 px-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <PhoneCall size={11} className="animate-bounce shrink-0" />
                <span>Follow Up Now (Reset SLA)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFollowUpModalDeal(deal)}
                className="w-full mt-0.5 py-1 px-2 rounded-lg bg-purple-100/90 hover:bg-purple-200 border border-purple-300 text-purple-900 font-bold text-[9.5px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <PhoneCall size={10} className="shrink-0 text-purple-700" />
                <span>Log Contact (+7d SLA)</span>
              </button>
            )}
          </div>
        )}

        {/* Footer: Estimator + Advance Button */}
        <div className="flex items-center justify-between pt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {deal.estimator.avatar ? (
              <img
                src={deal.estimator.avatar}
                alt={deal.estimator.name}
                className="w-4 h-4 rounded-full object-cover border border-white"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#1878B8] to-[#55C4F5] flex items-center justify-center text-white font-black text-[7px] border border-white shrink-0">
                {deal.estimator.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <span className="text-[9.5px] font-semibold text-slate-500">
              {deal.estimator.name !== 'Unassigned'
                ? `Claimed: ${deal.estimator.name.split(' ')[0]}`
                : 'Unassigned'}
            </span>
          </div>

          {nextStageDef && (
            <button
              type="button"
              onClick={() => handleAdvanceDeal(deal.id, nextStageDef.id)}
              className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-[#0284c7] hover:bg-[#1878B8] hover:text-white transition-all cursor-pointer"
              title={`Advance to Step ${nextStageDef.stepNumber}: ${nextStageDef.shortTitle}`}
            >
              <span>Next</span>
              <ArrowRight size={9} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto select-none pb-14 animate-in fade-in duration-200">
      {/* =========================================================================
          1. HERO INTAKE BANNER WITH PANORAMA BACKGROUND, INTEGRATED SEARCH & ACTIONS
          ========================================================================= */}
      <CrmPageHero
        pageId="pipeline"
        defaultEyebrow="Live Pipeline Cadence • Real Database Deals"
        defaultTitle="SALES PIPELINE & ESTIMATE WORKFLOW"
        defaultSubtitle="Live multi-stage roofing pipeline with drag-and-drop progression, real estimate values, and automated field notes."
        showSearch={true}
        searchPlaceholder="Search pipeline deals, clients, addresses, estimators..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        searchRef={searchInputRef}
        topRightActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPipelineData(true)}
              disabled={isRefreshing}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl liquid-glass-btn text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              title="Refresh pipeline from database"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#1878B8]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl liquid-glass-btn text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateLeadModal(true)}
              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-[#1878B8] via-sky-500 to-[#55C4F5] text-white font-bold text-xs shadow-xs hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>New Deal</span>
            </button>
          </div>
        }
        bottomRightBadges={
          <>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Database Connected</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/90 text-[10px] font-bold text-amber-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Drag &amp; Drop Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/90 border border-teal-200/90 text-[10px] font-bold text-teal-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>SLA Health: {summary?.slaHealthPct != null ? `${summary.slaHealthPct}%` : '—'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Deals: {deals.length}</span>
            </div>
          </>
        }
      />

      {/* =========================================================================
          2. EXECUTIVE STATISTICS ROW (Real Live Data)
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <UniversalStatCard
          label="Active Pipeline"
          value={totalPipelineVal > 0 ? `$${(totalPipelineVal / 1000).toFixed(1)}k` : '—'}
          icon={DollarSign}
          iconGradient="from-[#1878B8] to-[#55C4F5]"
          color="#0284c7"
          hoverBorderColor="hover:border-sky-400"
          blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
          footnoteLeft={`${deals.length} active leads`}
          footnoteRight={`${closedWonDeals.length} won`}
          sharePct={deals.length > 0 ? Math.round((deals.filter((d) => d.stageId !== 'closed_lost').length / deals.length) * 100) : 0}
          shareLabel="Active share"
          stageLabel="Active stages"
          sparklineData={stats?.sparklines?.estSent || stats?.sparklines?.newLeads}
        />

        <UniversalStatCard
          label="Weighted Forecast"
          value={weightedForecastVal > 0 ? `$${(weightedForecastVal / 1000).toFixed(1)}k` : '—'}
          deltaLabel="Prob-Adj"
          icon={Activity}
          iconGradient="from-[#7c3aed] to-[#a855f7]"
          color="#8b5cf6"
          hoverBorderColor="hover:border-purple-400"
          blurColor="bg-purple-400/15 group-hover:bg-purple-400/25"
          footnoteLeft="Expected close"
          footnoteRight="Probability weighted"
          sharePct={totalPipelineVal > 0 ? Math.round((weightedForecastVal / totalPipelineVal) * 100) : 0}
          shareLabel="Closing probability"
          stageLabel="Weighted pipeline"
          sparklineData={stats?.sparklines?.jobsWon}
        />

        <UniversalStatCard
          label="SLA Compliance"
          value={summary?.slaHealthPct != null ? `${summary.slaHealthPct}%` : '—'}
          deltaLabel={summary?.slaHealthPct != null ? 'Healthy' : 'Loading'}
          icon={Zap}
          iconGradient="from-[#d97706] to-[#f59e0b]"
          color="#f59e0b"
          hoverBorderColor="hover:border-amber-400"
          blurColor="bg-amber-400/15 group-hover:bg-amber-400/25"
          footnoteLeft="Initial call goal"
          footnoteRight="SLA on-track"
          sharePct={summary?.slaHealthPct ?? 0}
          shareLabel="Compliance rate"
          stageLabel="Stage response"
          sparklineData={stats?.sparklines?.contacted}
        />

        <UniversalStatCard
          label="Unassigned Leads"
          value={String(summary?.unassignedCount ?? deals.filter((d) => !d.estimator.name || d.estimator.name === 'Unassigned').length)}
          deltaLabel="Needs triage"
          icon={Users}
          iconGradient="from-[#ea580c] to-[#f97316]"
          color="#ea580c"
          hoverBorderColor="hover:border-orange-400"
          blurColor="bg-orange-400/15 group-hover:bg-orange-400/25"
          footnoteLeft="Awaiting estimator"
          footnoteRight="Immediate dispatch"
          sharePct={deals.length > 0 ? Math.round(((summary?.unassignedCount ?? deals.filter((d) => !d.estimator.name || d.estimator.name === 'Unassigned').length) / deals.length) * 100) : 0}
          shareLabel="Unassigned ratio"
          stageLabel="Queue health"
          sparklineData={stats?.sparklines?.newLeads}
        />

        <UniversalStatCard
          label="Closed Won Deals"
          value={String(summary?.wonCount ?? closedWonDeals.length)}
          deltaLabel="🎉 Won Contracts"
          icon={Award}
          iconGradient="from-[#059669] to-[#10b981]"
          color="#10b981"
          hoverBorderColor="hover:border-emerald-400"
          blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
          footnoteLeft="Signed contracts"
          footnoteRight="Handoff ready"
          sharePct={deals.length > 0 ? Math.round(((summary?.wonCount ?? closedWonDeals.length) / deals.length) * 100) : 0}
          shareLabel="Win rate"
          stageLabel="Closed revenue"
          sparklineData={stats?.sparklines?.jobsWon}
        />

        <UniversalStatCard
          label="Active Jobs in Field"
          value={String(summary?.activeInstallations ?? 0)}
          deltaLabel="Production"
          icon={CheckCircle2}
          iconGradient="from-[#6366f1] to-[#8b5cf6]"
          color="#6366f1"
          hoverBorderColor="hover:border-indigo-400"
          blurColor="bg-indigo-400/15 group-hover:bg-indigo-400/25"
          footnoteLeft="Crew in progress"
          footnoteRight="Zero downtime"
          sharePct={deals.length > 0 ? Math.round(((summary?.activeInstallations ?? 0) / deals.length) * 100) : 0}
          shareLabel="Field completion"
          stageLabel="Production pipeline"
          sparklineData={stats?.sparklines?.jobsWon}
        />
      </div>

      {/* =========================================================================
          3. MINIMAP / QUICK-SCROLL HORIZONTAL STEP STRIP
          ========================================================================= */}
      <div className="p-2 rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1">
            <Sparkles size={12} className="text-[#1878B8]" />
            <span>SOP Steps:</span>
          </span>

          {PIPELINE_STAGES.map((stage, idx) => {
            const count = deals.filter((d) => d.stageId === stage.id).length;
            const isHovered = dragOverStageId === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => scrollToStage(stage.id)}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={() => handleDragLeave(stage.id)}
                  onDrop={(e) => handleDropOnStage(e, stage.id)}
                  style={
                    isHovered
                      ? {
                          boxShadow: `0 0 0 2px ${stage.accentColor}, 0 4px 12px -2px ${stage.accentColor}40`,
                          transform: 'scale(1.05)',
                        }
                      : undefined
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    highlightedStage === stage.id
                      ? 'bg-sky-100 text-[#0284c7] border-sky-300 ring-2 ring-sky-400 shadow-xs'
                      : isHovered
                      ? 'bg-sky-50 text-[#0284c7] border-sky-400'
                      : 'bg-white/60 text-slate-700 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                  title={`${stage.title} — ${stage.sopGoal}`}
                >
                  <span
                    style={{ backgroundColor: stage.accentColor }}
                    className="w-2 h-2 rounded-full shrink-0"
                  />
                  <span className="text-[11px] font-extrabold">{stage.stepNumber}. {stage.shortTitle}</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-black ${
                      count > 0 ? 'bg-sky-100 text-[#0284c7]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight size={12} className="text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. FILTER TOOLBAR: Layout Switcher, Secondary Filters, & Outcome Drop Zones
          ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        {/* Full-Width View Mode Tabs */}
        <div className="w-full p-1.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/90 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-[#1878B8] to-[#0284c7] text-white shadow-md shadow-sky-500/20 ring-1 ring-white/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Kanban size={15} className={viewMode === 'kanban' ? 'text-white' : 'text-[#1878B8]'} />
              <span>8-Step Board</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'kanban' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {filteredDeals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#1878B8] to-[#0284c7] text-white shadow-md shadow-sky-500/20 ring-1 ring-white/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Layers size={15} className={viewMode === 'table' ? 'text-white' : 'text-[#1878B8]'} />
              <span>Deals Table</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'table' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {filteredDeals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-[#1878B8] to-[#0284c7] text-white shadow-md shadow-sky-500/20 ring-1 ring-white/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Clock size={15} className={viewMode === 'timeline' ? 'text-white' : 'text-[#1878B8]'} />
              <span>Process Timeline</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'timeline' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                SLA
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-[#1878B8] to-[#0284c7] text-white shadow-md shadow-sky-500/20 ring-1 ring-white/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Calendar size={15} className={viewMode === 'calendar' ? 'text-white' : 'text-[#1878B8]'} />
              <span>Calendar Visits</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'calendar' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                Schedule
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar & Carousel / Drag-to-Drop Targets */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs">
          {/* Filters on Left */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
              <Filter size={12} className="text-[#1878B8]" />
              <span>Filter:</span>
            </div>

            {/* Estimator Filter */}
            <select
              value={selectedEstimator}
              onChange={(e) => setSelectedEstimator(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="all">All Estimators</option>
              {availableEstimators.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>

            {/* Service Filter */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="all">All Roofing Types</option>
              <option value="Tile">Spanish / Concrete Tile</option>
              <option value="Shingle">Architectural Shingle</option>
              <option value="Metal">Standing Seam Metal</option>
              <option value="Commercial">Flat / Commercial TPO</option>
              <option value="Repair">Leak Repair &amp; Maintenance</option>
            </select>

            {/* SLA Filter */}
            <select
              value={selectedSlaFilter}
              onChange={(e) => setSelectedSlaFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="all">All SLA Timelines</option>
              <option value="due_today">⚡ Action Due Today</option>
              <option value="overdue">⚠️ SLA Overdue</option>
              <option value="high_value">💎 High Value (&gt;$25k)</option>
            </select>
          </div>

          {/* Right Side: 8-Step Numbered Carousel Navigation */}
          {viewMode === 'kanban' && (
            <div className="flex items-center gap-1 bg-white/95 p-1 rounded-2xl border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => scrollBoard('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'text-[#1878B8] hover:bg-sky-50 active:scale-95'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1 px-0.5">
                {PIPELINE_STAGES.map((stage) => {
                  const isVisible = stage.stepNumber >= visibleRange[0] && stage.stepNumber <= visibleRange[1];
                  const isHighlighted = highlightedStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => scrollToStage(stage.id)}
                      className={`w-7 h-7 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        isHighlighted
                          ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                          : isVisible
                          ? 'bg-gradient-to-r from-[#1878B8] to-[#0ea5e9] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-bold'
                      }`}
                      title={`Step ${stage.stepNumber}: ${stage.shortTitle}`}
                    >
                      {stage.stepNumber}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollBoard('right')}
                disabled={!canScrollRight}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  canScrollRight
                    ? 'text-[#1878B8] hover:bg-sky-50 active:scale-95'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
                title="Scroll Right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Notice if any */}
      {loadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-500 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadPipelineData()}
            className="px-2.5 py-1 rounded-lg bg-rose-200/80 hover:bg-rose-300 text-rose-900 font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          5. ACTIVE VIEW RENDERING
          ========================================================================= */}

      {/* Loading Shimmer Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-start">
          {[1, 2, 3, 4].map((ph) => (
            <div
              key={ph}
              className="rounded-2xl p-3 flex flex-col space-y-3 border border-slate-200/70 bg-white/40 min-h-[580px] animate-pulse"
            >
              <div className="h-10 rounded-xl bg-slate-200/80" />
              <div className="space-y-3 flex-1">
                {[1, 2, 3].map((st) => (
                  <div key={st} className="space-y-2 rounded-xl p-2.5 bg-slate-100/60">
                    <div className="h-4 rounded bg-slate-200 w-1/2" />
                    <div className="h-20 rounded-xl bg-slate-200/60" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 8-STEP HORIZONTAL WORKFLOW (Drag & Drop Enabled) */}
          {viewMode === 'kanban' && (
            <div className="relative">
              <div
                ref={kanbanScrollRef}
                onScroll={handleKanbanScroll}
                className="grid grid-flow-col auto-cols-[300px] gap-3.5 overflow-x-auto pb-6 pt-1 transition-all"
              >
                {PIPELINE_STAGES.map((stage, stageIdx) => {
                  const rawStageDeals = filteredDeals.filter((d) => d.stageId === stage.id);
                  const stageDeals = stage.id === 'follow_up'
                    ? [...rawStageDeals].sort((a, b) => {
                        if (a.isFollowupOverdue && !b.isFollowupOverdue) return -1;
                        if (!a.isFollowupOverdue && b.isFollowupOverdue) return 1;
                        const remA = a.followupDaysRemaining ?? 7;
                        const remB = b.followupDaysRemaining ?? 7;
                        return remA - remB;
                      })
                    : rawStageDeals;
                  const totalVal = stageDeals.reduce((sum, d) => sum + d.value, 0);
                  const nextStage = PIPELINE_STAGES[stageIdx + 1];
                  const isColHighlighted = highlightedStage === stage.id;
                  const isHovered = dragOverStageId === stage.id;
                  const headerGradient = pillGradients[stage.stepNumber] || 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5]';

                  return (
                    <div
                      id={`stage-col-${stage.id}`}
                      key={stage.id}
                      onDragOver={(e) => handleDragOver(e, stage.id)}
                      onDragLeave={() => handleDragLeave(stage.id)}
                      onDrop={(e) => handleDropOnStage(e, stage.id)}
                      style={{
                        boxShadow: isHovered
                          ? `0 0 0 2.5px ${stage.accentColor}, inset 0 1.5px 1px 0 rgba(255,255,255,0.75), 0 4px 24px -2px ${stage.accentColor}33`
                          : undefined,
                        transform: isHovered ? 'scale(1.015)' : 'scale(1)',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className={`liquid-column-channel rounded-2xl p-2 flex flex-col space-y-2 border transition-all duration-300 shadow-xs bg-white/50 min-h-[560px] ${
                        isHovered
                          ? 'ring-4 ring-sky-400/80 border-sky-400'
                          : isColHighlighted
                          ? 'ring-4 ring-sky-400/80 border-sky-400 scale-[1.01]'
                          : 'border-slate-200/80'
                      }`}
                    >
                      {/* Column Header Pill */}
                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl shadow-xs text-white ${headerGradient}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-white/25 text-[10px] flex items-center justify-center font-black shrink-0">
                            {stage.stepNumber}
                          </span>
                          <span className="text-[11px] font-black truncate">{stage.shortTitle}</span>
                        </div>
                        <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-md bg-black/20 text-white shrink-0 ml-1">
                          {stageDeals.length}
                        </span>
                      </div>

                      {/* Timing & Total Value Subhead */}
                      <div className="flex items-center justify-between px-1 text-[10.5px] text-slate-500 font-medium">
                        <span className="font-semibold text-slate-600 truncate">{stage.timingLabel}</span>
                        <span className="font-bold text-[#1F1F1F]">${totalVal.toLocaleString()}</span>
                      </div>

                      {/* Cards List in Column */}
                      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pt-1">
                        {stageDeals.length === 0 ? (
                          <div className="py-8 text-center text-xs font-semibold text-slate-400 bg-white/30 rounded-xl border border-dashed border-slate-200">
                            Drag deal here
                          </div>
                        ) : (
                          stageDeals.map((deal) => renderDealCard(deal, stage, nextStage))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: PROCESS TIMELINE (INTERACTIVE INFOGRAPHIC ROADMAP) */}
          {viewMode === 'timeline' && (
            <PipelineProcessTimeline
              deals={filteredDeals}
              onSelectDeal={(deal) => setActiveDealModal(deal)}
              onAdvanceDeal={handleAdvanceDeal}
              onMarkOutcome={handleMarkOutcome}
            />
          )}

          {/* VIEW 3: HIGH-DENSITY TABLE */}
          {viewMode === 'table' && (
            <div className="rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/70 bg-white/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Deal / Homeowner</th>
                      <th className="py-3 px-4">Property Address</th>
                      <th className="py-3 px-4">Service Scope</th>
                      <th className="py-3 px-4">Current Milestone</th>
                      <th className="py-3 px-4 text-right">Value</th>
                      <th className="py-3 px-4">SLA / Timing</th>
                      <th className="py-3 px-4">Estimator</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold">
                          No deals match current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDeals.map((deal) => {
                        const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === deal.stageId);
                        const stageDef = stageIndex >= 0 ? PIPELINE_STAGES[stageIndex] : null;
                        const nextStage = PIPELINE_STAGES[stageIndex + 1]?.id;

                        return (
                          <tr
                            key={deal.id}
                            onClick={() => setActiveDealModal(deal)}
                            className="hover:bg-white/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 group-hover:text-[#1878B8] transition-colors">
                                {deal.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {deal.phone}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{deal.address}</div>
                              <div className="text-[11px] text-slate-500">{deal.city}, CA</div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md ${getServiceBadgeClass(deal.serviceColor)}`}>
                                {deal.service}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {stageDef ? (
                                <span className={`inline-block text-[10.5px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${stageDef.pillBg} ${stageDef.pillText}`}>
                                  {stageDef.shortTitle}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-bold">{deal.stageId}</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              ${deal.value.toLocaleString()}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                                  deal.slaStatus === 'overdue'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : deal.slaStatus === 'due_today'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {deal.slaText}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={deal.estimator.avatar}
                                  alt={deal.estimator.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="font-semibold text-slate-800">{deal.estimator.name}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`tel:${deal.phone}`}
                                  className="p-1 rounded-lg bg-sky-100 text-[#0284c7] hover:bg-[#1878B8] hover:text-white transition-colors"
                                  title="Call Homeowner"
                                >
                                  <Phone size={12} />
                                </a>

                                {nextStage && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceDeal(deal.id, nextStage)}
                                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-100 text-[#0284c7] hover:bg-[#1878B8] hover:text-white transition-all cursor-pointer"
                                    title="Advance to Next Stage"
                                  >
                                    <span>Next</span>
                                    <ArrowRight size={10} />
                                  </button>
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
          )}

          {/* VIEW 4: SLA & INSPECTION CALENDAR */}
          {viewMode === 'calendar' && (
            <div className="rounded-2xl light-glass-panel glossy-sheen border border-white/85 p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                <div>
                  <h2 className="text-base font-black text-[#1F1F1F] tracking-tight">
                    Inspection &amp; Follow-Up Schedule
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Live schedule calculated from on-site visit dates and follow-up deadlines.
                  </p>
                </div>
                <div className="text-xs font-black text-[#1878B8] px-3 py-1 rounded-xl bg-sky-50 border border-sky-200">
                  Active Timeline
                </div>
              </div>

              {/* Chronological Schedule Stream */}
              <div className="space-y-2.5">
                {filteredDeals.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    No scheduled inspections or callbacks found.
                  </div>
                ) : (
                  filteredDeals.slice(0, 10).map((deal, idx) => (
                    <div
                      key={deal.id}
                      onClick={() => setActiveDealModal(deal)}
                      className="p-3.5 rounded-xl liquid-glass-tile hover:border-sky-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100/90 text-[#1878B8] flex flex-col items-center justify-center shrink-0 font-black shadow-2xs">
                          <span className="text-[9.5px] uppercase leading-tight">Day</span>
                          <span className="text-sm leading-none">{deal.daysInStage}d</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1F1F1F]">{deal.name}</span>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${getServiceBadgeClass(deal.serviceColor)}`}>
                              {deal.service}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-[#1878B8]" />
                            <span>{deal.address}, {deal.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-black text-[#1F1F1F]">${deal.value.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-[#0284c7]">{deal.slaText}</div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODALS INTEGRATION: Deal Modal (same as Dashboard), Create Lead, Move & Follow-Up Modal
          ========================================================================= */}
      <PipelineDealModal
        deal={activeDealModal}
        isOpen={Boolean(activeDealModal)}
        onClose={() => setActiveDealModal(null)}
        onAdvanceStage={handleAdvanceDeal}
        onUpdateDeal={handleUpdateDeal}
      />

      <CreateLeadModal
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        onSubmitLead={handleCreateLead}
      />

      {/* DRAG & DROP MOVE CONFIRMATION MODAL (Exact mirror of Dashboard) */}
      <MoveLeadModal
        intent={dropIntent}
        isMoving={isMoving}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />

      {/* FOLLOW-UP OUTREACH MODAL (Automatic 7-day SLA reset & note logging) */}
      <LogFollowUpModal
        deal={followUpModalDeal}
        isOpen={Boolean(followUpModalDeal)}
        isSaving={isSavingFollowUp}
        onClose={() => setFollowUpModalDeal(null)}
        onSubmitFollowUp={handleLogFollowUpSubmit}
      />

      {/* ESTIMATE SENT GATED MODAL (Automated stage workflow notice) */}
      <EstimateSentGatedModal
        deal={gatedEstimateDeal}
        isOpen={Boolean(gatedEstimateDeal)}
        onClose={() => setGatedEstimateDeal(null)}
      />
    </div>
  );
}

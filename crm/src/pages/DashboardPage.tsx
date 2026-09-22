import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  Calendar,
  FileText,
  Trophy,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  CalendarDays,
  Mail,
  CheckCircle2,
  MapPin,
  Bell,
  ArrowUpRight,
  Clock,
  Briefcase,
  ShieldCheck,
  Check,
  Sliders,
  UserCheck,
  Lock,
  Hammer,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PipelineListView } from '../components/pipeline/PipelineListView';
import { PipelineCalendarView } from '../components/pipeline/PipelineCalendarView';
import { useDashboardStats } from '../lib/dashboardStatsStore';
import { type RecentActivityItem } from '../api/dashboardApi';
import { usePipelineKanban } from '../lib/pipelineStore';

import { PipelineDealModal } from '../components/pipeline/PipelineDealModal';
import { MoveLeadModal } from '../components/pipeline/MoveLeadModal';
import { CreateLeadModal, CreateLeadPayload } from '../components/pipeline/CreateLeadModal';
import { EnrichedDeal, enrichDeals, PipelineDealItem, PipelineStageId } from '../components/pipeline/pipelineTypes';
import { updatePipelineDealStage, logDealFollowUp, claimLead } from '../api/pipelineApi';
import { LogFollowUpModal } from '../components/pipeline/LogFollowUpModal';
import { api } from '@/lib/api';
import { EstimateSentGatedModal, GatedLeadCard } from '../components/pipeline/EstimateSentGatedModal';
import { useClients360 } from '../lib/client360Store';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { useCompany } from '@/context/CompanyContext';

interface DealCard {
  id: string;
  name: string;
  location: string;
  service: string;
  serviceColor: 'sky' | 'amber' | 'emerald' | 'purple' | 'coral' | 'indigo' | 'blue';
  time: string;
  phone?: string;
  email?: string;
  value?: number;
  isFollowupOverdue?: boolean;
  hoursUntilAutoMove?: number | null;
  followupDaysRemaining?: number;
  leadSource?: string;
  leadSourceDetail?: string;
  sourceType?: string;
  assignedToUserId?: number | null;
  assignedToName?: string | null;
  createdByUserId?: number | null;
  createdByName?: string | null;
}

interface ColumnData {
  id: string;
  title: string;
  count: number;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  pillClass: string;
  badgeClass: string;
  iconType: 'users' | 'phone' | 'calendar' | 'file-text' | 'clock' | 'bell' | 'shield' | 'trophy' | 'briefcase';
  cards: DealCard[];
}

const SOURCE_OPTIONS = [
  'All Sources',
  'Website',
  'Manual',
];

const REP_OPTIONS = [
  'All Reps',
  'Marc Sarellano (Owner)',
  'Dave Harrison (Estimator)',
  'Carlos Morales (Foreman)',
  'Silvester Stone (Sales)',
  'Daniel Rodriguez (PM)',
];

const SERVICE_OPTIONS = [
  'All Services',
  'Residential Roofing',
  'Shingle Roof',
  'Tile Roofing',
  'Roof Repair',
  'Commercial Flat',
  'Maintenance',
  'Torch Down',
];

// Helper: format dollar amounts
function formatCurrency(val: number | undefined): string {
  if (val === undefined || val === null) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1000)}K`;
  return `$${Math.round(val)}`;
}

// Helper: format relative time
function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return 'just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'just now';
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return 'just now';
  }
}

function ActivityItemCard({ activity }: { activity: RecentActivityItem }) {
  const type = activity.activity_type;
  const userName = (activity.user_name || activity.performed_by || 'Staff').split(' ')[0];
  const targetName = activity.target_name || activity.metadata?.lead_name || activity.metadata?.customer_name || 'Client';
  const amount = activity.amount ?? activity.metadata?.amount ?? activity.metadata?.contract_value;
  const formattedAmount = amount && Number(amount) > 0 ? `$${Number(amount).toLocaleString()}` : null;
  const timeStr = formatRelativeTime(activity.created_at);

  if (type === 'lead_created' || type === 'lead_added') {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
        <div className="w-5 h-5 rounded-md bg-sky-100/90 text-[#1878B8] flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
          <Users size={11} />
        </div>
        <div className="truncate text-[10px]">
          <span className="text-slate-600">{userName} added lead <strong className="text-[#1F1F1F]">{targetName}</strong></span>
          <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
        </div>
      </div>
    );
  }

  if (type === 'lead_claimed') {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
        <div className="w-5 h-5 rounded-md bg-indigo-100/90 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
          <UserCheck size={11} />
        </div>
        <div className="truncate text-[10px]">
          <span className="text-slate-600">{userName} claimed lead <strong className="text-[#1F1F1F]">{targetName}</strong></span>
          <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
        </div>
      </div>
    );
  }

  if (type === 'estimate_sent' || type === 'proposal_sent') {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
        <div className="w-5 h-5 rounded-md bg-blue-100/90 text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
          <Mail size={11} />
        </div>
        <div className="truncate text-[10px]">
          <span className="text-slate-600">Sent to <strong className="text-[#1F1F1F]">{targetName}</strong>{formattedAmount ? ` ${formattedAmount}` : ''}</span>
          <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
        </div>
      </div>
    );
  }

  if (type === 'contract_signed') {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
        <div className="w-5 h-5 rounded-md bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
          <FileText size={11} />
        </div>
        <div className="truncate text-[10px]">
          <span className="text-slate-600">Contract signed <strong className="text-[#1F1F1F]">{targetName}</strong></span>
          <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
        </div>
      </div>
    );
  }

  if (type === 'job_completed' || type === 'completed') {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
        <div className="w-5 h-5 rounded-md bg-teal-100/90 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
          <CheckCircle2 size={11} />
        </div>
        <div className="truncate text-[10px]">
          <span className="text-slate-600">Job completed <strong className="text-[#1F1F1F]">{targetName}</strong></span>
          <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
        </div>
      </div>
    );
  }

  // Generic fallback for notes, calls, touchpoints
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg liquid-glass-tile text-xs min-w-0">
      <div className="w-5 h-5 rounded-md bg-slate-100/90 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-xs">
        <Clock size={11} />
      </div>
      <div className="truncate text-[10px]">
        <span className="text-slate-600">{userName} updated <strong className="text-[#1F1F1F]">{targetName}</strong></span>
        <span className="text-slate-400 ml-1.5 font-medium shrink-0">{timeStr}</span>
      </div>
    </div>
  );
}

// Generate smooth SVG path from data points for sparkline
function dataToMiniPath(data: number[] | undefined, width = 73, height = 28, pad = 2): string {
  const zeroY = height - pad - 2;
  if (!data || data.length < 2) return `M ${pad} ${zeroY} L ${width - pad} ${zeroY}`;
  const max = Math.max(...data);
  const min = Math.min(...data);
  if (max === 0 && min === 0) {
    return `M ${pad} ${zeroY} L ${width - pad} ${zeroY}`;
  }
  if (max === min) {
    const midY = Math.round(height / 2);
    return `M ${pad} ${midY} L ${width - pad} ${midY}`;
  }
  const range = max - min;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2 - 2),
  }));
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

function dataToPopoverPaths(data: number[] | undefined, width = 234, height = 64, padX = 6, padY = 6): {
  line: string; area: string; dotCx: number; dotCy: number;
} {
  const zeroY = height - padY - 2;
  const flatZero = {
    line: `M ${padX} ${zeroY} L ${width - padX} ${zeroY}`,
    area: `M ${padX} ${zeroY} L ${width - padX} ${zeroY} L ${width - padX} ${height} L ${padX} ${height} Z`,
    dotCx: width - padX,
    dotCy: zeroY,
  };
  if (!data || data.length < 2) return flatZero;
  const max = Math.max(...data);
  const min = Math.min(...data);
  if (max === 0 && min === 0) return flatZero;
  if (max === min) {
    const midY = Math.round(height / 2);
    return {
      line: `M ${padX} ${midY} L ${width - padX} ${midY}`,
      area: `M ${padX} ${midY} L ${width - padX} ${midY} L ${width - padX} ${height} L ${padX} ${height} Z`,
      dotCx: width - padX,
      dotCy: midY,
    };
  }
  const range = max - min;
  const pts = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (width - padX * 2),
    y: padY + (1 - (v - min) / range) * (height - padY * 2 - 4),
  }));
  let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    line += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  const area = `${line} L ${(width - padX).toFixed(1)} ${height} L ${padX} ${height} Z`;
  return { line, area, dotCx: Math.round(last.x), dotCy: Math.round(last.y) };
}

// Helper: trend delta pill (green positive, red negative, hidden if null)
function TrendPill({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) return null;
  const isPositive = delta >= 0;
  const label = `${isPositive ? '+' : ''}${delta}%`;
  if (isPositive) {
    return (
      <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-200/90 shadow-2xs backdrop-blur-xs">
        <TrendingUp size={9} className="stroke-[2.5]" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold text-[#E6392D] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50/90 border border-rose-200/90 shadow-2xs backdrop-blur-xs">
      <TrendingDown size={9} className="stroke-[2.5]" />
      <span>{label}</span>
    </span>
  );
}

// Helper: skeleton shimmer while loading
function StatSkeleton() {
  return <span className="inline-block w-8 h-6 bg-slate-200/80 animate-pulse rounded align-middle" />;
}


// ─── 600ms intentional-hover hook ─────────────────────────────────────────
// Prevents accidental reveals when cursor sweeps across cards.
// onEnter:        card mouseenter  — schedules open after openDelay
// onLeave:        card/popover mouseleave — schedules close after 120ms
// onPopoverEnter: popover mouseenter — cancels the pending close so cursor
//                 can move onto the popover without it disappearing
function useHoverDelay(openDelay = 600) {
  const [active, setActive] = useState(false);
  const openT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onEnter = useCallback(() => {
    if (closeT.current) clearTimeout(closeT.current);
    openT.current = setTimeout(() => setActive(true), openDelay);
  }, [openDelay]);

  const onLeave = useCallback(() => {
    if (openT.current) clearTimeout(openT.current);
    closeT.current = setTimeout(() => setActive(false), 120);
  }, []);

  const onPopoverEnter = useCallback(() => {
    if (closeT.current) clearTimeout(closeT.current);
  }, []);

  return { active, onEnter, onLeave, onPopoverEnter };
}

// ─── Stat card detail popover ──────────────────────────────────────────────
interface StatPopoverProps {
  label: string;
  value: number;
  delta: number | null;
  totalLeads: number;
  stageLabel: string;
  color: string;
  svgArea: string;
  svgLine: string;
  dotCx: number;
  dotCy: number;
  anchorRef: React.RefObject<HTMLDivElement>;
  onPopoverEnter: () => void;
  onLeave: () => void;
}

function StatCardPopover({
  label, value, delta, totalLeads, stageLabel, color,
  svgArea, svgLine, dotCx, dotCy,
  anchorRef, onPopoverEnter, onLeave,
}: StatPopoverProps) {
  const rect = anchorRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const popW = 276;
  const above = rect.top > window.innerHeight * 0.52;
  const rawLeft = rect.left + rect.width / 2 - popW / 2;
  const left = Math.max(8, Math.min(rawLeft, window.innerWidth - popW - 8));

  const posStyle: React.CSSProperties = above
    ? { position: 'fixed', bottom: window.innerHeight - rect.top + 8, left, width: popW, zIndex: 99998, transformOrigin: 'bottom center' }
    : { position: 'fixed', top: rect.bottom + 8, left, width: popW, zIndex: 99998, transformOrigin: 'top center' };

  const pct = totalLeads > 0 ? Math.min(100, Math.round((value / totalLeads) * 100)) : 0;
  const priorValue = delta != null ? Math.max(0, Math.round(value / (1 + delta / 100))) : null;
  const deltaPos = delta != null && delta > 0;
  const deltaNeg = delta != null && delta < 0;
  const deltaText = delta != null
    ? `${deltaPos ? '+' : ''}${delta.toFixed(1)}% MoM`
    : 'No prior data';
  const gradId = `ppg-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return createPortal(
    <div
      style={posStyle}
      onMouseEnter={onPopoverEnter}
      onMouseLeave={onLeave}
      className="animate-in fade-in zoom-in-95 duration-150 rounded-2xl bg-white/96 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.85)_inset] overflow-hidden"
    >
      {/* Accent gradient top bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${color}70, ${color})` }} />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-slate-100/80">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-3.5 rounded-full" style={{ background: color }} />
          <span className="text-[12px] font-black text-slate-900 tracking-tight">{label}</span>
        </div>
        <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${
          deltaPos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          deltaNeg ? 'bg-rose-50 text-rose-600 border-rose-200' :
          'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {deltaText}
        </span>
      </div>

      {/* Large sparkline */}
      <div className="px-3 pt-2.5 pb-1">
        <svg width="100%" height="62" viewBox="0 0 234 64" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.30" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>
          {/* Subtle grid lines */}
          <line x1="6" y1="21" x2="228" y2="21" stroke={color} strokeOpacity="0.08" strokeDasharray="5 4" strokeWidth="1" />
          <line x1="6" y1="42" x2="228" y2="42" stroke={color} strokeOpacity="0.08" strokeDasharray="5 4" strokeWidth="1" />
          {/* Area fill */}
          <path d={svgArea} fill={`url(#${gradId})`} />
          {/* Stroke */}
          <path d={svgLine} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          {/* Live endpoint dot — outer ring */}
          <circle cx={dotCx} cy={dotCy} r="5" fill="white" />
          {/* Live endpoint dot — inner fill + pulse */}
          <circle cx={dotCx} cy={dotCy} r="3" fill={color}>
            <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-3" />

      {/* Breakdown */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Current vs Prior */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium">This period</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-black text-slate-900">{value}</span>
            <span className="text-[9px] text-slate-300">vs</span>
            <span className="text-[11px] font-bold text-slate-400">
              {priorValue != null ? priorValue : '—'} prior
            </span>
          </div>
        </div>

        {/* Pipeline share bar */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500 font-medium shrink-0">Pipeline share</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-[10px] font-black text-slate-700">{pct}%</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: color, transition: 'width 0.7s ease' }}
              />
            </div>
          </div>
        </div>

        {/* Stage type */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium">Stage</span>
          <span
            className="text-[9.5px] font-black px-2 py-0.5 rounded-full border"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}
          >
            {stageLabel}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3.5">
        <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-1.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-400">Auto-refreshes every 60s</span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            Live
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Skeleton: KPI stat card shimmer ────────────────────────────────────────
function KpiCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: icon + pill */}
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg bg-slate-200/70 animate-pulse" />
        <div className="w-12 h-4 rounded-full bg-slate-200/50 animate-pulse" />
      </div>
      {/* Middle row: value + sparkline */}
      <div className="flex items-end justify-between mt-2">
        <div className="space-y-1.5">
          <div className="w-10 h-6 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="w-14 h-2.5 rounded bg-slate-200/50 animate-pulse" />
        </div>
        <div className="w-16 h-7 rounded-lg bg-slate-200/40 animate-pulse" />
      </div>
      {/* Bottom row: footnote + bar */}
      <div className="mt-2 pt-1.5 border-t border-slate-200/40 flex items-center justify-between">
        <div className="w-12 h-2 rounded bg-slate-200/40 animate-pulse" />
        <div className="w-12 h-1 rounded-full bg-slate-200/40 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Skeleton: Kanban column with shimmer lead cards ────────────────────────
function KanbanColumnSkeleton({ cardCount = 2 }: { cardCount?: number }) {
  return (
    <div
      className="liquid-column-channel rounded-2xl p-1.5 flex flex-col min-w-[130px] h-full"
      style={{
        backgroundColor: 'rgba(241,245,249,0.55)',
        boxShadow: '0 0 0 1.5px rgba(203,213,225,0.4), inset 0 1.5px 1px 0 rgba(255,255,255,0.75), 0 4px 16px -2px rgba(15,23,42,0.04)',
      }}
    >
      {/* Header pill shimmer */}
      <div className="flex items-center justify-between px-1 py-1 mb-1.5">
        <div className="w-16 h-5 rounded-full bg-slate-200/60 animate-pulse" />
        <div className="w-5 h-4 rounded bg-slate-200/40 animate-pulse" />
      </div>
      {/* Shimmer cards */}
      <div className="flex-1 space-y-1.5">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white/55 backdrop-blur-sm p-2 space-y-2 border border-white/60">
            <div className="flex items-center justify-between">
              <div className="w-20 h-3 rounded bg-slate-200/60 animate-pulse" />
              <div className="w-6 h-3 rounded bg-slate-200/40 animate-pulse" />
            </div>
            <div className="w-16 h-2.5 rounded bg-slate-200/45 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-3.5 rounded-full bg-slate-200/50 animate-pulse" />
              <div className="w-8 h-3.5 rounded-full bg-slate-200/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { company, licenseNumber, city, companyName } = useCompany();
  const { columns, summary, isLoading: pipelineLoading, refresh: refreshPipeline, moveCardOptimistically } = usePipelineKanban();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useDashboardStats();
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [omniSearch, setOmniSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [createLeadStage, setCreateLeadStage] = useState('new_leads');
  const [activeDropdown, setActiveDropdown] = useState<'source' | 'rep' | 'service' | null>(null);
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedRep, setSelectedRep] = useState('All Reps');
  const [selectedService, setSelectedService] = useState('All Services');
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Reactive KPI Stats: Harmonized with live Kanban columns for instant feedback ──
  const activeStats = useMemo(() => {
    if (columns && columns.length > 0) {
      const newLeads = columns.find((c) => c.id === 'new_leads')?.cards.length ?? 0;
      const contacted = columns.find((c) => c.id === 'contacted')?.cards.length ?? 0;
      const estScheduled = columns.find((c) => c.id === 'est_scheduled')?.cards.length ?? 0;
      const estSent = (columns.find((c) => c.id === 'est_sent')?.cards.length ?? 0) +
                      (columns.find((c) => c.id === 'follow_up')?.cards.length ?? 0);
      const contractSignedCount = columns.find((c) => c.id === 'contract_signed')?.cards.length ?? 0;
      const activeJobsCount = columns.find((c) => c.id === 'active_jobs')?.cards.length ?? 0;
      const wonFromSummary = summary?.wonCount ?? 0;
      const jobsWon = Math.max(contractSignedCount + activeJobsCount, wonFromSummary, stats?.jobsWon ?? 0);
      const lostClosed = summary?.lostCount ?? stats?.lostClosed ?? 0;
      const totalLeads = Math.max(
        columns.reduce((sum, col) => sum + col.cards.length, 0) + lostClosed,
        summary?.totalLeads ?? 0,
        stats?.totalLeads ?? 0
      );

      return {
        newLeads,
        newLeadsDelta: stats?.newLeadsDelta ?? null,
        contacted,
        contactedDelta: stats?.contactedDelta ?? null,
        estScheduled,
        estScheduledDelta: stats?.estScheduledDelta ?? null,
        estSent,
        estSentDelta: stats?.estSentDelta ?? null,
        jobsWon,
        jobsWonDelta: stats?.jobsWonDelta ?? null,
        lostClosed,
        lostClosedDelta: stats?.lostClosedDelta ?? null,
        totalLeads,
        ytdRevenue: stats?.ytdRevenue ?? 0,
        activeCrewCount: stats?.activeCrewCount ?? 0,
        totalPipelineValue: summary?.totalPipelineValue ?? stats?.totalPipelineValue ?? 0,
        sparklines: stats?.sparklines ?? null,
        recentActivities: stats?.recentActivities ?? [],
      };
    }
    return stats;
  }, [columns, summary, stats]);

  const isStatsLoadingInitial = (statsLoading && !stats) && (pipelineLoading && columns.length === 0);

  // ── KPI card hover popovers (6 cards × ref + 600ms hover hook) ───────────
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const card5Ref = useRef<HTMLDivElement>(null);
  const card6Ref = useRef<HTMLDivElement>(null);
  const hover1 = useHoverDelay();
  const hover2 = useHoverDelay();
  const hover3 = useHoverDelay();
  const hover4 = useHoverDelay();
  const hover5 = useHoverDelay();
  const hover6 = useHoverDelay();
  // Real pipeline-share % for progress bars
  const cardPct = (val: number | undefined) =>
    `${Math.min(100, Math.round(((val ?? 0) / Math.max(activeStats?.totalLeads ?? 1, 1)) * 100))}%`;
  // ──────────────────────────────────────────────────────────────────────────

  const dragCardRef = useRef<{ cardId: string; fromColId: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  const [dropIntent, setDropIntent] = useState<{
    card: DealCard;
    fromCol: ColumnData;
    toCol: ColumnData;
  } | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [followUpModalCard, setFollowUpModalCard] = useState<DealCard | null>(null);
  const [isLoggingFollowUp, setIsLoggingFollowUp] = useState(false);
  const [completeModalCard, setCompleteModalCard] = useState<DealCard | null>(null);
  const [gatedEstimateCard, setGatedEstimateCard] = useState<GatedLeadCard | null>(null);
  const [isCompletingJob, setIsCompletingJob] = useState(false);

  const handleDragStart = (cardId: string, fromColId: string) => {
    dragCardRef.current = { cardId, fromColId };
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverColId(null);
    dragCardRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = (colId: string) => {
    setDragOverColId((prev) => (prev === colId ? null : prev));
  };

  const handleDrop = (e: React.DragEvent, toCol: ColumnData) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOverColId(null);
    const drag = dragCardRef.current;
    dragCardRef.current = null;
    if (!drag) return;
    if (drag.fromColId === toCol.id) return; // same column — no-op
    const fromCol = columns.find((c) => c.id === drag.fromColId);
    const card = fromCol?.cards.find((c) => c.id === drag.cardId);
    if (!fromCol || !card) return;

    // Gated stage check: Estimate Sent is automated and cannot be manually dropped into
    if (toCol.id === 'est_sent' || toCol.id === 'estimate_sent') {
      setGatedEstimateCard({
        id: card.id,
        name: card.name,
        location: card.location,
        address: card.address || card.location,
        city: card.city,
        service: card.service,
        serviceColor: card.serviceColor,
        phone: card.phone,
        email: card.email,
        value: card.value,
        currentStageName: fromCol.title,
      });
      return;
    }

    setDropIntent({ card, fromCol, toCol });
  };

  // Dashboard column → backend pipeline_stage
  const STAGE_MAP: Record<string, { granularStage: PipelineStageId; pipelineStage: string }> = {
    new_leads:       { granularStage: 'cold_lead', pipelineStage: 'stage_1_lead_gen' },
    contacted:       { granularStage: 'initial_call', pipelineStage: 'stage_2_initial_contact' },
    est_scheduled:   { granularStage: 'inspection_scheduled', pipelineStage: 'stage_3_site_visit_estimate' },
    est_sent:        { granularStage: 'estimate_sent', pipelineStage: 'stage_3_site_visit_estimate' },
    follow_up:       { granularStage: 'follow_up', pipelineStage: 'stage_4_closing' },
    contract_signed: { granularStage: 'contract_signed', pipelineStage: 'stage_4_closing' },
    active_jobs:     { granularStage: 'active_jobs', pipelineStage: 'stage_5_completion_followup' },
    job_completed:   { granularStage: 'job_completed', pipelineStage: 'stage_5_completion_followup' },
  };

  const handleConfirmMove = async (notes: string, authorInfo?: { plainNote?: string; authorName?: string; authorRole?: string }) => {
    if (!dropIntent) return;
    const { card, fromCol, toCol } = dropIntent;
    // 1. Instantly move card in UI state for 0ms visual latency
    moveCardOptimistically(card.id, fromCol.id, toCol.id);
    setDropIntent(null);
    setIsMoving(true);

    const mapping = STAGE_MAP[toCol.id] || { granularStage: 'cold_lead', pipelineStage: 'stage_1_lead_gen' };
    try {
      await updatePipelineDealStage(card.id, mapping.granularStage, notes.trim() || undefined, authorInfo);
    } catch (err) {
      console.error('Failed to update stage:', err);
      // Revert/refresh on failure
      refreshPipeline(true);
    } finally {
      setIsMoving(false);
      refreshPipeline(true);
      refreshStats(true);
    }
  };

  const handleLogFollowUpSubmit = async (payload: {
    method: 'call' | 'sms' | 'email' | 'in_person';
    notes: string;
    outcome?: string;
  }) => {
    if (!followUpModalCard) return;
    setIsLoggingFollowUp(true);
    try {
      await logDealFollowUp(followUpModalCard.id, payload);
      setFollowUpModalCard(null);
      refreshPipeline();
      refreshStats();
    } catch (err) {
      console.error('Failed to log follow-up:', err);
    } finally {
      setIsLoggingFollowUp(false);
    }
  };

  const handleConfirmCompleteJob = async (notes: string, authorInfo?: { name?: string; role?: string }) => {
    if (!completeModalCard) return;
    setIsCompletingJob(true);
    try {
      await updatePipelineDealStage(completeModalCard.id, 'job_completed', notes.trim() || undefined, {
        authorName: authorInfo?.name,
        authorRole: authorInfo?.role,
        plainNote: notes.trim() || undefined,
      });
      setCompleteModalCard(null);
      refreshPipeline();
      refreshStats();
      window.dispatchEvent(new CustomEvent('crm:top-performers-updated'));
    } catch (err) {
      console.error('Failed to complete job:', err);
      setCompleteModalCard(null);
      refreshPipeline();
      refreshStats();
    } finally {
      setIsCompletingJob(false);
    }
  };

  const handleCancelMove = () => {
    setDropIntent(null);
  };
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClaimLead = async (cardId: string) => {
    try {
      await claimLead(cardId);
      refreshPipeline();
      refreshStats();
    } catch (err) {
      console.error('Failed to claim lead:', err);
    }
  };

  const filteredColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      cards: col.cards.filter((c) => {
        if (selectedService !== 'All Services') {
          const svcWord = selectedService.toLowerCase().replace(' residential', '').replace(' roofing', '').replace(' roof', '');
          if (!c.service.toLowerCase().includes(svcWord)) return false;
        }
        if (selectedSource !== 'All Sources') {
          if (selectedSource === 'Website') {
            if (c.leadSource !== 'website') return false;
          } else if (selectedSource === 'Manual') {
            if (c.leadSource !== 'manual') return false;
          }
        }
        if (selectedRep !== 'All Reps') {
          const repName = selectedRep.split(' (')[0].toLowerCase();
          const assigned = (c.assignedToName || '').toLowerCase();
          const creator = (c.createdByName || '').toLowerCase();
          if (!assigned.includes(repName) && !creator.includes(repName)) return false;
        }
        return true;
      }),
    }));
  }, [columns, selectedService, selectedSource, selectedRep]);

  const handleCreateLead = async (_lead: CreateLeadPayload) => {
    // Lead is created in database by CreateLeadModal; refresh dashboard stores
    refreshStats();
    refreshPipeline();
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderColumnIcon = (type: string) => {
    switch (type) {
      case 'users':
        return <Users size={11} className="shrink-0 stroke-[2.5]" />;
      case 'phone':
        return <Phone size={11} className="shrink-0 stroke-[2.5]" />;
      case 'calendar':
        return <Calendar size={11} className="shrink-0 stroke-[2.5]" />;
      case 'file-text':
        return <FileText size={11} className="shrink-0 stroke-[2.5]" />;
      case 'clock':
        return <Clock size={11} className="shrink-0 stroke-[2.5]" />;
      case 'bell':
        return <Bell size={11} className="shrink-0 stroke-[2.5]" />;
      case 'shield':
        return <ShieldCheck size={11} className="shrink-0 stroke-[2.5]" />;
      case 'trophy':
        return <Trophy size={11} className="shrink-0 stroke-[2.5]" />;
      case 'briefcase':
        return <Briefcase size={11} className="shrink-0 stroke-[2.5]" />;
    }
  };

  const getServiceBadgeClass = (color: string) => {
    switch (color) {
      case 'sky':
        return 'bg-sky-100/90 text-[#0284c7] border border-sky-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'amber':
        return 'bg-amber-100/90 text-amber-900 border border-[#F9C500]/70 font-bold shadow-2xs backdrop-blur-xs';
      case 'emerald':
        return 'bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'purple':
        return 'bg-purple-100/90 text-purple-800 border border-purple-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'coral':
        return 'bg-rose-100/90 text-rose-800 border border-[#E6392D]/40 font-bold shadow-2xs backdrop-blur-xs';
      case 'indigo':
        return 'bg-indigo-100/90 text-indigo-800 border border-indigo-300/80 font-bold shadow-2xs backdrop-blur-xs';
      case 'blue':
      default:
        return 'bg-blue-100/90 text-blue-800 border border-blue-300/80 font-bold shadow-2xs backdrop-blur-xs';
    }
  };

  return (
    <div className="h-full flex flex-col justify-between min-h-0 w-full max-w-[1600px] mx-auto select-none gap-2">
      {/* ========================================================
          1. UNIFIED HERO BANNER WITH TOP SEARCH & BADGES (Compact Mode)
          ======================================================== */}
      <CrmPageHero
        compact={true}
        pageId="dashboard"
        defaultEyebrow="Discipline Builds Freedom • North County San Diego"
        defaultTitle="EXECUTIVE COMMAND DASHBOARD"
        defaultSubtitle={`Real-time operations, crew dispatching, revenue velocity, and sales pipeline performance across ${city || 'Oceanside'}.`}
        showSearch={true}
        searchPlaceholder="Search leads, customers, jobs, addresses..."
        searchValue={omniSearch}
        onSearchChange={setOmniSearch}
        onSearchClear={() => setOmniSearch('')}
        searchRef={searchInputRef}
        bottomRightBadges={
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{licenseNumber || 'CSLB #1115874'} Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs shrink-0">
              <TrendingUp size={11} className="text-sky-600" />
              {isStatsLoadingInitial ? <StatSkeleton /> : <span>YTD: {formatCurrency(activeStats?.ytdRevenue)}</span>}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/90 text-[10px] font-bold text-amber-800 shadow-2xs shrink-0">
              <ShieldCheck size={11} className="text-amber-600" />
              {isStatsLoadingInitial ? <StatSkeleton /> : <span>{activeStats?.activeCrewCount ?? 0} Roofers Active</span>}
            </span>
          </div>
        }
      />

      {/* ========================================================
          2. KPI METRIC CARDS ROW (6 Executive Glass Cards with Sparklines)
          ======================================================== */}
      {isStatsLoadingInitial ? (
        <div className="grid grid-cols-6 gap-2 shrink-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} delay={i * 80} />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-6 gap-2 shrink-0">
        {/* Card 1: New Leads */}
        <div
          ref={card1Ref}
          onMouseEnter={hover1.onEnter}
          onMouseLeave={hover1.onLeave}
          className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group hover:border-sky-400 hover:shadow-md transition-all duration-200"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-sky-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-sky-400/25 transition-colors" />

          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1878B8] to-[#55C4F5] flex items-center justify-center text-white shadow-xs shadow-sky-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Users size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.newLeadsDelta} />
          </div>

          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.newLeads ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">
                New Leads
              </div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.newLeads);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-leads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-leads)" />
                    <path d={miniPath} stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.5" fill="#0284c7" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-slate-400 font-medium">vs last month</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-[#1878B8] to-[#55C4F5] h-full rounded-full" style={{ width: cardPct(activeStats?.newLeads) }} />
            </div>
          </div>

          {hover1.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.newLeads);
            return (
              <StatCardPopover
                label="New Leads" value={activeStats?.newLeads ?? 0} delta={activeStats?.newLeadsDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="Unworked leads" color="#0284c7"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card1Ref}
                onPopoverEnter={hover1.onPopoverEnter} onLeave={hover1.onLeave}
              />
            );
          })()}
        </div>

        {/* Card 2: Connected */}
        <div
          ref={card2Ref}
          onMouseEnter={hover2.onEnter}
          onMouseLeave={hover2.onLeave}
          className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400 hover:shadow-md transition-all duration-200"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-400/25 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white shadow-xs shadow-cyan-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Phone size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.contactedDelta} />
          </div>
          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.contacted ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">Connected</div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.contacted);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-conn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-conn)" />
                    <path d={miniPath} stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.5" fill="#06b6d4" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-emerald-600 font-semibold">High pick-up</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full" style={{ width: cardPct(activeStats?.contacted) }} />
            </div>
          </div>
          {hover2.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.contacted);
            return (
              <StatCardPopover
                label="Connected" value={activeStats?.contacted ?? 0} delta={activeStats?.contactedDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="Initial outreach" color="#06b6d4"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card2Ref}
                onPopoverEnter={hover2.onPopoverEnter} onLeave={hover2.onLeave}
              />
            );
          })()}
        </div>

        {/* Card 3: Est. Scheduled */}
        <div
          ref={card3Ref}
          onMouseEnter={hover3.onEnter}
          onMouseLeave={hover3.onLeave}
          className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all duration-200"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-purple-400/25 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center text-white shadow-xs shadow-purple-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Calendar size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.estScheduledDelta} />
          </div>
          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.estScheduled ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">Est. Scheduled</div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.estScheduled);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-sched" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-sched)" />
                    <path d={miniPath} stroke="#9333ea" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.5" fill="#9333ea" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-slate-400 font-medium">On-site walks</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full" style={{ width: cardPct(activeStats?.estScheduled) }} />
            </div>
          </div>
          {hover3.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.estScheduled);
            return (
              <StatCardPopover
                label="Est. Scheduled" value={activeStats?.estScheduled ?? 0} delta={activeStats?.estScheduledDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="On-site estimates" color="#9333ea"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card3Ref}
                onPopoverEnter={hover3.onPopoverEnter} onLeave={hover3.onLeave}
              />
            );
          })()}
        </div>

        {/* Card 4: Est. Sent */}
        <div
          ref={card4Ref}
          onMouseEnter={hover4.onEnter}
          onMouseLeave={hover4.onLeave}
          className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all duration-200"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-amber-400/25 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xs shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.estSentDelta} />
          </div>
          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.estSent ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">Est. Sent</div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.estSent);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-sent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-sent)" />
                    <path d={miniPath} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.5" fill="#f59e0b" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-slate-400 font-medium">Proposals live</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full" style={{ width: cardPct(activeStats?.estSent) }} />
            </div>
          </div>
          {hover4.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.estSent);
            return (
              <StatCardPopover
                label="Est. Sent" value={activeStats?.estSent ?? 0} delta={activeStats?.estSentDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="Proposals pending" color="#f59e0b"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card4Ref}
                onPopoverEnter={hover4.onPopoverEnter} onLeave={hover4.onLeave}
              />
            );
          })()}
        </div>

        {/* Card 5: Jobs Won */}
        <div
          ref={card5Ref}
          onMouseEnter={hover5.onEnter}
          onMouseLeave={hover5.onLeave}
          className="light-glass-card glossy-sheen rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all duration-200"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-400/18 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-400/28 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-xs shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Trophy size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.jobsWonDelta} />
          </div>
          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.jobsWon ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">Jobs Won</div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.jobsWon);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-won" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-won)" />
                    <path d={miniPath} stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.8" fill="#10b981" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-emerald-600 font-semibold">Closed &amp; signed</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" style={{ width: cardPct(activeStats?.jobsWon) }} />
            </div>
          </div>
          {hover5.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.jobsWon);
            return (
              <StatCardPopover
                label="Jobs Won" value={activeStats?.jobsWon ?? 0} delta={activeStats?.jobsWonDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="Contracts signed" color="#10b981"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card5Ref}
                onPopoverEnter={hover5.onPopoverEnter} onLeave={hover5.onLeave}
              />
            );
          })()}
        </div>

        {/* Card 6: Lost / Closed */}
        <div
          ref={card6Ref}
          onMouseEnter={hover6.onEnter}
          onMouseLeave={hover6.onLeave}
          className="light-glass-card glossy-sheen hover:border-rose-400 hover:shadow-md transition-all duration-200 rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-rose-400/12 rounded-full blur-xl pointer-events-none group-hover:bg-rose-400/22 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-xs shadow-rose-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle size={13} className="stroke-[2.5]" />
            </div>
            <TrendPill delta={activeStats?.lostClosedDelta} />
          </div>
          <div className="flex items-end justify-between mt-1.5 relative z-10">
            <div>
              <div className="text-2xl font-black text-[#1F1F1F] tracking-tight leading-none">
                {activeStats?.lostClosed ?? 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-700 mt-0.5 leading-tight">Lost / Closed</div>
            </div>
            <div className="shrink-0 mb-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {(() => {
                const miniPath = dataToMiniPath(stats?.sparklines?.lostClosed);
                const cy = parseFloat(miniPath.split(' ').pop()!) || 24;
                return (
                  <svg className="w-16 h-7" viewBox="0 0 75 28" fill="none">
                    <defs>
                      <linearGradient id="grad-lost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${miniPath} L 73 28 L 2 28 Z`} fill="url(#grad-lost)" />
                    <path d={miniPath} stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="73" cy={cy} r="2.5" fill="#f43f5e" className="animate-pulse" />
                  </svg>
                );
              })()}
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 relative z-10 flex items-center justify-between text-[8.5px]">
            <span className="text-slate-400 font-medium">Pricing / Delays</span>
            <div className="w-12 bg-slate-200/40 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-rose-400 h-full rounded-full" style={{ width: cardPct(activeStats?.lostClosed) }} />
            </div>
          </div>
          {hover6.active && (() => {
            const pp = dataToPopoverPaths(stats?.sparklines?.lostClosed);
            return (
              <StatCardPopover
                label="Lost / Closed" value={activeStats?.lostClosed ?? 0} delta={activeStats?.lostClosedDelta ?? null}
                totalLeads={activeStats?.totalLeads ?? 0} stageLabel="Churned leads" color="#f43f5e"
                svgLine={pp.line}
                svgArea={pp.area}
                dotCx={pp.dotCx} dotCy={pp.dotCy} anchorRef={card6Ref}
                onPopoverEnter={hover6.onPopoverEnter} onLeave={hover6.onLeave}
              />
            );
          })()}
        </div>
      </div>
      )}

      {/* ========================================================
          3. SALES PIPELINE SECTION (Kanban Board & Controls)
          ======================================================== */}
      <div className="rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-md p-2.5 lg:p-3 relative flex-1 min-h-0 flex flex-col">
        {/* Pipeline Control Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap shrink-0 mb-2">
          {/* Title & View Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-[#1F1F1F] tracking-tight">
                Sales Pipeline
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100/90 text-[#0284c7] border border-sky-300/70 shadow-2xs backdrop-blur-xs">
                {statsLoading ? <span className="inline-block w-8 h-3 bg-sky-200/60 animate-pulse rounded" /> : `${stats?.totalLeads ?? 0} Deals`}
              </span>
            </div>

            {/* View Mode Segmented Control: Kanban is default active */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-2xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <LayoutGrid size={12} />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <List size={12} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <CalendarDays size={12} />
                <span>Calendar</span>
              </button>
            </div>
          </div>

          {/* Filters & Search & Single Primary Action Button */}
          <div ref={filterDropdownRef} className="flex items-center gap-2">
            {/* Filter 1: Sources */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'source' ? null : 'source')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                  selectedSource !== 'All Sources'
                    ? 'bg-sky-50/90 text-[#0284c7] border border-sky-300/80 font-bold shadow-xs'
                    : 'liquid-glass-btn text-slate-700 hover:text-slate-900'
                }`}
              >
                <span className="truncate max-w-[84px]">{selectedSource}</span>
                <ChevronDown
                  size={11}
                  className={`opacity-60 transition-transform duration-150 ${
                    activeDropdown === 'source' ? 'rotate-180 text-[#0284c7]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'source' && (
                <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.18)] p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {SOURCE_OPTIONS.map((opt) => {
                    const isSelected = selectedSource === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedSource(opt);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-[#0284c7] font-bold'
                            : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check size={11} className="text-[#0284c7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter 2: Reps */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'rep' ? null : 'rep')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                  selectedRep !== 'All Reps'
                    ? 'bg-sky-50/90 text-[#0284c7] border border-sky-300/80 font-bold shadow-xs'
                    : 'liquid-glass-btn text-slate-700 hover:text-slate-900'
                }`}
              >
                <span className="truncate max-w-[84px]">{selectedRep.split(' ')[0]}</span>
                <ChevronDown
                  size={11}
                  className={`opacity-60 transition-transform duration-150 ${
                    activeDropdown === 'rep' ? 'rotate-180 text-[#0284c7]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'rep' && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.18)] p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {REP_OPTIONS.map((opt) => {
                    const isSelected = selectedRep === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedRep(opt);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-[#0284c7] font-bold'
                            : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check size={11} className="text-[#0284c7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter 3: Services */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'service' ? null : 'service')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                  selectedService !== 'All Services'
                    ? 'bg-sky-50/90 text-[#0284c7] border border-sky-300/80 font-bold shadow-xs'
                    : 'liquid-glass-btn text-slate-700 hover:text-slate-900'
                }`}
              >
                <span className="truncate max-w-[84px]">{selectedService}</span>
                <ChevronDown
                  size={11}
                  className={`opacity-60 transition-transform duration-150 ${
                    activeDropdown === 'service' ? 'rotate-180 text-[#0284c7]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'service' && (
                <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.18)] p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {SERVICE_OPTIONS.map((opt) => {
                    const isSelected = selectedService === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedService(opt);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-[#0284c7] font-bold'
                            : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check size={11} className="text-[#0284c7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Pipeline */}
            <div className="relative w-36">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pipeline..."
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-lg liquid-glass-input text-[11px] text-slate-800 placeholder-slate-400 transition-all"
              />
            </div>

            {/* Single "+ New Lead" Primary CTA Button */}
            <button
              onClick={() => {
                setCreateLeadStage('new_leads');
                setIsCreateLeadOpen(true);
              }}
              className="flex items-center gap-1 px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#1878B8] to-[#55C4F5] text-white text-[11px] font-bold shadow-[0_2px_10px_rgba(24,120,184,0.3)] hover:shadow-[0_4px_16px_rgba(24,120,184,0.4)] border border-sky-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* View Mode Switching: Kanban, List, or Calendar */}
        {viewMode === 'kanban' && pipelineLoading ? (
          <div className="grid grid-cols-7 gap-2 items-stretch pb-0.5 w-full flex-1 min-h-0">
            {Array.from({ length: 7 }).map((_, i) => (
              <KanbanColumnSkeleton key={i} cardCount={i < 3 ? 3 : 2} />
            ))}
          </div>
        ) : viewMode === 'kanban' && (
          <div
            ref={kanbanContainerRef}
            className="grid grid-cols-7 gap-2 items-stretch overflow-hidden pb-0.5 w-full flex-1 min-h-0"
          >
            {filteredColumns.map((col) => {
              const rawFilteredCards = pipelineSearch
                ? col.cards.filter(
                    (c) =>
                      c.name.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                      c.location.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                      c.service.toLowerCase().includes(pipelineSearch.toLowerCase())
                  )
                : col.cards;

              // Follow-up column: overdue leads stay at top; completed contacts sink to the end
              const filteredCards = col.id === 'follow_up'
                ? [...rawFilteredCards].sort((a, b) => {
                    if (a.isFollowupOverdue && !b.isFollowupOverdue) return -1;
                    if (!a.isFollowupOverdue && b.isFollowupOverdue) return 1;
                    const remA = a.followupDaysRemaining ?? 7;
                    const remB = b.followupDaysRemaining ?? 7;
                    return remA - remB;
                  })
                : rawFilteredCards;

              return (
                <div
                  key={col.id}
                  className="liquid-column-channel rounded-2xl p-1.5 flex flex-col min-w-0 transition-all duration-200 h-full"
                  style={{
                    backgroundColor: col.bgColor,
                    boxShadow: dragOverColId === col.id
                      ? `0 0 0 2.5px ${col.accentColor}, inset 0 1.5px 1px 0 rgba(255,255,255,0.75), 0 4px 24px -2px ${col.accentColor}33`
                      : `0 0 0 1.5px ${col.borderColor}, inset 0 1.5px 1px 0 rgba(255,255,255,0.75), 0 4px 16px -2px rgba(15,23,42,0.04)`,
                    transform: dragOverColId === col.id ? 'scale(1.012)' : 'scale(1)',
                  }}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => handleDragLeave(col.id)}
                  onDrop={(e) => handleDrop(e, col)}
                >
                  {/* Column Header Pill */}
                  <div
                    className={`flex items-center justify-between px-2 py-1 rounded-xl shadow-xs flex-shrink-0 ${col.pillClass}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {renderColumnIcon(col.iconType)}
                      <span className="text-[10px] font-black truncate">{col.title}</span>
                    </div>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ml-1 leading-normal ${col.badgeClass}`}
                    >
                      {col.count}
                    </span>
                  </div>

                  {/* Deal Cards Container — scrolls internally, no visible bar */}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 mt-1.5">
                    {filteredCards.map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          handleDragStart(card.id, col.id);
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          const allEnriched = enrichDeals(columns);
                          const found = allEnriched.find((d) => String(d.id) === String(card.id));
                          setSelectedDeal(
                            found || {
                              ...card,
                              stageId: col.id,
                              stageTitle: col.title,
                              stageAccent: col.accentColor,
                              stageBgColor: col.bgColor,
                              stageBorderColor: col.borderColor,
                              stagePillClass: col.pillClass,
                              stageBadgeClass: col.badgeClass,
                              iconType: col.iconType,
                              phone: card.phone || '(760) 555-0100',
                              email: card.email || `${String(card.name || 'homeowner').toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
                              value: card.value || 15000,
                              scheduledDay: 10,
                              timeSlot: '10:00 AM',
                              dateFormatted: 'Today',
                              notes: card.notes,
                            }
                          );
                          setIsDealModalOpen(true);
                        }}
                        style={{
                          borderColor: card.isFollowupOverdue ? '#ef4444' : col.borderColor,
                          borderLeftColor: card.isFollowupOverdue ? '#dc2626' : col.accentColor,
                          borderLeftWidth: card.isFollowupOverdue ? '4px' : '3.5px',
                        }}
                        className={`rounded-xl p-2 space-y-1 cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 group shadow-2xs transition-all duration-100 select-none ${
                          card.isFollowupOverdue
                            ? 'bg-red-50/90 border-2 border-red-500 ring-1 ring-red-400/30'
                            : 'liquid-glass-tile'
                        }`}
                      >
                        {/* Overdue Alert Banner if 7+ days uncontacted */}
                        {card.isFollowupOverdue && (
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[8px] tracking-wide animate-pulse">
                            <span className="flex items-center gap-1">
                              <AlertCircle size={8.5} className="shrink-0" />
                              <span>OVERDUE • 7d+</span>
                            </span>
                            <span className="bg-white/20 px-1 rounded text-[7px]">URGENT</span>
                          </div>
                        )}

                        {/* 48h Review countdown banner for proposals sent */}
                        {col.id === 'est_sent' && card.hoursUntilAutoMove !== null && card.hoursUntilAutoMove !== undefined && (
                          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 font-extrabold text-[8px] border border-amber-300/80">
                            <span className="flex items-center gap-1">
                              <Clock size={8.5} className="shrink-0 text-amber-700 animate-pulse" />
                              <span>48h Review:</span>
                            </span>
                            <span>{card.hoursUntilAutoMove > 0 ? `${card.hoursUntilAutoMove}h left` : 'Ready'}</span>
                          </div>
                        )}

                        {/* Name & Value Header */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-bold text-[11px] text-[#1F1F1F] group-hover:text-[#1878B8] transition-colors leading-snug truncate">
                            {card.name}
                          </div>
                          <span className="text-[9.5px] font-black text-slate-800 shrink-0 bg-white/80 border border-slate-200/80 px-1.5 py-0.2 rounded shadow-2xs">
                            ${card.value ? card.value.toLocaleString() : '15,000'}
                          </span>
                        </div>

                        {/* Location & Micro Actions */}
                        <div className="flex items-center justify-between text-[9.5px] text-slate-500">
                          <div className="flex items-center gap-0.5 truncate">
                            <MapPin size={8.5} className="shrink-0 text-slate-400" />
                            <span className="truncate">{card.location}</span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1 text-slate-400 group-hover:text-slate-600">
                            <button
                              title="Call"
                              className="p-0.5 hover:text-[#1878B8] hover:bg-sky-50/80 rounded transition-colors"
                            >
                              <Phone size={9} />
                            </button>
                            <button
                              title="Email"
                              className="p-0.5 hover:text-[#1878B8] hover:bg-sky-50/80 rounded transition-colors"
                            >
                              <Mail size={9} />
                            </button>
                          </div>
                        </div>

                        {/* Source Badges */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {card.leadSource === 'website' || card.leadSourceDetail?.toLowerCase().includes('website') ? (
                            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                              {card.leadSourceDetail || 'Website'}
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0 truncate max-w-[120px]" title={card.createdByName || card.leadSourceDetail || 'Manual'}>
                              {card.createdByName || card.leadSourceDetail || 'Manual'}
                            </span>
                          )}

                          {card.assignedToName && card.assignedToName !== 'Unassigned' && (
                            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 truncate max-w-[120px]">
                              Claimed: {card.assignedToName.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        {/* Claim Lead CTA for unassigned leads in New Leads column */}
                        {col.id === 'new_leads' && (!card.assignedToUserId || !card.assignedToName || card.assignedToName === 'Unassigned') && (
                          <div onClick={(e) => e.stopPropagation()} className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleClaimLead(card.id)}
                              className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <UserCheck size={10} />
                              <span>Claim Lead</span>
                            </button>
                          </div>
                        )}

                        {/* Bottom Service Pill Tag & Time */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                          <span
                            className={`text-[8.5px] px-1.5 py-0.2 rounded-md ${getServiceBadgeClass(
                              card.serviceColor
                            )}`}
                          >
                            {card.service}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-medium">
                            {card.time}
                          </span>
                        </div>

                        {/* Follow-Up Column Actions: 7-day countdown & Log Contact button */}
                        {col.id === 'follow_up' && (
                          <div className="pt-1 space-y-1">
                            {card.isFollowupOverdue ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFollowUpModalCard(card);
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                              >
                                <Phone size={9} />
                                <span>Follow Up Now</span>
                              </button>
                            ) : (
                              <>
                                <div className="flex items-center justify-between text-[8px] font-bold text-purple-700 bg-purple-50/80 px-1.5 py-0.5 rounded border border-purple-200/70">
                                  <span className="flex items-center gap-0.5">
                                    <Clock size={8} />
                                    <span>Next:</span>
                                  </span>
                                  <span>{card.followupDaysRemaining != null ? `${card.followupDaysRemaining}d remaining` : '7d SLA'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFollowUpModalCard(card);
                                  }}
                                  className="w-full px-1.5 py-0.5 rounded-md bg-purple-100/90 hover:bg-purple-200 text-purple-900 font-extrabold text-[8.5px] flex items-center justify-center gap-1 cursor-pointer transition-colors border border-purple-300/60"
                                >
                                  <Phone size={8.5} />
                                  <span>Log Contact (+7d SLA)</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Active Jobs Link to Production Work Orders */}
                        {col.id === 'active_jobs' && (
                          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => navigate('/jobs')}
                              className="w-full px-2 py-1 rounded-lg bg-gradient-to-r from-[#1878B8] to-[#55C4F5] hover:brightness-110 text-white font-extrabold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs border border-sky-400/40 hover:scale-[1.01] active:scale-[0.99]"
                            >
                              <Hammer size={9.5} />
                              <span>Track in Jobs</span>
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View Mode */}
        {viewMode === 'list' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <PipelineListView
              columns={filteredColumns}
              pipelineSearch={pipelineSearch}
              onSelectDeal={(deal) => {
                setSelectedDeal(deal);
                setIsDealModalOpen(true);
              }}
              getServiceBadgeClass={getServiceBadgeClass}
            />
          </div>
        )}

        {/* Calendar View Mode */}
        {viewMode === 'calendar' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <PipelineCalendarView
              columns={filteredColumns}
              pipelineSearch={pipelineSearch}
              onSelectDeal={(deal) => {
                setSelectedDeal(deal);
                setIsDealModalOpen(true);
              }}
              getServiceBadgeClass={getServiceBadgeClass}
            />
          </div>
        )}
      </div>

      {/* ========================================================
          4. RECENT ACTIVITY BAR
          ======================================================== */}
      <div className="rounded-xl light-glass-panel glossy-sheen border border-white/85 shadow-xs px-3 py-1.5 flex items-center justify-between gap-3 shrink-0">
        {/* Title */}
        <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-slate-200/70">
          <Clock size={13} className="text-[#1878B8]" />
          <span className="text-xs font-bold text-[#1F1F1F]">Recent Activity</span>
        </div>

        {/* Activity Items Horizontal Row */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {(activeStats?.recentActivities && activeStats.recentActivities.length > 0) ? (
            <>
              {activeStats.recentActivities.slice(0, 4).map((act, idx) => (
                <ActivityItemCard key={act.id || idx} activity={act} />
              ))}
              {Array.from({ length: Math.max(0, 4 - activeStats.recentActivities.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="hidden md:flex items-center gap-2 p-1.5 rounded-lg border border-dashed border-slate-200/60 text-[10px] text-slate-400 justify-center">
                  <Clock size={10} className="text-slate-300" />
                  <span>Awaiting activity...</span>
                </div>
              ))}
            </>
          ) : (
            <div className="col-span-4 flex items-center justify-center py-0.5 text-[11px] text-slate-400 font-medium">
              <Clock size={11} className="mr-1.5 text-[#1878B8]" />
              <span>No team activities logged yet. Real-time actions will appear here.</span>
            </div>
          )}
        </div>

        {/* View All Link */}
        <a
          href="/leads"
          className="text-[11px] font-bold text-[#1878B8] hover:text-[#55C4F5] hover:underline flex items-center gap-0.5 shrink-0 pl-2"
        >
          <span>View All</span>
          <ArrowUpRight size={11} />
        </a>
      </div>

      {/* Interactive Deal Inspection & Field Notes Modal */}
      <PipelineDealModal
        deal={selectedDeal}
        isOpen={isDealModalOpen}
        onClose={() => {
          setIsDealModalOpen(false);
          setSelectedDeal(null);
        }}
        getServiceBadgeClass={getServiceBadgeClass}
      />

      {/* Create New Lead Optical Glass Modal */}
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        initialStageId={createLeadStage}
        onClose={() => setIsCreateLeadOpen(false)}
        onSubmitLead={handleCreateLead}
      />

      {/* Drag & Drop Move Confirmation Modal */}
      <MoveLeadModal
        intent={dropIntent}
        isMoving={isMoving}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />

      {/* 7-Day SLA Automated Follow-Up Modal */}
      <LogFollowUpModal
        isOpen={Boolean(followUpModalCard)}
        deal={
          followUpModalCard
            ? {
                id: followUpModalCard.id,
                name: followUpModalCard.name,
                phone: followUpModalCard.phone || 'No phone provided',
                email: followUpModalCard.email || 'No email provided',
                address: followUpModalCard.location,
                city: followUpModalCard.location.split(',')[0] || 'Oceanside',
                service: followUpModalCard.service,
                serviceColor: followUpModalCard.serviceColor,
                value: followUpModalCard.value ?? 15000,
                stageId: 'follow_up' as PipelineStageId,
                daysInStage: 0,
                estimator: {
                  name: 'Jake Miller',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                  role: 'Senior Estimator',
                },
                slaStatus: followUpModalCard.isFollowupOverdue ? 'overdue' : 'on_track',
                slaText: followUpModalCard.isFollowupOverdue ? 'Overdue 7d+' : 'On track',
                photosCount: 0,
                notes: '',
                isFollowupOverdue: followUpModalCard.isFollowupOverdue,
                followupDaysRemaining: followUpModalCard.followupDaysRemaining,
                hoursUntilAutoMove: followUpModalCard.hoursUntilAutoMove,
                checklist: [],
              }
            : null
        }
        isSaving={isLoggingFollowUp}
        onClose={() => setFollowUpModalCard(null)}
        onSubmitFollowUp={handleLogFollowUpSubmit}
      />

      {/* Estimate Sent Gated Modal */}
      <EstimateSentGatedModal
        deal={gatedEstimateCard}
        isOpen={Boolean(gatedEstimateCard)}
        onClose={() => setGatedEstimateCard(null)}
      />
    </div>
  );
}

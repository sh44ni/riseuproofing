// Rise Up CRM — Pipeline API Client
// Interfaces with FastAPI backend at /api/admin/pipeline
// Provides live pipeline data for Dashboard (8-column) and PipelinePage (11-step + 4-phase)

import type { ColumnData, DealCard, PipelineDealItem, PipelineStageId } from '../components/pipeline/pipelineTypes';
import { api } from '@/lib/api';

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_CRM_API_KEY || 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw';

export interface PipelineSummary {
  totalLeads: number;
  totalPipelineValue: number;
  unassignedCount: number;
  slaHealthPct: number;
  activeInstallations?: number;
  wonCount?: number;
  lostCount?: number;
}

export interface BackendLeadRaw {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  service_type?: string | null;
  pipeline_stage: string;
  granular_stage?: string;
  status: string;
  priority?: string;
  lead_score?: number;
  estimated_value?: number;
  contract_value?: number;
  estimate_total?: number;
  stage_entered_at: string;
  initial_contacted_at?: string | null;
  site_visit_scheduled_at?: string | null;
  site_visit_completed_at?: string | null;
  proposal_sent_at?: string | null;
  contract_signed_at?: string | null;
  job_completed_at?: string | null;
  job_id?: number | null;
  job_status?: string | null;
  assigned_to_user_id?: number | null;
  assigned_to_name?: string | null;
  assigned_to_role?: string | null;
  assigned_to_avatar?: string | null;
  hours_in_stage?: number;
  days_in_stage?: number;
  sla_status?: string;
  sla_badge_label?: string;
  sla_alert_message?: string;
  photo_count?: number;
  lead_source?: string;
  lead_source_detail?: string;
  source_type?: string;
  created_by_user_id?: number | null;
  created_by_name?: string | null;
  notes?: string | null;
  lost_reason?: string | null;
  checklist_completed_count?: number;
  checklist_completed_keys?: string[];
  created_at: string;
  is_followup_overdue?: boolean;
  followup_days_remaining?: number;
  followup_hours_remaining?: number;
  hours_until_auto_move?: number | null;
  last_contact_at?: string | null;
  follow_up_at?: string | null;
}

// Service color mapper
export function serviceToColor(service: string): DealCard['serviceColor'] {
  const s = (service || '').toLowerCase();
  if (s.includes('tile')) return 'amber';
  if (s.includes('shingle')) return 'blue';
  if (s.includes('commercial') || s.includes('flat')) return 'sky';
  if (s.includes('repair') || s.includes('maintenance')) return 'coral';
  if (s.includes('metal')) return 'indigo';
  if (s.includes('solar') || s.includes('gc')) return 'purple';
  return 'emerald';
}

function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return 'Recently';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ──────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD OPERATION PIPELINE (8-COLUMN MODEL)
// Classifies a lead into one of the 8 visual dashboard columns
// ──────────────────────────────────────────────────────────────────────────

export function classifyToDashboardColumn(lead: BackendLeadRaw): string {
  const {
    pipeline_stage,
    granular_stage,
    proposal_sent_at,
    contract_signed_at,
    job_completed_at,
    status,
    job_id,
    job_status,
  } = lead;

  // Completed jobs are NOT shown on the active dashboard columns
  if (
    job_completed_at ||
    status === 'completed' ||
    pipeline_stage === 'job_completed' ||
    granular_stage === 'job_completed' ||
    pipeline_stage === 'completed' ||
    granular_stage === 'completed'
  ) {
    return 'completed';
  }

  const st = granular_stage || pipeline_stage;

  // Direct match to granular stage if available
  if (st === 'cold_lead' || st === 'stage_1_lead_gen' || st === 'new_leads') return 'new_leads';
  if (st === 'initial_call' || st === 'stage_2_initial_contact' || st === 'contacted') return 'contacted';
  if (st === 'inspection_scheduled' || st === 'inspection_completed' || st === 'estimate_building' || st === 'est_scheduled') return 'est_scheduled';
  if (st === 'estimate_sent' || st === 'est_sent') return 'est_sent';
  if (st === 'follow_up' || st === 'followup_2day' || st === 'followup_7day' || st === 'decision_followup' || st === 'future_followup') {
    return 'follow_up';
  }
  if (st === 'contract_signed') return 'contract_signed';
  if (st === 'active_jobs') return 'active_jobs';
  if (st === 'closed_won') {
    if (job_id || job_status === 'in_progress') return 'active_jobs';
    return 'contract_signed';
  }

  // Fallback to legacy heuristics
  switch (pipeline_stage) {
    case 'stage_1_lead_gen':
      return 'new_leads';
    case 'stage_2_initial_contact':
      return 'contacted';
    case 'stage_3_site_visit_estimate':
      if (proposal_sent_at) return 'est_sent';
      return 'est_scheduled';
    case 'stage_4_closing':
      if (contract_signed_at || status === 'won') return 'contract_signed';
      return 'follow_up';
    case 'stage_5_completion_followup':
      if (job_id || job_status === 'in_progress') return 'active_jobs';
      if (contract_signed_at || status === 'won') return 'contract_signed';
      return 'active_jobs';
    default:
      return 'new_leads';
  }
}

const COLUMN_CONFIG: Record<string, Omit<ColumnData, 'count' | 'cards'>> = {
  new_leads:       { id: 'new_leads',       title: 'New Leads',          bgColor: 'rgba(226,232,240,0.72)', borderColor: 'rgba(148,163,184,0.60)', accentColor: '#475569', pillClass: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-xs border border-slate-600/60', badgeClass: 'bg-black/30 text-white font-black', iconType: 'users' },
  contacted:       { id: 'contacted',       title: 'Leads Contacted',    bgColor: 'rgba(186,230,253,0.65)', borderColor: 'rgba(56,189,248,0.55)',  accentColor: '#0284c7', pillClass: 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white shadow-xs border border-sky-400/50',    badgeClass: 'bg-black/20 text-white font-black', iconType: 'phone' },
  est_scheduled:   { id: 'est_scheduled',   title: 'Estimate Scheduled', bgColor: 'rgba(233,213,255,0.65)', borderColor: 'rgba(192,132,252,0.55)', accentColor: '#7c3aed', pillClass: 'bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] text-white shadow-xs border border-purple-400/50', badgeClass: 'bg-black/20 text-white font-black', iconType: 'calendar' },
  est_sent:        { id: 'est_sent',        title: 'Estimate Sent',      bgColor: 'rgba(254,240,138,0.65)', borderColor: 'rgba(234,179,8,0.55)',   accentColor: '#d97706', pillClass: 'bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#facc15] text-slate-950 shadow-xs border border-amber-400/70 font-black', badgeClass: 'bg-black/15 text-slate-950 font-black', iconType: 'file-text' },
  follow_up:       { id: 'follow_up',       title: 'Follow-Up',          bgColor: 'rgba(243,232,255,0.72)', borderColor: 'rgba(168,85,247,0.55)',  accentColor: '#9333ea', pillClass: 'bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#a855f7] text-white shadow-xs border border-purple-400/50 font-black', badgeClass: 'bg-black/20 text-white font-black', iconType: 'clock' },
  contract_signed: { id: 'contract_signed', title: 'Contract Signed',    bgColor: 'rgba(187,247,208,0.65)', borderColor: 'rgba(52,211,153,0.55)',  accentColor: '#059669', pillClass: 'bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399] text-white shadow-xs border border-emerald-400/50', badgeClass: 'bg-black/20 text-white font-black', iconType: 'shield' },
  active_jobs:     { id: 'active_jobs',     title: 'Active Jobs',        bgColor: 'rgba(207,250,254,0.70)', borderColor: 'rgba(34,211,238,0.55)',  accentColor: '#0891b2', pillClass: 'bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] text-white shadow-xs border border-cyan-400/50', badgeClass: 'bg-black/20 text-white font-black', iconType: 'briefcase' },
};

const COLUMN_ORDER = ['new_leads', 'contacted', 'est_scheduled', 'est_sent', 'follow_up', 'contract_signed', 'active_jobs'];

export async function fetchPipelineForDashboard(): Promise<{ columns: ColumnData[]; summary: PipelineSummary | null }> {
  try {
    const res = await fetch(`${BASE}/api/admin/pipeline`, {
      headers: api.getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { columns: [], summary: null };
    const json = await res.json();
    if (!json?.ok) return { columns: [], summary: null };

    // Prefer granular_stages or stages
    const allLeads: BackendLeadRaw[] = json.granular_stages
      ? Object.values<BackendLeadRaw[]>(json.granular_stages).flat()
      : Object.values<BackendLeadRaw[]>(json.stages || {}).flat();

    // Deduplicate by ID
    const uniqueMap = new Map<number, BackendLeadRaw>();
    for (const l of allLeads) {
      if (!uniqueMap.has(l.id)) uniqueMap.set(l.id, l);
    }
    const uniqueLeads = Array.from(uniqueMap.values());

    const buckets: Record<string, DealCard[]> = {};
    for (const colId of COLUMN_ORDER) buckets[colId] = [];

    for (const lead of uniqueLeads) {
      const colId = classifyToDashboardColumn(lead);
      if (buckets[colId]) {
        buckets[colId].push({
          id: String(lead.id),
          name: lead.full_name,
          location: lead.city ? `${lead.city}, CA` : (lead.address ? `${lead.address}` : 'Oceanside, CA'),
          address: lead.address || undefined,
          city: lead.city || undefined,
          service: lead.service_type || 'Roofing',
          serviceColor: serviceToColor(lead.service_type || ''),
          time: relativeTime(lead.created_at),
          phone: lead.phone || undefined,
          email: lead.email || undefined,
          value: Number(lead.contract_value || lead.estimate_total || lead.estimated_value || 0),
          notes: lead.notes || undefined,
          isFollowupOverdue: Boolean(lead.is_followup_overdue),
          hoursUntilAutoMove: lead.hours_until_auto_move ?? null,
          followupDaysRemaining: lead.followup_days_remaining,
          leadSource: lead.lead_source || (lead.created_by_user_id ? 'manual' : 'website'),
          leadSourceDetail: lead.lead_source_detail || undefined,
          sourceType: lead.source_type || undefined,
          assignedToUserId: lead.assigned_to_user_id,
          assignedToName: lead.assigned_to_name,
          createdByName: lead.created_by_name,
        });
      }
    }

    const columns: ColumnData[] = COLUMN_ORDER.map((colId) => ({
      ...COLUMN_CONFIG[colId],
      count: buckets[colId].length,
      cards: buckets[colId],
    }));

    const rawSummary = json.summary;
    const summary: PipelineSummary | null = rawSummary
      ? {
          totalLeads: rawSummary.total_leads,
          totalPipelineValue: rawSummary.total_pipeline_value,
          unassignedCount: rawSummary.unassigned_count,
          slaHealthPct: rawSummary.sla_health_pct,
          activeInstallations: rawSummary.active_installations,
          wonCount: rawSummary.won_count,
          lostCount: rawSummary.lost_count,
        }
      : null;

    return { columns, summary };
  } catch {
    return { columns: [], summary: null };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 2. PIPELINE PAGE REAL DATA CLIENT (11-STAGE & 4-PHASE MODEL)
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_SOP_CHECKLISTS: Record<string, string[]> = {
  cold_lead: [
    'Review lead source & notes',
    'Confirm property address & satellite pitch',
    'Attempt initial call within 15 minutes',
  ],
  initial_call: [
    'Introduce Rise Up Roofing value proposition',
    'Discuss homeowner roof concerns & leaks',
    'Schedule on-site inspection appointment',
  ],
  inspection_scheduled: [
    'Confirm appointment time with client via SMS',
    'Prep estimator ladders and inspection toolkit',
    'Arrival notification sent to client',
  ],
  inspection_completed: [
    'Take drone/ladder photos of all slopes',
    'Measure squares, eaves, valleys, and flashing',
    'Review findings with homeowner on-site',
  ],
  estimate_building: [
    'Build multi-tier estimate (Good/Better/Best)',
    'Apply current material manufacturer pricing',
    'Verify warranty packages & financing terms',
  ],
  estimate_sent: [
    'Send proposal via portal email and SMS',
    'Follow up immediately to confirm receipt',
    'Offer to answer immediate scope questions',
  ],
  follow_up: [
    'Review proposal tier options with homeowner',
    'Answer questions regarding materials, warranty & financing',
    'Confirm decision timeline or schedule next follow-up call',
  ],
  followup_2day: [
    'Check if homeowner reviewed proposal tiers',
    'Answer questions regarding warranties & materials',
    'Confirm timeline for roof replacement decision',
  ],
  followup_7day: [
    'Second follow-up call & text message',
    'Assess competitor bids & offer price match if valid',
    'Address HOA / insurance adjuster requirements',
  ],
  decision_followup: [
    'Obtain firm decision status or milestone date',
    'Offer flexible financing promotion if budget concern',
    'Establish final action step',
  ],
  future_followup: [
    'Categorize into 30/60/90-day callback calendar',
    'Log insurance claim or HOA approval status',
    'Set scheduled automated reminder',
  ],
  closed_won: [
    'Collect digital contract signature',
    'Process deposit payment',
    'Handoff project to Production Manager & Crew Lead',
  ],
  closed_lost: [
    'Log root-cause loss reason',
    'Record autopsy feedback in field notes',
    'Archive contact for future seasonal campaigns',
  ],
};

function normalizeStageId(rawStage: string | undefined): PipelineStageId {
  if (
    rawStage === 'followup_2day' ||
    rawStage === 'followup_7day' ||
    rawStage === 'decision_followup' ||
    rawStage === 'future_followup'
  ) {
    return 'follow_up';
  }
  if (
    rawStage === 'contract_signed' ||
    rawStage === 'active_jobs' ||
    rawStage === 'job_completed' ||
    rawStage === 'closed_won'
  ) {
    return 'closed_won';
  }
  const valid: PipelineStageId[] = [
    'cold_lead',
    'initial_call',
    'inspection_scheduled',
    'inspection_completed',
    'estimate_building',
    'estimate_sent',
    'follow_up',
    'closed_won',
    'closed_lost',
  ];
  if (rawStage && valid.includes(rawStage as PipelineStageId)) {
    return rawStage as PipelineStageId;
  }
  return 'cold_lead';
}

function normalizeSlaStatus(status: string | undefined): 'on_track' | 'due_today' | 'overdue' {
  if (status === 'overdue' || status === 'warning') return 'overdue';
  if (status === 'due_today' || status === 'due_soon') return 'due_today';
  return 'on_track';
}

export async function fetchPipelineDeals(): Promise<{
  deals: PipelineDealItem[];
  summary: PipelineSummary | null;
  users: any[];
}> {
  const res = await fetch(`${BASE}/api/admin/pipeline`, {
    headers: api.getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load pipeline: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.detail || 'Failed to load pipeline data');
  }

  // Gather all leads from granular_stages (preferred) or stages
  const rawLeads: BackendLeadRaw[] = json.granular_stages
    ? Object.values<BackendLeadRaw[]>(json.granular_stages).flat()
    : Object.values<BackendLeadRaw[]>(json.stages || {}).flat();

  // Deduplicate by ID
  const map = new Map<number, BackendLeadRaw>();
  for (const l of rawLeads) {
    if (!map.has(l.id)) map.set(l.id, l);
  }
  const uniqueLeads = Array.from(map.values());

  const deals: PipelineDealItem[] = uniqueLeads.map((l) => {
    const stageId = normalizeStageId(l.granular_stage || l.pipeline_stage);
    const serviceName = l.service_type || 'Residential Roofing';
    const val = Number(l.contract_value || l.estimate_total || l.estimated_value || 0);

    const checklistLabels = DEFAULT_SOP_CHECKLISTS[stageId] || DEFAULT_SOP_CHECKLISTS.cold_lead;
    const completedCount = l.checklist_completed_count || 0;
    const completedKeys = new Set(l.checklist_completed_keys || []);
    const checklist = checklistLabels.map((label, idx) => {
      const itemKey = `chk-${idx}`;
      return {
        id: itemKey,
        label,
        done: completedKeys.has(itemKey) || idx < completedCount,
      };
    });

    const slaStatus = normalizeSlaStatus(l.sla_status);
    const slaText = l.sla_badge_label || (slaStatus === 'overdue' ? 'Action overdue' : slaStatus === 'due_today' ? 'Due today' : 'On track');

    const isWebsite = l.source_type === 'website' || (l.lead_source || '').toLowerCase().includes('website') || (!l.created_by_user_id && l.lead_source !== 'manual');
    const estimatorName = l.assigned_to_name || (isWebsite ? 'Unassigned' : (l.lead_source_detail || l.created_by_name || 'Staff'));
    const estimatorRole = l.assigned_to_role || (isWebsite && !l.assigned_to_name ? 'Unclaimed' : 'Estimator');

    return {
      id: String(l.id),
      name: l.full_name,
      phone: l.phone || 'No phone provided',
      email: l.email || 'No email provided',
      address: l.address || 'Address pending',
      city: l.city || 'Oceanside',
      service: serviceName,
      serviceColor: serviceToColor(serviceName),
      value: val,
      stageId,
      daysInStage: l.days_in_stage ?? 0,
      score: l.lead_score || 0,
      leadSource: l.lead_source || (l.created_by_user_id ? 'manual' : 'website'),
      leadSourceDetail: l.lead_source_detail || undefined,
      sourceType: l.source_type || undefined,
      assignedToUserId: l.assigned_to_user_id,
      assignedToName: l.assigned_to_name,
      createdByName: l.created_by_name,
      estimator: {
        name: estimatorName,
        avatar: l.assigned_to_avatar || '',
        role: estimatorRole,
      },
      slaStatus,
      slaText,
      photosCount: l.photo_count || 0,
      proposalSentDate: l.proposal_sent_at || undefined,
      notes: l.notes || '',
      lossReason: l.lost_reason || undefined,
      isFollowupOverdue: l.is_followup_overdue || false,
      followupDaysRemaining: l.followup_days_remaining,
      followupHoursRemaining: l.followup_hours_remaining,
      hoursUntilAutoMove: l.hours_until_auto_move,
      lastContactAt: l.last_contact_at,
      followUpAt: l.follow_up_at,
      checklist,
    };
  });

  const rawSummary = json.summary;
  const summary: PipelineSummary | null = rawSummary
    ? {
        totalLeads: rawSummary.total_leads,
        totalPipelineValue: rawSummary.total_pipeline_value,
        unassignedCount: rawSummary.unassigned_count,
        slaHealthPct: rawSummary.sla_health_pct,
        activeInstallations: rawSummary.active_installations,
        wonCount: rawSummary.won_count,
        lostCount: rawSummary.lost_count,
      }
    : null;

  return { deals, summary, users: json.users || [] };
}

export async function updatePipelineDealStage(
  leadId: string | number,
  newStage: string,
  notes?: string,
  authorInfo?: { plainNote?: string; authorName?: string; authorRole?: string }
): Promise<{ ok: boolean; lead: any }> {
  const res = await fetch(`${BASE}/api/admin/pipeline/${leadId}/stage`, {
    method: 'PUT',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stage: newStage,
      notes: notes || undefined,
      plainNote: authorInfo?.plainNote || undefined,
      authorName: authorInfo?.authorName || undefined,
      authorRole: authorInfo?.authorRole || undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `Stage update failed with HTTP ${res.status}`);
  }

  return await res.json();
}

export async function setDealOutcome(
  leadId: string | number,
  outcome: 'closed_won' | 'closed_lost' | 'future_followup',
  payload: {
    notes?: string;
    lossReason?: string;
    futureBucket?: string;
    futureFollowUpDate?: string;
    authorName?: string;
    authorRole?: string;
  }
): Promise<{ ok: boolean; lead: any }> {
  const res = await fetch(`${BASE}/api/admin/pipeline/${leadId}/stage`, {
    method: 'PUT',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stage: outcome,
      notes: payload.notes,
      lossReason: payload.lossReason,
      futureBucket: payload.futureBucket,
      futureFollowUpDate: payload.futureFollowUpDate,
      authorName: payload.authorName,
      authorRole: payload.authorRole,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `Outcome update failed with HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Toggle or update an individual SOP checklist item for a pipeline deal.
 */
export async function toggleChecklistItem(
  leadId: string | number,
  itemKey: string,
  completed: boolean,
  stage?: string
): Promise<{ ok: boolean; checklist_item: any }> {
  const res = await fetch(`${BASE}/api/admin/pipeline/${leadId}/checklist/${itemKey}`, {
    method: 'PUT',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed, stage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update checklist item' }));
    throw new Error(err?.detail || 'Failed to update checklist item');
  }

  return await res.json();
}

/**
 * Log a follow-up action with homeowner.
 * Resets the 7-day timer, saves activity, and updates notes.
 */
export async function logDealFollowUp(
  leadId: string | number,
  payload: { method: string; notes: string; outcome?: string }
): Promise<{ ok: boolean; message: string; followUpAt: string }> {
  const res = await fetch(`${BASE}/api/admin/pipeline/${leadId}/follow-up`, {
    method: 'POST',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to log follow-up' }));
    throw new Error(err?.detail || 'Failed to log follow-up');
  }

  return await res.json();
}

/**
 * Claim an unassigned website lead for the current logged in user.
 */
export async function claimLead(leadId: string | number): Promise<{ ok: boolean; lead: any }> {
  const res = await fetch(`${BASE}/api/admin/pipeline/${leadId}/claim`, {
    method: 'POST',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to claim lead' }));
    throw new Error(err?.detail || 'Failed to claim lead');
  }

  return await res.json();
}

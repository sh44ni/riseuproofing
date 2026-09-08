/**
 * Canonical Pipeline SLA and Stale-Lead Evaluation Engine
 * Shared between Pipeline Kanban cards, Pipeline Table view, and Dashboard's "Needs Follow-Up" widget.
 */

export interface EvaluateLeadSlaInput {
  stage: string;
  stageEnteredAt: string | Date | null;
  initialContactedAt?: string | Date | null;
  proposalSentAt?: string | Date | null;
  contractSignedAt?: string | Date | null;
  hoursThreshold?: number;
  now?: number;
}

export interface LeadSlaResult {
  hoursInStage: number;
  hoursRemaining?: number;
  status: 'met' | 'warning' | 'breached' | 'ok';
  isStale: boolean;
  badgeLabel?: string;
  badgeTone: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  alertMessage?: string;
}

export const DEFAULT_STAGE_SLA_HOURS: Record<string, number> = {
  stage_1_lead_gen: 24,           // Unassigned or fresh lead should be claimed/actioned in 24h
  stage_2_initial_contact: 48,    // Official Sales Chart 24–48h SLA for first call/text
  stage_3_site_visit_estimate: 72, // Inspection/estimate within 72h
  stage_4_closing: 48,            // Official Sales Chart 48h closing follow-up SLA
  stage_5_completion_followup: 168, // 7 days post-completion for review/warranty
};

/**
 * Pure evaluation function for lead SLA status.
 */
export function evaluateLeadSla(input: EvaluateLeadSlaInput): LeadSlaResult {
  const now = input.now ?? Date.now();
  const stageEnteredTime = input.stageEnteredAt ? new Date(input.stageEnteredAt).getTime() : now;
  const hoursInStage = Math.max(0, Math.round((now - stageEnteredTime) / (1000 * 60 * 60)));

  const thresholdHours = input.hoursThreshold || DEFAULT_STAGE_SLA_HOURS[input.stage] || 48;
  const deadline = stageEnteredTime + thresholdHours * 60 * 60 * 1000;
  const hoursRemaining = Math.round((deadline - now) / (1000 * 60 * 60));

  // ── Stage 2: Initial Contact SLA ──
  if (input.stage === 'stage_2_initial_contact') {
    if (input.initialContactedAt) {
      return {
        hoursInStage,
        hoursRemaining: 0,
        status: 'met',
        isStale: false,
        badgeLabel: 'Contacted within SLA',
        badgeTone: 'emerald',
      };
    }

    if (hoursRemaining <= 0) {
      const overdueHours = Math.abs(hoursRemaining);
      return {
        hoursInStage,
        hoursRemaining,
        status: 'breached',
        isStale: true,
        badgeLabel: `Overdue: ${overdueHours}h past 48h SLA`,
        badgeTone: 'rose',
        alertMessage: `Breached 48h initial contact SLA (${overdueHours}h overdue)`,
      };
    }

    if (hoursRemaining <= 12) {
      return {
        hoursInStage,
        hoursRemaining,
        status: 'warning',
        isStale: true,
        badgeLabel: `Action Due: ${hoursRemaining}h left`,
        badgeTone: 'amber',
        alertMessage: `Approaching SLA deadline: only ${hoursRemaining}h remaining`,
      };
    }

    return {
      hoursInStage,
      hoursRemaining,
      status: 'ok',
      isStale: false,
      badgeLabel: `48h SLA: ${hoursRemaining}h left`,
      badgeTone: 'sky',
    };
  }

  // ── Stage 4: Closing / Proposal Follow-Up SLA ──
  if (input.stage === 'stage_4_closing' || input.stage === 'stage_4_proposal_negotiation') {
    if (input.contractSignedAt) {
      return {
        hoursInStage,
        hoursRemaining: 0,
        status: 'met',
        isStale: false,
        badgeLabel: 'Contract Signed',
        badgeTone: 'emerald',
      };
    }

    if (hoursRemaining <= 0) {
      const overdueHours = Math.abs(hoursRemaining);
      return {
        hoursInStage,
        hoursRemaining,
        status: 'breached',
        isStale: true,
        badgeLabel: `Follow-Up Overdue: ${overdueHours}h late`,
        badgeTone: 'rose',
        alertMessage: `Proposal follow-up overdue by ${overdueHours} hours`,
      };
    }

    if (hoursRemaining <= 12) {
      return {
        hoursInStage,
        hoursRemaining,
        status: 'warning',
        isStale: true,
        badgeLabel: `Follow-Up Due: ${hoursRemaining}h left`,
        badgeTone: 'amber',
        alertMessage: `Proposal follow-up window closing in ${hoursRemaining} hours`,
      };
    }

    return {
      hoursInStage,
      hoursRemaining,
      status: 'ok',
      isStale: false,
      badgeLabel: `48h Follow-up: ${hoursRemaining}h left`,
      badgeTone: 'sky',
    };
  }

  // ── Other Stages (Generic Stale Logic) ──
  const isStale = hoursRemaining <= 0;
  return {
    hoursInStage,
    hoursRemaining,
    status: isStale ? 'breached' : 'ok',
    isStale,
    badgeLabel: isStale ? `Stale: ${hoursInStage}h in stage` : `${hoursInStage}h in stage`,
    badgeTone: isStale ? 'amber' : 'slate',
  };
}

/**
 * Returns SQL fragment to match stale leads needing follow-up across Stage 2 and Stage 4.
 * Guarantees that Dashboard query and Pipeline views never diverge on follow-up criteria.
 */
export function getNeedsFollowUpSqlCondition(thresholdParamIndex: number): string {
  return `(
    -- Stage 2 breached SLA: No initial contact within threshold
    (l.pipeline_stage = 'stage_2_initial_contact' AND l.initial_contacted_at IS NULL AND COALESCE(l.stage_entered_at, l.created_at) < NOW() - ($${thresholdParamIndex} * INTERVAL '1 hour'))
    OR
    -- Stage 4 breached SLA: Proposal sent but contract not signed within threshold
    ((l.pipeline_stage = 'stage_4_closing' OR l.pipeline_stage = 'stage_4_proposal_negotiation') AND l.contract_signed_at IS NULL AND COALESCE(l.stage_entered_at, l.proposal_sent_at, l.created_at) < NOW() - ($${thresholdParamIndex} * INTERVAL '1 hour'))
    OR
    -- Legacy status fallback
    (l.status IN ('quoted', 'contacted') AND l.status NOT IN ('won', 'lost') AND COALESCE(l.proposal_sent_at, l.last_contact_at, l.stage_entered_at, l.created_at) < NOW() - ($${thresholdParamIndex} * INTERVAL '1 hour'))
  )`;
}

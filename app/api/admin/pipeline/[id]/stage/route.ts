import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { PIPELINE_STAGES, PipelineStage } from '../../route';

const STAGE_LABELS: Record<PipelineStage, string> = {
  stage_1_lead_gen: 'Lead Generation',
  stage_2_initial_contact: 'Initial Contact',
  stage_3_site_visit_estimate: 'Site Visit + Estimate',
  stage_4_closing: 'Closing',
  stage_5_completion_followup: 'Job Completion & Follow-up',
};

const STAGE_TO_LEGACY_STATUS: Record<PipelineStage, string> = {
  stage_1_lead_gen: 'new',
  stage_2_initial_contact: 'contacted',
  stage_3_site_visit_estimate: 'estimate',
  stage_4_closing: 'proposal',
  stage_5_completion_followup: 'won',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (auth.response) return auth.response;

  const resolvedParams = await params;
  const leadId = parseInt(resolvedParams.id, 10);

  if (isNaN(leadId)) {
    return NextResponse.json({ ok: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const newStage = body.new_stage as PipelineStage;
    const metadata = body.metadata || {};

    if (!PIPELINE_STAGES.includes(newStage)) {
      return NextResponse.json({ ok: false, error: `Invalid stage: ${newStage}` }, { status: 400 });
    }

    // Fetch existing lead
    const existing = await query<any>(
      `SELECT * FROM leads WHERE id = $1`,
      [leadId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    const lead = existing[0];
    const oldStage = (lead.pipeline_stage as PipelineStage) || 'stage_1_lead_gen';

    // ── Implicit Auto-Claim Logic ──
    // If the lead was unassigned and is moved forward by any staff member,
    // automatically assign it to the acting user.
    let assignedUserId = lead.assigned_to_user_id;
    let didAutoClaim = false;

    if (!assignedUserId) {
      assignedUserId = auth.user.id;
      didAutoClaim = true;
    } else if (metadata.assigned_to_user_id) {
      assignedUserId = metadata.assigned_to_user_id;
    }

    // Stage milestone timestamp updates
    let initialContactedAt = lead.initial_contacted_at;
    let siteVisitScheduledAt = lead.site_visit_scheduled_at;
    let siteVisitCompletedAt = lead.site_visit_completed_at;
    let proposalSentAt = lead.proposal_sent_at;
    let contractSignedAt = lead.contract_signed_at;
    let jobCompletedAt = lead.job_completed_at;

    if (newStage === 'stage_2_initial_contact' && !initialContactedAt && metadata.contacted) {
      initialContactedAt = new Date().toISOString();
    }
    if (newStage === 'stage_3_site_visit_estimate') {
      if (metadata.site_visit_scheduled_at) {
        siteVisitScheduledAt = metadata.site_visit_scheduled_at;
      }
      if (metadata.site_visit_completed) {
        siteVisitCompletedAt = new Date().toISOString();
      }
    }
    if (newStage === 'stage_4_closing' && !proposalSentAt) {
      proposalSentAt = new Date().toISOString();
    }
    if (newStage === 'stage_5_completion_followup') {
      if (!contractSignedAt) contractSignedAt = new Date().toISOString();
      if (metadata.job_completed) jobCompletedAt = new Date().toISOString();
    }

    const legacyStatus = STAGE_TO_LEGACY_STATUS[newStage] || lead.status;

    // Update lead record
    const updatedRows = await query<any>(
      `UPDATE leads
       SET 
         pipeline_stage = $1,
         stage_entered_at = NOW(),
         status = $2,
         assigned_to_user_id = $3,
         assigned_at = CASE WHEN $3 IS NOT NULL AND assigned_at IS NULL THEN NOW() ELSE assigned_at END,
         assigned_by_user_id = CASE WHEN $4 = true THEN $5 ELSE assigned_by_user_id END,
         initial_contacted_at = COALESCE($6, initial_contacted_at),
         site_visit_scheduled_at = COALESCE($7, site_visit_scheduled_at),
         site_visit_completed_at = COALESCE($8, site_visit_completed_at),
         proposal_sent_at = COALESCE($9, proposal_sent_at),
         contract_signed_at = COALESCE($10, contract_signed_at),
         job_completed_at = COALESCE($11, job_completed_at),
         address_confirmed = CASE WHEN $12 = true THEN true ELSE address_confirmed END,
         discount_applied = COALESCE($13, discount_applied),
         financing_interested = CASE WHEN $14 = true THEN true ELSE financing_interested END,
         updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        newStage,
        legacyStatus,
        assignedUserId,
        didAutoClaim,
        auth.user.id,
        initialContactedAt,
        siteVisitScheduledAt,
        siteVisitCompletedAt,
        proposalSentAt,
        contractSignedAt,
        jobCompletedAt,
        Boolean(metadata.address_confirmed),
        metadata.discount_applied || null,
        Boolean(metadata.financing_interested),
        leadId,
      ]
    );

    // ── Auto-Provision Stage 5 Job Record ──
    let createdJob: any = null;
    if (newStage === 'stage_5_completion_followup') {
      // Check if job already exists
      const existingJob = await query<any>(
        'SELECT * FROM jobs WHERE lead_id = $1 LIMIT 1',
        [leadId]
      );

      if (existingJob.length === 0) {
        const year = new Date().getFullYear();
        const randHex = Math.floor(1000 + Math.random() * 9000);
        const jobNumber = `JOB-${year}-${randHex}`;
        const contractVal = Number(metadata.contract_value) || Number(lead.estimated_value) || 16500.00;

        const jobRows = await query<any>(
          `INSERT INTO jobs (
             lead_id,
             job_number,
             status,
             customer_name,
             customer_phone,
             customer_email,
             address,
             city,
             zip,
             service_type,
             contract_value,
             notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            leadId,
            jobNumber,
            'permit_pending',
            lead.full_name,
            lead.phone,
            lead.email,
            lead.address,
            lead.city,
            lead.zip,
            lead.service_type || 'Roof Replacement',
            contractVal,
            `Auto-created upon pipeline progression to Stage 5 (Job Completion & Follow-up). Lead #${leadId}`,
          ]
        );
        createdJob = jobRows[0];
      } else {
        createdJob = existingJob[0];
      }
    }

    // Record activity audit trail
    const claimNote = didAutoClaim ? ' (and auto-claimed assignment)' : '';
    const desc = `${auth.user.name} moved lead from ${STAGE_LABELS[oldStage]} to ${STAGE_LABELS[newStage]}${claimNote}${metadata.notes ? ` — ${metadata.notes}` : ''}`;

    await query(
      `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'lead',
        leadId,
        'stage_change',
        `Stage Changed to ${STAGE_LABELS[newStage]}`,
        desc,
        auth.user.name,
      ]
    );

    return NextResponse.json({
      ok: true,
      lead: updatedRows[0],
      job: createdJob,
      auto_claimed: didAutoClaim,
    });
  } catch (err) {
    console.error('Error updating pipeline stage:', err);
    return NextResponse.json({ ok: false, error: 'Database error updating stage' }, { status: 500 });
  }
}

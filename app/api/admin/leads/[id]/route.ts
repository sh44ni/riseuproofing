import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { calculateLeadScore } from '@/lib/crm-scoring';
import { recalculateClientStats } from '@/lib/crm-clients';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:view');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  const rows = await query<any>(
    `SELECT 
       l.*,
       u_creator.name as created_by_name,
       u_creator.role as created_by_role,
       u_creator.avatar_url as created_by_avatar,
       u_assigned.name as assigned_to_name
     FROM leads l
     LEFT JOIN users u_creator ON l.created_by_user_id = u_creator.id
     LEFT JOIN users u_assigned ON l.assigned_to_user_id = u_assigned.id
     WHERE l.id = $1`,
    [leadId]
  );
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = rows[0];

  // Automatic Website Lead Recognition:
  // If created_by_user_id is not present or came via public forms, automatically recognize as website lead
  const isTeam = Boolean(lead.created_by_user_id || lead.created_by_name);
  lead.source_type = isTeam ? 'team_member' : 'website';

  if (!lead.lead_source_detail) {
    if (lead.source_type === 'website') {
      if (lead.form_type === 'contact') lead.lead_source_detail = 'Website Contact Form';
      else if (lead.form_type === 'storm_promo' || lead.lead_source === 'storm_promo_popup') lead.lead_source_detail = 'Storm Season Alert';
      else if (lead.form_type === 'estimate' || lead.form_type === 'estimator_full') lead.lead_source_detail = 'Website Estimate Request';
      else if (lead.form_type === 'calculator') lead.lead_source_detail = 'Cost Calculator Inbound';
      else if (lead.lead_source === 'google_ads') lead.lead_source_detail = 'Google Ads Search';
      else if (lead.lead_source === 'yelp') lead.lead_source_detail = 'Yelp Directory';
      else lead.lead_source_detail = 'Website Inbound';
    } else {
      lead.lead_source_detail = 'Sales Rep Outreach';
    }
  }

  // Auto-calculate score if not persisted
  if (!lead.lead_score || lead.lead_score === 0) {
    const scored = calculateLeadScore({
      serviceType: lead.service_type,
      phone: lead.phone,
      email: lead.email,
      roofSqf: lead.roof_sqf,
      address: lead.address,
      zip: lead.zip,
      leadSource: lead.lead_source,
      formType: lead.form_type,
    });
    lead.lead_score = scored.score;
    lead.priority = scored.priority;
    lead.score_factors = scored.factors;
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:edit');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  const body = await req.json();
  const allowedFields = [
    'full_name',
    'phone',
    'email',
    'address',
    'zip',
    'service_type',
    'notes',
    'status',
    'assigned_to',
    'assigned_to_user_id',
    'lead_source',
    'source_type',
    'created_by_user_id',
    'lead_source_detail',
    'property_type',
    'roof_type',
    'roof_sqf',
    'roof_age',
    'stories',
    'hoa',
    'priority',
    'lost_reason',
    'follow_up_at',
  ];

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      params.push(body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: true });
  }

  params.push(leadId);
  const sql = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${params.length}`;
  await query(sql, params);

  // If status changed or lost_reason updated, log activity and recalculate linked client stats
  if (body.status || body.lost_reason !== undefined) {
    if (body.status) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'status_change', $2, $3, $4)`,
        [
          leadId,
          `Status changed to ${body.status}`,
          body.lost_reason ? `Reason: ${body.lost_reason}` : `Pipeline status updated to ${body.status}`,
          body.performed_by || 'Admin',
        ]
      );
    }

    try {
      const leadRows = await query<{ client_id: number | null }>(`SELECT client_id FROM leads WHERE id = $1`, [leadId]);
      const clientId = leadRows[0]?.client_id;
      if (clientId) {
        await recalculateClientStats(Number(clientId));
      }
    } catch (syncErr) {
      console.warn('Could not recalculate client stats in leads/[id] PATCH:', syncErr);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('leads:delete');
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
  }

  await query(`DELETE FROM activities WHERE entity_type = 'lead' AND entity_id = $1`, [leadId]);
  await query(`DELETE FROM tasks WHERE entity_type = 'lead' AND entity_id = $1`, [leadId]);
  await query(`DELETE FROM leads WHERE id = $1`, [leadId]);

  return NextResponse.json({ ok: true });
}

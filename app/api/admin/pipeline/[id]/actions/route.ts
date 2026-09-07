import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function POST(
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
    const { action_type, payload = {} } = body;

    // Fetch current lead
    const rows = await query<any>('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 });
    }

    const lead = rows[0];
    let assignedUserId = lead.assigned_to_user_id || auth.user.id;
    let didAutoClaim = !lead.assigned_to_user_id;

    switch (action_type) {
      case 'log_contact': {
        // Marks lead contacted, auto-moves to Stage 2 if still in Stage 1
        const newStage = lead.pipeline_stage === 'stage_1_lead_gen' ? 'stage_2_initial_contact' : lead.pipeline_stage;
        await query(
          `UPDATE leads
           SET 
             initial_contacted_at = NOW(),
             pipeline_stage = $1,
             stage_entered_at = CASE WHEN $1 != pipeline_stage THEN NOW() ELSE stage_entered_at END,
             status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END,
             assigned_to_user_id = $2,
             assigned_at = CASE WHEN assigned_at IS NULL THEN NOW() ELSE assigned_at END,
             updated_at = NOW()
           WHERE id = $3`,
          [newStage, assignedUserId, leadId]
        );

        const method = payload.method || 'Phone Call';
        const notes = payload.notes ? ` — ${payload.notes}` : '';
        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'contact',
            `Customer Contacted (${method})`,
            `${auth.user.name} logged contact with homeowner via ${method}${notes}`,
            auth.user.name,
          ]
        );
        break;
      }

      case 'confirm_address': {
        const address = payload.address || lead.address;
        const city = payload.city || lead.city;
        const zip = payload.zip || lead.zip;

        await query(
          `UPDATE leads
           SET 
             address_confirmed = true,
             address = $1,
             city = $2,
             zip = $3,
             assigned_to_user_id = $4,
             assigned_at = CASE WHEN assigned_at IS NULL THEN NOW() ELSE assigned_at END,
             updated_at = NOW()
           WHERE id = $5`,
          [address, city, zip, assignedUserId, leadId]
        );

        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'address_confirmed',
            'Property Address Verified',
            `${auth.user.name} confirmed property address: ${address}, ${city} ${zip}`,
            auth.user.name,
          ]
        );
        break;
      }

      case 'book_site_visit': {
        const scheduledAt = payload.scheduled_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const inspectorId = payload.inspector_id ? parseInt(payload.inspector_id, 10) : assignedUserId;

        // Auto-advance to Stage 3 if earlier
        const targetStage =
          lead.pipeline_stage === 'stage_1_lead_gen' || lead.pipeline_stage === 'stage_2_initial_contact'
            ? 'stage_3_site_visit_estimate'
            : lead.pipeline_stage;

        await query(
          `UPDATE leads
           SET 
             site_visit_scheduled_at = $1,
             pipeline_stage = $2,
             stage_entered_at = CASE WHEN $2 != pipeline_stage THEN NOW() ELSE stage_entered_at END,
             status = 'estimate',
             assigned_to_user_id = $3,
             assigned_at = CASE WHEN assigned_at IS NULL THEN NOW() ELSE assigned_at END,
             updated_at = NOW()
           WHERE id = $4`,
          [scheduledAt, targetStage, inspectorId, leadId]
        );

        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'visit_scheduled',
            '12-Point Roof Inspection Booked',
            `${auth.user.name} scheduled site inspection for ${new Date(scheduledAt).toLocaleString()}`,
            auth.user.name,
          ]
        );
        break;
      }

      case 'apply_discount': {
        const discount = payload.discount || 'Standard Pricing';
        const financing = Boolean(payload.financing_interested);

        await query(
          `UPDATE leads
           SET 
             discount_applied = $1,
             financing_interested = $2,
             updated_at = NOW()
           WHERE id = $3`,
          [discount, financing, leadId]
        );

        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'discount_applied',
            'Promotion & Financing Updated',
            `${auth.user.name} applied: "${discount}". Financing interest: ${financing ? 'Yes' : 'No'}`,
            auth.user.name,
          ]
        );
        break;
      }

      case 'issue_warranty': {
        // Find existing job
        const jobRows = await query<any>('SELECT id FROM jobs WHERE lead_id = $1 LIMIT 1', [leadId]);
        const jobId = jobRows.length > 0 ? jobRows[0].id : null;

        if (!jobId) {
          return NextResponse.json({ ok: false, error: 'A job record is required to issue a warranty. Move to Stage 5 first.' }, { status: 400 });
        }

        const existingWar = await query<any>('SELECT id, warranty_number FROM warranties WHERE job_id = $1 OR lead_id = $2', [jobId, leadId]);
        if (existingWar.length > 0) {
          return NextResponse.json({ ok: true, message: 'Warranty already issued', warranty: existingWar[0] });
        }

        const warNum = `WAR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const warType = payload.warranty_type || '50-Year GAF Golden Pledge Lifetime Warranty';

        const newWar = await query<any>(
          `INSERT INTO warranties (
             job_id, lead_id, warranty_number, warranty_type, start_date, expiration_date, coverage_details
           )
           VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '50 years', $5)
           RETURNING *`,
          [
            jobId,
            leadId,
            warNum,
            warType,
            'Covers 100% manufacturer defects, non-prorated 50-year material coverage and 25-year workmanship warranty backed by Rise Up Roofing.',
          ]
        );

        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'warranty_issued',
            `Issued ${warType}`,
            `${auth.user.name} issued warranty certificate #${warNum}`,
            auth.user.name,
          ]
        );

        return NextResponse.json({ ok: true, warranty: newWar[0] });
      }

      case 'request_review': {
        const jobRows = await query<any>('SELECT id FROM jobs WHERE lead_id = $1 LIMIT 1', [leadId]);
        const jobId = jobRows.length > 0 ? jobRows[0].id : null;

        await query(
          `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'lead',
            leadId,
            'review_requested',
            '5-Star Google Review Invite Sent',
            `${auth.user.name} sent Google & Yelp review request link to ${lead.full_name} (${lead.phone || lead.email})`,
            auth.user.name,
          ]
        );

        // Check or insert pending review stub
        const existingRev = await query<any>('SELECT id FROM reviews WHERE lead_id = $1', [leadId]);
        if (existingRev.length === 0) {
          await query(
            `INSERT INTO reviews (lead_id, job_id, customer_name, customer_city, rating, status, source)
             VALUES ($1, $2, $3, $4, 5, 'pending', 'sms_invite')`,
            [leadId, jobId, lead.full_name, lead.city || 'Bay Area']
          );
        }

        break;
      }

      default:
        return NextResponse.json({ ok: false, error: `Unsupported action type: ${action_type}` }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      action: action_type,
      auto_claimed: didAutoClaim,
    });
  } catch (err) {
    console.error('Error executing pipeline action:', err);
    return NextResponse.json({ ok: false, error: 'Database error executing pipeline action' }, { status: 500 });
  }
}

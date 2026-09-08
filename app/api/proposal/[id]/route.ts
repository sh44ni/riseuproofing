import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Strict anti-enumeration: Disallow sequential numeric lookups
  if (/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Proposal not found or link has expired' }, { status: 404 });
  }

  // Lookup by estimate_number (e.g. EST-2026-0001) or secure access_token
  const rows = await query<any>(
    `SELECT * FROM estimates WHERE estimate_number = $1 OR access_token = $1 LIMIT 1`,
    [id]
  );
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Proposal not found or link has expired' }, { status: 404 });
  }

  const est = rows[0];

  // Track customer first view
  if (!est.viewed_at) {
    await query(`UPDATE estimates SET viewed_at = NOW() WHERE id = $1`, [est.id]);

    if (est.lead_id) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'system', 'Proposal Viewed by Homeowner', $2, 'Customer')`,
        [est.lead_id, `Homeowner opened digital proposal (${est.estimate_number}) online`]
      );
    }
  }

  // Sanitize internal wholesale costs from public view
  const publicProposal = {
    id: est.id,
    estimateNumber: est.estimate_number,
    status: est.status,
    customerName: est.customer_name,
    customerAddress: est.customer_address,
    customerCity: est.customer_city,
    customerZip: est.customer_zip,
    serviceType: est.service_type,
    roofSquares: est.roof_squares,
    roofPitch: est.roof_pitch,
    stories: est.stories,
    materialType: est.material_type,
    addons: est.addons,
    total: est.total,
    financingMonths: est.financing_months,
    monthlyPayment: est.monthly_payment,
    validUntil: est.valid_until,
    notes: est.notes,
    createdAt: est.created_at,
    viewedAt: est.viewed_at,
    acceptedAt: est.accepted_at,
    signatureName: est.signature_name,
  };

  return NextResponse.json({ proposal: publicProposal });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Strict anti-enumeration: Disallow sequential numeric lookups
  if (/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const body = await req.json();
  const { signatureName, token } = body;
  const tokenParam = req.nextUrl.searchParams.get('token') || req.headers.get('x-proposal-token') || token;

  if (!signatureName || !signatureName.trim()) {
    return NextResponse.json({ error: 'Full legal name signature is required' }, { status: 400 });
  }

  const rows = await query<any>(
    `SELECT * FROM estimates WHERE estimate_number = $1 OR access_token = $1 LIMIT 1`,
    [id]
  );
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const est = rows[0];

  // If estimate has an access_token, enforce token validation (unless user is authenticated admin)
  if (est.access_token) {
    const isAdmin = await isAuthenticated();
    if (!isAdmin && tokenParam !== est.access_token && id !== est.access_token) {
      return NextResponse.json(
        { error: 'Forbidden: Valid authorization token required to accept proposal.' },
        { status: 403 }
      );
    }
  }

  if (est.status === 'accepted') {
    return NextResponse.json({ ok: true, message: 'Proposal was already accepted' });
  }

  // Resolve or establish client_id
  let clientId: number | null = est.client_id ? Number(est.client_id) : null;
  if (!clientId && est.lead_id) {
    const lRows = await query<any>('SELECT client_id FROM leads WHERE id = $1', [est.lead_id]);
    if (lRows[0]?.client_id) clientId = Number(lRows[0].client_id);
  }
  if (!clientId) {
    const { findOrCreateClient } = await import('@/lib/crm-clients');
    const client = await findOrCreateClient({
      fullName: est.customer_name,
      phone: est.customer_phone,
      email: est.customer_email,
      address: est.customer_address,
      city: est.customer_city,
      zip: est.customer_zip,
      serviceType: est.service_type,
      leadSource: 'proposal_portal',
    });
    clientId = client.id;
  }

  // Update estimate status and link client
  await query(
    `UPDATE estimates SET 
       status = 'accepted',
       accepted_at = NOW(),
       signature_name = $1,
       client_id = COALESCE(client_id, $2)
     WHERE id = $3`,
    [signatureName.trim(), clientId, est.id]
  );

  // Generate job number JOB-YYYY-XXXX
  const year = new Date().getFullYear();
  const jobCount = await query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs`);
  const seq = String(parseInt(jobCount[0]?.count ?? '0', 10) + 1).padStart(4, '0');
  const jobNumber = `JOB-${year}-${seq}`;

  // Create Job in 'permit_pending' with client_id
  await query(
    `INSERT INTO jobs (
      lead_id, client_id, estimate_id, job_number, status, customer_name, customer_phone,
      customer_email, address, city, zip, service_type, contract_value, notes
    ) VALUES (
      $1, $2, $3, $4, 'permit_pending', $5, $6,
      $7, $8, $9, $10, $11, $12, $13
    )`,
    [
      est.lead_id,
      clientId,
      est.id,
      jobNumber,
      est.customer_name,
      est.customer_phone,
      est.customer_email,
      est.customer_address,
      est.customer_city,
      est.customer_zip,
      est.service_type,
      est.total,
      `Digitally signed by ${signatureName.trim()}`,
    ]
  );

  // Mark lead as won and advance to Stage 5 in the Sales Pipeline
  if (est.lead_id) {
    await query(
      `UPDATE leads 
       SET status = 'won',
           pipeline_stage = 'stage_5_completion_followup',
           stage_entered_at = NOW(),
           contract_signed_at = NOW(),
           estimated_value = GREATEST(COALESCE(estimated_value, 0), $1),
           client_id = COALESCE(client_id, $2),
           updated_at = NOW()
       WHERE id = $3`,
      [Number(est.total) || 0, clientId, est.lead_id]
    );

    await query(
      `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
       VALUES ('lead', $1, $2, 'status_change', 'Contract Signed Online!', $3, 'Customer')`,
      [
        est.lead_id,
        clientId,
        `Homeowner ${signatureName.trim()} signed estimate ${est.estimate_number} ($${Number(est.total).toLocaleString()}). Project ${jobNumber} created and moved to Stage 5!`,
      ]
    );
  }

  if (clientId) {
    const { recalculateClientStats } = await import('@/lib/crm-clients');
    await recalculateClientStats(clientId);
  }

  return NextResponse.json({
    ok: true,
    message: 'Proposal accepted successfully! Rise Up Roofing project dispatch notified.',
    jobNumber,
  });
}

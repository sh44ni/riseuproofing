import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit('estimate-form', ip, {
    limit: 5,
    windowMs: 10 * 60 * 1000, // 5 requests per 10 minutes
  });

  if (!rateLimit.allowed) {
    const retrySec = Math.ceil(rateLimit.resetMs / 1000);
    return NextResponse.json(
      { ok: false, error: `Too many submissions. Please wait ${retrySec} seconds.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retrySec) },
      }
    );
  }

  try {
    const body = await req.json();

    // Honeypot bot protection: If filled, silently discard
    if (body.honeypot && String(body.honeypot).trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const {
      fullName,
      phone,
      address,
      city,
      zip,
      serviceType,
      notes,
      email,
      formType = 'estimate',
      priority = 'cool',
      leadScore = 0,
      leadSource = 'website',
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ ok: false, error: 'Name and phone are required' }, { status: 400 });
    }

    const referer = req.headers.get('referer') ?? '/';
    let sourcePage = '/';
    try {
      sourcePage = new URL(referer).pathname;
    } catch {
      sourcePage = referer;
    }

    let detail = 'Website Free Estimate';
    if (formType === 'estimator_full' || formType === 'calculator') {
      detail = 'Instant Estimator';
    } else if (formType === 'storm_promo' || leadSource === 'storm_promo_popup') {
      detail = 'Storm Season Alert';
    } else if (sourcePage && sourcePage.includes('/service-area/')) {
      const citySlug = sourcePage.replace('/service-area/', '').replace(/\/$/, '');
      detail = `Website Landing (${citySlug})`;
    } else if (sourcePage && sourcePage.includes('/services/')) {
      const serviceSlug = sourcePage.replace('/services/', '').replace(/\/$/, '');
      detail = `Website Service (${serviceSlug})`;
    }

    let clientId: number | null = null;
    try {
      const { findOrCreateClient } = await import('@/lib/crm-clients');
      const client = await findOrCreateClient({
        fullName,
        phone,
        email: email ?? null,
        address: address ?? null,
        city: city ?? null,
        zip: zip ?? null,
        leadSource: leadSource || 'website_estimate',
        sourceType: 'website',
        leadSourceDetail: detail,
        notes: notes ?? null,
      });
      clientId = client.id;
    } catch (clientErr) {
      console.error('[api/estimate] Failed to auto-link client:', clientErr);
    }

    const result = await query<{ id: string }>(
      `INSERT INTO leads (
        form_type, full_name, phone, email, address, city, zip, service_type, notes, source_page, status, priority, lead_score, lead_source, client_id,
        source_type, lead_source_detail
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', $11, $12, $13, $14, 'website', $15)
      RETURNING id`,
      [
        formType,
        fullName,
        phone,
        email ?? null,
        address ?? null,
        city ?? 'San Diego',
        zip ?? null,
        serviceType ?? 'Roof Replacement',
        notes ?? null,
        sourcePage,
        priority,
        leadScore,
        leadSource,
        clientId,
        detail,
      ]
    );

    const leadId = result[0]?.id;

    if (leadId) {
      // Log lead creation activity to customer timeline
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, $2, 'form_submission', $3, $4, 'Website Visitor')`,
        [
          leadId,
          clientId,
          formType === 'storm_promo' ? '⚡ Storm Season Alert $1,000 Off Claimed' : 'New Estimate Request',
          notes || 'Inquiry submitted through website portal',
        ]
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, leadId });
  } catch (err) {
    console.error('[api/estimate]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

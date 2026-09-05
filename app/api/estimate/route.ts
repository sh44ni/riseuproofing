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

    const result = await query<{ id: string }>(
      `INSERT INTO leads (
        form_type, full_name, phone, email, address, city, zip, service_type, notes, source_page, status, priority, lead_score, lead_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', $11, $12, $13)
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
      ]
    );

    const leadId = result[0]?.id;

    if (leadId) {
      // Log lead creation activity to customer timeline
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'form_submission', $2, $3, 'Website Visitor')`,
        [
          leadId,
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

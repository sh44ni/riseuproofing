import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { contactFormSchema } from '@/lib/schema/forms';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit('contact-form', ip, {
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

    // Honeypot check: If the hidden honeypot field is filled, silently discard spam
    if (body.honeypot && String(body.honeypot).trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const parseResult = contactFormSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid form data';
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { fullName, email, phone, subject, message } = parseResult.data;

    const referer = req.headers.get('referer') ?? '/';
    let sourcePage = '/';
    try {
      sourcePage = new URL(referer).pathname;
    } catch {
      sourcePage = referer;
    }

    let clientId: number | null = null;
    try {
      const { findOrCreateClient } = await import('@/lib/crm-clients');
      const client = await findOrCreateClient({
        fullName,
        phone: phone ?? null,
        email: email ?? null,
        leadSource: 'website_contact',
        sourceType: 'website',
        leadSourceDetail: 'Website Contact Form',
        notes: subject ? `Subject: ${subject}` : null,
      });
      clientId = client.id;
    } catch (clientErr) {
      console.error('[api/contact] Failed to auto-link client:', clientErr);
    }

    const insertedLead = await query<{ id: number }>(
      `INSERT INTO leads (form_type, full_name, phone, email, subject, message, source_page, status, client_id, source_type, lead_source, lead_source_detail)
       VALUES ('contact', $1, $2, $3, $4, $5, $6, 'new', $7, 'website', 'website_contact', 'Website Contact Form')
       RETURNING id`,
      [fullName, phone ?? null, email, subject ?? null, message, sourcePage, clientId]
    );

    // Also log activity to client/lead
    if (clientId && insertedLead.length > 0) {
      try {
        await query(
          `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description)
           VALUES ('lead', $1, $2, 'system', 'Website Contact Form Received', $3)`,
          [insertedLead[0].id, clientId, `Subject: ${subject || 'General Inquiry'}. Message: ${message}`]
        );
      } catch (actErr) {
        console.error('[api/contact] Activity log error:', actErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/contact]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

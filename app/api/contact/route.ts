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

    await query(
      `INSERT INTO leads (form_type, full_name, phone, email, subject, message, source_page, status)
       VALUES ('contact', $1, $2, $3, $4, $5, $6, 'new')`,
      [fullName, phone ?? null, email, subject ?? null, message, sourcePage]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/contact]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, subject, message } = body;

    if (!fullName || !email || !message) {
      return NextResponse.json({ ok: false, error: 'Name, email and message are required' }, { status: 400 });
    }

    const referer = req.headers.get('referer') ?? '/';
    const sourcePage = new URL(referer).pathname;

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

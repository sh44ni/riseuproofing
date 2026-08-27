import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, address, zip, serviceType, notes, email, preferredContactTime } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ ok: false, error: 'Name and phone are required' }, { status: 400 });
    }

    const referer = req.headers.get('referer') ?? '/';
    const sourcePage = new URL(referer).pathname;

    await query(
      `INSERT INTO leads (form_type, full_name, phone, email, address, zip, service_type, notes, source_page, status)
       VALUES ('estimate', $1, $2, $3, $4, $5, $6, $7, $8, 'new')`,
      [fullName, phone, email ?? null, address ?? null, zip ?? null, serviceType ?? null, notes ?? null, sourcePage]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/estimate]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

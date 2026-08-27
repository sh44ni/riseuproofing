import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const formType = searchParams.get('form_type');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (formType) { params.push(formType); conditions.push(`form_type = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countRow, daily] = await Promise.all([
    query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM leads ${where}`, params),
    query<{ day: string; count: string }>(
      `SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*) AS count
       FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day`
    ),
  ]);

  return NextResponse.json({
    leads: rows,
    total: parseInt(countRow[0]?.count ?? '0'),
    page,
    daily,
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await req.json();
  const valid = ['new', 'contacted', 'quoted', 'won', 'lost'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await query(`UPDATE leads SET status = $1 WHERE id = $2`, [status, id]);
  return NextResponse.json({ ok: true });
}

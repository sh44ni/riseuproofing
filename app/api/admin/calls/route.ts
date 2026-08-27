import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30');

  const [daily, byPage, byDevice, recent] = await Promise.all([
    query<{ day: string; count: string }>(
      `SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY day ORDER BY day`
    ),
    query<{ page_path: string; count: string }>(
      `SELECT page_path, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY page_path ORDER BY count DESC LIMIT 8`
    ),
    query<{ device_type: string; count: string }>(
      `SELECT device_type, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY device_type`
    ),
    query(
      `SELECT * FROM call_events ORDER BY created_at DESC LIMIT 20`
    ),
  ]);

  return NextResponse.json({ daily, byPage, byDevice, recent });
}

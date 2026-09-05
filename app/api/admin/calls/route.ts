import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('analytics:view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const rawDays = parseInt(searchParams.get('days') ?? '30', 10);
  const days = Number.isInteger(rawDays) && rawDays > 0 ? Math.min(rawDays, 365) : 30;

  const [daily, byPage, byDevice, recent] = await Promise.all([
    query<{ day: string; count: string }>(
      `SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
         AND (page_path NOT LIKE '/admin%' OR page_path IS NULL)
       GROUP BY day ORDER BY day`
    ),
    query<{ page_path: string; count: string }>(
      `SELECT page_path, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
         AND (page_path NOT LIKE '/admin%' OR page_path IS NULL)
       GROUP BY page_path ORDER BY count DESC LIMIT 8`
    ),
    query<{ device_type: string; count: string }>(
      `SELECT device_type, COUNT(*) AS count
       FROM call_events
       WHERE created_at >= NOW() - INTERVAL '${days} days'
         AND (page_path NOT LIKE '/admin%' OR page_path IS NULL)
       GROUP BY device_type`
    ),
    query(
      `SELECT * FROM call_events
       WHERE (page_path NOT LIKE '/admin%' OR page_path IS NULL)
       ORDER BY created_at DESC LIMIT 20`
    ),
  ]);

  return NextResponse.json({ daily, byPage, byDevice, recent });
}

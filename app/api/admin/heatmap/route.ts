import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('analytics:view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const pagePath = searchParams.get('page') ?? '/';
  const rawDays = parseInt(searchParams.get('days') ?? '30', 10);
  const days = Number.isInteger(rawDays) && rawDays > 0 ? Math.min(rawDays, 365) : 30;

  // Do not show or query heatmaps for internal admin routes
  if (pagePath.startsWith('/admin')) {
    const pages = await query<{ page_path: string; views: string }>(
      `SELECT page_path, COUNT(*) AS views
       FROM analytics_events
       WHERE event_type = 'pageview' AND page_path NOT LIKE '/admin%'
       GROUP BY page_path ORDER BY views DESC`
    );
    return NextResponse.json({ clicks: [], scrollDepth: [], topElements: [], pages });
  }

  const [clicks, scrollDepth, topElements] = await Promise.all([
    // Click coordinates for heatmap
    query<{ x_pct: number; y_pct: number; count: number }>(
      `SELECT x_pct, y_pct, COUNT(*) AS count
       FROM analytics_events
       WHERE event_type = 'click'
         AND page_path = $1
         AND x_pct IS NOT NULL
         AND y_pct IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY x_pct, y_pct`,
      [pagePath]
    ),
    // Scroll depth distribution
    query<{ bucket: number; count: string }>(
      `SELECT FLOOR(scroll_pct / 10) * 10 AS bucket, COUNT(DISTINCT session_id) AS count
       FROM analytics_events
       WHERE event_type = 'scroll'
         AND page_path = $1
         AND scroll_pct IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY bucket ORDER BY bucket`,
      [pagePath]
    ),
    // Top clicked elements
    query<{ element: string; count: string }>(
      `SELECT element, COUNT(*) AS count
       FROM analytics_events
       WHERE event_type = 'click'
         AND page_path = $1
         AND element IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY element ORDER BY count DESC LIMIT 10`,
      [pagePath]
    ),
    // All pages for selector
  ]);

  const pages = await query<{ page_path: string; views: string }>(
    `SELECT page_path, COUNT(*) AS views
     FROM analytics_events
     WHERE event_type = 'pageview' AND page_path NOT LIKE '/admin%'
     GROUP BY page_path ORDER BY views DESC`
  );

  return NextResponse.json({ clicks, scrollDepth, topElements, pages });
}

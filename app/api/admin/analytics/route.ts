import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Support custom date range (from/to) OR legacy days param
  let fromExpr: string;
  let toExpr: string;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const days = parseInt(searchParams.get('days') ?? '30');

  if (fromParam && toParam) {
    fromExpr = `'${fromParam}'::TIMESTAMPTZ`;
    toExpr   = `('${toParam}'::DATE + INTERVAL '1 day')::TIMESTAMPTZ`;
  } else {
    fromExpr = `(NOW() - INTERVAL '${days} days')`;
    toExpr   = `NOW()`;
  }

  // Base WHERE predicates (no alias usage — PostgreSQL requires full expressions in GROUP BY)
  const timeFilter = `created_at >= ${fromExpr} AND created_at < ${toExpr}`;
  const pvFilter   = `event_type = 'pageview' AND ${timeFilter}`;

  const [
    dailyPageviews,
    topPages,
    deviceBreakdown,
    referrers,
    countries,
    hourlyHeatmap,
    weekdayTraffic,
    eventTypeBreakdown,
    topButtons,
    activityFeed,
    sessionStats,
    callsByHour,
    utmSources,
    leadsInRange,
  ] = await Promise.all([

    // ── Daily pageviews + sessions ────────────────────────────────────────
    query<{ day: string; pageviews: string; sessions: string }>(
      `SELECT DATE_TRUNC('day', created_at)::DATE AS day,
              COUNT(*)                             AS pageviews,
              COUNT(DISTINCT session_id)           AS sessions
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY DATE_TRUNC('day', created_at)::DATE
       ORDER BY DATE_TRUNC('day', created_at)::DATE`
    ),

    // ── Top pages ─────────────────────────────────────────────────────────
    query<{ page_path: string; views: string; sessions: string }>(
      `SELECT page_path,
              COUNT(*)                   AS views,
              COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY page_path
       ORDER BY views DESC LIMIT 12`
    ),

    // ── Device breakdown ──────────────────────────────────────────────────
    query<{ device_type: string; count: string }>(
      `SELECT device_type, COUNT(DISTINCT session_id) AS count
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY device_type`
    ),

    // ── Traffic sources / referrers ───────────────────────────────────────
    query<{ referrer: string; count: string }>(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS referrer,
              COUNT(DISTINCT session_id)               AS count
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct')
       ORDER BY count DESC LIMIT 10`
    ),

    // ── Countries ─────────────────────────────────────────────────────────
    query<{ country: string; count: string }>(
      `SELECT country, COUNT(DISTINCT session_id) AS count
       FROM analytics_events
       WHERE ${pvFilter} AND country IS NOT NULL AND country != ''
       GROUP BY country
       ORDER BY count DESC LIMIT 10`
    ),

    // ── Hourly heatmap (0–23) — GROUP BY full expression ─────────────────
    query<{ hour: string; count: string }>(
      `SELECT EXTRACT(HOUR FROM created_at)::INT AS hour,
              COUNT(DISTINCT session_id)          AS count
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY EXTRACT(HOUR FROM created_at)::INT
       ORDER BY EXTRACT(HOUR FROM created_at)::INT`
    ),

    // ── Weekday traffic (0=Sun … 6=Sat) — GROUP BY full expressions ───────
    query<{ dow: string; label: string; count: string }>(
      `SELECT EXTRACT(DOW FROM created_at)::INT  AS dow,
              TO_CHAR(created_at, 'Dy')           AS label,
              COUNT(DISTINCT session_id)           AS count
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY EXTRACT(DOW FROM created_at)::INT, TO_CHAR(created_at, 'Dy')
       ORDER BY EXTRACT(DOW FROM created_at)::INT`
    ),

    // ── Event type breakdown ──────────────────────────────────────────────
    query<{ event_type: string; count: string }>(
      `SELECT event_type, COUNT(*) AS count
       FROM analytics_events
       WHERE ${timeFilter}
       GROUP BY event_type
       ORDER BY count DESC`
    ),

    // ── Top CTA buttons / nav links ───────────────────────────────────────
    query<{ label: string; count: string }>(
      `SELECT COALESCE(label, element, 'unknown') AS label,
              COUNT(*)                             AS count
       FROM analytics_events
       WHERE event_type IN ('button_click','nav_click') AND ${timeFilter}
         AND COALESCE(label, element) IS NOT NULL
       GROUP BY COALESCE(label, element, 'unknown')
       ORDER BY count DESC LIMIT 10`
    ),

    // ── Activity feed (last 60) ────────────────────────────────────────────
    query<{
      id: string; session_id: string; event_type: string; page_path: string;
      label: string; element: string; device_type: string; country: string;
      city: string; scroll_pct: string; duration_ms: string;
      utm_source: string; utm_medium: string; created_at: string;
    }>(
      `SELECT id, session_id, event_type, page_path, label, element,
              device_type, country, city, scroll_pct, duration_ms,
              utm_source, utm_medium, created_at
       FROM activity_log
       WHERE ${timeFilter}
       ORDER BY created_at DESC LIMIT 60`
    ).catch(() => []),

    // ── Bounce rate + avg scroll depth ────────────────────────────────────
    query<{ total_sessions: string; bounce_sessions: string; avg_scroll: string }>(
      `SELECT COUNT(DISTINCT session_id) AS total_sessions,
              COUNT(DISTINCT CASE WHEN pv_count = 1 THEN session_id END) AS bounce_sessions,
              ROUND(AVG(max_scroll)) AS avg_scroll
       FROM (
         SELECT session_id,
                COUNT(CASE WHEN event_type='pageview' THEN 1 END)               AS pv_count,
                MAX(CASE WHEN event_type='scroll' THEN scroll_pct ELSE 0 END)   AS max_scroll
         FROM analytics_events
         WHERE ${timeFilter}
         GROUP BY session_id
       ) s`
    ),

    // ── Calls by hour — GROUP BY full expression ──────────────────────────
    query<{ hour: string; count: string }>(
      `SELECT EXTRACT(HOUR FROM created_at)::INT AS hour,
              COUNT(*)                            AS count
       FROM call_events
       WHERE ${timeFilter}
       GROUP BY EXTRACT(HOUR FROM created_at)::INT
       ORDER BY EXTRACT(HOUR FROM created_at)::INT`
    ),

    // ── UTM source breakdown ──────────────────────────────────────────────
    query<{ utm_source: string; count: string }>(
      `SELECT COALESCE(utm_source, 'organic') AS utm_source,
              COUNT(DISTINCT session_id)       AS count
       FROM analytics_events
       WHERE ${pvFilter}
       GROUP BY COALESCE(utm_source, 'organic')
       ORDER BY count DESC LIMIT 8`
    ),

    // ── Leads in time range ───────────────────────────────────────────────
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM leads WHERE ${timeFilter}`
    ),
  ]);

  // Derived metrics
  const totalSessions  = parseInt(sessionStats[0]?.total_sessions  ?? '0');
  const bounceSessions = parseInt(sessionStats[0]?.bounce_sessions ?? '0');
  const avgScroll      = parseInt(sessionStats[0]?.avg_scroll      ?? '0');
  const bounceRate     = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;
  const leadsCount     = parseInt(leadsInRange[0]?.count ?? '0');
  const conversionRate = totalSessions > 0
    ? parseFloat(((leadsCount / totalSessions) * 100).toFixed(1))
    : 0;

  return NextResponse.json({
    dailyPageviews,
    topPages,
    deviceBreakdown,
    referrers,
    countries,
    hourlyHeatmap,
    weekdayTraffic,
    eventTypeBreakdown,
    topButtons,
    activityFeed,
    utmSources,
    callsByHour,
    bounceRate,
    avgScrollDepth: avgScroll,
    conversionRate,
    totalSessions,
  });
}

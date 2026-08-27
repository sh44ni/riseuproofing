import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All KPIs in parallel
  const [
    visitorsToday,
    visitors7d,
    visitors30d,
    leadsTotal,
    leads7d,
    callsTotal,
    calls7d,
    topPages,
    deviceBreakdown,
    leadsBreakdown,
    dailyVisitors,
    recentLeads,
    sessionStats,
    recentActivity,
  ] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE event_type='pageview' AND created_at >= NOW() - INTERVAL '1 day'`),
    query<{ count: string }>(`SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE event_type='pageview' AND created_at >= NOW() - INTERVAL '7 days'`),
    query<{ count: string }>(`SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE event_type='pageview' AND created_at >= NOW() - INTERVAL '30 days'`),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM leads`),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'`),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM call_events`),
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM call_events WHERE created_at >= NOW() - INTERVAL '7 days'`),
    query<{ page_path: string; views: string }>(`SELECT page_path, COUNT(*) AS views FROM analytics_events WHERE event_type='pageview' GROUP BY page_path ORDER BY views DESC LIMIT 8`),
    query<{ device_type: string; count: string }>(`SELECT device_type, COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE event_type='pageview' GROUP BY device_type`),
    query<{ status: string; count: string }>(`SELECT status, COUNT(*) AS count FROM leads GROUP BY status`),
    query<{ day: string; visitors: string }>(`SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(DISTINCT session_id) AS visitors FROM analytics_events WHERE event_type='pageview' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day`),
    query<{ id: number; full_name: string; service_type: string; status: string; created_at: string }>(`SELECT id, full_name, service_type, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5`),
    // Bounce rate + conversion rate (last 30 days)
    query<{ total_sessions: string; bounce_sessions: string }>(
      `SELECT COUNT(DISTINCT session_id) AS total_sessions,
              COUNT(DISTINCT CASE WHEN pv_count = 1 THEN session_id END) AS bounce_sessions
       FROM (
         SELECT session_id, COUNT(CASE WHEN event_type='pageview' THEN 1 END) AS pv_count
         FROM analytics_events WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY session_id
       ) s`
    ),
    // Recent activity feed (last 10 events)
    query<{ event_type: string; page_path: string; label: string; device_type: string; created_at: string }>(
      `SELECT event_type, page_path, label, device_type, created_at
       FROM activity_log ORDER BY created_at DESC LIMIT 10`
    ).catch(() => []),
  ]);

  const totalSessions = parseInt(sessionStats[0]?.total_sessions ?? '0');
  const bounceSessions = parseInt(sessionStats[0]?.bounce_sessions ?? '0');
  const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;
  const leadsCount = parseInt(leadsTotal[0]?.count ?? '0');
  const conversionRate = totalSessions > 0 ? parseFloat(((leadsCount / totalSessions) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    visitorsToday: parseInt(visitorsToday[0]?.count ?? '0'),
    visitors7d: parseInt(visitors7d[0]?.count ?? '0'),
    visitors30d: parseInt(visitors30d[0]?.count ?? '0'),
    leadsTotal: leadsCount,
    leads7d: parseInt(leads7d[0]?.count ?? '0'),
    callsTotal: parseInt(callsTotal[0]?.count ?? '0'),
    calls7d: parseInt(calls7d[0]?.count ?? '0'),
    topPages,
    deviceBreakdown,
    leadsBreakdown,
    dailyVisitors,
    recentLeads,
    bounceRate,
    conversionRate,
    recentActivity,
  });
}

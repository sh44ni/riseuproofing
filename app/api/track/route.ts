import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Resolve geo from IP via ipapi.co (free, no key needed, 1000 req/day)
async function getGeo(ip: string): Promise<{ country: string; city: string }> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return { country: '', city: '' };
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return { country: '', city: '' };
    const d = await r.json();
    return { country: d.country_name ?? '', city: d.city ?? '' };
  } catch {
    return { country: '', city: '' };
  }
}

function detectDevice(ua: string): string {
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Events that get written to the activity_log feed (everything meaningful)
const FEED_EVENTS = new Set([
  'pageview', 'call', 'form_start', 'form_submit', 'button_click',
  'nav_click', 'scroll', 'session_end', 'outbound_link', 'estimate_view',
  'tab_switch', 'image_view', 'video_play', 'estimate_submit', 'contact_submit',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      eventType,
      pagePath,
      element,
      label,
      xPct,
      yPct,
      scrollPct,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      durationMs,
    } = body;

    // Never track internal admin routes in public web analytics
    if (!pagePath || pagePath.startsWith('/admin')) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const ua = req.headers.get('user-agent') ?? '';
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '';
    const device = detectDevice(ua);

    // Only resolve geo for events that need it (not hot-path clicks)
    const geoNeeded = ['pageview', 'call', 'form_submit', 'session_end'].includes(eventType);
    const { country, city } = geoNeeded ? await getGeo(ip) : { country: '', city: '' };

    if (eventType === 'call') {
      // Write to call_events for backward compat
      await query(
        `INSERT INTO call_events (session_id, page_path, device_type, country, city)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, pagePath, device, country, city]
      );
    }

    // Write to analytics_events for aggregate queries
    await query(
      `INSERT INTO analytics_events
         (session_id, event_type, page_path, element, label, x_pct, y_pct,
          scroll_pct, referrer, user_agent, device_type, country, city,
          utm_source, utm_medium, utm_campaign, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        sessionId, eventType, pagePath,
        element ?? null, label ?? null,
        xPct ?? null, yPct ?? null,
        scrollPct ?? null, referrer ?? null,
        ua, device, country, city,
        utmSource ?? null, utmMedium ?? null, utmCampaign ?? null,
        durationMs ?? null,
      ]
    );

    // Write to activity_log (human-readable feed) for meaningful events
    if (FEED_EVENTS.has(eventType)) {
      await query(
        `INSERT INTO activity_log
           (session_id, event_type, page_path, label, element,
            device_type, country, city, scroll_pct, duration_ms,
            utm_source, utm_medium, utm_campaign)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          sessionId, eventType, pagePath,
          label ?? element ?? null, element ?? null,
          device, country, city,
          scrollPct ?? null, durationMs ?? null,
          utmSource ?? null, utmMedium ?? null, utmCampaign ?? null,
        ]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Silently fail — don't break visitor experience
    console.error('[track]', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

// Allow preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleReviews } from '@/lib/google-reviews';
import { syncYelpReviews } from '@/lib/yelp-reviews';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get('secret');

  // Verify secret if CRON_SECRET is configured
  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const [googleResult, yelpResult] = await Promise.allSettled([
      syncGoogleReviews(),
      syncYelpReviews(),
    ]);

    const google = googleResult.status === 'fulfilled' ? googleResult.value : { ok: false, error: (googleResult as any).reason?.message };
    const yelp = yelpResult.status === 'fulfilled' ? yelpResult.value : { ok: false, error: (yelpResult as any).reason?.message };

    return NextResponse.json({
      ok: Boolean(google.ok || yelp.ok),
      google,
      yelp,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[cron/sync-reviews error]', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error running sync' },
      { status: 500 }
    );
  }
}

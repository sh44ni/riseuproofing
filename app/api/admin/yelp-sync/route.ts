import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { getYelpAuthSettings, saveYelpAuthSettings, syncYelpReviews } from '@/lib/yelp-reviews';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    const settings = await getYelpAuthSettings();
    const isConnected = Boolean(settings?.api_key);

    const maskedKey = settings?.api_key
      ? `${settings.api_key.slice(0, 6)}...${settings.api_key.slice(-4)}`
      : null;

    return NextResponse.json({
      isConnected,
      businessId: settings.business_id || null,
      businessAlias: settings.business_alias || null,
      businessName: settings.business_name || 'Rise Up Roofing And Construction',
      businessRating: settings.business_rating ?? 5.0,
      businessReviewCount: settings.business_review_count ?? 1,
      businessUrl: settings.business_url || 'https://www.yelp.com/biz/rise-up-roofing-and-construction-oceanside-2',
      lastSyncedAt: settings.last_synced_at || null,
      lastSyncStatus: settings.last_sync_status || null,
      lastSyncCount: settings.last_sync_count ?? 0,
      lastError: settings.last_error || null,
      apiKeyMasked: maskedKey,
    });
  } catch (err: any) {
    console.error('[api/admin/yelp-sync GET]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error loading Yelp sync status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {}

    // Allow updating API key or business ID via POST
    if (body?.apiKey || body?.businessId) {
      await saveYelpAuthSettings({
        ...(body.apiKey ? { api_key: body.apiKey.trim() } : {}),
        ...(body.businessId ? { business_id: body.businessId.trim() } : {}),
      });
    }

    const result = await syncYelpReviews();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[api/admin/yelp-sync POST]', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to trigger Yelp sync' },
      { status: 500 }
    );
  }
}

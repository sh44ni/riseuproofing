import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { getGoogleAuthSettings, syncGoogleReviews } from '@/lib/google-reviews';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    const settings = await getGoogleAuthSettings();
    const isConnected = Boolean(settings?.refresh_token);

    return NextResponse.json({
      isConnected,
      businessName: settings?.business_name || null,
      accountName: settings?.account_name || null,
      locationName: settings?.location_name || null,
      lastSyncedAt: settings?.last_synced_at || null,
      lastSyncStatus: settings?.last_sync_status || null,
      lastSyncCount: settings?.last_sync_count ?? 0,
      lastError: settings?.last_error || null,
    });
  } catch (err: any) {
    console.error('[api/admin/google-sync GET]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error loading Google sync status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    const result = await syncGoogleReviews();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[api/admin/google-sync POST]', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}

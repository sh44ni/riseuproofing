import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleAuthSettings, syncGoogleReviews } from '@/lib/google-reviews';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'riseuprac.com';
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  if (error) {
    console.error('[Google OAuth Callback Error]', error);
    return NextResponse.redirect(`${baseUrl}/admin/reviews?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/admin/reviews?google_error=${encodeURIComponent('No authorization code returned from Google')}`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/admin/google-callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/admin/reviews?google_error=${encodeURIComponent('OAuth credentials missing in environment')}`
    );
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || (!tokenData.refresh_token && !tokenData.access_token)) {
      const msg = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code';
      return NextResponse.redirect(
        `${baseUrl}/admin/reviews?google_error=${encodeURIComponent(msg)}`
      );
    }

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    // Save tokens
    await saveGoogleAuthSettings({
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
      access_token: tokenData.access_token,
      expires_at: expiresAt,
      last_sync_status: 'pending',
      last_error: null,
    });

    // Run initial reviews synchronization immediately
    const syncResult = await syncGoogleReviews();

    return NextResponse.redirect(
      `${baseUrl}/admin/reviews?google_connected=success&synced=${syncResult.syncedCount}`
    );
  } catch (err: any) {
    console.error('[google-callback exception]', err);
    return NextResponse.redirect(
      `${baseUrl}/admin/reviews?google_error=${encodeURIComponent(err?.message || 'Server error during authentication')}`
    );
  }
}

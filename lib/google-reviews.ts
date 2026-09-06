import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface GoogleAuthSettings {
  refresh_token: string;
  access_token?: string;
  expires_at?: number; // epoch ms
  account_name?: string; // e.g. "accounts/1029384756..."
  location_name?: string; // e.g. "locations/987654321..."
  business_name?: string;
  last_synced_at?: string;
  last_sync_status?: 'success' | 'error' | 'pending';
  last_sync_count?: number;
  last_error?: string | null;
}

export interface GoogleReviewItem {
  reviewId: string;
  reviewer?: {
    displayName?: string;
    profilePhotoUrl?: string;
  };
  starRating?: string | number; // 'FIVE' | 'FOUR' | etc. or 5
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: {
    comment?: string;
    updateTime?: string;
  };
}

export function parseStarRating(rating?: string | number): number {
  if (typeof rating === 'number') return rating;
  if (!rating) return 5;
  switch (rating.toUpperCase()) {
    case 'FIVE':
      return 5;
    case 'FOUR':
      return 4;
    case 'THREE':
      return 3;
    case 'TWO':
      return 2;
    case 'ONE':
      return 1;
    default: {
      const parsed = parseInt(rating, 10);
      return isNaN(parsed) ? 5 : parsed;
    }
  }
}

/**
 * Retrieve current Google Auth settings from Neon DB
 */
export async function getGoogleAuthSettings(): Promise<GoogleAuthSettings | null> {
  const rows = await query<{ value: GoogleAuthSettings }>(
    `SELECT value FROM app_settings WHERE key = 'google_reviews_auth'`
  );
  return rows[0]?.value || null;
}

/**
 * Save Google Auth settings to Neon DB
 */
export async function saveGoogleAuthSettings(settings: Partial<GoogleAuthSettings>): Promise<void> {
  const current = (await getGoogleAuthSettings()) || ({} as GoogleAuthSettings);
  const updated = { ...current, ...settings };

  await query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('google_reviews_auth', $1, NOW())
     ON CONFLICT (key) DO UPDATE 
     SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(updated)]
  );
}

/**
 * Get or refresh a valid Google access token
 */
export async function getValidAccessToken(): Promise<string> {
  const settings = await getGoogleAuthSettings();
  if (!settings?.refresh_token) {
    throw new Error('Google OAuth is not connected. Please connect your Google account in the admin panel.');
  }

  const now = Date.now();
  // If access token is still valid for at least 5 minutes, use it
  if (settings.access_token && settings.expires_at && settings.expires_at > now + 300_000) {
    return settings.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in environment.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: settings.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const errorMsg = data.error_description || data.error || 'Failed to refresh Google access token';
    await saveGoogleAuthSettings({
      last_sync_status: 'error',
      last_error: errorMsg,
    });
    throw new Error(errorMsg);
  }

  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  await saveGoogleAuthSettings({
    access_token: data.access_token,
    expires_at: expiresAt,
    last_error: null,
  });

  return data.access_token;
}

/**
 * Discover Google Business Account & Location
 */
export async function discoverGoogleBusinessLocation(
  accessToken: string
): Promise<{ accountName: string; locationName: string; businessName?: string }> {
  const settings = await getGoogleAuthSettings();
  if (settings?.account_name && settings?.location_name) {
    return {
      accountName: settings.account_name,
      locationName: settings.location_name,
      businessName: settings.business_name,
    };
  }

  // 1. Fetch Accounts
  const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const accData = await accRes.json();
  if (!accRes.ok || !accData.accounts?.length) {
    throw new Error(
      `Failed to list Google Business accounts: ${accData.error?.message || JSON.stringify(accData)}`
    );
  }

  const account = accData.accounts[0];
  const accountName = account.name; // e.g. "accounts/12345"

  // 2. Fetch Locations under this account
  const locRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,metadata`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const locData = await locRes.json();
  if (!locRes.ok || !locData.locations?.length) {
    throw new Error(
      `Failed to list Google Business locations for account ${accountName}: ${locData.error?.message || JSON.stringify(locData)}`
    );
  }

  const location = locData.locations[0];
  const locationName = location.name; // e.g. "locations/67890"
  const businessName = location.title || 'Rise Up Roofing and Construction Inc';

  await saveGoogleAuthSettings({
    account_name: accountName,
    location_name: locationName,
    business_name: businessName,
  });

  return { accountName, locationName, businessName };
}

/**
 * Fetch all reviews from Google Business Profile API
 */
export async function fetchGoogleBusinessReviews(
  accessToken: string,
  accountName: string,
  locationName: string
): Promise<GoogleReviewItem[]> {
  const allReviews: GoogleReviewItem[] = [];
  let pageToken: string | undefined = undefined;

  // locationName can be full path or just locationId
  const locEndpoint = locationName.startsWith('locations/')
    ? `${accountName}/${locationName}/reviews`
    : `${accountName}/locations/${locationName}/reviews`;

  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${locEndpoint}`);
    url.searchParams.set('pageSize', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Error fetching Google reviews: ${data.error?.message || JSON.stringify(data)}`
      );
    }

    if (data.reviews && Array.isArray(data.reviews)) {
      allReviews.push(...data.reviews);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return allReviews;
}

/**
 * Main weekly or on-demand synchronizer
 */
export async function syncGoogleReviews(): Promise<{
  ok: boolean;
  syncedCount: number;
  message: string;
  error?: string;
}> {
  try {
    const accessToken = await getValidAccessToken();
    const { accountName, locationName, businessName } =
      await discoverGoogleBusinessLocation(accessToken);

    const googleReviews = await fetchGoogleBusinessReviews(
      accessToken,
      accountName,
      locationName
    );

    let syncedCount = 0;

    for (const rev of googleReviews) {
      const reviewId = rev.reviewId;
      if (!reviewId) continue;

      const customerName = rev.reviewer?.displayName?.trim() || 'Google Reviewer';
      const rating = parseStarRating(rev.starRating);
      const feedback = rev.comment?.trim() || '';
      const authorPhoto = rev.reviewer?.profilePhotoUrl || null;
      const originalTime = rev.createTime ? new Date(rev.createTime) : new Date();
      const ownerReply = rev.reviewReply?.comment?.trim() || null;

      await query(
        `INSERT INTO reviews (
          customer_name,
          customer_city,
          rating,
          feedback,
          service_type,
          source,
          status,
          google_review_id,
          author_photo,
          original_time,
          owner_reply,
          google_clicked,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'google', 'published', $6, $7, $8, $9, true, $8, NOW())
        ON CONFLICT (google_review_id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          rating = EXCLUDED.rating,
          feedback = EXCLUDED.feedback,
          author_photo = EXCLUDED.author_photo,
          original_time = EXCLUDED.original_time,
          owner_reply = EXCLUDED.owner_reply,
          updated_at = NOW()`,
        [
          customerName,
          'San Diego County',
          rating,
          feedback,
          'Roofing & Construction',
          reviewId,
          authorPhoto,
          originalTime,
          ownerReply,
        ]
      );

      syncedCount++;
    }

    // Save successful sync metadata
    const nowIso = new Date().toISOString();
    await saveGoogleAuthSettings({
      business_name: businessName,
      last_synced_at: nowIso,
      last_sync_status: 'success',
      last_sync_count: syncedCount,
      last_error: null,
    });

    // Revalidate Next.js cache so the public pages immediately reflect fresh reviews
    try {
      revalidatePath('/');
      revalidatePath('/reviews');
    } catch {
      // Revalidation outside request lifecycle will gracefully fall back
    }

    return {
      ok: true,
      syncedCount,
      message: `Successfully synchronized ${syncedCount} reviews from Google Business Profile.`,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown error syncing Google reviews';
    console.error('[syncGoogleReviews error]', err);

    await saveGoogleAuthSettings({
      last_sync_status: 'error',
      last_error: errorMsg,
    });

    return {
      ok: false,
      syncedCount: 0,
      message: errorMsg,
      error: errorMsg,
    };
  }
}

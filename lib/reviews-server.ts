import { query } from '@/lib/db';
import { reviews, type EnrichedReview } from '@/lib/data/reviews';
import { GOOGLE_REVIEWS_URL, YELP_REVIEWS_URL } from '@/lib/utils';
import type { YelpAuthSettings } from '@/lib/yelp-reviews';

export interface ReviewStats {
  totalCount: number;
  averageRating: number;
  googleCount: number;
  yelpCount: number;
  yelpTotalCount: number;
  yelpRating: number;
  googleRating: number;
  yelpUrl: string;
  googleUrl: string;
}

/**
 * Fetch published reviews from Neon database with graceful fallback to curated defaults
 */
export async function getPublicReviews(): Promise<EnrichedReview[]> {
  try {
    const rows = await query<{
      id: string;
      customer_name: string;
      customer_city: string | null;
      rating: number;
      feedback: string | null;
      service_type: string | null;
      source: string | null;
      google_review_id: string | null;
      yelp_review_id: string | null;
      yelp_review_url: string | null;
      author_photo: string | null;
      original_time: string | null;
      owner_reply: string | null;
      created_at: string | null;
    }>(
      `SELECT customer_name, customer_city, rating, feedback, service_type, source,
              google_review_id, yelp_review_id, yelp_review_url, author_photo, original_time, owner_reply, created_at
       FROM reviews
       WHERE status = 'published'
       ORDER BY original_time DESC NULLS LAST, created_at DESC`
    );

    if (!rows || rows.length === 0) {
      return reviews;
    }

    const dbReviews: EnrichedReview[] = rows.map((r) => {
      const isYelp = r.source === 'yelp' || Boolean(r.yelp_review_id);
      const dateSource = r.original_time || r.created_at;
      let formattedDate = 'Recent';
      if (dateSource) {
        try {
          formattedDate = new Date(dateSource).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
        } catch {}
      }

      return {
        author: r.customer_name || 'Verified Homeowner',
        location: r.customer_city ? `${r.customer_city}, CA` : 'San Diego County, CA',
        neighborhood: r.customer_city ? `${r.customer_city}, CA` : 'North County, San Diego',
        projectType: r.service_type || 'Roofing & Construction',
        rating: r.rating || 5,
        text: r.feedback || 'Outstanding roofing and construction craftsmanship. Prompt, clean, and reliable service.',
        source: isYelp ? 'yelp' : 'google',
        serviceCategory: (r.service_type || 'residential').toLowerCase(),
        date: formattedDate,
        authorPhoto: r.author_photo || null,
        ownerReply: r.owner_reply || null,
        reviewUrl: r.yelp_review_url || (isYelp ? 'https://www.yelp.com/biz/rise-up-roofing-and-construction-oceanside-2' : null),
      };
    });

    return dbReviews;
  } catch (err) {
    console.warn('[getPublicReviews] Database query failed, using static reviews fallback:', err);
    return reviews;
  }
}

/**
 * Fetch aggregated review counts and ratings dynamically from Neon DB and Yelp metadata
 */
export async function getReviewStats(): Promise<ReviewStats> {
  try {
    const statsQuery = query<{
      source: string | null;
      cnt: string;
      avg_rating: string;
    }>(
      `SELECT COALESCE(source, 'direct') as source, COUNT(*)::text as cnt, AVG(rating)::text as avg_rating
       FROM reviews
       WHERE status = 'published'
       GROUP BY source`
    );

    const yelpSettingsQuery = query<{ value: YelpAuthSettings }>(
      `SELECT value FROM app_settings WHERE key = 'yelp_reviews_auth'`
    );

    const [statsRows, yelpRows] = await Promise.all([statsQuery, yelpSettingsQuery]);

    let totalCount = 0;
    let sumRating = 0;
    let googleCount = 0;
    let yelpCount = 0;
    let googleRatingSum = 0;

    if (statsRows && statsRows.length > 0) {
      for (const row of statsRows) {
        const count = parseInt(row.cnt, 10) || 0;
        const avg = parseFloat(row.avg_rating) || 5.0;
        totalCount += count;
        sumRating += avg * count;

        if (row.source === 'google') {
          googleCount = count;
          googleRatingSum = avg * count;
        } else if (row.source === 'yelp') {
          yelpCount = count;
        }
      }
    }

    const yelpSettings = yelpRows?.[0]?.value || {};
    const yelpTotalCount = yelpSettings.business_review_count || (yelpCount > 0 ? yelpCount : 1);
    const yelpRating = yelpSettings.business_rating ? Number(yelpSettings.business_rating.toFixed(1)) : 5.0;
    const yelpUrl = yelpSettings.business_url || YELP_REVIEWS_URL;

    const averageRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : 5.0;
    const googleRating = googleCount > 0 ? Number((googleRatingSum / googleCount).toFixed(1)) : 5.0;

    return {
      totalCount: totalCount > 0 ? totalCount : reviews.length,
      averageRating: averageRating || 5.0,
      googleCount: googleCount > 0 ? googleCount : reviews.filter((r) => r.source === 'google').length,
      yelpCount: yelpCount > 0 ? yelpCount : reviews.filter((r) => r.source === 'yelp').length,
      yelpTotalCount,
      yelpRating,
      googleRating,
      yelpUrl,
      googleUrl: GOOGLE_REVIEWS_URL,
    };
  } catch (err) {
    console.warn('[getReviewStats] Database query failed, using static reviews fallback:', err);
    return {
      totalCount: reviews.length,
      averageRating: 5.0,
      googleCount: reviews.filter((r) => r.source === 'google').length,
      yelpCount: reviews.filter((r) => r.source === 'yelp').length,
      yelpTotalCount: 1,
      yelpRating: 5.0,
      googleRating: 5.0,
      yelpUrl: YELP_REVIEWS_URL,
      googleUrl: GOOGLE_REVIEWS_URL,
    };
  }
}


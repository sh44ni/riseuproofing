import { query } from '@/lib/db';
import { reviews, type EnrichedReview } from '@/lib/data/reviews';

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
      author_photo: string | null;
      original_time: string | null;
      owner_reply: string | null;
      created_at: string | null;
    }>(
      `SELECT customer_name, customer_city, rating, feedback, service_type, source,
              google_review_id, author_photo, original_time, owner_reply, created_at
       FROM reviews
       WHERE status = 'published'
       ORDER BY original_time DESC NULLS LAST, created_at DESC`
    );

    if (!rows || rows.length === 0) {
      return reviews;
    }

    const dbReviews: EnrichedReview[] = rows.map((r) => {
      const isYelp = r.source === 'yelp';
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
      };
    });

    return dbReviews;
  } catch (err) {
    console.warn('[getPublicReviews] Database query failed, using static reviews fallback:', err);
    return reviews;
  }
}

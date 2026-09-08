import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const rating = searchParams.get('rating');
  const search = searchParams.get('search');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }

  if (rating && rating !== 'all') {
    if (rating === '5') {
      conditions.push(`r.rating = 5`);
    } else if (rating === '4') {
      conditions.push(`r.rating = 4`);
    } else if (rating === 'below_4') {
      conditions.push(`r.rating < 4`);
    }
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = `$${params.length}`;
    conditions.push(`(
      LOWER(r.customer_name) LIKE ${pIdx} OR
      LOWER(COALESCE(r.customer_city, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(r.feedback, '')) LIKE ${pIdx} OR
      LOWER(COALESCE(r.service_type, '')) LIKE ${pIdx}
    )`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT r.*, 
            l.phone as customer_phone, l.email as customer_email,
            j.job_number
     FROM reviews r
     LEFT JOIN leads l ON r.lead_id = l.id
     LEFT JOIN jobs j ON r.job_id = j.id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  );

  // Calculate statistics across all reviews
  const [stats] = await query<{
    total_reviews: string;
    avg_rating: string;
    five_star_count: string;
    escalated_count: string;
    google_clicked_count: string;
  }>(`
    SELECT 
      COUNT(*) as total_reviews,
      ROUND(COALESCE(AVG(rating), 5.0)::numeric, 1) as avg_rating,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
      COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated_count,
      COUNT(CASE WHEN google_clicked = true THEN 1 END) as google_clicked_count
    FROM reviews
  `);

  const total = parseInt(stats?.total_reviews || '0', 10);
  const fiveStars = parseInt(stats?.five_star_count || '0', 10);
  const fiveStarPct = total > 0 ? Math.round((fiveStars / total) * 100) : 100;

  return NextResponse.json({
    reviews: rows,
    summary: {
      totalReviews: total,
      avgRating: parseFloat(stats?.avg_rating || '5.0'),
      fiveStarPct,
      escalatedCount: parseInt(stats?.escalated_count || '0', 10),
      googleClickedCount: parseInt(stats?.google_clicked_count || '0', 10),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      leadId,
      jobId,
      customerName,
      customerCity = 'San Diego',
      serviceType = 'Roof Replacement',
      initialRating = 5,
      source = 'sms_request',
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Generate cryptographically secure unique token
    const token = `REV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Resolve client_id
    let clientId: number | null = null;
    if (leadId) {
      const l = await query<any>('SELECT client_id FROM leads WHERE id = $1', [parseInt(leadId, 10)]);
      if (l[0]?.client_id) clientId = Number(l[0].client_id);
    }
    if (!clientId && jobId) {
      const j = await query<any>('SELECT client_id FROM jobs WHERE id = $1', [parseInt(jobId, 10)]);
      if (j[0]?.client_id) clientId = Number(j[0].client_id);
    }

    const rows = await query<any>(
      `INSERT INTO reviews (
        lead_id, job_id, client_id, customer_name, customer_city, rating,
        service_type, source, status, review_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      RETURNING *`,
      [
        leadId ? parseInt(leadId, 10) : null,
        jobId ? parseInt(jobId, 10) : null,
        clientId,
        customerName,
        customerCity,
        initialRating,
        serviceType,
        source,
        token,
      ]
    );

    const createdReview = rows[0];

    // Log to activities timeline if leadId is linked
    if (leadId) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, $2, 'message', $3, $4, $5)`,
        [
          parseInt(leadId, 10),
          clientId,
          `Review Request Dispatched to ${customerName}`,
          `Sent automated review request link (/review/${token}).`,
          'Reputation Engine',
        ]
      );
    }

    return NextResponse.json({
      ok: true,
      review: createdReview,
      reviewLink: `/review/${token}`,
    });
  } catch (err) {
    console.error('[api/admin/reviews POST]', err);
    return NextResponse.json({ error: 'Server error generating review request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, status, feedback } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [parseInt(id, 10)];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (feedback !== undefined) {
      params.push(feedback);
      updates.push(`feedback = $${params.length}`);
    }

    const rows = await query<any>(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    return NextResponse.json({ ok: true, review: rows[0] });
  } catch (err) {
    console.error('[api/admin/reviews PATCH]', err);
    return NextResponse.json({ error: 'Server error updating review' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('reviews:manage');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM reviews WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}

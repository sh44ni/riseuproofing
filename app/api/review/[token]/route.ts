import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: 'Review token is required' }, { status: 400 });
  }

  const rows = await query<any>(
    `SELECT id, customer_name, customer_city, rating, feedback, service_type, status, google_clicked
     FROM reviews
     WHERE review_token = $1
     LIMIT 1`,
    [token]
  );

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Review request not found or link has expired' }, { status: 404 });
  }

  return NextResponse.json({ review: rows[0] });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: 'Review token is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { rating, feedback, googleClicked = false } = body;

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Valid rating between 1 and 5 is required' }, { status: 400 });
    }

    // Determine status & escalation
    let newStatus = 'pending';
    let isUrgentEscalation = false;

    if (numRating === 5) {
      newStatus = 'published';
    } else if (numRating < 4) {
      newStatus = 'escalated';
      isUrgentEscalation = true;
    }

    const rows = await query<any>(
      `UPDATE reviews
       SET rating = $1,
           feedback = $2,
           status = $3,
           google_clicked = $4,
           updated_at = NOW()
       WHERE review_token = $5
       RETURNING *`,
      [numRating, feedback || null, newStatus, !!googleClicked, token]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updatedReview = rows[0];

    // If < 4 stars, create high priority escalation task for management
    if (isUrgentEscalation && updatedReview.lead_id) {
      await query(
        `INSERT INTO tasks (entity_type, entity_id, title, description, assigned_to, due_at, priority)
         VALUES ('lead', $1, $2, $3, 'Owner / Management', NOW() + INTERVAL '2 hours', 'urgent')`,
        [
          updatedReview.lead_id,
          `🚨 Unsatisfied Homeowner Follow-up (${numRating}★): ${updatedReview.customer_name}`,
          `Customer feedback: "${feedback || 'No comments left.'}". Call homeowner immediately to resolve concerns before public review.`,
        ]
      );

      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'escalation', $2, $3, 'Reputation Engine')`,
        [
          updatedReview.lead_id,
          `Private Homeowner Rating: ${numRating} / 5 Stars`,
          `Feedback: ${feedback || '(No comment provided)'}`,
        ]
      );
    } else if (numRating === 5 && updatedReview.lead_id) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'status_change', $2, $3, 'Reputation Engine')`,
        [
          updatedReview.lead_id,
          `5-Star Review Received from ${updatedReview.customer_name}!`,
          `Feedback: "${feedback || 'Great experience!'}". Customer redirected to Google Business Profile.`,
        ]
      );
    }

    return NextResponse.json({
      ok: true,
      message: numRating === 5
        ? 'Thank you for your 5-star review! Please confirm on Google to help our local roofing crew.'
        : 'Thank you for your honest feedback. Our owner will reach out directly to ensure complete satisfaction.',
      review: updatedReview,
    });
  } catch (err) {
    console.error('[api/review/[token] POST]', err);
    return NextResponse.json({ error: 'Server error recording review' }, { status: 500 });
  }
}

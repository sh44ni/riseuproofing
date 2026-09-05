import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('jobs:view');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('job_id');
  const phase = searchParams.get('phase');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const conditions: string[] = ['job_id = $1'];
  const params: unknown[] = [parseInt(jobId, 10)];

  if (phase && phase !== 'all') {
    params.push(phase);
    conditions.push(`phase = $${params.length}`);
  }

  const rows = await query<any>(
    `SELECT * FROM job_photos
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return NextResponse.json({ photos: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('photos:upload');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { jobId, phase = 'before', url, caption, uploadedBy = 'Field Crew' } = body;

    if (!jobId || !url) {
      return NextResponse.json({ error: 'Job ID and photo URL are required' }, { status: 400 });
    }

    const rows = await query<any>(
      `INSERT INTO job_photos (job_id, phase, url, caption, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parseInt(jobId, 10), phase, url, caption || null, uploadedBy]
    );

    // Also log an entry to the lead's activity timeline if lead exists
    const jobRows = await query<any>(`SELECT lead_id, job_number FROM jobs WHERE id = $1`, [jobId]);
    if (jobRows && jobRows.length > 0 && jobRows[0].lead_id) {
      await query(
        `INSERT INTO activities (entity_type, entity_id, activity_type, title, description, performed_by)
         VALUES ('lead', $1, 'note', $2, $3, $4)`,
        [
          jobRows[0].lead_id,
          `Photo Uploaded: ${phase.toUpperCase()} Phase`,
          caption || `Photo added to project documentation for ${jobRows[0].job_number}`,
          uploadedBy,
        ]
      );
    }

    return NextResponse.json({ ok: true, photo: rows[0] });
  } catch (err) {
    console.error('[api/admin/photos POST]', err);
    return NextResponse.json({ error: 'Server error saving photo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('photos:delete');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM job_photos WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}

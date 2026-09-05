import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || /^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Warranty certificate not found' }, { status: 404 });
  }

  const sql = `
    SELECT w.*, 
           j.job_number, j.customer_name, j.address, j.city, j.zip, 
           j.service_type, j.actual_end, j.scheduled_start,
           e.material_type, e.roof_squares, e.roof_pitch, e.stories
    FROM warranties w
    LEFT JOIN jobs j ON w.job_id = j.id
    LEFT JOIN estimates e ON j.estimate_id = e.id
    WHERE w.warranty_number = $1 OR w.access_token = $1
    LIMIT 1
  `;

  const rows = await query<any>(sql, [id]);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Warranty certificate not found' }, { status: 404 });
  }

  const warranty = rows[0];

  return NextResponse.json({
    warranty: {
      ...warranty,
      access_token: undefined, // Never expose secret access_token in response
    },
  });
}

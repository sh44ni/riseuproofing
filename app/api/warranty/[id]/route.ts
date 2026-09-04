import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Warranty identifier required' }, { status: 400 });
  }

  const isNumeric = /^\d+$/.test(id);
  const sql = `
    SELECT w.*, 
           j.job_number, j.customer_name, j.address, j.city, j.zip, 
           j.service_type, j.actual_end, j.scheduled_start,
           e.material_type, e.roof_squares, e.roof_pitch, e.stories
    FROM warranties w
    LEFT JOIN jobs j ON w.job_id = j.id
    LEFT JOIN estimates e ON j.estimate_id = e.id
    WHERE ${isNumeric ? 'w.id = $1 OR w.warranty_number = $1' : 'w.warranty_number = $1'}
    LIMIT 1
  `;

  const rows = await query<any>(sql, [isNumeric ? parseInt(id, 10) : id]);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Warranty certificate not found' }, { status: 404 });
  }

  return NextResponse.json({ warranty: rows[0] });
}

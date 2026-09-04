import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Inspection identifier required' }, { status: 400 });
  }

  const isNumeric = /^\d+$/.test(id);
  const sql = `
    SELECT i.*, 
           l.full_name as customer_name, l.phone as customer_phone, l.email as customer_email,
           l.address, l.zip, l.service_type, l.roof_type, l.roof_sqf, l.stories,
           j.job_number
    FROM inspections i
    LEFT JOIN leads l ON i.lead_id = l.id
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE ${isNumeric ? 'i.id = $1 OR i.inspection_number = $1' : 'i.inspection_number = $1'}
    LIMIT 1
  `;

  const rows = await query<any>(sql, [isNumeric ? parseInt(id, 10) : id]);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Roof inspection report not found' }, { status: 404 });
  }

  const inspection = rows[0];
  let parsedFindings = inspection.findings;
  if (typeof parsedFindings === 'string') {
    try {
      parsedFindings = JSON.parse(parsedFindings);
    } catch {
      parsedFindings = [];
    }
  }

  return NextResponse.json({
    inspection: {
      ...inspection,
      findings: parsedFindings,
    },
  });
}

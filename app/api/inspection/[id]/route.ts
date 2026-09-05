import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || /^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Roof inspection report not found' }, { status: 404 });
  }

  const tokenParam = req.nextUrl.searchParams.get('token') || req.headers.get('x-inspection-token');
  const isAdmin = await isAuthenticated();

  const sql = `
    SELECT i.*, 
           l.full_name as customer_name, l.phone as customer_phone, l.email as customer_email,
           l.address, l.zip, l.service_type, l.roof_type, l.roof_sqf, l.stories,
           j.job_number
    FROM inspections i
    LEFT JOIN leads l ON i.lead_id = l.id
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE i.inspection_number = $1 OR i.access_token = $1
    LIMIT 1
  `;

  const rows = await query<any>(sql, [id]);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Roof inspection report not found' }, { status: 404 });
  }

  const inspection = rows[0];
  const hasFullAccess = isAdmin || (inspection.access_token && tokenParam === inspection.access_token) || id === inspection.access_token;

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
      customer_phone: hasFullAccess ? inspection.customer_phone : null,
      customer_email: hasFullAccess ? inspection.customer_email : null,
      access_token: undefined, // Never expose secret access_token in response
      findings: parsedFindings,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function generateCsv(headers: string[], rows: any[], keys: string[]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map(row =>
    keys.map(k => escapeCsvField(row[k])).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'leads';
  const dateStr = new Date().toISOString().slice(0, 10);

  let csv = '';
  let filename = `rise-up-${type}-${dateStr}.csv`;

  if (type === 'leads') {
    const rows = await query<any>(
      `SELECT id, full_name, phone, email, address, city, zip, service_type, 
              roof_type, roof_sqf, stories, hoa, lead_score, priority, status, 
              lead_source, created_at 
       FROM leads 
       ORDER BY created_at DESC`
    );
    const headers = [
      'Lead ID', 'Full Name', 'Phone', 'Email', 'Address', 'City', 'Zip',
      'Service Type', 'Roof Type', 'Roof SQF', 'Stories', 'HOA', 'Lead Score',
      'Priority', 'Status', 'Lead Source', 'Created At'
    ];
    const keys = [
      'id', 'full_name', 'phone', 'email', 'address', 'city', 'zip',
      'service_type', 'roof_type', 'roof_sqf', 'stories', 'hoa', 'lead_score',
      'priority', 'status', 'lead_source', 'created_at'
    ];
    csv = generateCsv(headers, rows, keys);
  } else if (type === 'jobs') {
    const rows = await query<any>(
      `SELECT job_number, customer_name, customer_phone, address, city, service_type,
              status as stage, contract_value, deposit_amount, final_amount,
              scheduled_start, created_at
       FROM jobs
       ORDER BY created_at DESC`
    );
    const headers = [
      'Job Number', 'Customer Name', 'Phone', 'Address', 'City', 'Service Type',
      'Stage', 'Contract Value ($)', 'Deposit ($)', 'Final ($)', 'Scheduled Start', 'Created At'
    ];
    const keys = [
      'job_number', 'customer_name', 'customer_phone', 'address', 'city', 'service_type',
      'stage', 'contract_value', 'deposit_amount', 'final_amount', 'scheduled_start', 'created_at'
    ];
    csv = generateCsv(headers, rows, keys);
  } else if (type === 'estimates') {
    const rows = await query<any>(
      `SELECT estimate_number, customer_name, customer_phone, customer_address, 
              service_type, material_name, roof_squares, pitch, total_cost,
              monthly_financing, status, created_at
       FROM estimates
       ORDER BY created_at DESC`
    );
    const headers = [
      'Estimate Number', 'Customer Name', 'Phone', 'Address', 'Service Type',
      'Material', 'Roof Squares', 'Pitch', 'Total Estimate ($)', 'Financing ($/mo)', 'Status', 'Created At'
    ];
    const keys = [
      'estimate_number', 'customer_name', 'customer_phone', 'customer_address',
      'service_type', 'material_name', 'roof_squares', 'pitch', 'total_cost',
      'monthly_financing', 'status', 'created_at'
    ];
    csv = generateCsv(headers, rows, keys);
  } else if (type === 'finances') {
    const rows = await query<any>(
      `SELECT i.invoice_number, j.job_number, j.customer_name, i.milestone_title, 
              i.amount, i.status, i.due_date, i.paid_at, i.created_at
       FROM invoices i
       LEFT JOIN jobs j ON i.job_id = j.id
       ORDER BY i.created_at DESC`
    );
    const headers = [
      'Invoice #', 'Job #', 'Customer Name', 'Milestone Stage',
      'Amount ($)', 'Payment Status', 'Due Date', 'Paid Date', 'Created At'
    ];
    const keys = [
      'invoice_number', 'job_number', 'customer_name', 'milestone_title',
      'amount', 'status', 'due_date', 'paid_at', 'created_at'
    ];
    csv = generateCsv(headers, rows, keys);
  } else if (type === 'inspections') {
    const rows = await query<any>(
      `SELECT i.inspection_number, l.full_name as customer_name, l.address, 
              i.inspector_name, i.inspection_date, i.roof_health_score, 
              i.urgent_action_required, i.estimated_remaining_years, i.notes
       FROM inspections i
       LEFT JOIN leads l ON i.lead_id = l.id
       ORDER BY i.inspection_date DESC`
    );
    const headers = [
      'Inspection #', 'Customer Name', 'Address', 'Inspector',
      'Inspection Date', 'Roof Health Score (%)', 'Urgent Action Required',
      'Est. Remaining Years', 'Notes'
    ];
    const keys = [
      'inspection_number', 'customer_name', 'address', 'inspector_name',
      'inspection_date', 'roof_health_score', 'urgent_action_required',
      'estimated_remaining_years', 'notes'
    ];
    csv = generateCsv(headers, rows, keys);
  } else if (type === 'reviews') {
    const rows = await query<any>(
      `SELECT customer_name, customer_city, service_type, rating, feedback,
              source, status, google_clicked, created_at
       FROM reviews
       ORDER BY created_at DESC`
    );
    const headers = [
      'Customer Name', 'City', 'Service Type', 'Rating (1-5)', 'Feedback Text',
      'Source Channel', 'Status', 'Confirmed on Google', 'Date Submitted'
    ];
    const keys = [
      'customer_name', 'customer_city', 'service_type', 'rating', 'feedback',
      'source', 'status', 'google_clicked', 'created_at'
    ];
    csv = generateCsv(headers, rows, keys);
  } else {
    return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

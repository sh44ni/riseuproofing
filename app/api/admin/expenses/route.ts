import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('finances:view_expenses');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('job_id');

  let sql = `SELECT * FROM job_expenses`;
  const params: unknown[] = [];

  if (jobId) {
    params.push(parseInt(jobId, 10));
    sql += ` WHERE job_id = $1`;
  }

  sql += ` ORDER BY expense_date DESC, created_at DESC`;

  const rows = await query<any>(sql, params);
  const total = rows.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return NextResponse.json({ expenses: rows, total });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('finances:manage_expenses');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      jobId,
      category,
      vendor,
      amount,
      invoiceReceiptNumber,
      expenseDate,
      notes,
    } = body;

    if (!jobId || !category || !vendor || !amount) {
      return NextResponse.json(
        { error: 'Job ID, category, vendor, and amount are required' },
        { status: 400 }
      );
    }

    const rows = await query<any>(
      `INSERT INTO job_expenses (
        job_id, category, vendor, amount, invoice_receipt_number, expense_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        parseInt(jobId, 10),
        category,
        vendor,
        Number(amount),
        invoiceReceiptNumber ?? null,
        expenseDate || new Date().toISOString().slice(0, 10),
        notes ?? null,
      ]
    );

    return NextResponse.json({ ok: true, expense: rows[0] });
  } catch (err) {
    console.error('[api/admin/expenses POST]', err);
    return NextResponse.json({ error: 'Server error logging expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('finances:manage_expenses');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }

  await query(`DELETE FROM job_expenses WHERE id = $1`, [parseInt(id, 10)]);
  return NextResponse.json({ ok: true });
}

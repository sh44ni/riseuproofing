import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('finances:view_invoices');
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const jobId = searchParams.get('job_id');

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    if (status === 'overdue') {
      conditions.push(`(i.status = 'overdue' OR (i.status = 'pending' AND i.due_date < CURRENT_DATE))`);
    } else {
      params.push(status);
      conditions.push(`i.status = $${params.length}`);
    }
  }

  if (jobId) {
    params.push(parseInt(jobId, 10));
    conditions.push(`i.job_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any>(
    `SELECT 
       i.*, 
       j.job_number, 
       j.customer_name, 
       j.customer_phone, 
       j.address, 
       j.city, 
       j.lead_id, 
       COALESCE(i.client_id, j.client_id) as client_id,
       c.source_type as client_source_type,
       c.lead_source_detail as client_source_detail,
       c.client_since,
       u_acq.name as acquired_by_name,
       u_acq.role as acquired_by_role,
       u_acq.avatar_url as acquired_by_avatar
     FROM invoices i
     LEFT JOIN jobs j ON i.job_id = j.id
     LEFT JOIN clients c ON COALESCE(i.client_id, j.client_id) = c.id
     LEFT JOIN users u_acq ON c.acquired_by_user_id = u_acq.id
     ${where}
     ORDER BY i.due_date ASC, i.created_at DESC`,
    params
  );

  return NextResponse.json({ invoices: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('finances:create_invoices');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      generateMilestones,
      jobId,
      estimateId,
      milestoneName,
      amount,
      dueDate,
      notes,
    } = body;

    const year = new Date().getFullYear();

    // Auto-generate CSLB-compliant 4-milestone schedule
    if (generateMilestones && jobId) {
      const jobRows = await query<any>(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
      if (!jobRows || jobRows.length === 0) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      const job = jobRows[0];
      const contractValue = Number(job.contract_value);

      // CSLB § 7159 Rule: Down payment capped at 10% or $1,000, whichever is less
      const depositAmount = Math.min(1000, Math.round(contractValue * 0.10));
      const deliveryAmount = Math.round(contractValue * 0.40);
      const dryinAmount = Math.round(contractValue * 0.40);
      const finalAmount = Math.max(0, contractValue - (depositAmount + deliveryAmount + dryinAmount));

      const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM invoices`);
      let seq = parseInt(countRes[0]?.count ?? '0', 10);

      const today = new Date();
      const addDays = (d: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        return date.toISOString().slice(0, 10);
      };

      const milestones = [
        { name: 'Deposit (CSLB Compliant)', amount: depositAmount, due: addDays(0) },
        { name: 'Material Delivery & Tear-off', amount: deliveryAmount, due: addDays(7) },
        { name: 'Substantial Completion / Dry-In', amount: dryinAmount, due: addDays(14) },
        { name: 'Final City Inspection Passed', amount: finalAmount, due: addDays(21) },
      ];

      const createdInvoices = [];
      const jobClientId = job.client_id ? Number(job.client_id) : null;
      for (const m of milestones) {
        seq += 1;
        const invNumber = `INV-${year}-${String(seq).padStart(4, '0')}`;
        const res = await query<any>(
          `INSERT INTO invoices (job_id, estimate_id, client_id, invoice_number, milestone_name, amount, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING *`,
          [job.id, job.estimate_id, jobClientId, invNumber, m.name, m.amount, m.due]
        );
        createdInvoices.push(res[0]);
      }

      return NextResponse.json({ ok: true, invoices: createdInvoices });
    }

    // Single custom invoice
    if (!amount || !dueDate) {
      return NextResponse.json({ error: 'Amount and due date are required' }, { status: 400 });
    }

    let resolvedClientId: number | null = null;
    if (jobId) {
      const j = await query<any>('SELECT client_id FROM jobs WHERE id = $1', [parseInt(jobId, 10)]);
      if (j[0]?.client_id) resolvedClientId = Number(j[0].client_id);
    }
    if (!resolvedClientId && estimateId) {
      const e = await query<any>('SELECT client_id FROM estimates WHERE id = $1', [parseInt(estimateId, 10)]);
      if (e[0]?.client_id) resolvedClientId = Number(e[0].client_id);
    }

    const countRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM invoices`);
    const seq = String(parseInt(countRes[0]?.count ?? '0', 10) + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${seq}`;

    const rows = await query<any>(
      `INSERT INTO invoices (
        job_id, estimate_id, client_id, invoice_number, milestone_name, amount, due_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [
        jobId ? parseInt(jobId, 10) : null,
        estimateId ? parseInt(estimateId, 10) : null,
        resolvedClientId,
        invoiceNumber,
        milestoneName || 'Payment Milestone',
        Number(amount),
        dueDate,
        notes ?? null,
      ]
    );

    return NextResponse.json({ ok: true, invoice: rows[0] });
  } catch (err) {
    console.error('[api/admin/invoices POST]', err);
    return NextResponse.json({ error: 'Server error creating invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('finances:record_payment');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, status, paymentMethod, transactionId, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);

      if (status === 'paid') {
        updates.push(`paid_at = NOW()`);
      }
    }

    if (paymentMethod) {
      params.push(paymentMethod);
      updates.push(`payment_method = $${params.length}`);
    }

    if (transactionId) {
      params.push(transactionId);
      updates.push(`transaction_id = $${params.length}`);
    }

    if (notes) {
      params.push(notes);
      updates.push(`notes = $${params.length}`);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<any>(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    const inv = res[0];

    // If marked paid, log to lead timeline if linked and recalculate client stats
    if (status === 'paid' && inv) {
      let resolvedClientId = inv.client_id ? Number(inv.client_id) : null;

      const jobRows = await query<any>(`SELECT lead_id, client_id, job_number FROM jobs WHERE id = $1`, [inv.job_id]);
      if (jobRows && jobRows.length > 0) {
        if (!resolvedClientId && jobRows[0].client_id) {
          resolvedClientId = Number(jobRows[0].client_id);
          await query('UPDATE invoices SET client_id = $1 WHERE id = $2', [resolvedClientId, inv.id]);
        }

        if (jobRows[0].lead_id) {
          await query(
            `INSERT INTO activities (entity_type, entity_id, client_id, activity_type, title, description, performed_by)
             VALUES ('lead', $1, $2, 'status_change', $3, $4, 'Billing')`,
            [
              jobRows[0].lead_id,
              resolvedClientId,
              `Payment Received: $${Number(inv.amount).toLocaleString()}`,
              `Paid for ${inv.milestone_name} (${inv.invoice_number}) via ${paymentMethod || 'Credit Card / Check'}`,
            ]
          );
        }
      }

      if (resolvedClientId) {
        const { recalculateClientStats } = await import('@/lib/crm-clients');
        await recalculateClientStats(resolvedClientId);
      }
    }

    return NextResponse.json({ ok: true, invoice: inv });
  } catch (err) {
    console.error('[api/admin/invoices PATCH]', err);
    return NextResponse.json({ error: 'Server error updating invoice' }, { status: 500 });
  }
}

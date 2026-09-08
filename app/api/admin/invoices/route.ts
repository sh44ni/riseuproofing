import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('finances.view');
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
  const auth = await requirePermission('finances.edit');
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      generateMilestones,
      jobId,
      milestoneName,
      amount,
      dueDate,
      notes,
    } = body;

    // Strict Rule: An invoice MUST strictly follow the Jobs Pipeline
    const parsedJobId = jobId ? parseInt(String(jobId), 10) : null;
    if (!parsedJobId || isNaN(parsedJobId)) {
      return NextResponse.json(
        { error: 'A valid roofing job from the jobs pipeline is required to create an invoice.' },
        { status: 400 }
      );
    }

    // Verify job exists
    const jobRows = await query<any>(`SELECT * FROM jobs WHERE id = $1`, [parsedJobId]);
    if (!jobRows || jobRows.length === 0) {
      return NextResponse.json({ error: 'Selected job not found in pipeline' }, { status: 404 });
    }
    const job = jobRows[0];

    // Strict Rule: Client MUST exist to create an invoice for
    let resolvedClientId = job.client_id ? Number(job.client_id) : null;
    if (!resolvedClientId) {
      const { findOrCreateClient } = await import('@/lib/crm-clients');
      const client = await findOrCreateClient({
        fullName: job.customer_name || 'Homeowner',
        phone: job.customer_phone,
        email: job.customer_email,
        address: job.address,
        city: job.city,
        zip: job.zip,
        serviceType: job.service_type,
        leadSource: 'jobs_pipeline_invoicing',
      });
      resolvedClientId = client.id;
      await query('UPDATE jobs SET client_id = $1 WHERE id = $2', [resolvedClientId, job.id]);
    }

    const year = new Date().getFullYear();

    // ── Mode A: Auto-generate CSLB-compliant 4-milestone schedule ──
    if (generateMilestones) {
      const contractValue = Number(job.contract_value) || 12000;

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
      for (const m of milestones) {
        seq += 1;
        const invNumber = `INV-${year}-${String(seq).padStart(4, '0')}`;
        const res = await query<any>(
          `INSERT INTO invoices (job_id, estimate_id, client_id, invoice_number, milestone_name, amount, due_date, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
           RETURNING *`,
          [
            job.id,
            job.estimate_id,
            resolvedClientId,
            invNumber,
            m.name,
            m.amount,
            m.due,
            `Auto-generated CSLB § 7159 milestone for ${job.job_number} (${job.customer_name})`,
          ]
        );
        createdInvoices.push(res[0]);
      }

      // Record activity on Client 360 timeline & Job audit
      await query(
        `INSERT INTO activities (
          entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
        ) VALUES (
          'client', $1, $1, 'invoice_created', $2, $3, $4, $5, $4
        )`,
        [
          resolvedClientId,
          `CSLB Milestone Billing Generated (4 Invoices)`,
          `${auth.user.name} generated CSLB-compliant 4-stage milestone invoices totaling $${contractValue.toLocaleString()} for Job ${job.job_number}.`,
          auth.user.name,
          auth.user.id,
        ]
      );

      if (job.lead_id) {
        await query(
          `INSERT INTO activities (
            entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
          ) VALUES (
            'lead', $1, $2, 'invoice_created', $3, $4, $5, $6, $5
          )`,
          [
            job.lead_id,
            resolvedClientId,
            `CSLB Milestone Billing Generated`,
            `4 milestone invoices created for Job ${job.job_number}.`,
            auth.user.name,
            auth.user.id,
          ]
        );
      }

      // Recalculate Client 360 financial stats
      const { recalculateClientStats } = await import('@/lib/crm-clients');
      await recalculateClientStats(resolvedClientId);

      return NextResponse.json({ ok: true, invoices: createdInvoices });
    }

    // ── Mode B: Single custom milestone / change order invoice ──
    if (!amount || Number(amount) <= 0 || !dueDate) {
      return NextResponse.json({ error: 'Valid amount and due date are required' }, { status: 400 });
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
        job.id,
        job.estimate_id,
        resolvedClientId,
        invoiceNumber,
        milestoneName || 'Payment Milestone',
        Number(amount),
        dueDate,
        notes ?? null,
      ]
    );

    const newInvoice = rows[0];

    // Record activity on Client 360 & Job audit
    await query(
      `INSERT INTO activities (
        entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
      ) VALUES (
        'client', $1, $1, 'invoice_created', $2, $3, $4, $5, $4
      )`,
      [
        resolvedClientId,
        `Invoice Issued: ${newInvoice.invoice_number} ($${Number(amount).toLocaleString()})`,
        `${auth.user.name} issued ${newInvoice.milestone_name} for Job ${job.job_number}.`,
        auth.user.name,
        auth.user.id,
      ]
    );

    if (job.lead_id) {
      await query(
        `INSERT INTO activities (
          entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
        ) VALUES (
          'lead', $1, $2, 'invoice_created', $3, $4, $5, $6, $5
        )`,
        [
          job.lead_id,
          resolvedClientId,
          `Invoice Issued: ${newInvoice.invoice_number}`,
          `${newInvoice.milestone_name} ($${Number(amount).toLocaleString()}) for Job ${job.job_number}`,
          auth.user.name,
          auth.user.id,
        ]
      );
    }

    // Recalculate Client 360 financial stats
    const { recalculateClientStats } = await import('@/lib/crm-clients');
    await recalculateClientStats(resolvedClientId);

    return NextResponse.json({ ok: true, invoice: newInvoice });
  } catch (err) {
    console.error('[api/admin/invoices POST]', err);
    return NextResponse.json({ error: 'Server error creating invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('finances.edit');
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

    // If marked paid, log to job, client, and lead timelines, and recalculate client stats
    if (status === 'paid' && inv) {
      let resolvedClientId = inv.client_id ? Number(inv.client_id) : null;

      const jobRows = await query<any>(`SELECT lead_id, client_id, job_number FROM jobs WHERE id = $1`, [inv.job_id]);
      const currentJob = jobRows && jobRows.length > 0 ? jobRows[0] : null;

      if (currentJob) {
        if (!resolvedClientId && currentJob.client_id) {
          resolvedClientId = Number(currentJob.client_id);
          await query('UPDATE invoices SET client_id = $1 WHERE id = $2', [resolvedClientId, inv.id]);
        }

        // 1. Log to Job timeline
        await query(
          `INSERT INTO activities (
            entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
          ) VALUES (
            'job', $1, $2, 'payment_received', $3, $4, $5, $6, $5
          )`,
          [
            inv.job_id,
            resolvedClientId,
            `Payment Received: $${Number(inv.amount).toLocaleString()}`,
            `Paid for ${inv.milestone_name} (${inv.invoice_number}) via ${paymentMethod || 'Credit Card / Check'}`,
            auth.user.name,
            auth.user.id,
          ]
        );

        // 2. Log to Client 360 timeline
        if (resolvedClientId) {
          await query(
            `INSERT INTO activities (
              entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
            ) VALUES (
              'client', $1, $1, 'payment_received', $2, $3, $4, $5, $4
            )`,
            [
              resolvedClientId,
              `Payment Received: $${Number(inv.amount).toLocaleString()}`,
              `Milestone payment of $${Number(inv.amount).toLocaleString()} collected for Job ${currentJob.job_number || inv.job_id} (${inv.milestone_name})`,
              auth.user.name,
              auth.user.id,
            ]
          );
        }

        // 3. Log to Lead timeline if linked
        if (currentJob.lead_id) {
          await query(
            `INSERT INTO activities (
              entity_type, entity_id, client_id, activity_type, title, description, performed_by, user_id, user_name
            ) VALUES (
              'lead', $1, $2, 'payment_received', $3, $4, $5, $6, $5
            )`,
            [
              currentJob.lead_id,
              resolvedClientId,
              `Payment Received: $${Number(inv.amount).toLocaleString()}`,
              `Paid for ${inv.milestone_name} (${inv.invoice_number}) via ${paymentMethod || 'Credit Card / Check'}`,
              auth.user.name,
              auth.user.id,
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

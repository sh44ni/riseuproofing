import { query } from './db';
import { findOrCreateClient, recalculateClientStats } from './crm-clients';

/**
 * Synchronizes a job with its linked lead and client records.
 * Ensures that every job has both a valid client_id and a valid lead_id.
 */
export async function syncLeadAndClientForJob(jobId: number): Promise<{
  jobId: number;
  leadId: number;
  clientId: number;
}> {
  const jobRows = await query<any>('SELECT * FROM jobs WHERE id = $1', [jobId]);
  if (!jobRows || jobRows.length === 0) {
    throw new Error(`Job #${jobId} not found`);
  }
  const job = jobRows[0];

  let clientId: number | null = job.client_id ? Number(job.client_id) : null;
  let leadId: number | null = job.lead_id ? Number(job.lead_id) : null;

  // 1. If leadId exists, verify its client_id
  if (leadId) {
    const leadRows = await query<any>('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadRows.length > 0) {
      const lead = leadRows[0];
      if (lead.client_id) {
        clientId = Number(lead.client_id);
      } else if (clientId) {
        await query('UPDATE leads SET client_id = $1 WHERE id = $2', [clientId, leadId]);
      } else {
        // Find or create client from lead details
        const client = await findOrCreateClient({
          fullName: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          city: lead.city,
          zip: lead.zip,
          serviceType: lead.service_type,
          leadSource: lead.lead_source || 'job_sync',
        });
        clientId = client.id;
        await query('UPDATE leads SET client_id = $1 WHERE id = $2', [clientId, leadId]);
      }
    }
  }

  // 2. If clientId is still missing, resolve from job's customer details
  if (!clientId) {
    const client = await findOrCreateClient({
      fullName: job.customer_name,
      phone: job.customer_phone,
      email: job.customer_email,
      address: job.address,
      city: job.city,
      zip: job.zip,
      leadSource: 'job_record',
    });
    clientId = client.id;
  }

  // 3. If leadId is missing, check if a lead exists for this client or create one in Stage 5
  if (!leadId) {
    // Check if an existing lead matches this client
    const matchingLeads = await query<any>(
      `SELECT id FROM leads WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    );

    if (matchingLeads.length > 0) {
      leadId = Number(matchingLeads[0].id);
    } else {
      // Auto-provision a pipeline lead so this job appears in the Sales Pipeline
      const newLead = await query<any>(
        `INSERT INTO leads (
          form_type, full_name, phone, email, address, city, zip, service_type,
          lead_source, status, pipeline_stage, stage_entered_at, contract_signed_at,
          job_completed_at, client_id, estimated_value, source_type, lead_source_detail
        ) VALUES (
          'manual_job', $1, $2, $3, $4, $5, $6, $7,
          'direct_job', 'won', 'stage_5_completion_followup', NOW(), NOW(),
          CASE WHEN $8 = 'complete' THEN NOW() ELSE NULL END,
          $9, $10, 'team_member', 'Field Job Dispatch'
        ) RETURNING id`,
        [
          job.customer_name,
          job.customer_phone,
          job.customer_email,
          job.address,
          job.city,
          job.zip,
          job.service_type || 'Residential Roofing',
          job.status,
          clientId,
          Number(job.contract_value) || 18500,
        ]
      );
      leadId = Number(newLead[0].id);
    }
  }

  // 4. Update the job record with both FKs
  await query(
    `UPDATE jobs SET client_id = $1, lead_id = $2, updated_at = NOW() WHERE id = $3`,
    [clientId, leadId, jobId]
  );

  // 5. If job has an estimate, ensure estimate also links to this client and lead
  if (job.estimate_id) {
    await query(
      `UPDATE estimates 
       SET client_id = COALESCE(client_id, $1), 
           lead_id = COALESCE(lead_id, $2),
           status = 'accepted',
           accepted_at = COALESCE(accepted_at, NOW()),
           updated_at = NOW()
       WHERE id = $3`,
      [clientId, leadId, job.estimate_id]
    );
  }

  // 6. Recalculate client statistics
  await recalculateClientStats(clientId);

  return { jobId, leadId, clientId };
}

/**
 * Synchronizes a job status update across linked entities
 */
export async function syncJobStatusChange(
  jobId: number,
  newStatus: string
): Promise<void> {
  const jobRows = await query<any>('SELECT * FROM jobs WHERE id = $1', [jobId]);
  if (!jobRows || jobRows.length === 0) return;
  const job = jobRows[0];

  // If job is complete, mark the lead's job_completed_at
  if (newStatus === 'complete' && job.lead_id) {
    await query(
      `UPDATE leads 
       SET job_completed_at = NOW(), 
           status = 'won', 
           updated_at = NOW() 
       WHERE id = $1`,
      [job.lead_id]
    );
  }

  if (job.client_id) {
    await recalculateClientStats(Number(job.client_id));
  }
}

/**
 * Diagnostic auto-heal function that scans the entire CRM database
 * and repairs any missing foreign keys, stage desynchronizations, or stale rollups.
 */
export async function autoHealDataflowSync(): Promise<{
  jobsHealed: number;
  leadsHealed: number;
  estimatesHealed: number;
  invoicesHealed: number;
  warrantiesHealed: number;
  reviewsHealed: number;
  tasksHealed: number;
  clientsRecalculated: number;
}> {
  let jobsHealed = 0;
  let leadsHealed = 0;
  let estimatesHealed = 0;
  let invoicesHealed = 0;
  let warrantiesHealed = 0;
  let reviewsHealed = 0;
  let tasksHealed = 0;

  // 1. Ensure all leads have a client_id
  const unlinkedLeads = await query<any>('SELECT * FROM leads WHERE client_id IS NULL');
  for (const lead of unlinkedLeads) {
    try {
      const client = await findOrCreateClient({
        fullName: lead.full_name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        zip: lead.zip,
        serviceType: lead.service_type,
        leadSource: lead.lead_source || 'historical_backfill',
      });
      await query('UPDATE leads SET client_id = $1 WHERE id = $2', [client.id, lead.id]);
      leadsHealed++;
    } catch (e) {
      console.warn(`Could not heal lead #${lead.id}:`, e);
    }
  }

  // 2. Heal all jobs (linking client_id and lead_id)
  const allJobs = await query<any>('SELECT id, lead_id, client_id, estimate_id FROM jobs ORDER BY id ASC');
  for (const job of allJobs) {
    try {
      if (!job.lead_id || !job.client_id) {
        await syncLeadAndClientForJob(job.id);
        jobsHealed++;
      } else {
        // Ensure client stats are warm
        await recalculateClientStats(Number(job.client_id));
      }
    } catch (e) {
      console.warn(`Could not heal job #${job.id}:`, e);
    }
  }

  // 3. Heal estimates client_id & lead_id
  const unlinkedEstimates = await query<any>(`
    SELECT e.id, e.lead_id, e.client_id, e.customer_name, e.customer_phone, e.customer_email, e.customer_address
    FROM estimates e
    WHERE e.client_id IS NULL OR e.lead_id IS NULL
  `);
  for (const est of unlinkedEstimates) {
    try {
      let cId = est.client_id;
      let lId = est.lead_id;

      if (!cId && lId) {
        const l = await query<any>('SELECT client_id FROM leads WHERE id = $1', [lId]);
        if (l[0]?.client_id) cId = l[0].client_id;
      }
      if (!lId && cId) {
        const l = await query<any>('SELECT id FROM leads WHERE client_id = $1 ORDER BY id DESC LIMIT 1', [cId]);
        if (l[0]?.id) lId = l[0].id;
      }
      if (!cId) {
        const client = await findOrCreateClient({
          fullName: est.customer_name,
          phone: est.customer_phone,
          email: est.customer_email,
          address: est.customer_address,
          leadSource: 'estimate_backfill',
        });
        cId = client.id;
      }

      await query(
        `UPDATE estimates SET client_id = COALESCE(client_id, $1), lead_id = COALESCE(lead_id, $2) WHERE id = $3`,
        [cId, lId, est.id]
      );
      estimatesHealed++;
    } catch (e) {
      console.warn(`Could not heal estimate #${est.id}:`, e);
    }
  }

  // 4. Heal invoices client_id
  const unlinkedInvoices = await query<any>(`
    SELECT i.id, i.job_id, i.estimate_id, j.client_id as job_client_id, e.client_id as est_client_id
    FROM invoices i
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN estimates e ON i.estimate_id = e.id
    WHERE i.client_id IS NULL
  `);
  for (const inv of unlinkedInvoices) {
    const targetClient = inv.job_client_id || inv.est_client_id;
    if (targetClient) {
      await query('UPDATE invoices SET client_id = $1 WHERE id = $2', [targetClient, inv.id]);
      invoicesHealed++;
    }
  }

  // 5. Heal warranties client_id
  const unlinkedWarranties = await query<any>(`
    SELECT w.id, j.client_id as job_client_id, l.client_id as lead_client_id
    FROM warranties w
    LEFT JOIN jobs j ON w.job_id = j.id
    LEFT JOIN leads l ON w.lead_id = l.id
    WHERE w.client_id IS NULL
  `);
  for (const war of unlinkedWarranties) {
    const targetClient = war.job_client_id || war.lead_client_id;
    if (targetClient) {
      await query('UPDATE warranties SET client_id = $1 WHERE id = $2', [targetClient, war.id]);
      warrantiesHealed++;
    }
  }

  // 6. Heal reviews client_id, lead_id, job_id
  const unlinkedReviews = await query<any>(`
    SELECT r.id, r.customer_name, r.job_id, r.lead_id, r.client_id
    FROM reviews r
    WHERE r.client_id IS NULL OR r.job_id IS NULL OR r.lead_id IS NULL
  `);
  for (const rev of unlinkedReviews) {
    let matchedClient = rev.client_id;
    let matchedJob = rev.job_id;
    let matchedLead = rev.lead_id;

    if (!matchedClient && rev.customer_name) {
      const match = await query<any>(
        `SELECT id FROM clients WHERE LOWER(full_name) = LOWER($1) LIMIT 1`,
        [rev.customer_name.trim()]
      );
      if (match.length > 0) matchedClient = match[0].id;
    }

    if (matchedClient) {
      if (!matchedJob) {
        const j = await query<any>('SELECT id FROM jobs WHERE client_id = $1 LIMIT 1', [matchedClient]);
        if (j.length > 0) matchedJob = j[0].id;
      }
      if (!matchedLead) {
        const l = await query<any>('SELECT id FROM leads WHERE client_id = $1 LIMIT 1', [matchedClient]);
        if (l.length > 0) matchedLead = l[0].id;
      }
    }

    await query(
      `UPDATE reviews 
       SET client_id = COALESCE(client_id, $1),
           job_id = COALESCE(job_id, $2),
           lead_id = COALESCE(lead_id, $3)
       WHERE id = $4`,
      [matchedClient, matchedJob, matchedLead, rev.id]
    );
    reviewsHealed++;
  }

  // 7. Heal tasks client_id
  const unlinkedTasks = await query<any>(`
    SELECT t.id, t.entity_type, t.entity_id, t.client_id
    FROM tasks t
    WHERE t.client_id IS NULL AND t.entity_id IS NOT NULL
  `);
  for (const t of unlinkedTasks) {
    let resolvedClientId: number | null = null;
    if (t.entity_type === 'lead') {
      const l = await query<any>('SELECT client_id FROM leads WHERE id = $1', [t.entity_id]);
      if (l[0]?.client_id) resolvedClientId = l[0].client_id;
    } else if (t.entity_type === 'job') {
      const j = await query<any>('SELECT client_id FROM jobs WHERE id = $1', [t.entity_id]);
      if (j[0]?.client_id) resolvedClientId = j[0].client_id;
    } else if (t.entity_type === 'client') {
      resolvedClientId = Number(t.entity_id);
    }

    if (resolvedClientId) {
      await query('UPDATE tasks SET client_id = $1 WHERE id = $2', [resolvedClientId, t.id]);
      tasksHealed++;
    }
  }

  // 8. Align pipeline stage for leads with active/completed jobs
  await query(`
    UPDATE leads l
    SET pipeline_stage = 'stage_5_completion_followup',
        status = 'won',
        contract_signed_at = COALESCE(l.contract_signed_at, j.created_at, NOW()),
        job_completed_at = CASE WHEN j.status = 'complete' THEN COALESCE(l.job_completed_at, j.updated_at, NOW()) ELSE l.job_completed_at END
    FROM jobs j
    WHERE j.lead_id = l.id AND (l.pipeline_stage != 'stage_5_completion_followup' OR l.status != 'won')
  `);

  // 9. Recalculate stats for every client in the database
  const allClients = await query<any>('SELECT id FROM clients');
  for (const c of allClients) {
    await recalculateClientStats(Number(c.id));
  }

  return {
    jobsHealed,
    leadsHealed,
    estimatesHealed,
    invoicesHealed,
    warrantiesHealed,
    reviewsHealed,
    tasksHealed,
    clientsRecalculated: allClients.length,
  };
}

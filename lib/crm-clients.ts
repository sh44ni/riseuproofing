import { query } from './db';
import {
  normalizePhone,
  formatPhone,
  formatClientSince,
  formatClientTenure,
  getRoleBadgeInfo,
} from './crm-clients-utils';
export {
  normalizePhone,
  formatPhone,
  formatClientSince,
  formatClientTenure,
  getRoleBadgeInfo,
};

export interface ClientInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  secondaryPhone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  propertyType?: string | null;
  roofType?: string | null;
  roofSqf?: number | null;
  roofAge?: number | null;
  stories?: number | null;
  hoa?: boolean | null;
  leadSource?: string | null;
  notes?: string | null;
  assignedToUserId?: number | null;
  sourceType?: 'website' | 'team_member' | string | null;
  acquiredByUserId?: number | null;
  leadSourceDetail?: string | null;
  serviceType?: string | null;
  clientSince?: string | Date | null;
  clientCategory?: 'lead' | 'new_client' | 'existing_client' | 'lost_lead' | string | null;
  lostReason?: string | null;
}

export interface ClientRecord {
  id: number;
  full_name: string;
  phone: string | null;
  phone_normalized: string | null;
  email: string | null;
  secondary_phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  property_type: string | null;
  roof_type: string | null;
  roof_sqf: number | null;
  roof_age: number | null;
  stories: number | null;
  hoa: boolean;
  status: string;
  client_category?: 'lead' | 'new_client' | 'existing_client' | 'lost_lead' | string;
  lost_reason?: string | null;
  tags: string[];
  total_revenue: number;
  total_jobs_count: number;
  notes: string | null;
  assigned_to_user_id: number | null;
  source_type?: string | null;
  acquired_by_user_id?: number | null;
  lead_source_detail?: string | null;
  client_since?: string | null;
  created_at: string;
  updated_at: string;
}

let tableEnsured = false;

/**
 * Self-healing table check to guarantee clients table, category fields, and foreign keys exist in production
 */
export async function ensureClientsTable(): Promise<void> {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        id                  BIGSERIAL PRIMARY KEY,
        full_name           TEXT NOT NULL,
        phone               TEXT,
        phone_normalized    TEXT,
        email               TEXT,
        secondary_phone     TEXT,
        address             TEXT,
        city                TEXT,
        zip                 TEXT,
        property_type       TEXT DEFAULT 'Single Family',
        roof_type           TEXT,
        roof_sqf            INTEGER,
        roof_age            INTEGER,
        stories             INTEGER DEFAULT 1,
        hoa                 BOOLEAN DEFAULT false,
        status              TEXT DEFAULT 'lead',
        client_category     TEXT DEFAULT 'lead',
        lost_reason         TEXT,
        tags                TEXT[] DEFAULT '{"New Lead"}',
        total_revenue       NUMERIC(10,2) DEFAULT 0,
        total_jobs_count    INTEGER DEFAULT 0,
        notes               TEXT,
        assigned_to_user_id BIGINT REFERENCES users(id),
        source_type         TEXT DEFAULT 'website',
        acquired_by_user_id BIGINT REFERENCES users(id),
        lead_source_detail  TEXT,
        client_since        TIMESTAMPTZ DEFAULT NOW(),
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_clients_phone_norm ON clients (phone_normalized);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
      CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (full_name);
      CREATE INDEX IF NOT EXISTS idx_clients_created ON clients (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clients_acquired_by ON clients (acquired_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_clients_category ON clients (client_category);

      ALTER TABLE clients ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS acquired_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source_detail TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_since TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_category TEXT DEFAULT 'lead';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS lost_reason TEXT;

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_detail TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
      CREATE INDEX IF NOT EXISTS idx_leads_source_type ON leads (source_type, created_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads (client_id);

      ALTER TABLE estimates ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON estimates (client_id);

      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs (client_id);

      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE warranties ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_inspections_client_id ON inspections (client_id);

      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;

      -- Future-proof dynamic contract foundation
      CREATE TABLE IF NOT EXISTS contracts (
        id                  BIGSERIAL PRIMARY KEY,
        lead_id             BIGINT REFERENCES leads(id) ON DELETE CASCADE,
        estimate_id         BIGINT REFERENCES estimates(id) ON DELETE CASCADE,
        job_id              BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
        client_id           BIGINT REFERENCES clients(id) ON DELETE SET NULL,
        contract_number     TEXT UNIQUE,
        status              TEXT NOT NULL DEFAULT 'action_required',
        client_signed_at    TIMESTAMPTZ,
        counter_signed_at   TIMESTAMPTZ,
        counter_signed_by   BIGINT REFERENCES users(id),
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts (client_id);

      -- Idempotent initial backfill for existing client classifications
      UPDATE clients c
      SET client_category = 'existing_client'
      WHERE (client_category IS NULL OR client_category != 'existing_client')
        AND (
          c.total_jobs_count > 0 
          OR c.status IN ('active_job', 'completed', 'repeat') 
          OR c.total_revenue > 0
          OR EXISTS (SELECT 1 FROM jobs j WHERE (j.client_id = c.id OR j.lead_id IN (SELECT id FROM leads WHERE client_id = c.id)) AND j.status NOT IN ('cancelled', 'draft'))
          OR EXISTS (SELECT 1 FROM leads l WHERE l.client_id = c.id AND (l.contract_signed_at IS NOT NULL OR l.status = 'won' OR l.pipeline_stage = 'stage_5_completion_followup'))
        );

      UPDATE clients c
      SET client_category = 'lost_lead', status = 'lost'
      WHERE (client_category IS NULL OR client_category IN ('lead', 'new_client'))
        AND c.status NOT IN ('active_job', 'completed', 'repeat')
        AND c.total_jobs_count = 0
        AND c.total_revenue = 0
        AND (
          c.status = 'lost'
          OR EXISTS (SELECT 1 FROM leads l WHERE l.client_id = c.id AND l.status = 'lost')
        );

      UPDATE clients c
      SET client_category = 'new_client', status = 'opportunity'
      WHERE (client_category IS NULL OR client_category = 'lead')
        AND c.status NOT IN ('active_job', 'completed', 'repeat', 'lost')
        AND c.total_jobs_count = 0
        AND c.total_revenue = 0
        AND (
          c.status = 'opportunity'
          OR EXISTS (SELECT 1 FROM estimates e WHERE e.client_id = c.id OR e.lead_id IN (SELECT id FROM leads WHERE client_id = c.id))
          OR EXISTS (SELECT 1 FROM inspections insp WHERE insp.client_id = c.id OR insp.lead_id IN (SELECT id FROM leads WHERE client_id = c.id))
          OR EXISTS (SELECT 1 FROM leads l WHERE l.client_id = c.id AND (l.site_visit_scheduled_at IS NOT NULL OR l.proposal_sent_at IS NOT NULL OR l.status IN ('estimate_scheduled', 'estimate_sent', 'inspected', 'quoted') OR l.pipeline_stage IN ('stage_2_site_visit', 'stage_3_estimate_drafting', 'stage_4_proposal_review')))
        );

      UPDATE clients
      SET client_category = 'lead'
      WHERE client_category IS NULL OR client_category = '';
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn('ensureClientsTable warning (may already exist):', err);
  }
}

/**
 * Finds an existing client by matching normalized phone or email,
 * or creates a new client record with initial status 'lead'.
 * If existing client is found, backfills any missing address/specs.
 */
export async function findOrCreateClient(input: ClientInput): Promise<ClientRecord> {
  await ensureClientsTable();
  const normPhone = normalizePhone(input.phone);
  const cleanEmail = input.email ? input.email.trim().toLowerCase() : null;
  const cleanName = (input.fullName || '').trim();
  const safeRoofSqf = (input.roofSqf !== null && input.roofSqf !== undefined && !isNaN(Number(input.roofSqf)))
    ? Math.round(Number(input.roofSqf))
    : null;
  const safeRoofAge = (input.roofAge !== null && input.roofAge !== undefined && !isNaN(Number(input.roofAge)))
    ? Math.round(Number(input.roofAge))
    : null;
  const safeStories = (input.stories !== null && input.stories !== undefined && !isNaN(Number(input.stories)))
    ? Math.max(1, Math.round(Number(input.stories)))
    : 1;
  const safeAssigned = (input.assignedToUserId !== null && input.assignedToUserId !== undefined && !isNaN(Number(input.assignedToUserId)))
    ? Number(input.assignedToUserId)
    : null;
  const safeAcquiredBy = (input.acquiredByUserId !== null && input.acquiredByUserId !== undefined && !isNaN(Number(input.acquiredByUserId)))
    ? Number(input.acquiredByUserId)
    : safeAssigned;
  const safeSourceType = input.sourceType === 'team_member' || (input.sourceType !== 'website' && safeAcquiredBy) ? 'team_member' : 'website';
  const safeSourceDetail = input.leadSourceDetail || input.leadSource || (safeSourceType === 'team_member' ? 'Team Member Attribution' : 'Website Inbound');

  let existing: ClientRecord[] = [];

  if (normPhone || cleanEmail) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (normPhone) {
      params.push(normPhone);
      conditions.push(`phone_normalized = $${params.length}`);
    }
    if (cleanEmail) {
      params.push(cleanEmail);
      conditions.push(`LOWER(email) = $${params.length}`);
    }

    existing = await query<ClientRecord>(
      `SELECT * FROM clients WHERE ${conditions.join(' OR ')} ORDER BY created_at ASC LIMIT 1`,
      params
    );
  }

  // Fallback: match by exact name and property address if phone/email didn't match
  if (existing.length === 0 && cleanName && input.address) {
    existing = await query<ClientRecord>(
      `SELECT * FROM clients 
       WHERE LOWER(full_name) = LOWER($1) 
         AND LOWER(COALESCE(address, '')) = LOWER($2) 
       ORDER BY created_at ASC LIMIT 1`,
      [cleanName, input.address.trim()]
    );
  }

  // If found, update missing details if input provides them (protecting acquired_by_user_id)
  if (existing.length > 0) {
    const client = existing[0];
    const updates: string[] = [];
    const updateParams: unknown[] = [client.id];

    if (!client.address && input.address) {
      updateParams.push(input.address);
      updates.push(`address = $${updateParams.length}`);
    }
    if (!client.city && input.city) {
      updateParams.push(input.city);
      updates.push(`city = $${updateParams.length}`);
    }
    if (!client.zip && input.zip) {
      updateParams.push(input.zip);
      updates.push(`zip = $${updateParams.length}`);
    }
    if (!client.roof_type && input.roofType) {
      updateParams.push(input.roofType);
      updates.push(`roof_type = $${updateParams.length}`);
    }
    if (!client.roof_sqf && safeRoofSqf !== null) {
      updateParams.push(safeRoofSqf);
      updates.push(`roof_sqf = $${updateParams.length}`);
    }
    if (!client.roof_age && safeRoofAge !== null) {
      updateParams.push(safeRoofAge);
      updates.push(`roof_age = $${updateParams.length}`);
    }
    if (!client.phone && input.phone) {
      updateParams.push(input.phone);
      updates.push(`phone = $${updateParams.length}`);
      if (normPhone) {
        updateParams.push(normPhone);
        updates.push(`phone_normalized = $${updateParams.length}`);
      }
    }
    if (!client.email && cleanEmail) {
      updateParams.push(cleanEmail);
      updates.push(`email = $${updateParams.length}`);
    }
    // Permanent attribution: only fill if client currently has no acquired_by_user_id
    if (!client.acquired_by_user_id && safeAcquiredBy) {
      updateParams.push(safeAcquiredBy);
      updates.push(`acquired_by_user_id = $${updateParams.length}`);
    }
    if (!client.source_type && safeSourceType) {
      updateParams.push(safeSourceType);
      updates.push(`source_type = $${updateParams.length}`);
    }
    if (!client.lead_source_detail && safeSourceDetail) {
      updateParams.push(safeSourceDetail);
      updates.push(`lead_source_detail = $${updateParams.length}`);
    }
    if (!client.client_since) {
      updateParams.push(input.clientSince ? new Date(input.clientSince) : new Date());
      updates.push(`client_since = $${updateParams.length}`);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      const updated = await query<ClientRecord>(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
        updateParams
      );
      return updated[0] || client;
    }

    return client;
  }

  // Otherwise, insert new client
  const insertSql = `
    INSERT INTO clients (
      full_name,
      phone,
      phone_normalized,
      email,
      secondary_phone,
      address,
      city,
      zip,
      property_type,
      roof_type,
      roof_sqf,
      roof_age,
      stories,
      hoa,
      status,
      client_category,
      tags,
      notes,
      assigned_to_user_id,
      source_type,
      acquired_by_user_id,
      lead_source_detail,
      client_since
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING *
  `;

  const newClient = await query<ClientRecord>(insertSql, [
    cleanName,
    input.phone ?? null,
    normPhone,
    cleanEmail,
    input.secondaryPhone ?? null,
    input.address ?? null,
    input.city ?? null,
    input.zip ?? null,
    input.propertyType ?? 'Single Family',
    input.roofType ?? null,
    safeRoofSqf,
    safeRoofAge,
    safeStories,
    Boolean(input.hoa),
    'lead',
    input.clientCategory || 'lead',
    ['New Lead'],
    input.notes ?? null,
    safeAssigned,
    safeSourceType,
    safeAcquiredBy,
    safeSourceDetail,
    input.clientSince ? new Date(input.clientSince) : new Date(),
  ]);

  return newClient[0];
}

/**
 * Dynamic contract verification hook.
 * Inspects signed agreements across contracts, signed leads, and active jobs.
 * Extensible for future dedicated contract modules.
 */
export async function hasClientContract(clientId: number): Promise<boolean> {
  // 1. Direct check on dedicated contracts table if available
  try {
    const contractRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM contracts 
       WHERE (client_id = $1 
              OR lead_id IN (SELECT id FROM leads WHERE client_id = $1)
              OR job_id IN (SELECT id FROM jobs WHERE client_id = $1)
              OR estimate_id IN (SELECT id FROM estimates WHERE client_id = $1))
         AND (status IN ('client_signed', 'fully_executed') OR client_signed_at IS NOT NULL)`,
      [clientId]
    );
    if (parseInt(contractRes[0]?.count || '0', 10) > 0) {
      return true;
    }
  } catch (err) {
    // Graceful fallback if table is not yet migrated
  }

  // 2. Check signed milestones on linked leads
  const leadRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM leads 
     WHERE client_id = $1 
       AND (contract_signed_at IS NOT NULL 
            OR status = 'won' 
            OR pipeline_stage = 'stage_5_completion_followup')`,
    [clientId]
  );
  if (parseInt(leadRes[0]?.count || '0', 10) > 0) {
    return true;
  }

  // 3. Check active jobs (a job in production implies an executed deal)
  const jobRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM jobs 
     WHERE (client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1))
       AND status NOT IN ('cancelled', 'draft')`,
    [clientId]
  );
  if (parseInt(jobRes[0]?.count || '0', 10) > 0) {
    return true;
  }

  return false;
}

/**
 * Re-computes lifetime revenue, job counts, status, and 4-tier lifecycle category for a client
 */
export async function recalculateClientStats(clientId: number): Promise<void> {
  // 1. Sum paid invoices (linked via job_id, estimate_id, or direct client_id)
  const revRes = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM invoices 
     WHERE (job_id IN (SELECT id FROM jobs WHERE client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1)) 
            OR estimate_id IN (SELECT id FROM estimates WHERE client_id = $1)
            OR client_id = $1)
       AND status = 'paid'`,
    [clientId]
  );
  let totalRevenue = parseFloat(revRes[0]?.total || '0');

  // If no formal invoices paid yet, check completed jobs contract value
  if (totalRevenue === 0) {
    const jobValRes = await query<{ total: string }>(
      `SELECT COALESCE(SUM(contract_value), 0) as total
       FROM jobs
       WHERE (client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1))
         AND status = 'complete'`,
      [clientId]
    );
    const completedContractVal = parseFloat(jobValRes[0]?.total || '0');
    if (completedContractVal > 0) {
      totalRevenue = completedContractVal;
    }
  }

  // 2. Count jobs (linked directly or via client's leads)
  const jobRes = await query<{ count: string; has_active: string }>(
    `SELECT 
       COUNT(*) as count,
       COUNT(CASE WHEN status NOT IN ('complete', 'cancelled') THEN 1 END) as has_active
     FROM jobs 
     WHERE client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1)`,
    [clientId]
  );
  const totalJobs = parseInt(jobRes[0]?.count || '0', 10);
  const hasActiveJob = parseInt(jobRes[0]?.has_active || '0', 10) > 0;

  // 3. Dynamic contract validation
  const hasContract = await hasClientContract(clientId);

  // 4. Query linked leads for milestones, proposals, inspections, or lost status
  const leadRes = await query<{
    has_won: string;
    has_lost: string;
    lost_reason: string | null;
    has_inspection: string;
    has_proposal: string;
  }>(
    `SELECT 
       COUNT(CASE WHEN status = 'won' OR contract_signed_at IS NOT NULL OR pipeline_stage = 'stage_5_completion_followup' THEN 1 END) as has_won,
       COUNT(CASE WHEN status = 'lost' THEN 1 END) as has_lost,
       (SELECT lost_reason FROM leads WHERE client_id = $1 AND status = 'lost' AND lost_reason IS NOT NULL ORDER BY updated_at DESC LIMIT 1) as lost_reason,
       COUNT(CASE WHEN site_visit_scheduled_at IS NOT NULL OR site_visit_completed_at IS NOT NULL OR status IN ('estimate_scheduled', 'inspected') OR pipeline_stage IN ('stage_2_site_visit', 'stage_3_estimate_drafting') THEN 1 END) as has_inspection,
       COUNT(CASE WHEN proposal_sent_at IS NOT NULL OR status IN ('estimate_sent', 'quoted') OR pipeline_stage = 'stage_4_proposal_review' THEN 1 END) as has_proposal
     FROM leads
     WHERE client_id = $1`,
    [clientId]
  );
  const leadInfo = leadRes[0];
  const hasWonLead = parseInt(leadInfo?.has_won || '0', 10) > 0;
  const hasLostLead = parseInt(leadInfo?.has_lost || '0', 10) > 0;
  const leadLostReason = leadInfo?.lost_reason || null;
  const hasLeadInspection = parseInt(leadInfo?.has_inspection || '0', 10) > 0;
  const hasLeadProposal = parseInt(leadInfo?.has_proposal || '0', 10) > 0;

  // 5. Query estimates and inspections
  const [estRes, inspRes, clientRow] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM estimates WHERE client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1)`,
      [clientId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM inspections WHERE client_id = $1 OR lead_id IN (SELECT id FROM leads WHERE client_id = $1)`,
      [clientId]
    ),
    query<{ status: string; lost_reason: string | null }>(
      `SELECT status, lost_reason FROM clients WHERE id = $1`,
      [clientId]
    ),
  ]);

  const hasEstimates = parseInt(estRes[0]?.count || '0', 10) > 0;
  const hasInspections = parseInt(inspRes[0]?.count || '0', 10) > 0;
  const currentStatus = clientRow[0]?.status;
  const currentLostReason = clientRow[0]?.lost_reason;

  // 6. 4-Tier Lifecycle Hierarchy
  // Tier 1: Existing Clients ("The ones we are already dealing with")
  const isExistingClient = hasActiveJob || totalJobs > 0 || totalRevenue > 0 || hasContract || hasWonLead;

  let clientCategory: 'existing_client' | 'lost_lead' | 'new_client' | 'lead' = 'lead';
  let status = 'lead';
  let lostReason = currentLostReason;

  if (isExistingClient) {
    clientCategory = 'existing_client';
    if (hasActiveJob) {
      status = 'active_job';
    } else if (totalJobs > 1) {
      status = 'repeat';
    } else {
      status = 'completed';
    }
  } else if (hasLostLead || currentStatus === 'lost') {
    // Tier 2: Lost Leads ("Captured before contract/job execution")
    clientCategory = 'lost_lead';
    status = 'lost';
    lostReason = leadLostReason || currentLostReason || 'Lost before contract';
  } else if (hasEstimates || hasInspections || hasLeadInspection || hasLeadProposal || currentStatus === 'opportunity') {
    // Tier 3: New Clients ("Estimate sent or inspection done, actively engaged")
    clientCategory = 'new_client';
    status = 'opportunity';
  } else {
    // Tier 4: Inbound Leads ("Fresh inquiries, not yet estimated/inspected")
    clientCategory = 'lead';
    status = 'lead';
  }

  await query(
    `UPDATE clients 
     SET total_revenue = $1, 
         total_jobs_count = $2, 
         status = $3, 
         client_category = $4,
         lost_reason = $5,
         updated_at = NOW() 
     WHERE id = $6`,
    [totalRevenue, totalJobs, status, clientCategory, lostReason, clientId]
  );
}

/**
 * Reconciles and auto-heals all client records across the entire database:
 * 1. Links any unlinked leads to client profiles via findOrCreateClient
 * 2. Runs recalculateClientStats on every client profile
 * Returns metrics on healed/recalculated clients
 */
export async function autoHealDataflowSync(): Promise<{
  syncedClients: number;
  linkedLeads: number;
}> {
  await ensureClientsTable();

  // 1. Link orphan leads that have phone/email but no client_id
  const unlinkedLeads = await query<{
    id: number;
    full_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
    service_type: string | null;
    notes: string | null;
    created_at: string;
  }>(`SELECT id, full_name, phone, email, address, city, zip, service_type, notes, created_at FROM leads WHERE client_id IS NULL AND (phone IS NOT NULL OR email IS NOT NULL)`);

  let linkedLeads = 0;
  for (const l of unlinkedLeads) {
    try {
      const client = await findOrCreateClient({
        fullName: l.full_name,
        phone: l.phone,
        email: l.email,
        address: l.address,
        city: l.city,
        zip: l.zip,
        notes: l.notes,
        clientSince: l.created_at,
        serviceType: l.service_type,
      });
      await query(`UPDATE leads SET client_id = $1 WHERE id = $2`, [client.id, l.id]);
      linkedLeads++;
    } catch (e) {
      console.warn(`[autoHealDataflowSync] Failed to link lead #${l.id}:`, e);
    }
  }

  // 2. Recalculate stats & categories for all clients
  const allClients = await query<{ id: number }>(`SELECT id FROM clients`);
  for (const c of allClients) {
    try {
      await recalculateClientStats(c.id);
    } catch (e) {
      console.warn(`[autoHealDataflowSync] Failed to recalculate client #${c.id}:`, e);
    }
  }

  return {
    syncedClients: allClients.length,
    linkedLeads,
  };
}

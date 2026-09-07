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
  clientSince?: string | Date | null;
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
 * Self-healing table check to guarantee clients table and foreign keys exist in production
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

      ALTER TABLE clients ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website';
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS acquired_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source_detail TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_since TIMESTAMPTZ DEFAULT NOW();

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_detail TEXT;
      CREATE INDEX IF NOT EXISTS idx_leads_source_type ON leads (source_type, created_by_user_id);

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE estimates ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE warranties ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE inspections ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;
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
      tags,
      notes,
      assigned_to_user_id,
      source_type,
      acquired_by_user_id,
      lead_source_detail,
      client_since
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
 * Re-computes lifetime revenue, job counts, and status for a client
 */
export async function recalculateClientStats(clientId: number): Promise<void> {
  // Sum paid invoices
  const revRes = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM invoices 
     WHERE (job_id IN (SELECT id FROM jobs WHERE client_id = $1) 
            OR estimate_id IN (SELECT id FROM estimates WHERE client_id = $1))
       AND status = 'paid'`,
    [clientId]
  );
  const totalRevenue = parseFloat(revRes[0]?.total || '0');

  // Count jobs
  const jobRes = await query<{ count: string; has_active: string }>(
    `SELECT 
       COUNT(*) as count,
       COUNT(CASE WHEN status NOT IN ('complete', 'cancelled') THEN 1 END) as has_active
     FROM jobs 
     WHERE client_id = $1`,
    [clientId]
  );
  const totalJobs = parseInt(jobRes[0]?.count || '0', 10);
  const hasActiveJob = parseInt(jobRes[0]?.has_active || '0', 10) > 0;

  // Determine status
  let status = 'lead';
  if (hasActiveJob) {
    status = 'active_job';
  } else if (totalJobs > 1) {
    status = 'repeat';
  } else if (totalJobs === 1) {
    status = 'completed';
  } else {
    // Check if proposals exist
    const estRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM estimates WHERE client_id = $1`,
      [clientId]
    );
    if (parseInt(estRes[0]?.count || '0', 10) > 0) {
      status = 'opportunity';
    }
  }

  await query(
    `UPDATE clients 
     SET total_revenue = $1, 
         total_jobs_count = $2, 
         status = $3, 
         updated_at = NOW() 
     WHERE id = $4`,
    [totalRevenue, totalJobs, status, clientId]
  );
}

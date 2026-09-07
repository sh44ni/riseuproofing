import { query } from './db';
import { normalizePhone, formatPhone } from './crm-clients-utils';
export { normalizePhone, formatPhone };

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
  created_at: string;
  updated_at: string;
}

/**
 * Finds an existing client by matching normalized phone or email,
 * or creates a new client record with initial status 'lead'.
 * If existing client is found, backfills any missing address/specs.
 */
export async function findOrCreateClient(input: ClientInput): Promise<ClientRecord> {
  const normPhone = normalizePhone(input.phone);
  const cleanEmail = input.email ? input.email.trim().toLowerCase() : null;
  const cleanName = input.fullName.trim();

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

  // If found, update missing details if input provides them
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
    if (!client.roof_sqf && input.roofSqf) {
      updateParams.push(input.roofSqf);
      updates.push(`roof_sqf = $${updateParams.length}`);
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
      assigned_to_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
    input.roofSqf ?? null,
    input.roofAge ?? null,
    input.stories ?? 1,
    Boolean(input.hoa),
    'lead',
    ['New Lead'],
    input.notes ?? null,
    input.assignedToUserId ?? null,
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

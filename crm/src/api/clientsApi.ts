// Rise Up CRM — Backend Clients API Client
// Interfaces with FastAPI backend at /api/admin/clients

import { api, API_ORIGIN } from '@/lib/api';

const BASE = API_ORIGIN;

export interface ClientSummary {
  totalClients: number;
  existingClientsCount: number;
  newClientsCount: number;
  leadsCount: number;
  lostLeadsCount: number;
  activeProjects: number;
  leadCount: number;
  totalLtv: number;
}

export interface ClientApiRecord {
  id: number;
  full_name: string;
  phone?: string | null;
  phone_normalized?: string | null;
  email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  roof_type?: string | null;
  roof_sqf?: number | null;
  roof_age?: number | null;
  stories?: number | string | null;
  hoa?: boolean | null;
  status?: string | null;
  client_category?: string | null;
  total_revenue?: number | null;
  total_jobs_count?: number | null;
  assigned_to_user_id?: number | null;
  assigned_to_name?: string | null;
  acquired_by_user_id?: number | null;
  acquired_by_name?: string | null;
  acquired_by_role?: string | null;
  acquired_by_avatar?: string | null;
  source_type?: string | null;
  lead_source_detail?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  lost_reason?: string | null;
  lead_lost_reason?: string | null;
  latest_estimate_total?: number | null;
  total_billed?: number | null;
  total_paid?: number | null;
  balance_due?: number | null;
}

export interface ClientDirectoryResponse {
  ok: boolean;
  clients: ClientApiRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ClientSummary;
}

export interface Client360ApiResponse {
  ok: boolean;
  client: ClientApiRecord;
  leads: any[];
  inspections: any[];
  inspection_photos?: any[];
  documents?: any[];
  estimates: any[];
  jobs: any[];
  invoices: any[];
  warranties: any[];
  reviews: any[];
  activities: any[];
  tasks: any[];
}

export interface CreateClientPayload {
  fullName: string;
  phone?: string;
  email?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  zip?: string;
  propertyType?: string;
  roofType?: string;
  roofSqf?: number;
  roofAge?: number;
  stories?: number;
  hoa?: boolean;
  notes?: string;
  assignedToUserId?: number;
  sourceType?: string;
  acquiredByUserId?: number;
  leadSourceDetail?: string;
}

export interface ClientActivityPayload {
  title: string;
  description?: string;
  activityType?: string;
  callDuration?: number;
}

export async function fetchClients(params?: {
  search?: string;
  category?: string;
  status?: string;
  tag?: string;
  sort?: string;
  page?: number;
  sync?: boolean;
}): Promise<ClientDirectoryResponse> {
  const query: Record<string, string> = {};
  if (params?.search && params.search.trim()) query.search = params.search.trim();
  if (params?.category && params.category !== 'all') query.category = params.category;
  if (params?.status && params.status !== 'all') query.status = params.status;
  if (params?.tag && params.tag !== 'all') query.tag = params.tag;
  if (params?.sort) query.sort = params.sort;
  if (params?.page) query.page = String(params.page);
  if (params?.sync) query.sync = 'true';

  const qs = Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';
  const res = await fetch(`${BASE}/api/admin/clients${qs}`, {
    headers: api.getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch clients' }));
    throw new Error(err?.detail || `Failed to fetch clients: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function fetchClient360(clientId: number | string): Promise<Client360ApiResponse> {
  const res = await fetch(`${BASE}/api/admin/clients/${clientId}`, {
    headers: api.getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch client 360 profile' }));
    throw new Error(err?.detail || `Failed to fetch client 360: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function createClient(payload: CreateClientPayload): Promise<{ ok: boolean; client: { id: number; full_name: string } }> {
  const res = await fetch(`${BASE}/api/admin/clients`, {
    method: 'POST',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create client' }));
    throw new Error(err?.detail || `Client creation failed: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function updateClient(clientId: number | string, payload: Record<string, any>): Promise<any> {
  const res = await fetch(`${BASE}/api/admin/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update client' }));
    throw new Error(err?.detail || `Client update failed: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function updateClientSpecs(clientId: number | string, specs: Record<string, any>): Promise<any> {
  return await updateClient(clientId, specs);
}

export async function archiveClient(clientId: number | string): Promise<any> {
  const res = await fetch(`${BASE}/api/admin/clients/${clientId}`, {
    method: 'DELETE',
    headers: api.getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to archive client' }));
    throw new Error(err?.detail || `Client archive failed: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function addClientActivity(clientId: number | string, payload: ClientActivityPayload): Promise<any> {
  const res = await fetch(`${BASE}/api/admin/clients/${clientId}/activities`, {
    method: 'POST',
    headers: {
      ...api.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to log client activity' }));
    throw new Error(err?.detail || `Activity logging failed: HTTP ${res.status}`);
  }

  return await res.json();
}

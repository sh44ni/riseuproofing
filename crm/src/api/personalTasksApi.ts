/**
 * Rise Up CRM — User Personal Tasks & Sticky Notes API Client
 * 
 * Manages user-specific to-dos and sticky notes with personal scope.
 * Designed with a local-first resilient fallback pattern: if the backend
 * is offline or not yet connected, operations execute seamlessly via localStorage.
 */

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type WorkCategory = 'Rise Up' | 'Content Creation' | 'Marketing';

export interface PersonalTaskPayload {
  id: string;
  title: string;
  workCategory: WorkCategory;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
  notes?: string;
  sortOrder?: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PersonalTasksListResponse {
  success: boolean;
  data: PersonalTaskPayload[];
  total: number;
  message?: string;
}

export interface SinglePersonalTaskResponse {
  success: boolean;
  data: PersonalTaskPayload;
  message?: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000');
const API_ENDPOINT = `${BACKEND_BASE_URL}/api/admin/users/me/tasks`;

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const apiKey = (import.meta as any).env?.VITE_CRM_API_KEY || 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw';
  const token = typeof window !== 'undefined' ? (localStorage.getItem('crm_auth_token') || localStorage.getItem('access_token')) : null;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Client-Platform': 'crm-web',
    ...extra,
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}


/**
 * Fetch current user's personal tasks
 */
export async function fetchPersonalTasksFromBackend(): Promise<PersonalTaskPayload[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json: PersonalTasksListResponse = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Create a new personal task on the backend
 */
export async function createPersonalTaskOnBackend(
  task: PersonalTaskPayload
): Promise<PersonalTaskPayload | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(task),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json: SinglePersonalTaskResponse = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Update an existing personal task on the backend
 */
export async function updatePersonalTaskOnBackend(
  id: string,
  updates: Partial<PersonalTaskPayload>
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a personal task on the backend
 */
export async function deletePersonalTaskOnBackend(id: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

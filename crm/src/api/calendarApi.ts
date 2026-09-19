/**
 * Rise Up CRM — Unified Team Operations & Task Calendar API Client
 * 
 * Handles fetching, scheduling, updating, completing, and deleting team operations
 * and tasks. Connects to PostgreSQL `tasks`, scheduled `leads`, `jobs`, and `warranties`
 * via FastAPI endpoints with local-first resilient fallback.
 */

import { TeamOperationEvent, DispatchEvent, CalendarStats, CalendarWeather } from '@/types/calendarTypes';

export interface CalendarEventsApiResponse {
  success: boolean;
  data: TeamOperationEvent[];
  events?: TeamOperationEvent[];
  message?: string;
}

export interface SingleCalendarEventApiResponse {
  success: boolean;
  data: TeamOperationEvent;
  task?: any;
  message?: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const CALENDAR_ENDPOINT = `${BACKEND_BASE_URL}/api/admin/calendar`;
const TASKS_ENDPOINT = `${BACKEND_BASE_URL}/api/admin/tasks`;

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
 * Fetch unified team operations and calendar schedule from backend
 */
export async function fetchCalendarEventsFromBackend(params?: {
  startDate?: string;
  endDate?: string;
  assignedToUserId?: string | number;
  category?: string;
  status?: string;
}): Promise<TeamOperationEvent[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.assignedToUserId && params.assignedToUserId !== 'all') {
      query.append('assignedToUserId', String(params.assignedToUserId));
    }
    if (params?.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params?.status && params.status !== 'all') {
      query.append('status', params.status);
    }

    const url = query.toString() ? `${CALENDAR_ENDPOINT}?${query.toString()}` : CALENDAR_ENDPOINT;

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback to /events endpoint if primary is unreachable
      return await fetchLegacyCalendarEvents(params);
    }

    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json.events) ? json.events : null);
    return rawList;
  } catch {
    return null;
  }
}

export const fetchCalendarOperations = fetchCalendarEventsFromBackend;

/**
 * Fallback to legacy events endpoint
 */
async function fetchLegacyCalendarEvents(params?: any): Promise<TeamOperationEvent[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/calendar/events`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch registered CRM user accounts from backend
 */
export async function fetchRegisteredUsers(): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    return json.users || [];
  } catch {
    return [];
  }
}

/**
 * Fetch active pipeline leads from backend for entity linking
 */
export async function fetchPipelineJobs(): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/leads`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    return json.leads || [];
  } catch {
    return [];
  }
}

/**
 * Fetch active signed jobs from backend for entity linking
 */
export async function fetchRealJobs(): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/jobs`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    return json.jobs || json.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch dynamic operations and workload stats
 */
export async function fetchCalendarStats(): Promise<CalendarStats | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/calendar/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch live North County weather & OSHA wind safety
 */
export async function fetchCalendarWeather(): Promise<CalendarWeather | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/calendar/weather`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Create a new team operation or task on the backend
 */
export async function createCalendarEventOnBackend(
  event: TeamOperationEvent
): Promise<TeamOperationEvent | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const payload = {
      title: event.title,
      description: event.description || event.notes,
      category: event.category,
      eventType: event.category,
      assignedToUserId: event.assignedToUserId,
      assignedTo: event.assignedToName,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      dueAt: event.dueAt,
      endAt: event.endAt,
      priority: event.priority,
      entityType: event.entityType,
      entityId: event.entityId,
    };

    const res = await fetch(TASKS_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    const createdTask = json.task || json.data;
    if (createdTask) {
      return {
        ...event,
        id: `task-${createdTask.id}`,
        numericId: createdTask.id,
      };
    }
    return event;
  } catch {
    return null;
  }
}

export const createTeamTask = createCalendarEventOnBackend;

/**
 * Update an existing operation or task on the backend
 */
export async function updateCalendarEventOnBackend(
  id: string,
  updates: Partial<TeamOperationEvent>
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const payload: Record<string, any> = { id };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined || updates.notes !== undefined) {
      payload.description = updates.description || updates.notes;
    }
    if (updates.category !== undefined) {
      payload.category = updates.category;
      payload.eventType = updates.category;
    }
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.assignedToUserId !== undefined) payload.assignedToUserId = updates.assignedToUserId;
    if (updates.assignedToName !== undefined) payload.assignedTo = updates.assignedToName;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.startTime !== undefined) payload.startTime = updates.startTime;
    if (updates.endTime !== undefined) payload.endTime = updates.endTime;
    if (updates.dueAt !== undefined) payload.dueAt = updates.dueAt;
    if (updates.endAt !== undefined) payload.endAt = updates.endAt;
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.status !== undefined) {
      payload.completed = updates.status === 'completed';
    }

    const res = await fetch(TASKS_ENDPOINT, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export const updateTeamTask = updateCalendarEventOnBackend;

/**
 * Toggle task completion status
 */
export async function toggleTaskComplete(id: string, completed: boolean): Promise<boolean> {
  return updateCalendarEventOnBackend(id, { completed });
}

/**
 * Delete an operation or task on the backend
 */
export async function deleteCalendarEventOnBackend(id: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${TASKS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
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

export const deleteTeamTask = deleteCalendarEventOnBackend;

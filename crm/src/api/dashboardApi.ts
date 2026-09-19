import { api } from '@/lib/api';

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface DashboardStats {
  newLeads: number;
  newLeadsDelta: number | null;
  contacted: number;
  contactedDelta: number | null;
  estScheduled: number;
  estScheduledDelta: number | null;
  estSent: number;
  estSentDelta: number | null;
  jobsWon: number;
  jobsWonDelta: number | null;
  lostClosed: number;
  lostClosedDelta: number | null;
  ytdRevenue: number;
  activeCrewCount: number;
  totalLeads: number;
  totalPipelineValue: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: api.getAuthHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok || !json?.stats) return null;
    return json.stats as DashboardStats;
  } catch {
    return null;
  }
}

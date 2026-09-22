// Rise Up CRM — Dashboard Stats Store
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../api/dashboardApi';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const data = await fetchDashboardStats();
    if (data) setStats(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load(false);
    intervalRef.current = setInterval(() => load(true), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const refresh = useCallback((silent = true) => {
    return load(silent);
  }, [load]);

  return { stats, setStats, isLoading, refresh };
}

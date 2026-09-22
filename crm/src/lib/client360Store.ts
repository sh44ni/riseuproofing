import { useState, useEffect, useCallback } from 'react';
import { Client360Record } from '@/types/client360Types';
import { api } from '@/lib/api';
import { backendClientToClient360 } from '@/lib/clientAdapter';

export function useClients360() {
  const [clients, setClients] = useState<Client360Record[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await api.request<{ clients: any[] }>('/admin/clients');
      setClients(res.clients.map((c: any) => backendClientToClient360(c)));
    } catch (err) {
      console.error('Failed to load clients in useClients360:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { clients, setClients, refresh };
}

// Rise Up CRM — useClients React Hook
// Manages real-time client state, directory list, 360 profile caching, and backend mutations

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchClients,
  fetchClient360,
  updateClientSpecs,
  updateClient,
  addClientActivity,
  createClient,
  ClientApiRecord,
  ClientSummary,
  CreateClientPayload,
} from '@/api/clientsApi';
import {
  backendClientToClient360,
  roofSpecsToBackendPayload,
} from '@/lib/clientAdapter';
import { Client360Record, RoofSpecs, TimelineEvent } from '@/types/client360Types';
import { useAuth } from '@/context/AuthContext';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client360Record[]>([]);
  const [rawClients, setRawClients] = useState<ClientApiRecord[]>([]);
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeClientDetail, setActiveClientDetail] = useState<Client360Record | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch directory list
  const loadClients = useCallback(
    async (params?: {
      search?: string;
      category?: string;
      status?: string;
      tag?: string;
      sort?: string;
      page?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchClients(params);
        if (isMountedRef.current) {
          setRawClients(res.clients);
          const adapted = res.clients.map((c) => backendClientToClient360(c));
          setClients(adapted);
          setSummary(res.summary);
          setTotal(res.total);
          setPage(res.page);
          setTotalPages(res.totalPages);

          // Auto-select first client if none selected
          if (!selectedClientId && adapted.length > 0) {
            setSelectedClientId(adapted[0].id);
          }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          console.error('Failed to load clients from backend:', err);
          setError(err?.message || 'Failed to load clients');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [selectedClientId]
  );

  // Initial load
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Load 360 Detail when a client is selected
  const loadClient360Detail = useCallback(
    async (clientId: string | number) => {
      const numericId = typeof clientId === 'string' ? parseInt(clientId.replace(/\D/g, '')) || Number(clientId) : clientId;
      if (!numericId || isNaN(numericId)) return;

      setDetailLoading(true);
      try {
        const detailRes = await fetchClient360(numericId);
        if (isMountedRef.current && detailRes?.client) {
          const fullyEnriched = backendClientToClient360(detailRes.client, detailRes);
          setActiveClientDetail(fullyEnriched);
          // Also update the item in the list
          setClients((prev) =>
            prev.map((c) => (String(c.id) === String(numericId) ? fullyEnriched : c))
          );
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          console.error(`Failed to load client 360 detail for ID ${numericId}:`, err);
        }
      } finally {
        if (isMountedRef.current) {
          setDetailLoading(false);
        }
      }
    },
    []
  );

  // When selectedClientId changes, trigger detail fetch
  useEffect(() => {
    if (selectedClientId) {
      loadClient360Detail(selectedClientId);
    }
  }, [selectedClientId, loadClient360Detail]);

  // Handler: Select client
  const selectClient = useCallback((id: string) => {
    setSelectedClientId(id);
  }, []);

  // Handler: Save roof specs
  const saveSpecs = useCallback(
    async (clientId: string | number, updatedSpecs: RoofSpecs) => {
      const numericId = typeof clientId === 'string' ? parseInt(clientId.replace(/\D/g, '')) || Number(clientId) : clientId;
      const payload = roofSpecsToBackendPayload(updatedSpecs);

      // Optimistic update
      setClients((prev) =>
        prev.map((c) => {
          if (String(c.id) === String(clientId)) {
            return {
              ...c,
              roofSpecs: updatedSpecs,
              address: updatedSpecs.address,
              city: updatedSpecs.cityZip.split(' ')[0] || c.city,
            };
          }
          return c;
        })
      );

      if (activeClientDetail && String(activeClientDetail.id) === String(clientId)) {
        setActiveClientDetail((prev) =>
          prev
            ? {
                ...prev,
                roofSpecs: updatedSpecs,
                address: updatedSpecs.address,
                city: updatedSpecs.cityZip.split(' ')[0] || prev.city,
              }
            : null
        );
      }

      try {
        await updateClientSpecs(numericId, payload);
        // Refresh detail in background
        loadClient360Detail(numericId);
      } catch (err: any) {
        console.error('Failed to update client specs on backend:', err);
        throw err;
      }
    },
    [activeClientDetail, loadClient360Detail]
  );

  // Handler: Log activity
  const logActivity = useCallback(
    async (clientId: string | number, newEvent: Omit<TimelineEvent, 'id'>) => {
      const numericId = typeof clientId === 'string' ? parseInt(clientId.replace(/\D/g, '')) || Number(clientId) : clientId;

      const fullEvent: TimelineEvent = {
        ...newEvent,
        id: `ev-temp-${Date.now()}`,
      };

      // Optimistic update
      setClients((prev) =>
        prev.map((c) => {
          if (String(c.id) === String(clientId)) {
            return {
              ...c,
              timeline: [fullEvent, ...c.timeline],
            };
          }
          return c;
        })
      );

      if (activeClientDetail && String(activeClientDetail.id) === String(clientId)) {
        setActiveClientDetail((prev) =>
          prev
            ? {
                ...prev,
                timeline: [fullEvent, ...prev.timeline],
              }
            : null
        );
      }

      try {
        await addClientActivity(numericId, {
          title: newEvent.title,
          description: newEvent.details,
          activityType: newEvent.type,
        });
        loadClient360Detail(numericId);
      } catch (err: any) {
        console.error('Failed to save client activity on backend:', err);
        throw err;
      }
    },
    [activeClientDetail, loadClient360Detail]
  );

  // Handler: Reactivate deal
  const reactivateClient = useCallback(
    async (clientId: string | number) => {
      const numericId = typeof clientId === 'string' ? parseInt(clientId.replace(/\D/g, '')) || Number(clientId) : clientId;

      try {
        await updateClient(numericId, {
          status: 'active_job',
          client_category: 'existing_client',
        });
        await addClientActivity(numericId, {
          title: 'Deal Reactivated from Closed Lost Archive',
          description: 'Client reactivated to active pipeline by staff.',
          activityType: 'system',
        });
        await loadClients();
        loadClient360Detail(numericId);
      } catch (err: any) {
        console.error('Failed to reactivate client on backend:', err);
        throw err;
      }
    },
    [loadClients, loadClient360Detail]
  );

  // Handler: Create client
  const createNewClient = useCallback(
    async (payload: CreateClientPayload) => {
      try {
        const res = await createClient(payload);
        await loadClients();
        if (res?.client?.id) {
          setSelectedClientId(String(res.client.id));
        }
        return res;
      } catch (err: any) {
        console.error('Failed to create new client on backend:', err);
        throw err;
      }
    },
    [loadClients]
  );

  // Selected client object fallback
  const currentClient =
    (activeClientDetail && String(activeClientDetail.id) === String(selectedClientId)
      ? activeClientDetail
      : clients.find((c) => String(c.id) === String(selectedClientId))) || clients[0];

  return {
    clients,
    setClients,
    rawClients,
    summary,
    selectedClientId,
    setSelectedClientId,
    currentClient,
    loading,
    detailLoading,
    error,
    total,
    page,
    totalPages,
    loadClients,
    selectClient,
    saveSpecs,
    logActivity,
    reactivateClient,
    createNewClient,
    refetch: loadClients,
  };
}

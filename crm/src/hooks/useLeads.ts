// Rise Up CRM - useLeads React Hook
// Manages real-time leads state, polling, optimistic updates, and CRUD actions

import { useState, useEffect, useCallback, useRef } from 'react';
import { leadsApi, Lead, CreateLeadInput, LeadsCounts } from '@/api/leadsApi';
import { serializeProfileNote } from '@/lib/noteUtils';
import { useAuth } from '@/context/AuthContext';

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<LeadsCounts>({
    all: 0,
    leads: 0,
    new_clients: 0,
    existing_clients: 0,
    lost_leads: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLeads = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      if (leads.length === 0) setIsLoading(true);
      else setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await leadsApi.listLeads({ limit: 100 });
      if (isMountedRef.current) {
        setLeads(data.leads);
        setTotalCount(data.total);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Failed to fetch leads from backend:', err);
        setError(err?.message || 'Could not connect to CRM backend service.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [leads.length]);

  // Initial fetch on mount
  useEffect(() => {
    fetchLeads(false);
  }, []);

  // Background auto-refresh poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLeads(false);
  }, [fetchLeads]);

  // Create lead
  const createLead = useCallback(async (payload: CreateLeadInput): Promise<Lead> => {
    try {
      const created = await leadsApi.createLead(payload);
      setLeads((prev) => [created, ...prev]);
      setTotalCount((c) => c + 1);
      return created;
    } catch (err: any) {
      console.error('Error creating lead:', err);
      throw err;
    }
  }, []);

  // Advance stage
  const advanceStage = useCallback(async (leadId: string | number, nextStage: Lead['status']) => {
    const prevLeads = [...leads];
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: nextStage } : l))
    );

    try {
      await leadsApi.updateLeadStage(leadId, nextStage);
    } catch (err) {
      console.error('Failed to update stage on backend, rolling back:', err);
      setLeads(prevLeads);
      throw err;
    }
  }, [leads]);

  // Mark as lost
  const markAsLost = useCallback(async (
    leadId: string | number,
    reason: NonNullable<Lead['lossReason']>,
    lossNotes?: string
  ) => {
    const prevLeads = [...leads];
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: 'lost',
              lossReason: reason,
              lossNotes: lossNotes || 'Marked as lost during follow-up',
              lostDate: 'Just now',
            }
          : l
      )
    );

    try {
      await leadsApi.markLeadAsLost(leadId, reason, lossNotes, {
        authorName: (user as any)?.name || 'Staff',
        authorRole: (user as any)?.role || 'Team',
      });
    } catch (err) {
      console.error('Failed to mark lead lost on backend, rolling back:', err);
      setLeads(prevLeads);
      throw err;
    }
  }, [leads]);

  // Reactivate lead
  const reactivateLead = useCallback(async (leadId: string | number) => {
    const prevLeads = [...leads];
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: 'contacted',
              lossReason: undefined,
              lossNotes: undefined,
              notes: (l.notes ? l.notes + ' • ' : '') + `Reactivated on ${new Date().toLocaleDateString()}`,
            }
          : l
      )
    );

    try {
      await leadsApi.reactivateLead(leadId);
    } catch (err) {
      console.error('Failed to reactivate lead on backend, rolling back:', err);
      setLeads(prevLeads);
      throw err;
    }
  }, [leads]);

  // Add note / activity with author profile and 12h timestamp - persists to DB permanently
  const addNote = useCallback(async (
    leadId: string | number,
    note: string,
    authorInfo?: { name?: string; role?: string }
  ) => {
    if (!note.trim()) return;
    const isAlreadySerialized = note.trim().startsWith('[');
    const authorName = authorInfo?.name || (user as any)?.name || 'Rise Up Team';
    const authorRole = authorInfo?.role || (user as any)?.role || 'Team';
    const formattedNote = isAlreadySerialized
      ? note.trim()
      : serializeProfileNote(note, authorName, authorRole);

    let updatedNotes = formattedNote;
    setLeads((prev) => {
      const target = prev.find((l) => String(l.id) === String(leadId));
      updatedNotes = target?.notes
        ? `${target.notes}\n\n${formattedNote}`
        : formattedNote;
      return prev.map((l) =>
        String(l.id) === String(leadId) ? { ...l, notes: updatedNotes } : l
      );
    });

    try {
      // 1. Permanently persist updated notes string to leads table in PostgreSQL
      await leadsApi.updateLead(leadId, { notes: updatedNotes });
      // 2. Permanently record immutable activity log
      await leadsApi.addActivity(leadId, 'General Note', note.trim(), 'note', {
        authorName,
        authorRole,
      });
    } catch (err) {
      console.error('Failed to log note activity to backend database:', err);
      throw err;
    }
  }, []);

  return {
    leads,
    setLeads,
    totalCount,
    counts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    createLead,
    advanceStage,
    markAsLost,
    reactivateLead,
    addNote,
  };
}

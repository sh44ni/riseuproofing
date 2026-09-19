// Rise Up CRM — Client 360 Store (Persistent with localStorage)
import { useState, useEffect, useCallback } from 'react';
import { Client360Record, TimelineEvent, ClientQuote } from '@/types/client360Types';
import { INITIAL_CLIENTS_360 } from '@/data/client360Data';
import { formatTimestamp12h } from './noteUtils';

const STORAGE_KEY = 'riseup_client360_records_v1';
const EVENT_NAME = 'riseup_client360_updated';

function loadStoredClients(): Client360Record[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to initial
  }
  return INITIAL_CLIENTS_360;
}

function saveClients(records: Client360Record[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // local storage full or blocked
  }
}

/**
 * Log a completion note and mark a client as completed with 50-year warranty.
 */
export function completeClientJob(
  clientNameOrId: string,
  note: string,
  meta?: { value?: number; address?: string; service?: string },
  authorInfo?: { name?: string; role?: string }
): Client360Record {
  const list = loadStoredClients();
  const searchKey = clientNameOrId.trim().toLowerCase();

  let targetIndex = list.findIndex(
    (c) => c.id.toLowerCase() === searchKey || c.name.toLowerCase() === searchKey
  );

  const timestamp12h = formatTimestamp12h(new Date());
  const authorName = authorInfo?.name || 'Rise Up CRM';
  const authorRole = authorInfo?.role || 'Owner';
  const authorString = `${authorName} (${authorRole})`;

  const completionEvent: TimelineEvent = {
    id: `ev-comp-${Date.now()}`,
    type: 'system',
    title: 'Roofing Project Completed & 50-Year Warranty Activated',
    details: note.trim() || 'Final inspection signed off with homeowner. Clean-up & magnetic sweep passed. 50-Year Golden Pledge warranty registered.',
    date: timestamp12h,
    author: authorString,
    sentiment: 'positive',
  };

  let client: Client360Record;

  if (targetIndex >= 0) {
    const existingJob = list[targetIndex].activeJob;
    client = {
      ...list[targetIndex],
      status: 'completed',
      statusLabel: 'Lifetime Client • 50-Year Warranty',
      timeline: [completionEvent, ...list[targetIndex].timeline],
      activeJob: existingJob
        ? {
            ...existingJob,
            stage: 'Completed & Certified',
            progressPct: 100,
            targetCompletion: timestamp12h,
            contractValue: meta?.value ?? existingJob.contractValue,
          }
        : undefined,
      completedJob: {
        jobId: existingJob?.jobId || `JOB-${Date.now()}`,
        title: `${meta?.service || 'Roofing'} Replacement`,
        totalPaid: meta?.value || 18500,
        installedDate: timestamp12h,
        warrantyType: '50-Year Golden Pledge',
        warrantyCertNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        nextAnnualInspectionDate: 'Mar 2027',
      },
      warrantySummary: {
        ...list[targetIndex].warrantySummary,
        warrantiesCount: Math.max(1, list[targetIndex].warrantySummary.warrantiesCount + 1),
        hasCertificate: true,
        statusText: '50-Year Golden Pledge Lifetime Warranty Active',
      },
    };
    list[targetIndex] = client;
  } else {
    // Create new Client 360 record if client didn't exist prior
    const newId = `client-${Date.now()}`;
    client = {
      id: newId,
      name: clientNameOrId.trim(),
      phone: '',
      email: '',
      address: meta?.address || '',
      city: '',
      zip: '',
      status: 'completed',
      statusLabel: 'Lifetime Client • 50-Year Warranty',
      assignedRep: {
        name: 'Marc Sarellano',
        role: 'Owner / Qualifier',
        badge: 'OWNER / QUALIFIER',
      },
      originSource: 'Rise Up Sales Pipeline',
      roofSpecs: {
        address: meta?.address || 'Oceanside, CA',
        cityZip: 'Oceanside 92056',
        roofMaterial: meta?.service || '',
        roofAreaSqFt: 0,
        roofSquares: 0,
        stories: '',
        roofAgeYears: 0,
        hoaCommunity: '',
        originRepName: authorInfo?.name || '',
        pitch: '',
        deckingCondition: '',
        valleysCount: 0,
        solarPresent: false,
      },
      activeJob: {
        jobId: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${meta?.service || 'Roofing'} Project Completed`,
        stage: 'Completed & Certified',
        contractValue: meta?.value || 0,
        crewLead: 'TBD',
        scheduledStart: 'Completed',
        progressPct: 100,
        targetCompletion: 'Today',
      },
      completedJob: {
        jobId: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${meta?.service || 'Roofing'} Project Completed`,
        totalPaid: meta?.value || 0,
        installedDate: 'Today',
        warrantyType: '50-Year Golden Pledge',
        warrantyCertNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        nextAnnualInspectionDate: 'Mar 2027',
      },
      billingSummary: {
        totalBilled: meta?.value || 0,
        collectedCash: meta?.value || 0,
        pendingDeposit: 0,
        invoicesOnFileCount: 1,
        paymentHealthStatus: 'current_and_paid',
        paymentHealthMessage: 'Paid in full upon final completion',
        invoices: [],
      },
      warrantySummary: {
        warrantiesCount: 1,
        hasCertificate: true,
        statusText: '50-Year Golden Pledge Lifetime Warranty Active',
        certificates: [
          {
            id: `cert-${Date.now()}`,
            type: '50-Year Golden Pledge Lifetime Warranty',
            certNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            issuer: 'GAF Master Elite / Rise Up Roofing',
            termYears: 50,
            coverage: '100% Non-prorated labor, materials, tear-off, and disposal',
            validUntil: 'Mar 2076',
          },
        ],
      },
      tasks: [],
      quotes: [],
      timeline: [completionEvent],
    };
    list.unshift(client);
  }

  saveClients(list);
  return client;
}

/**
 * Add a note or event to a client's 360 profile
 */
export function addClientNote(clientNameOrId: string, note: string, author = 'Marc Sarellano (Owner)') {
  const list = loadStoredClients();
  const searchKey = clientNameOrId.trim().toLowerCase();

  const targetIndex = list.findIndex(
    (c) => c.id.toLowerCase() === searchKey || c.name.toLowerCase() === searchKey
  );

  const event: TimelineEvent = {
    id: `ev-note-${Date.now()}`,
    type: 'note',
    title: 'Field & Completion Note',
    details: note.trim(),
    date: formatTimestamp12h(new Date()),
    author,
    sentiment: 'neutral',
  };

  if (targetIndex >= 0) {
    list[targetIndex].timeline = [event, ...list[targetIndex].timeline];
    saveClients(list);
  }
}

/**
 * React hook to access and update Client 360 records
 */
export function useClients360() {
  const [clients, setClients] = useState<Client360Record[]>(loadStoredClients);

  const refresh = useCallback(() => {
    setClients(loadStoredClients());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const updateClients = useCallback((newRecords: Client360Record[] | ((prev: Client360Record[]) => Client360Record[])) => {
    setClients((prev) => {
      const next = typeof newRecords === 'function' ? newRecords(prev) : newRecords;
      saveClients(next);
      return next;
    });
  }, []);

  return { clients, setClients: updateClients, refresh };
}

/**
 * Attach or record an estimate proposal inside a client's 360 profile.
 */
export function attachEstimateToClient360(
  clientNameOrId: string,
  data: {
    estimateNumber: string;
    total: number;
    pdfUrl?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerCity?: string;
    roofSquares?: number;
    roofPitch?: string;
    stories?: string;
    optionA?: { title: string; price: number };
    optionB?: { title: string; price: number };
    status?: 'draft' | 'sent' | 'approved' | 'declined';
  }
): Client360Record {
  const list = loadStoredClients();
  const searchKey = clientNameOrId.trim().toLowerCase();

  const targetIndex = list.findIndex(
    (c) => c.id.toLowerCase() === searchKey || c.name.toLowerCase() === searchKey
  );

  const timestamp12h = formatTimestamp12h(new Date());

  const newQuote: ClientQuote = {
    id: `quote-${Date.now()}`,
    quoteNumber: data.estimateNumber,
    title: `Roofing Proposal (${data.roofSquares || 25} SQ • ${data.optionA?.title || 'Tile Roof'})`,
    amount: data.total,
    status: data.status || 'sent',
    date: timestamp12h,
    tierOptions: [
      { name: data.optionA?.title || 'Option A', price: data.optionA?.price || data.total, selected: false },
      { name: data.optionB?.title || 'Option B', price: data.optionB?.price || Math.round(data.total * 1.2), selected: true },
    ],
  };

  const timelineEvent: TimelineEvent = {
    id: `ev-est-${Date.now()}`,
    type: 'estimate',
    title: `Official 2-Page Proposal Sent (${data.estimateNumber})`,
    details: `Official 2-page proposal of $${data.total.toLocaleString()} generated and emailed via Resend to ${data.customerEmail || 'homeowner'}. Includes 20-Day Lock-In terms.`,
    date: timestamp12h,
    author: 'Marc Sarellano (Owner)',
    sentiment: 'positive',
  };

  let client: Client360Record;

  if (targetIndex >= 0) {
    const existing = list[targetIndex];
    client = {
      ...existing,
      quotes: [newQuote, ...(existing.quotes || [])],
      timeline: [timelineEvent, ...(existing.timeline || [])],
      roofSpecs: {
        ...existing.roofSpecs,
        roofSquares: data.roofSquares || existing.roofSpecs.roofSquares,
        pitch: data.roofPitch || existing.roofSpecs.pitch,
        stories: data.stories || existing.roofSpecs.stories,
      },
    };
    list[targetIndex] = client;
  } else {
    client = {
      id: `client-${Date.now()}`,
      name: clientNameOrId.trim(),
      phone: data.customerPhone || '(760) 555-0199',
      email: data.customerEmail || 'client@example.com',
      address: data.customerAddress || 'Client Residence',
      city: data.customerCity || 'Oceanside',
      zip: '92054',
      status: 'lead_review',
      statusLabel: 'Active Proposal Sent',
      assignedRep: {
        name: 'Marc Sarellano',
        role: 'Owner / Qualifier',
        badge: 'OWNER',
      },
      originSource: 'Proposal Studio',
      roofSpecs: {
        address: data.customerAddress || 'Client Residence',
        cityZip: `${data.customerCity || 'Oceanside'} 92054`,
        roofMaterial: 'Tile / Shingle',
        roofAreaSqFt: (data.roofSquares || 25) * 100,
        roofSquares: data.roofSquares || 25,
        stories: data.stories || '1 Story',
        roofAgeYears: 20,
        hoaCommunity: 'No',
        originRepName: 'Marc Sarellano',
        pitch: data.roofPitch || '4:12',
      },
      billingSummary: {
        totalBilled: 0,
        collectedCash: 0,
        pendingDeposit: 0,
        invoicesOnFileCount: 0,
        paymentHealthStatus: 'deposit_pending',
        paymentHealthMessage: `Proposal for $${data.total.toLocaleString()} pending client sign-off.`,
        invoices: [],
      },
      warrantySummary: {
        warrantiesCount: 0,
        hasCertificate: false,
        statusText: '10-Year Workmanship Warranty upon project sign-off',
        certificates: [],
      },
      tasks: [],
      timeline: [timelineEvent],
      quotes: [newQuote],
    };
    list.unshift(client);
  }

  saveClients(list);
  return client;
}

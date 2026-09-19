// Rise Up CRM — Client 360 Adapter
// Bridges backend PostgreSQL records with frontend Client360Record UI schema

import {
  Client360Record,
  ClientStatus,
  TimelineEvent,
  RoofSpecs,
  BillingSummary,
  WarrantySummary,
  ClientTask,
  ClientQuote,
  ActiveJob,
  CompletedJob,
  LossPostMortem,
} from '@/types/client360Types';
import { ClientApiRecord, Client360ApiResponse } from '@/api/clientsApi';

export function normalizeClientStatus(
  status?: string | null,
  category?: string | null,
  hasCompletedJob?: boolean
): { status: ClientStatus; label: string } {
  const s = (status || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (c === 'lost_lead' || s === 'lost' || s === 'closed_lost') {
    return { status: 'closed_lost', label: 'Closed Lost • Win-Back Opportunity' };
  }

  if (s === 'completed' || s === 'repeat' || c === 'existing_client' || hasCompletedJob) {
    return { status: 'completed', label: 'Lifetime Client • 50-Year Warranty' };
  }

  if (s === 'active_job' || s === 'in_progress' || s === 'scheduled' || c === 'new_client') {
    return { status: 'active_job', label: 'Existing Client • Active Jobsite' };
  }

  return { status: 'lead_review', label: 'Pipeline Prospect' };
}

export function backendClientToClient360(
  raw: ClientApiRecord,
  detail?: Partial<Client360ApiResponse>
): Client360Record {
  const warranties = detail?.warranties || [];
  const invoices = detail?.invoices || [];
  const jobs = detail?.jobs || [];
  const estimates = detail?.estimates || [];
  const activities = detail?.activities || [];
  const tasks = detail?.tasks || [];

  const hasCompletedJob =
    jobs.some((j: any) => j.status === 'completed') ||
    raw.status === 'completed' ||
    warranties.length > 0;

  const { status, label: statusLabel } = normalizeClientStatus(
    raw.status,
    raw.client_category,
    hasCompletedJob
  );

  const repName = raw.acquired_by_name || raw.assigned_to_name || 'Staff';
  const repRole = raw.acquired_by_role || 'Sales Rep';

  // Roof Specs
  const roofSpecs: RoofSpecs = {
    address: raw.address || 'Address pending',
    cityZip: `${raw.city || 'Oceanside'} ${raw.zip || raw.zip_code || '92054'}`.trim(),
    roofMaterial: raw.roof_type || 'Eagle Concrete Tile',
    roofAreaSqFt: raw.roof_sqf || 2400,
    roofSquares: raw.roof_sqf ? Math.round(raw.roof_sqf / 100) : 24,
    stories: raw.stories ? `${raw.stories}-Story` : '1-Story',
    roofAgeYears: raw.roof_age || 15,
    hoaCommunity: raw.hoa ? 'Yes (Strict HOA)' : 'No HOA',
    originRepName: repName,
  };

  // Active Job (if present)
  let activeJob: ActiveJob | undefined = undefined;
  const inProgressJob = jobs.find((j: any) => j.status !== 'completed' && j.status !== 'cancelled');
  if (inProgressJob || status === 'active_job') {
    activeJob = {
      jobId: inProgressJob?.job_number || `JOB-${raw.id}`,
      title: inProgressJob?.name || `${raw.roof_type || 'Tile'} Roof Installation`,
      stage: inProgressJob?.status ? inProgressJob.status.replace(/_/g, ' ').toUpperCase() : 'In Progress',
      contractValue: Number(inProgressJob?.contract_amount || raw.total_revenue || 22000),
      crewLead: inProgressJob?.foreman_name || 'Assigned Soon',
      scheduledStart: inProgressJob?.start_date ? new Date(inProgressJob.start_date).toLocaleDateString() : 'Active',
      progressPct: inProgressJob?.progress_pct ?? 45,
    };
  }

  // Completed Job (if present)
  let completedJob: CompletedJob | undefined = undefined;
  const finishedJob = jobs.find((j: any) => j.status === 'completed') || jobs[0];
  if (status === 'completed') {
    completedJob = {
      jobId: finishedJob?.job_number || `JOB-${raw.id}`,
      title: finishedJob?.name || 'Full Eagle Concrete Tile Replacement',
      totalPaid: Number(raw.total_paid || raw.total_revenue || 24500),
      installedDate: finishedJob?.completed_at ? new Date(finishedJob.completed_at).toLocaleDateString() : 'Installed',
      warrantyType: '50-Year Golden Pledge & Manufacturer Lifetime',
      warrantyCertNumber: warranties[0]?.certificate_number || `RUP-CERT-${raw.id}`,
      nextAnnualInspectionDate: 'Annual Routine',
    };
  }

  // Loss Post Mortem (if lost)
  let lossPostMortem: LossPostMortem | undefined = undefined;
  if (status === 'closed_lost') {
    lossPostMortem = {
      opportunityId: `OPP-${raw.id}`,
      title: 'Full Tile Replacement & Underlayment',
      proposedValue: Number(raw.latest_estimate_total || 22000),
      lossReason: raw.lost_reason || raw.lead_lost_reason || 'Competitor Underbid & Delay',
      lossReasonKey: 'competitor_price',
      lostDate: raw.updated_at ? new Date(raw.updated_at).toLocaleDateString() : 'Recently',
      daysAgo: 14,
      autopsyNotes: raw.notes || 'Homeowner chose an alternate proposal or postponed work.',
      riskVulnerabilities: ['Competitor undercut pricing', 'Homeowner financing postponed'],
      winBackDate: 'Next 30 Days',
      winBackStrategy: 'Re-engage homeowner with upgraded manufacturer warranty incentive.',
      canReactivate: true,
    };
  }

  // Invoices & Billing Summary
  const invoiceList = invoices.map((inv: any) => ({
    id: String(inv.id),
    invoiceNumber: inv.invoice_number || `INV-${inv.id}`,
    date: inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Recent',
    amount: Number(inv.amount || 0),
    status: (inv.status || 'paid') as 'paid' | 'pending' | 'overdue',
    description: inv.description || 'Roofing Materials & Labor',
  }));

  const totalBilled = raw.total_billed ?? invoiceList.reduce((sum: number, i: any) => sum + i.amount, 0);
  const totalPaid = raw.total_paid ?? raw.total_revenue ?? totalBilled;
  const balanceDue = raw.balance_due ?? Math.max(0, totalBilled - totalPaid);

  const billingSummary: BillingSummary = {
    totalBilled,
    collectedCash: totalPaid,
    pendingDeposit: balanceDue,
    invoicesOnFileCount: invoiceList.length,
    paymentHealthStatus: balanceDue > 0 ? 'deposit_pending' : 'current_and_paid',
    paymentHealthMessage: balanceDue > 0 ? `$${balanceDue.toLocaleString()} Balance Pending` : 'All Accounts Current & Settled',
    invoices: invoiceList,
  };

  // Warranty Summary
  const certificates = warranties.map((w: any) => ({
    id: String(w.id),
    type: w.warranty_type || '50-Year Manufacturer Warranty',
    certNumber: w.certificate_number || `RUP-CERT-${raw.id}`,
    issuer: w.provider || 'Eagle Roofing Products / GAF',
    termYears: w.duration_years || 50,
    coverage: w.coverage_details || '100% Non-Prorated Labor & Materials Coverage',
    validUntil: w.expires_at ? new Date(w.expires_at).toLocaleDateString() : '2074-06-01',
  }));

  const warrantySummary: WarrantySummary = {
    warrantiesCount: certificates.length,
    hasCertificate: certificates.length > 0 || status === 'completed',
    statusText: certificates.length > 0 ? 'Active 50-Year Protection' : 'Standard Workmanship Guarantee',
    certificates,
  };

  // Tasks
  const clientTasks: ClientTask[] = tasks.map((t: any) => ({
    id: String(t.id),
    title: t.title || 'Task Reminder',
    dueDate: t.due_at ? new Date(t.due_at).toLocaleDateString() : 'Upcoming',
    completed: Boolean(t.completed_at),
    assignedTo: t.assigned_to_name || repName,
    priority: (t.priority || 'medium') as 'high' | 'medium' | 'low',
  }));

  // Timeline Events
  const timeline: TimelineEvent[] = activities.map((act: any) => ({
    id: String(act.id),
    type: (act.activity_type || 'note') as any,
    title: act.title || 'Activity Logged',
    date: act.created_at ? new Date(act.created_at).toLocaleString() : 'Recently',
    author: act.user_name || act.performed_by || 'Staff',
    details: act.description || '',
    sentiment: act.metadata?.sentiment || 'neutral',
  }));

  // Estimates / Quotes
  const quotes: ClientQuote[] = estimates.map((est: any) => ({
    id: String(est.id),
    quoteNumber: est.estimate_number || `EST-${est.id}`,
    title: est.title || 'Roof Replacement Estimate',
    amount: Number(est.total || 0),
    status: (est.status || 'sent') as any,
    date: est.created_at ? new Date(est.created_at).toLocaleDateString() : 'Recently',
  }));

  return {
    id: String(raw.id),
    name: raw.full_name || 'Homeowner',
    phone: raw.phone || 'No phone',
    email: raw.email || 'No email',
    address: raw.address || 'Address pending',
    city: raw.city || 'Oceanside',
    zip: raw.zip || raw.zip_code || '92054',
    status,
    statusLabel,
    assignedRep: {
      name: repName,
      role: repRole,
      badge: 'Certified',
      avatar: raw.acquired_by_avatar || undefined,
    },
    originSource: raw.lead_source_detail || (raw.source_type === 'team_member' ? 'Sales Rep Outreach' : 'Website Inbound'),
    roofSpecs,
    activeJob,
    completedJob,
    lossPostMortem,
    billingSummary,
    warrantySummary,
    tasks: clientTasks,
    timeline,
    quotes,
  };
}

export function roofSpecsToBackendPayload(specs: Partial<RoofSpecs>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (specs.address !== undefined) payload.address = specs.address;
  if (specs.roofMaterial !== undefined) payload.roof_type = specs.roofMaterial;
  if (specs.roofAreaSqFt !== undefined) payload.roof_sqf = specs.roofAreaSqFt;
  if (specs.roofAgeYears !== undefined) payload.roof_age = specs.roofAgeYears;
  if (specs.stories !== undefined) {
    const parsed = parseInt(String(specs.stories));
    if (!isNaN(parsed)) payload.stories = parsed;
  }
  if (specs.hoaCommunity !== undefined) {
    payload.hoa = specs.hoaCommunity.toLowerCase().includes('yes');
  }
  if (specs.cityZip) {
    const parts = specs.cityZip.trim().split(' ');
    if (parts.length > 0) payload.city = parts[0];
    if (parts.length > 1) payload.zip = parts[parts.length - 1];
  }
  return payload;
}

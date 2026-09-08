'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  User,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Layers,
  FileText,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';

interface JobSummary {
  id: number;
  job_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  contract_value: number | string;
  client_id?: number;
  status: string;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdInvoice: any) => void;
  initialJobId?: number | string;
  initialJob?: JobSummary;
}

const PRESET_MILESTONES = [
  'Deposit / Down Payment (CSLB Capped)',
  'Material Delivery (Rooftop Drop)',
  'Tear-Off & Deck Inspection',
  'Dry-In & Underlayment Inspection',
  'Tile / Shingle Field Installation',
  'Final City Inspection & Sign-off',
  'Decking / Plywood Dry Rot Repair (Extra Scope)',
  'Solar Detach & Reset Milestone',
  'Custom Milestone',
];

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  initialJobId,
  initialJob,
}: CreateInvoiceModalProps) {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [searchJobQuery, setSearchJobQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(initialJob || null);

  // Tab: 'cslb_schedule' | 'single_milestone'
  const [mode, setMode] = useState<'cslb_schedule' | 'single_milestone'>('cslb_schedule');

  // Single milestone form fields
  const [presetMilestone, setPresetMilestone] = useState(PRESET_MILESTONES[0]);
  const [customMilestoneName, setCustomMilestoneName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');

  // Submissions state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch jobs if modal opened without a preselected job
  useEffect(() => {
    if (!isOpen) return;

    if (initialJob) {
      setSelectedJob(initialJob);
      return;
    }

    if (initialJobId && jobs.length > 0) {
      const match = jobs.find(j => String(j.id) === String(initialJobId));
      if (match) setSelectedJob(match);
    }

    async function loadJobs() {
      setLoadingJobs(true);
      try {
        const res = await fetch('/api/admin/jobs');
        if (res.ok) {
          const data = await res.json();
          const list: JobSummary[] = data.jobs || [];
          setJobs(list);

          if (initialJobId) {
            const found = list.find(j => String(j.id) === String(initialJobId));
            if (found) setSelectedJob(found);
          }
        }
      } catch (err) {
        console.error('Failed to load active jobs', err);
      } finally {
        setLoadingJobs(false);
      }
    }

    if (jobs.length === 0) {
      loadJobs();
    }
  }, [isOpen, initialJobId, initialJob, jobs]);

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    if (!searchJobQuery.trim()) return jobs.slice(0, 10);
    const q = searchJobQuery.toLowerCase();
    return jobs
      .filter(
        j =>
          (j.job_number && j.job_number.toLowerCase().includes(q)) ||
          (j.customer_name && j.customer_name.toLowerCase().includes(q)) ||
          (j.address && j.address.toLowerCase().includes(q)) ||
          (j.city && j.city.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [jobs, searchJobQuery]);

  // CSLB 4-Stage calculation for selected job
  const cslbMilestones = useMemo(() => {
    if (!selectedJob) return null;
    const contract = Number(selectedJob.contract_value) || 0;
    // CSLB statutory down payment: 10% or $1,000, whichever is less
    const deposit = Math.min(1000, contract * 0.1);
    const delivery = contract * 0.4;
    const dryIn = contract * 0.4;
    const finalBalance = Math.max(0, contract - (deposit + delivery + dryIn));

    return [
      {
        step: 1,
        name: 'Stage 1: Down Payment Deposit',
        percent: contract > 0 ? ((deposit / contract) * 100).toFixed(1) : '0',
        amount: deposit,
        timing: 'Due at contract signing / job start',
        rule: 'CSLB § 7159 Cap: Lesser of $1,000 or 10%',
      },
      {
        step: 2,
        name: 'Stage 2: Material Delivery',
        percent: '40.0',
        amount: delivery,
        timing: 'Due upon rooftop drop & verification',
        rule: 'Substantial materials delivered on-site',
      },
      {
        step: 3,
        name: 'Stage 3: Dry-in / Mid-Roof Inspection',
        percent: '40.0',
        amount: dryIn,
        timing: 'Due upon deck repair & underlayment sign-off',
        rule: 'Dry-in inspection passed by city/inspector',
      },
      {
        step: 4,
        name: 'Stage 4: Final Inspection & Completion',
        percent: contract > 0 ? ((finalBalance / contract) * 100).toFixed(1) : '0',
        amount: finalBalance,
        timing: 'Due upon final city sign-off & warranty delivery',
        rule: '100% completion & homeowner satisfaction',
      },
    ];
  }, [selectedJob]);

  // CSLB down payment validation warning for single milestone
  const milestoneName = presetMilestone === 'Custom Milestone' ? customMilestoneName : presetMilestone;
  const isDepositMilestone = milestoneName.toLowerCase().includes('deposit') || milestoneName.toLowerCase().includes('down payment');
  const numAmount = parseFloat(amount) || 0;
  const isDepositOverCslbCap = isDepositMilestone && numAmount > 1000;

  async function handleCreateCSLBSchedule() {
    if (!selectedJob) {
      setError('Please select an active pipeline job first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateMilestones: true,
          jobId: selectedJob.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate CSLB milestone invoices');
      }

      setSuccessMsg(`Successfully generated 4 CSLB milestone invoices for Job ${selectedJob.job_number}!`);
      if (onSuccess) onSuccess(data);

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An error occurred generating invoices');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSingleMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob) {
      setError('Please select an active pipeline job first.');
      return;
    }

    const finalName = milestoneName.trim();
    if (!finalName) {
      setError('Please enter or select a milestone name.');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid invoice amount.');
      return;
    }

    if (!dueDate) {
      setError('Please select an invoice due date.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          milestoneName: finalName,
          amount: numAmount,
          dueDate,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      setSuccessMsg(`Invoice ${data.invoice?.invoice_number || ''} created and synced with Client 360!`);
      if (onSuccess) onSuccess(data.invoice);

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An error occurred creating invoice');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-[24px] bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0B1E33]">
                Create Job Milestone Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Pipeline-enforced billing with verified Client 360 sync &amp; CSLB compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800 text-xs font-bold">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Job & Client Selection Step */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                1. Target Pipeline Job &amp; Client <span className="text-rose-500">*</span>
              </label>
              {selectedJob && !initialJobId && (
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="text-xs text-[#1878B8] font-bold hover:underline cursor-pointer"
                >
                  Change Job
                </button>
              )}
            </div>

            {!selectedJob ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name, job number (JOB-...), or address..."
                    value={searchJobQuery}
                    onChange={e => setSearchJobQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-[#EAA636] focus:outline-hidden"
                  />
                </div>

                <div className="border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
                  {loadingJobs ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading active pipeline jobs...</div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching jobs found. Invoices require an active job in the pipeline.
                    </div>
                  ) : (
                    filteredJobs.map(j => (
                      <div
                        key={j.id}
                        onClick={() => setSelectedJob(j)}
                        className="p-2.5 px-3 hover:bg-amber-50/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1878B8]">{j.job_number}</span>
                            <span className="text-xs font-bold text-[#0B1E33]">{j.customer_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {j.address ? `${j.address}, ${j.city || 'CA'}` : 'San Diego, CA'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-[#0B1E33]">
                            ${Number(j.contract_value || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {j.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Verified Client 360 Profile Card */
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-100 text-[#1878B8]">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0B1E33]">{selectedJob.customer_name}</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <ShieldCheck size={11} />
                          Verified Client 360
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-[#1878B8] mt-0.5">
                        Job Ref: {selectedJob.job_number}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Contract</span>
                    <div className="text-base font-black text-[#0B1E33]">
                      ${Number(selectedJob.contract_value || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>{selectedJob.address ? `${selectedJob.address}, ${selectedJob.city || 'CA'}` : 'San Diego, CA'}</span>
                  </div>
                  {selectedJob.customer_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{selectedJob.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Billing Mode Selector */}
          {selectedJob && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  2. Choose Invoicing Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('cslb_schedule')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'cslb_schedule'
                        ? 'bg-amber-50/70 border-[#EAA636] ring-1 ring-[#EAA636]'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers size={16} className={mode === 'cslb_schedule' ? 'text-[#d49428]' : 'text-slate-400'} />
                      <span className="text-xs font-bold text-[#0B1E33]">CSLB 4-Stage Schedule</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standard statutory progress billing: Deposit ($1k cap) &rarr; Material &rarr; Dry-in &rarr; Final
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('single_milestone')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'single_milestone'
                        ? 'bg-amber-50/70 border-[#EAA636] ring-1 ring-[#EAA636]'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={16} className={mode === 'single_milestone' ? 'text-[#d49428]' : 'text-slate-400'} />
                      <span className="text-xs font-bold text-[#0B1E33]">Single Milestone Invoice</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Issue an individual milestone, deck repair extra, or custom scope billing
                    </p>
                  </button>
                </div>
              </div>

              {/* Mode A: CSLB 4-Stage Breakdown */}
              {mode === 'cslb_schedule' && cslbMilestones && (
                <div className="space-y-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/90">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1E33] flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-600" />
                        California CSLB § 7159 Compliance Schedule
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Guarantees contract down payment does not exceed $1,000 or 10% statutory limit.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cslbMilestones.map(m => (
                      <div
                        key={m.step}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-[#0B1E33]">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {m.timing} &bull; <span className="text-amber-700">{m.rule}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-[#0B1E33] text-sm">
                            ${m.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            {m.percent}% of contract
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs">
                    <span className="font-bold text-slate-600">Total Scheduled Billed:</span>
                    <span className="font-black text-base text-[#0B1E33]">
                      ${Number(selectedJob.contract_value || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCreateCSLBSchedule}
                    className="w-full py-2.5 px-4 rounded-xl admin-btn-gold text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Sparkles size={15} />
                    {submitting
                      ? 'Generating Invoices & Syncing Client...'
                      : `Generate 4 CSLB Milestones ($${Number(selectedJob.contract_value || 0).toLocaleString()})`}
                  </button>
                </div>
              )}

              {/* Mode B: Single Milestone Form */}
              {mode === 'single_milestone' && (
                <form onSubmit={handleCreateSingleMilestone} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Milestone Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={presetMilestone}
                      onChange={e => setPresetMilestone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#EAA636] focus:outline-hidden"
                    >
                      {PRESET_MILESTONES.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {presetMilestone === 'Custom Milestone' && (
                      <input
                        type="text"
                        placeholder="Enter custom milestone name (e.g. Fascia Board Replacement)"
                        value={customMilestoneName}
                        onChange={e => setCustomMilestoneName(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs text-slate-800 focus:border-[#EAA636] focus:outline-hidden"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Invoice Amount ($) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="e.g. 5000"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-200/90 pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#EAA636] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Due Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200/90 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-[#EAA636] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CSLB Down payment statutory advisory if amount > $1,000 for deposit */}
                  {isDepositOverCslbCap && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                        CSLB § 7159 Statutory Cap Notice
                      </div>
                      <p className="text-[11px] text-amber-900/80">
                        Under California Business &amp; Professions Code § 7159, down payments on home improvement contracts cannot legally exceed <strong>$1,000 or 10%</strong> of the contract amount, whichever is less.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Milestone Scope &amp; Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or milestone completion criteria displayed on client invoice..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/90 p-3 text-xs text-slate-800 focus:border-[#EAA636] focus:outline-hidden resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl admin-btn-gold text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <FileText size={15} />
                    {submitting
                      ? 'Creating Invoice...'
                      : `Issue Milestone Invoice (${numAmount > 0 ? `$${numAmount.toLocaleString()}` : '$0'})`}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

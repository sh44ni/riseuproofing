'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Hammer,
  Shield,
  Truck,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  Trash2,
  ExternalLink,
  FileText,
  DollarSign,
  Receipt,
  Plus,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Building2,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { STAGES } from '../page';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import JobPhotoGallery from '@/components/admin/jobs/JobPhotoGallery';

interface JobDetail {
  id: number;
  job_number: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  zip?: string;
  service_type?: string;
  contract_value: number;
  permit_status: string;
  permit_number?: string;
  permit_filed_at?: string;
  permit_approved_at?: string;
  material_status: string;
  material_ordered_at?: string;
  material_delivered_at?: string;
  crew_lead?: string;
  scheduled_start?: string;
  estimated_days?: number;
  weather_delays?: number;
  notes?: string;
  created_at: string;
  estimate_id?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  milestone_name: string;
  amount: number | string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
}

interface JobExpense {
  id: number;
  category: string;
  vendor: string;
  amount: number | string;
  invoice_receipt_number?: string;
  expense_date: string;
  notes?: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [estimate, setEstimate] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<JobExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Job Form state
  const [status, setStatus] = useState('permit_pending');
  const [permitStatus, setPermitStatus] = useState('not_filed');
  const [permitNumber, setPermitNumber] = useState('');
  const [materialStatus, setMaterialStatus] = useState('not_ordered');
  const [crewLead, setCrewLead] = useState('Carlos');
  const [scheduledStart, setScheduledStart] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [weatherDelays, setWeatherDelays] = useState(0);
  const [notes, setNotes] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('materials');
  const [expenseVendor, setExpenseVendor] = useState('ABC Supply');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseNotes, setExpenseNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Invoicing
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('check');
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Warranties
  const [warranties, setWarranties] = useState<any[]>([]);
  const [issuingWarranty, setIssuingWarranty] = useState(false);

  const loadJob = useCallback(async () => {
    try {
      const [jobRes, invRes, expRes, warRes] = await Promise.all([
        fetch(`/api/admin/jobs/${jobId}`),
        fetch(`/api/admin/invoices?job_id=${jobId}`),
        fetch(`/api/admin/expenses?job_id=${jobId}`),
        fetch(`/api/admin/warranties?job_id=${jobId}`),
      ]);

      if (jobRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!jobRes.ok) {
        router.push('/admin/jobs');
        return;
      }

      const jobData = await jobRes.json();
      const j = jobData.job;
      setJob(j);
      setEstimate(jobData.estimate);

      setStatus(j.status || 'permit_pending');
      setPermitStatus(j.permit_status || 'not_filed');
      setPermitNumber(j.permit_number || '');
      setMaterialStatus(j.material_status || 'not_ordered');
      setCrewLead(j.crew_lead || 'Carlos');
      setScheduledStart(j.scheduled_start ? j.scheduled_start.slice(0, 10) : '');
      setEstimatedDays(j.estimated_days || 3);
      setWeatherDelays(j.weather_delays || 0);
      setNotes(j.notes || '');

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData.expenses || []);
      }

      if (warRes.ok) {
        const warData = await warRes.json();
        setWarranties(warData.warranties || []);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  async function handleIssueWarranty() {
    setIssuingWarranty(true);
    try {
      const res = await fetch('/api/admin/warranties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          warrantyType: 'Owens Corning Preferred Protection (50-Yr System)',
          yearsDuration: 50,
        }),
      });
      if (res.ok) {
        loadJob();
      } else {
        alert('Failed to issue warranty');
      }
    } catch (err) {
      console.error(err);
      alert('Error issuing warranty');
    } finally {
      setIssuingWarranty(false);
    }
  }

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          permit_status: permitStatus,
          permit_number: permitNumber,
          material_status: materialStatus,
          crew_lead: crewLead,
          scheduled_start: scheduledStart || null,
          estimated_days: estimatedDays,
          weather_delays: weatherDelays,
          notes,
        }),
      });
      loadJob();
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateMilestones() {
    setGeneratingInvoices(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateMilestones: true,
          jobId,
        }),
      });
      if (res.ok) {
        loadJob();
      } else {
        alert('Failed to generate milestone invoices');
      }
    } finally {
      setGeneratingInvoices(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseAmount || !expenseVendor) return;
    setSavingExpense(true);

    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          category: expenseCategory,
          vendor: expenseVendor,
          amount: expenseAmount,
          invoiceReceiptNumber: expenseReceipt,
          expenseDate,
          notes: expenseNotes,
        }),
      });

      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseAmount('');
        setExpenseReceipt('');
        setExpenseNotes('');
        loadJob();
      } else {
        alert('Failed to log expense');
      }
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(id: number) {
    if (!confirm('Remove this expense entry?')) return;
    await fetch(`/api/admin/expenses?id=${id}`, { method: 'DELETE' });
    loadJob();
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activePaymentInvoice) return;
    setSavingPayment(true);

    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activePaymentInvoice.id,
          status: 'paid',
          paymentMethod,
          transactionId: paymentTxId,
          notes: paymentNotes,
        }),
      });

      if (res.ok) {
        setActivePaymentInvoice(null);
        setPaymentTxId('');
        setPaymentNotes('');
        loadJob();
      } else {
        alert('Failed to record payment');
      }
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this job record?')) return;
    await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
    router.push('/admin/jobs');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) return null;

  // Profit calculations
  const contractValue = Number(job.contract_value) || 0;
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const realizedProfit = contractValue - totalExpenses;
  const realizedMargin = contractValue > 0 ? ((realizedProfit / contractValue) * 100).toFixed(1) : '0';

  const collectedCash = invoices
    .filter(i => i.status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-12">
      {/* Top Breadcrumb — Sticky on mobile */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2.5 lg:mx-0 lg:px-0 lg:py-0 bg-white/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-slate-200/80 lg:border-none flex items-center justify-between gap-4">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0B1E33] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Jobs Board
        </Link>

        <button
          onClick={handleDelete}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete Job"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {job.job_number}
              </span>
              <span className="text-xs text-slate-500">{job.service_type || 'Roof Replacement'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E33] mt-1">
              {job.customer_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin size={14} className="text-slate-400" />
              {job.address ? `${job.address}${job.city ? `, ${job.city}` : ''}` : 'No address specified'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Value</p>
            <p className="text-3xl font-black text-[#0B1E33] tabular-nums">
              ${Number(job.contract_value).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Contact & Estimate Link */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          {job.customer_phone && (
            <a
              href={`tel:${job.customer_phone.replace(/\\D/g, '')}`}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold"
            >
              <Phone size={13} /> Call Homeowner
            </a>
          )}

          {job.estimate_id && (
            <Link
              href={`/admin/estimates/${job.estimate_id}`}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold"
            >
              <FileText size={13} /> View Originating Estimate
            </Link>
          )}

          <Link
            href="/admin/finances"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-50 text-[#1878B8] hover:bg-sky-100 border border-sky-200 text-xs font-semibold"
          >
            <DollarSign size={13} /> View Accounts Receivable
          </Link>
        </div>
      </div>

      {/* SECTION: Realized Profitability & Job Financials */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              Job Profitability &amp; Financial Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Contract value vs actual supplier expenses, dumpster fees and realized margin %
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Log Expense
            </button>
          </div>
        </div>

        {/* Profitability KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[16px] bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Contract</span>
            <div className="text-xl font-black text-[#0B1E33] mt-0.5">
              ${contractValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              ${collectedCash.toLocaleString()} collected
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Actual Costs</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">
              ${totalExpenses.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {expenses.length} expense receipt{expenses.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Realized Gross Profit</span>
            <div className="text-xl font-black text-[#0B1E33] mt-0.5">
              ${realizedProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">After all materials &amp; dump</div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-sky-50/50 border border-sky-200">
            <span className="text-[10px] uppercase font-bold text-[#1878B8]">Realized Gross Margin</span>
            <div className="text-xl font-black text-[#1878B8] mt-0.5">
              {realizedMargin}%
            </div>
            <div className="text-[11px] text-[#1878B8]/80 mt-0.5 font-medium">
              Target: 38% - 42%
            </div>
          </div>
        </div>

        {/* Milestone Invoicing Subsection */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Receipt size={15} className="text-[#EAA636]" />
              CSLB 4-Stage Milestone Invoices
            </h4>

            {invoices.length === 0 && (
              <button
                type="button"
                disabled={generatingInvoices}
                onClick={handleGenerateMilestones}
                className="px-3 py-1.5 rounded-xl admin-btn-gold text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <DollarSign size={13} />
                {generatingInvoices ? 'Generating...' : 'Auto-Generate 4 Milestones'}
              </button>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="p-4 rounded-[16px] border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
              No invoices generated for this job yet. Click &quot;Auto-Generate 4 Milestones&quot; to build compliant CSLB progress billing.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {invoices.map(inv => {
                const isPaid = inv.status === 'paid';
                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-[16px] border ${
                      isPaid
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50 border-slate-200/80'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#1878B8]">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#0B1E33] line-clamp-1">
                        {inv.milestone_name}
                      </div>
                      <div className="text-base font-black text-[#0B1E33] mt-0.5">
                        ${Number(inv.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Due: {inv.due_date}
                      </div>
                    </div>

                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={() => setActivePaymentInvoice(inv)}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
                      >
                        Record Payment
                      </button>
                    ) : (
                      <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check size={12} /> Settled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expenses List Subsection */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Receipt size={15} className="text-rose-500" />
            Job Expenses &amp; Vendor Receipts
          </h4>

          {expenses.length === 0 ? (
            <div className="p-4 rounded-[16px] border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
              No job expenses recorded yet. Click &quot;Log Expense&quot; to track supplier receipts, dumpster drops, and city permits.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[16px] border border-slate-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Receipt / PO #</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-500">{exp.expense_date}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#0B1E33]">{exp.vendor}</td>
                      <td className="py-2.5 px-3 capitalize">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-medium">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {exp.invoice_receipt_number || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-600">
                        ${Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Owens Corning & Workmanship Warranty Certificate (Stage 8) */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Warranty Registration &amp; Certificate (Stage 8)
            </h3>
            <p className="text-xs text-slate-500">
              Owens Corning Preferred Contractor 50-Year System Protection &amp; post-completion inspections
            </p>
          </div>

          {warranties.length === 0 && (
            <button
              type="button"
              disabled={issuingWarranty}
              onClick={handleIssueWarranty}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Award size={14} />
              {issuingWarranty ? 'Issuing...' : 'Issue 50-Yr Warranty Certificate'}
            </button>
          )}
        </div>

        {warranties.length === 0 ? (
          <div className="p-4 rounded-[16px] border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
            No warranty registered yet. Once the roof installation is completed and signed off, issue the official Owens Corning certificate to schedule 6-month &amp; 1-year check-ins.
          </div>
        ) : (
          <div className="space-y-3">
            {warranties.map(war => (
              <div
                key={war.id}
                className="p-4 rounded-[16px] bg-slate-50 border border-emerald-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1878B8]">
                        {war.warranty_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ACTIVE CERTIFICATE
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#0B1E33] mt-1">
                      {war.warranty_type}
                    </div>
                  </div>

                  <Link
                    href={`/warranty/${war.warranty_number}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors self-start sm:self-auto"
                  >
                    View Homeowner Certificate <ExternalLink size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Coverage Start</span>
                    <div className="font-semibold text-[#0B1E33]">{war.start_date}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Valid Through</span>
                    <div className="font-semibold text-[#0B1E33]">{war.expiration_date}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">6-Month Check-in</span>
                    <div className="font-semibold text-slate-700">
                      {war.checkin_6mo_completed ? '✅ Completed' : `Due: ${war.checkin_6mo_due}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">1-Year Check-in</span>
                    <div className="font-semibold text-slate-700">
                      {war.checkin_1yr_completed ? '✅ Completed' : `Due: ${war.checkin_1yr_due}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: Field Photo Gallery by Project Phase */}
      <JobPhotoGallery jobId={job.id} jobNumber={job.job_number} />

      {/* Main Operations Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Stage & Progress */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 sm:p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Hammer size={16} className="text-[#2F9FE3]" />
            Project Stage &amp; Lifecycle
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {STAGES.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  status === s.id
                    ? 'admin-btn-gold shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-[#0B1E33]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Columns: Permits, Materials, Crew */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Permits */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-[#2F9FE3]" />
              City Permitting
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Permit Status</label>
                <select
                  value={permitStatus}
                  onChange={e => setPermitStatus(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="not_filed">Not Filed</option>
                  <option value="filed">Application Filed</option>
                  <option value="approved">Permit Issued &amp; Ready</option>
                  <option value="inspection_scheduled">City Inspection Booked</option>
                  <option value="passed">Final Permit Passed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Permit Number</label>
                <input
                  type="text"
                  placeholder="e.g. BLD2026-04918"
                  value={permitNumber}
                  onChange={e => setPermitNumber(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Truck size={16} className="text-[#2F9FE3]" />
              Materials &amp; Logistics
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Delivery</label>
                <select
                  value={materialStatus}
                  onChange={e => setMaterialStatus(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="not_ordered">PO Not Ordered</option>
                  <option value="ordered">PO Sent to ABC Supply / Beacon</option>
                  <option value="delivered">Rooftop Delivery Scheduled</option>
                  <option value="on_site">Materials On-Site &amp; Verified</option>
                </select>
              </div>

              {estimate && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <p><strong className="text-slate-800">Material:</strong> {estimate.material_type}</p>
                  <p><strong className="text-slate-800">Quantity:</strong> {estimate.roof_squares} Squares</p>
                </div>
              )}
            </div>
          </div>

          {/* Crew & Schedule */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-[#2F9FE3]" />
              Crew &amp; Dispatch
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Foreman / Crew Lead</label>
                <input
                  type="text"
                  value={crewLead}
                  onChange={e => setCrewLead(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={scheduledStart}
                    onChange={e => setScheduledStart(e.target.value)}
                    className="admin-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Est. Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={e => setEstimatedDays(Number(e.target.value))}
                    className="admin-input text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On-site Notes */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-3 shadow-xs">
          <label className="block text-xs uppercase font-bold text-slate-500 tracking-wider">
            Job Notes &amp; Field Instructions
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Protect driveway pavers with plywood before dumpster drop-off. Homeowner requested tile debris piled away from pool..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="admin-input text-sm resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-gold px-6 py-3 rounded-xl font-bold text-sm shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Updating Job...' : 'Save Job Progress'}
          </button>
        </div>
      </form>

      {/* Log Expense BottomSheet */}
      {isExpenseModalOpen && (
        <BottomSheet
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Log Job Expense"
          subtitle={`Record vendor cost for ${job.job_number}`}
        >
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="materials">Materials</option>
                  <option value="labor">Labor Payroll</option>
                  <option value="dumpster">Dumpster &amp; Waste</option>
                  <option value="permits">City Permit Fees</option>
                  <option value="equipment">Equipment Rental</option>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Supply, EDCO"
                  value={expenseVendor}
                  onChange={e => setExpenseVendor(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice / PO #</label>
                <input
                  type="text"
                  placeholder="e.g. INV-98242"
                  value={expenseReceipt}
                  onChange={e => setExpenseReceipt(e.target.value)}
                  className="admin-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Details of materials or services rendered..."
                value={expenseNotes}
                onChange={e => setExpenseNotes(e.target.value)}
                className="admin-input text-xs resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingExpense}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingExpense ? 'Saving...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* Record Payment BottomSheet */}
      {activePaymentInvoice && (
        <BottomSheet
          isOpen={Boolean(activePaymentInvoice)}
          onClose={() => setActivePaymentInvoice(null)}
          title="Record Milestone Payment"
          subtitle={`${activePaymentInvoice.milestone_name} (${activePaymentInvoice.invoice_number})`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Milestone Amount:</span>
                <div className="text-lg font-black text-emerald-700">
                  ${Number(activePaymentInvoice.amount).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Due: {activePaymentInvoice.due_date}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'check', label: 'Check' },
                  { id: 'credit_card', label: 'Credit Card' },
                  { id: 'ach', label: 'ACH / Wire' },
                  { id: 'financing', label: 'Financing' },
                  { id: 'cash', label: 'Cash' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'admin-btn-gold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:text-[#0B1E33] bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transaction ID / Check Number
              </label>
              <input
                type="text"
                placeholder="e.g. Check #1042 or Auth #98234"
                value={paymentTxId}
                onChange={e => setPaymentTxId(e.target.value)}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Homeowner handed check upon tear-off completion..."
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="admin-input text-xs resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPayment}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingPayment ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  );
}

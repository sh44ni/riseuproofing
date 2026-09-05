'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Home,
  MapPin,
  Calendar,
  CheckSquare,
  Clock,
  Edit2,
  Save,
  Trash2,
  Sparkles,
  AlertCircle,
  PhoneCall,
  UserCheck,
  FileText,
} from 'lucide-react';
import StatusBadge, { PriorityLevel } from '@/components/admin/shared/StatusBadge';
import ActivityTimeline, { Activity } from '@/components/admin/timeline/ActivityTimeline';
import LogActivitySheet from '@/components/admin/timeline/LogActivitySheet';
import QuickMessageModal from '@/components/admin/timeline/QuickMessageModal';

interface LeadDetailData {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  service_type?: string;
  status: string;
  priority: PriorityLevel;
  lead_score: number;
  score_factors?: string[];
  lead_source?: string;
  property_type?: string;
  roof_type?: string;
  roof_sqf?: number;
  roof_age?: number;
  stories?: number;
  hoa?: boolean;
  address?: string;
  zip?: string;
  notes?: string;
  message?: string;
  created_at: string;
  assigned_to?: string;
  last_contact_at?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description?: string;
  due_at: string;
  completed_at?: string;
  priority: string;
  assigned_to?: string;
}

const STATUSES = ['new', 'contacted', 'inspected', 'quoted', 'won', 'lost'];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const router = useRouter();

  const [lead, setLead] = useState<LeadDetailData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProperty, setSavingProperty] = useState(false);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  // Sheets
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [messageModalChannel, setMessageModalChannel] = useState<'sms' | 'email' | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Editable specs state
  const [specs, setSpecs] = useState({
    roof_sqf: '',
    roof_type: 'Concrete Tile',
    stories: '1',
    roof_age: '',
    hoa: false,
    address: '',
    zip: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [leadRes, actRes, taskRes, estRes] = await Promise.all([
        fetch(`/api/admin/leads/${leadId}`),
        fetch(`/api/admin/leads/${leadId}/activities`),
        fetch(`/api/admin/tasks?lead_id=${leadId}`),
        fetch(`/api/admin/estimates?lead_id=${leadId}`),
      ]);

      if (leadRes.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!leadRes.ok) {
        router.push('/admin/leads');
        return;
      }

      const leadData = await leadRes.json();
      const actData = await actRes.json();
      const taskData = await taskRes.json();
      const estData = await estRes.json();

      setLead(leadData.lead);
      setActivities(actData.activities ?? []);
      setTasks(taskData.tasks ?? []);
      setEstimates(estData.estimates ?? []);

      setSpecs({
        roof_sqf: leadData.lead.roof_sqf ? String(leadData.lead.roof_sqf) : '',
        roof_type: leadData.lead.roof_type || 'Concrete Tile',
        stories: leadData.lead.stories ? String(leadData.lead.stories) : '1',
        roof_age: leadData.lead.roof_age ? String(leadData.lead.roof_age) : '',
        hoa: Boolean(leadData.lead.hoa),
        address: leadData.lead.address || '',
        zip: leadData.lead.zip || '',
        notes: leadData.lead.notes || '',
      });
    } finally {
      setLoading(false);
    }
  }, [leadId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function handleOpenLog() {
      setShowLogSheet(true);
    }
    window.addEventListener('crm:open-log-call', handleOpenLog);
    return () => window.removeEventListener('crm:open-log-call', handleOpenLog);
  }, []);

  async function handleStatusChange(newStatus: string) {
    if (!lead) return;
    setLead({ ...lead, status: newStatus });
    await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    // Reload activities to see status change in timeline
    const actRes = await fetch(`/api/admin/leads/${leadId}/activities`);
    const actData = await actRes.json();
    setActivities(actData.activities ?? []);
  }

  async function handleSaveSpecs(e: React.FormEvent) {
    e.preventDefault();
    setSavingProperty(true);
    try {
      await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roof_sqf: specs.roof_sqf ? parseInt(specs.roof_sqf, 10) : null,
          roof_type: specs.roof_type,
          stories: specs.stories ? parseInt(specs.stories, 10) : 1,
          roof_age: specs.roof_age ? parseInt(specs.roof_age, 10) : null,
          hoa: specs.hoa,
          address: specs.address,
          zip: specs.zip,
          notes: specs.notes,
        }),
      });
      setIsEditingSpecs(false);
      loadData();
    } finally {
      setSavingProperty(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDue) return;

    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskTitle,
        dueAt: newTaskDue,
        entityType: 'lead',
        entityId: leadId,
      }),
    });

    setNewTaskTitle('');
    setNewTaskDue('');
    setShowTaskForm(false);
    loadData();
  }

  async function handleToggleTask(taskId: number, completed: boolean) {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed_at: completed ? new Date().toISOString() : undefined } : t))
    );
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, completed }),
    });
  }

  async function handleDeleteLead() {
    if (!confirm('Are you sure you want to permanently delete this lead and its timeline history?')) return;
    await fetch(`/api/admin/leads/${leadId}`, { method: 'DELETE' });
    router.push('/admin/leads');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#d4a447] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions — Sticky on mobile */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2.5 lg:mx-0 lg:px-0 lg:py-0 bg-[#0c1117]/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-white/[0.04] lg:border-none flex items-center justify-between gap-4">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8a95a5] hover:text-[#f0f2f5] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Leads
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteLead}
            className="p-2 rounded-xl text-[#5e6a7a] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Lead"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-[#141b24]/80 border border-white/[0.06] rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#d4a447] to-[#c4923a] flex items-center justify-center text-[#0c1117] font-black text-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
                {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
              </div>
              {lead.priority === 'hot' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 ring-2 ring-[#141b24] admin-shimmer" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#f0f2f5]">{lead.full_name}</h1>
                <StatusBadge priority={lead.priority} size="md" />
              </div>
              <p className="text-[#d4a447] font-semibold text-sm mt-0.5 capitalize">
                {lead.service_type || 'Roofing Inquiry'}
              </p>
              <p className="text-[#5e6a7a] text-xs mt-0.5 flex items-center gap-1.5">
                <Clock size={12} />
                Submitted {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-[#1a2332]/80 px-3.5 py-2 rounded-[16px] border border-white/[0.06]">
            <span className="text-xs font-semibold text-[#8a95a5] uppercase tracking-wider">Pipeline:</span>
            <select
              value={lead.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="text-xs sm:text-sm font-bold bg-transparent text-[#f0f2f5] outline-none cursor-pointer capitalize"
            >
              {STATUSES.map(s => (
                <option key={s} value={s} className="bg-[#141b24] text-[#f0f2f5] capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Tap Quick Action Contact Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-5 mt-5 border-t border-white/[0.06]">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone.replace(/\\D/g, '')}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Phone size={15} />
              Call Phone
            </a>
          ) : (
            <button disabled className="py-2.5 px-4 rounded-xl bg-white/[0.03] text-[#5e6a7a] text-xs opacity-50 cursor-not-allowed">
              No Phone
            </button>
          )}

          <button
            type="button"
            onClick={() => setMessageModalChannel('sms')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare size={15} />
            Quick SMS
          </button>

          <button
            type="button"
            onClick={() => setMessageModalChannel('email')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Mail size={15} />
            Quick Email
          </button>

          <button
            onClick={() => setShowLogSheet(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#d4a447]/15 hover:bg-[#d4a447]/25 border border-[#d4a447]/30 text-[#d4a447] font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <PhoneCall size={15} />
            Log Activity
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3): Property Specs & Lead Insights */}
        <div className="space-y-6">
          {/* Lead Scoring Intelligence Card */}
          <div className="bg-[#141b24]/60 border border-white/[0.06] rounded-[20px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-[#d4a447]" />
                Lead Priority Score
              </h3>
              <span className="text-2xl font-black text-[#d4a447] tabular-nums">
                {lead.lead_score ?? 0}
                <span className="text-xs font-normal text-[#5e6a7a]">/100</span>
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full h-2 bg-[#1a2332] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  lead.lead_score >= 70 ? 'bg-red-500' : lead.lead_score >= 35 ? 'bg-[#d4a447]' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, lead.lead_score))}%` }}
              />
            </div>

            {lead.score_factors && lead.score_factors.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-semibold text-[#8a95a5] uppercase tracking-wider">Scoring Factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.score_factors.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[#a0aab8]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property & Roof Specifications Card */}
          <div className="bg-[#141b24]/60 border border-white/[0.06] rounded-[20px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
                <Home size={16} className="text-[#d4a447]" />
                Roof Specifications
              </h3>
              <button
                onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                className="text-xs font-semibold text-[#d4a447] hover:text-[#e8c06a] flex items-center gap-1 cursor-pointer"
              >
                {isEditingSpecs ? (
                  'Cancel'
                ) : (
                  <>
                    <Edit2 size={13} /> Edit Specs
                  </>
                )}
              </button>
            </div>

            {isEditingSpecs ? (
              <form onSubmit={handleSaveSpecs} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Roof SQF</label>
                  <input
                    type="number"
                    value={specs.roof_sqf}
                    onChange={e => setSpecs({ ...specs, roof_sqf: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Roof Type</label>
                  <select
                    value={specs.roof_type}
                    onChange={e => setSpecs({ ...specs, roof_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                  >
                    <option value="Concrete Tile">Concrete Tile</option>
                    <option value="Clay Tile">Clay Tile</option>
                    <option value="Architectural Shingle">Architectural Shingle</option>
                    <option value="Flat / TPO">Flat / TPO</option>
                    <option value="Metal">Metal</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Stories</label>
                    <input
                      type="number"
                      value={specs.stories}
                      onChange={e => setSpecs({ ...specs, stories: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Roof Age (Years)</label>
                    <input
                      type="number"
                      value={specs.roof_age}
                      onChange={e => setSpecs({ ...specs, roof_age: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Address</label>
                  <input
                    type="text"
                    value={specs.address}
                    onChange={e => setSpecs({ ...specs, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a95a5] mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={specs.notes}
                    onChange={e => setSpecs({ ...specs, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="w-full py-2 bg-[#d4a447] text-[#0c1117] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  {savingProperty ? 'Saving...' : 'Save Specifications'}
                </button>
              </form>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-[#8a95a5]">Roof Area</span>
                  <span className="text-[#f0f2f5] font-semibold">
                    {lead.roof_sqf ? `${lead.roof_sqf.toLocaleString()} sq ft` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-[#8a95a5]">Material</span>
                  <span className="text-[#f0f2f5] font-semibold">{lead.roof_type || 'Tile / Shingle'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-[#8a95a5]">Stories</span>
                  <span className="text-[#f0f2f5] font-semibold">{lead.stories || 1} Story</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-[#8a95a5]">Roof Age</span>
                  <span className="text-[#f0f2f5] font-semibold">{lead.roof_age ? `${lead.roof_age} Years` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-[#8a95a5]">Address</span>
                  <span className="text-[#f0f2f5] font-semibold text-right max-w-[180px] truncate">
                    {lead.address || '—'}{lead.zip ? `, ${lead.zip}` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#8a95a5]">Lead Source</span>
                  <span className="text-[#d4a447] font-semibold capitalize">{lead.lead_source || 'Website'}</span>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <p className="text-[#5e6a7a] font-semibold mb-1">Notes</p>
                    <p className="text-[#a0aab8] leading-relaxed bg-white/[0.03] p-2.5 rounded-xl">{lead.notes}</p>
                  </div>
                )}
                {lead.message && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <p className="text-[#5e6a7a] font-semibold mb-1">Inquiry Message</p>
                    <p className="text-[#a0aab8] leading-relaxed bg-white/[0.03] p-2.5 rounded-xl">{lead.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2/3): Activity Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estimates & Proposals Section */}
          <div className="bg-[#141b24]/60 border border-white/[0.06] rounded-[20px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-[#d4a447]" />
                Estimates & Proposals ({estimates.length})
              </h3>
              <Link
                href={`/admin/estimates/new?lead_id=${lead.id}`}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#d4a447] hover:bg-[#c4923a] text-[#0c1117] flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus size={14} strokeWidth={2.5} /> Create Estimate
              </Link>
            </div>

            {estimates.length === 0 ? (
              <p className="text-xs text-[#5e6a7a] py-2 italic">No estimates generated yet for this lead.</p>
            ) : (
              <div className="space-y-2">
                {estimates.map(est => (
                  <Link
                    key={est.id}
                    href={`/admin/estimates/${est.id}`}
                    className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#1a2332]/60 hover:bg-[#1a2332] border border-white/[0.04] transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#d4a447]">
                          {est.estimate_number}
                        </span>
                        <span className="text-xs font-semibold text-[#f0f2f5] group-hover:text-[#e8c06a] transition-colors">
                          {est.material_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8a95a5] mt-0.5">
                        {est.roof_squares} Squares • Status: <span className="capitalize text-[#c8cfd8]">{est.status}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#f0f2f5] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </p>
                      {est.monthly_payment && (
                        <p className="text-[10px] text-[#d4a447]/80 font-medium">
                          ${est.monthly_payment}/mo
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Tasks Section */}
          <div className="bg-[#141b24]/60 border border-white/[0.06] rounded-[20px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
                <CheckSquare size={16} className="text-[#d4a447]" />
                Follow-up Tasks & Reminders
              </h3>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="text-xs font-semibold text-[#d4a447] hover:text-[#e8c06a] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>

            {/* Quick Task Creation Form */}
            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="p-3.5 bg-[#1a2332]/80 rounded-[16px] border border-white/[0.06] space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call back homeowner about tile sample selection"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141b24] border border-white/[0.06] text-[#f0f2f5] text-xs focus:outline-none focus:border-[#d4a447]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    required
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#141b24] border border-white/[0.06] text-[#f0f2f5] text-xs focus:outline-none focus:border-[#d4a447]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-[#d4a447] text-[#0c1117] font-bold text-xs hover:bg-[#c4923a] cursor-pointer ml-auto"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <p className="text-xs text-[#5e6a7a] py-2 italic">No tasks scheduled for this lead yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => {
                  const isDone = Boolean(t.completed_at);
                  const isOverdue = !isDone && new Date(t.due_at) < new Date();

                  return (
                    <div
                      key={t.id}
                      className={`flex items-start gap-3 p-3 rounded-[16px] border transition-all ${
                        isDone
                          ? 'bg-white/[0.03] border-white/[0.04] opacity-60'
                          : isOverdue
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-[#1a2332]/50 border-white/[0.04]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={e => handleToggleTask(t.id, e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-[#1a2332] text-[#d4a447] focus:ring-[#d4a447] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isDone ? 'line-through text-[#5e6a7a]' : 'text-[#f0f2f5]'}`}>
                          {t.title}
                        </p>
                        <p className="text-[11px] text-[#5e6a7a] mt-0.5 flex items-center gap-1.5">
                          <Clock size={11} className={isOverdue ? 'text-red-400' : 'text-[#5e6a7a]'} />
                          <span className={isOverdue ? 'text-red-400 font-semibold' : ''}>
                            Due {new Date(t.due_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Timeline Section */}
          <div className="bg-[#141b24]/60 border border-white/[0.06] rounded-[20px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#d4a447]" />
                Activity Timeline
              </h3>
              <button
                onClick={() => setShowLogSheet(true)}
                className="text-xs font-semibold text-[#d4a447] hover:text-[#e8c06a] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Log Call / Note
              </button>
            </div>

            <ActivityTimeline activities={activities} />
          </div>
        </div>
      </div>

      {/* Log Activity Bottom Sheet */}
      <LogActivitySheet
        isOpen={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        leadId={lead.id}
        leadName={lead.full_name}
        onCreated={loadData}
      />

      {/* Quick Message Homeowner Modal */}
      {messageModalChannel && (
        <QuickMessageModal
          isOpen={Boolean(messageModalChannel)}
          onClose={() => setMessageModalChannel(null)}
          leadId={lead.id}
          customerName={lead.full_name}
          customerPhone={lead.phone}
          customerEmail={lead.email}
          address={lead.address}
          proposalLink={estimates.length > 0 ? `https://riseuproofing.com/proposal/${estimates[0].id}` : undefined}
          defaultChannel={messageModalChannel}
          onSent={loadData}
        />
      )}
    </div>
  );
}

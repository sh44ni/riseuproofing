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
import CustomSelect from '@/components/admin/shared/CustomSelect';
import CustomDatePicker from '@/components/admin/shared/CustomDatePicker';
import SourceAttributionBadge from '@/components/admin/shared/SourceAttributionBadge';
import LeadStageChecklistCard from '@/components/admin/pipeline/LeadStageChecklistCard';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New Lead', badge: 'Fresh', badgeColor: 'sky' as const },
  { value: 'contacted', label: 'Contacted', badge: 'In Touch', badgeColor: 'amber' as const },
  { value: 'estimate_scheduled', label: 'Inspection / Est Scheduled', badge: 'Booked', badgeColor: 'purple' as const },
  { value: 'estimate_sent', label: 'Proposal Sent', badge: 'Proposal', badgeColor: 'gold' as const },
  { value: 'won', label: 'Won / Converted to Job', badge: 'Won', badgeColor: 'emerald' as const },
  { value: 'lost', label: 'Lost / Disqualified', badge: 'Archived', badgeColor: 'rose' as const },
];

const ROOF_TYPE_OPTIONS = [
  { value: 'Concrete Tile', label: 'Concrete Tile', badge: 'Tile', badgeColor: 'sky' as const },
  { value: 'Clay Tile', label: 'Clay Tile', badge: 'Tile', badgeColor: 'amber' as const },
  { value: 'Architectural Shingle', label: 'Architectural Shingle', badge: 'Shingle', badgeColor: 'emerald' as const },
  { value: 'Flat / TPO', label: 'Flat / TPO', badge: 'Flat', badgeColor: 'purple' as const },
  { value: 'Metal', label: 'Metal', badge: 'Metal', badgeColor: 'slate' as const },
];

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
  source_type?: string;
  lead_source_detail?: string;
  created_by_name?: string;
  created_by_role?: string;
  created_by_avatar?: string;
  assigned_to_name?: string;
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
  client_id?: number;
  pipeline_stage?: string;
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
        <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions — Sticky on mobile */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2.5 lg:mx-0 lg:px-0 lg:py-0 bg-white/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-slate-200/80 lg:border-none flex items-center justify-between gap-4">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0B1E33] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Leads
        </Link>

        <div className="flex items-center gap-2">
          {lead.client_id && (
            <Link
              href={`/admin/clients/${lead.client_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 font-bold text-xs border border-sky-200 shadow-2xs transition-colors"
            >
              <UserCheck size={14} />
              <span>360° Client Profile</span>
            </Link>
          )}

          <button
            onClick={handleDeleteLead}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Lead"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#EAA636] to-[#d49428] flex items-center justify-center text-white font-black text-xl shadow-xs">
                {lead.full_name ? lead.full_name[0].toUpperCase() : '?'}
              </div>
              {lead.priority === 'hot' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 ring-2 ring-white admin-shimmer" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1E33]">{lead.full_name}</h1>
                <StatusBadge priority={lead.priority} size="md" />
              </div>
              <p className="text-[#1878B8] font-semibold text-sm mt-0.5 capitalize">
                {lead.service_type || 'Roofing Inquiry'}
              </p>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                <Clock size={12} />
                Submitted {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-60 self-start sm:self-auto">
            <CustomSelect
              value={lead.status}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS}
              size="sm"
            />
          </div>
        </div>

        {/* 1-Tap Quick Action Contact Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-5 mt-5 border-t border-slate-100">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone.replace(/\\D/g, '')}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Phone size={15} />
              Call Phone
            </a>
          ) : (
            <button disabled className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs opacity-50 cursor-not-allowed">
              No Phone
            </button>
          )}

          <button
            type="button"
            onClick={() => setMessageModalChannel('sms')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1878B8] font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare size={15} />
            Quick SMS
          </button>

          <button
            type="button"
            onClick={() => setMessageModalChannel('email')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Mail size={15} />
            Quick Email
          </button>

          <button
            onClick={() => setShowLogSheet(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
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
          {/* Lead Source Attribution */}
          <SourceAttributionBadge
            sourceType={lead.source_type}
            sourceDetail={lead.lead_source_detail}
            teamMemberName={lead.created_by_name}
            teamMemberRole={lead.created_by_role}
            teamMemberAvatar={lead.created_by_avatar}
            variant="card"
          />

          {/* Official Sales Chart Stage Checklist */}
          <LeadStageChecklistCard
            leadId={lead.id}
            stage={lead.pipeline_stage || 'stage_1_lead_gen'}
          />

          {/* Lead Scoring Intelligence Card */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-[#EAA636]" />
                Lead Priority Score
              </h3>
              <span className="text-2xl font-black text-[#EAA636] tabular-nums">
                {lead.lead_score ?? 0}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  lead.lead_score >= 70 ? 'bg-rose-500' : lead.lead_score >= 35 ? 'bg-[#EAA636]' : 'bg-[#2F9FE3]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, lead.lead_score))}%` }}
              />
            </div>

            {lead.score_factors && lead.score_factors.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scoring Factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.score_factors.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property & Roof Specifications Card */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Home size={16} className="text-[#2F9FE3]" />
                Roof Specifications
              </h3>
              <button
                onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                className="text-xs font-semibold text-[#1878B8] hover:text-[#0f5382] flex items-center gap-1 cursor-pointer"
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
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Roof SQF</label>
                  <input
                    type="number"
                    value={specs.roof_sqf}
                    onChange={e => setSpecs({ ...specs, roof_sqf: e.target.value })}
                    className="admin-input text-xs"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Roof Type"
                    value={specs.roof_type || 'Concrete Tile'}
                    onChange={val => setSpecs({ ...specs, roof_type: val })}
                    options={ROOF_TYPE_OPTIONS}
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stories</label>
                    <input
                      type="number"
                      value={specs.stories}
                      onChange={e => setSpecs({ ...specs, stories: e.target.value })}
                      className="admin-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Roof Age (Years)</label>
                    <input
                      type="number"
                      value={specs.roof_age}
                      onChange={e => setSpecs({ ...specs, roof_age: e.target.value })}
                      className="admin-input text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address</label>
                  <input
                    type="text"
                    value={specs.address}
                    onChange={e => setSpecs({ ...specs, address: e.target.value })}
                    className="admin-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={specs.notes}
                    onChange={e => setSpecs({ ...specs, notes: e.target.value })}
                    className="admin-input text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="w-full py-2 admin-btn-gold font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  {savingProperty ? 'Saving...' : 'Save Specifications'}
                </button>
              </form>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Roof Area</span>
                  <span className="text-[#0B1E33] font-semibold">
                    {lead.roof_sqf ? `${lead.roof_sqf.toLocaleString()} sq ft` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Material</span>
                  <span className="text-[#0B1E33] font-semibold">{lead.roof_type || 'Tile / Shingle'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Stories</span>
                  <span className="text-[#0B1E33] font-semibold">{lead.stories || 1} Story</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Roof Age</span>
                  <span className="text-[#0B1E33] font-semibold">{lead.roof_age ? `${lead.roof_age} Years` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Address</span>
                  <span className="text-[#0B1E33] font-semibold text-right max-w-[180px] truncate">
                    {lead.address || '—'}{lead.zip ? `, ${lead.zip}` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Lead Source</span>
                  <span className="text-[#1878B8] font-semibold capitalize">{lead.lead_source || 'Website'}</span>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 font-semibold mb-1">Notes</p>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">{lead.notes}</p>
                  </div>
                )}
                {lead.message && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 font-semibold mb-1">Inquiry Message</p>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">{lead.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2/3): Activity Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estimates & Proposals Section */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-[#2F9FE3]" />
                Estimates & Proposals ({estimates.length})
              </h3>
              <Link
                href={`/admin/estimates/new?lead_id=${lead.id}`}
                className="text-xs font-bold px-3 py-1.5 rounded-xl admin-btn-gold flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} strokeWidth={2.5} /> Create Estimate
              </Link>
            </div>

            {estimates.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No estimates generated yet for this lead.</p>
            ) : (
              <div className="space-y-2">
                {estimates.map(est => (
                  <Link
                    key={est.id}
                    href={`/admin/estimates/${est.id}`}
                    className="flex items-center justify-between p-3.5 rounded-[16px] bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1878B8]">
                          {est.estimate_number}
                        </span>
                        <span className="text-xs font-semibold text-[#0B1E33] group-hover:text-[#1878B8] transition-colors">
                          {est.material_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {est.roof_squares} Squares • Status: <span className="capitalize text-slate-700 font-medium">{est.status}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#0B1E33] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </p>
                      {est.monthly_payment && (
                        <p className="text-[10px] text-[#EAA636] font-medium">
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
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare size={16} className="text-[#2F9FE3]" />
                Follow-up Tasks & Reminders
              </h3>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="text-xs font-semibold text-[#1878B8] hover:text-[#0f5382] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>

            {/* Quick Task Creation Form */}
            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="p-3.5 bg-slate-50 rounded-[16px] border border-slate-200 space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call back homeowner about tile sample selection"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#0B1E33] text-xs focus:outline-none focus:border-[#2F9FE3]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomDatePicker
                      mode="datetime"
                      required
                      placeholder="Due date & time..."
                      value={newTaskDue}
                      onChange={setNewTaskDue}
                      size="sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl admin-btn-gold font-bold text-xs cursor-pointer ml-auto"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No tasks scheduled for this lead yet.</p>
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
                          ? 'bg-slate-50/50 border-slate-200/60 opacity-60'
                          : isOverdue
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={e => handleToggleTask(t.id, e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#2F9FE3] focus:ring-[#2F9FE3] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-[#0B1E33]'}`}>
                          {t.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock size={11} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                          <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
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
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#2F9FE3]" />
                Activity Timeline
              </h3>
              <button
                onClick={() => setShowLogSheet(true)}
                className="text-xs font-semibold text-[#1878B8] hover:text-[#0f5382] flex items-center gap-1 cursor-pointer"
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
          proposalLink={estimates.length > 0 ? `https://riseuprac.com/proposal/${estimates[0].id}` : undefined}
          defaultChannel={messageModalChannel}
          onSent={loadData}
        />
      )}
    </div>
  );
}

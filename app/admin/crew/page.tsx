'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  HardHat,
  Phone,
  MessageSquare,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Briefcase,
  Shield,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import { CrewRosterSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface CrewMember {
  id: number;
  name: string;
  phone?: string;
  role: 'foreman' | 'lead_installer' | 'laborer' | 'sales';
  active: boolean;
  current_job_id?: number;
  skills: string[];
  notes?: string;
  created_at: string;
  job_number?: string;
  current_job_customer?: string;
  current_job_address?: string;
  current_job_city?: string;
  current_job_status?: string;
}

interface CrewSummary {
  totalCrew: number;
  activeCount: number;
  foremenCount: number;
  installerCount: number;
  onJobCount: number;
}

interface ActiveJobOption {
  id: number;
  job_number: string;
  customer_name: string;
  address?: string;
  city?: string;
}

const ROLES = [
  { id: 'foreman', label: 'Foreman', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'lead_installer', label: 'Lead Installer', color: 'bg-sky-50 text-[#1878B8] border-sky-200' },
  { id: 'laborer', label: 'Laborer / Staging', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'sales', label: 'Sales / Inspection', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [summary, setSummary] = useState<CrewSummary>({
    totalCrew: 0,
    activeCount: 0,
    foremenCount: 0,
    installerCount: 0,
    onJobCount: 0,
  });
  const [jobs, setJobs] = useState<ActiveJobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'foreman' | 'lead_installer' | 'laborer' | 'sales'>('lead_installer');
  const [skills, setSkills] = useState<string[]>(['shingle', 'tile']);
  const [notes, setNotes] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCrew = useCallback(async () => {
    try {
      const [crewRes, jobsRes] = await Promise.all([
        fetch(`/api/admin/crew?role=${roleFilter}`),
        fetch('/api/admin/jobs'),
      ]);

      if (crewRes.ok) {
        const data = await crewRes.json();
        setCrew(data.crew || []);
        setSummary(data.summary);
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(
          (data.jobs || []).map((j: any) => ({
            id: j.id,
            job_number: j.job_number,
            customer_name: j.customer_name,
            address: j.address,
            city: j.city,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load crew data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  function openAddModal() {
    setName('');
    setPhone('');
    setRole('lead_installer');
    setSkills(['shingle', 'tile']);
    setNotes('');
    setCurrentJobId('');
    setEditingMember(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(m: CrewMember) {
    setEditingMember(m);
    setName(m.name);
    setPhone(m.phone || '');
    setRole(m.role);
    setSkills(m.skills || []);
    setNotes(m.notes || '');
    setCurrentJobId(m.current_job_id ? String(m.current_job_id) : '');
    setIsAddModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role) return;
    setSubmitting(true);

    try {
      const method = editingMember ? 'PATCH' : 'POST';
      const body = {
        id: editingMember?.id,
        name,
        phone,
        role,
        skills,
        notes,
        currentJobId: currentJobId ? parseInt(currentJobId, 10) : null,
      };

      const res = await fetch('/api/admin/crew', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchCrew();
      } else {
        alert('Failed to save crew member');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving crew member');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this crew member from the roster?')) return;
    await fetch(`/api/admin/crew?id=${id}`, { method: 'DELETE' });
    fetchCrew();
  }

  async function handleQuickAssign(memberId: number, jobIdStr: string) {
    const jId = jobIdStr ? parseInt(jobIdStr, 10) : null;
    await fetch('/api/admin/crew', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memberId, currentJobId: jId }),
    });
    fetchCrew();
  }

  const filteredCrew = crew.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q)) ||
      (m.skills && m.skills.some(s => s.toLowerCase().includes(q))) ||
      (m.job_number && m.job_number.toLowerCase().includes(q))
    );
  });

  if (loading && crew.length === 0) {
    return <CrewRosterSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-amber-50 border border-amber-200 text-[#d49428]">
            <HardHat size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Roofing Crew &amp; Dispatch Roster
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage field personnel, foreman assignments, and job site dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchCrew();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-300 ease-out cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#EAA636]' : ''} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white font-bold text-xs shadow-sm transition-all duration-300 ease-out cursor-pointer"
          >
            <Plus size={15} /> Add Team Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Total Crew</span>
            <Users size={15} className="text-[#d49428]" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.totalCrew}</div>
          <div className="text-xs text-slate-500 mt-1">{summary.activeCount} active on roster</div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Dispatched on Jobs</span>
            <Briefcase size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.onJobCount}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Currently on roof sites</div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Field Foremen</span>
            <Shield size={15} className="text-[#1878B8]" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.foremenCount}</div>
          <div className="text-xs text-[#1878B8] font-semibold mt-1">OSHA &amp; site leads</div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Installers &amp; Stagers</span>
            <HardHat size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.installerCount}</div>
          <div className="text-xs text-purple-600 font-semibold mt-1">Certified applicators</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'foreman', label: 'Foremen' },
            { id: 'lead_installer', label: 'Lead Installers' },
            { id: 'laborer', label: 'Laborers' },
            { id: 'sales', label: 'Sales / Reps' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out whitespace-nowrap cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-[#EAA636] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:bg-white focus:ring-1 focus:ring-[#2F9FE3]"
          />
        </div>
      </div>

      {/* Crew Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw size={24} className="animate-spin text-[#EAA636]" />
          <span className="text-xs font-semibold text-slate-500">Loading crew roster...</span>
        </div>
      ) : filteredCrew.length === 0 ? (
        <div className="py-16 text-center rounded-[16px] border border-slate-200/80 bg-white shadow-xs">
          <HardHat size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-[#0B1E33] mb-1">No Crew Members Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Try adjusting your search query.' : 'Add your first roofing team member.'}
          </p>
          <div className="mt-4">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white text-xs font-bold shadow-sm"
            >
              <Plus size={14} /> Add Crew Member
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrew.map(member => {
            const roleMeta = ROLES.find(r => r.id === member.role) || ROLES[1];
            const isAssigned = Boolean(member.current_job_id);

            return (
              <div
                key={member.id}
                className="p-5 rounded-[20px] bg-white border border-slate-200/80 space-y-4 hover:border-slate-300 hover:shadow-md transition-all duration-300 ease-out shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Name & Role Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-[#0B1E33]">{member.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleMeta.color}`}
                        >
                          {roleMeta.label}
                        </span>
                        {!member.active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-300 ease-out"
                        title="Edit Crew Member"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 ease-out"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Contact row */}
                  {member.phone && (
                    <div className="flex items-center gap-2 pt-3">
                      <a
                        href={`tel:${member.phone.replace(/\D/g, '')}`}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out"
                      >
                        <Phone size={13} /> {member.phone}
                      </a>
                      <a
                        href={`sms:${member.phone.replace(/\D/g, '')}`}
                        className="p-1.5 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200 text-xs font-semibold flex items-center justify-center transition-all duration-300 ease-out"
                        title="Send SMS"
                      >
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  )}

                  {/* Skills tags */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="pt-3 flex flex-wrap gap-1.5">
                      {member.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 capitalize font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {member.notes && (
                    <p className="text-xs text-slate-500 pt-2 italic line-clamp-2">
                      &quot;{member.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Job Dispatch Status Card */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Current Dispatch
                    </span>
                    {isAssigned ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Assigned
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold">Standby / Unassigned</span>
                    )}
                  </div>

                  {isAssigned && member.job_number && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1878B8]">
                          {member.job_number}
                        </span>
                        <Link
                          href={`/admin/jobs/${member.current_job_id}`}
                          className="text-slate-500 hover:text-[#0B1E33] flex items-center gap-1 text-[11px]"
                        >
                          View Job <ExternalLink size={10} />
                        </Link>
                      </div>
                      <div className="font-semibold text-[#0B1E33] truncate">
                        {member.current_job_customer}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate flex items-center gap-1">
                        <MapPin size={10} /> {member.current_job_address}, {member.current_job_city}
                      </div>
                    </div>
                  )}

                  {/* Quick Re-assign dropdown */}
                  <div>
                    <select
                      value={member.current_job_id || ''}
                      onChange={e => handleQuickAssign(member.id, e.target.value)}
                      className="admin-select w-full px-2.5 py-1.5 text-[11px] font-semibold"
                    >
                      <option value="">-- No Active Job (Standby) --</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>
                          {j.job_number} - {j.customer_name} ({j.city || 'SD'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Crew Member Modal */}
      {isAddModalOpen && (
        <BottomSheet
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingMember ? 'Edit Team Member' : 'Add Crew Member'}
          subtitle="Field installer, foreman, or sales representative"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carlos Ramirez"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  placeholder="(760) 555-0199"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="admin-select text-xs font-semibold"
              >
                <option value="foreman">Foreman / Job Site Lead</option>
                <option value="lead_installer">Lead Installer</option>
                <option value="laborer">Laborer / Tear-off &amp; Staging</option>
                <option value="sales">Sales &amp; Field Estimator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills &amp; Certifications (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="shingle, concrete tile, clay tile, tpo, osha 30"
                value={skills.join(', ')}
                onChange={e =>
                  setSkills(
                    e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                  )
                }
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign to Active Job
              </label>
              <select
                value={currentJobId}
                onChange={e => setCurrentJobId(e.target.value)}
                className="admin-select text-xs font-semibold"
              >
                <option value="">Standby (No active job)</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.job_number} - {j.customer_name} ({j.city || 'CA'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Owens Corning certified applicator. Fluent in Spanish & English."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white font-bold text-xs shadow-sm transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingMember ? 'Update Team Member' : 'Add to Crew Roster'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  );
}

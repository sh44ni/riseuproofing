'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Hammer,
  DollarSign,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ClipboardCheck,
  Clock,
  User,
  Plus,
} from 'lucide-react';
import SourceAttributionBadge from '../../shared/SourceAttributionBadge';

interface ClientOverviewTabProps {
  client: any;
  jobs: any[];
  estimates: any[];
  invoices: any[];
  warranties: any[];
  inspections: any[];
  tasks: any[];
  onSelectTab: (tab: string) => void;
  onEditSpecs: () => void;
}

export default function ClientOverviewTab({
  client,
  jobs,
  estimates,
  invoices,
  warranties,
  inspections,
  tasks,
  onSelectTab,
  onEditSpecs,
}: ClientOverviewTabProps) {
  const activeJob = jobs.find(j => !['complete', 'cancelled'].includes(j.status));
  const latestInspection = inspections[0];
  const activeWarranty = warranties.find(w => w.status === 'active') || warranties[0];
  const pendingTasks = tasks.filter(t => !t.completed_at);
  const balanceDue = Number(client.balance_due || 0);

  return (
    <div className="space-y-6">
      {/* Active Project Highlight Banner (if customer has active roof underway) */}
      {activeJob && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0B1E33] text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Active Roofing Project Underway
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
                {activeJob.job_number} — {activeJob.service_type || 'Roof Replacement'}
              </h2>
            </div>

            <Link
              href={`/admin/jobs/${activeJob.id}`}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#2F9FE3] hover:bg-[#1878B8] text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Manage Job</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs">
            <div>
              <span className="text-slate-400 block">Stage</span>
              <span className="font-bold text-white capitalize">
                {activeJob.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Contract Value</span>
              <span className="font-bold text-white">
                ${Number(activeJob.contract_value || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Crew Lead</span>
              <span className="font-bold text-white">{activeJob.crew_lead || 'Assigned Soon'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Scheduled Start</span>
              <span className="font-bold text-white">
                {activeJob.scheduled_start
                  ? new Date(activeJob.scheduled_start).toLocaleDateString()
                  : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Key Lifecycle Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Property & Roof Specifications Card */}
        <div className="admin-card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
                <Home size={16} />
              </div>
              <h3 className="font-bold text-[#0B1E33] text-sm">Property & Roof Specs</h3>
            </div>
            <button
              onClick={onEditSpecs}
              className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
            >
              Edit
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Address</span>
              <span className="font-semibold text-slate-800 text-right">
                {client.address || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">City & ZIP</span>
              <span className="font-semibold text-slate-800">
                {client.city || '—'} {client.zip || ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Roof Material</span>
              <span className="font-bold text-[#0284C7]">{client.roof_type || 'Unspecified'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Roof Area</span>
              <span className="font-semibold text-slate-800">
                {client.roof_sqf ? `${client.roof_sqf.toLocaleString()} sq ft` : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Stories / Age</span>
              <span className="font-semibold text-slate-800">
                {client.stories || 1} Story • {client.roof_age ? `${client.roof_age} yrs old` : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">HOA Community</span>
              <span className="font-semibold text-slate-800">
                {client.hoa ? 'Yes (Review Restrictions)' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Origin / Source</span>
              <SourceAttributionBadge
                sourceType={client.source_type}
                sourceDetail={client.lead_source_detail}
                teamMemberName={client.acquired_by_name}
                teamMemberRole={client.acquired_by_role}
                teamMemberAvatar={client.acquired_by_avatar}
                variant="compact"
              />
            </div>
          </div>
        </div>

        {/* 2. Billing & Invoices Snapshot */}
        <div className="admin-card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <h3 className="font-bold text-[#0B1E33] text-sm">Billing & Cash Flow</h3>
              </div>
              <button
                onClick={() => onSelectTab('billing')}
                className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Billed</span>
                <span className="text-base font-black text-slate-800">
                  ${Number(client.total_billed || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl">
                <span className="text-[11px] text-emerald-800 font-semibold block">Collected Cash</span>
                <span className="text-base font-black text-emerald-700">
                  ${Number(client.total_paid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {balanceDue > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
                <span>${balanceDue.toLocaleString()} currently outstanding</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span>All invoices current & paid in full</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Invoices on file: {invoices.length}</span>
            <Link
              href="/admin/finances"
              className="text-[#0284C7] font-semibold hover:underline flex items-center gap-1"
            >
              Open Invoices Hub
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>

        {/* 3. Roof Health & Warranty Status */}
        <div className="admin-card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="font-bold text-[#0B1E33] text-sm">Warranties & Health</h3>
              </div>
              <button
                onClick={() => onSelectTab('warranties')}
                className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {activeWarranty ? (
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 mb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    {activeWarranty.warranty_type || '50-Yr Owens Corning'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white uppercase">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Certificate #{activeWarranty.warranty_number}
                </p>
                <div className="text-[10px] text-teal-700 flex items-center gap-2 pt-1">
                  <span>6-Mo Check-in: {activeWarranty.checkin_6mo_completed ? '✅ Done' : '⏳ Due'}</span>
                  <span>•</span>
                  <span>1-Yr: {activeWarranty.checkin_1yr_completed ? '✅ Done' : '⏳ Due'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-xs text-slate-500 text-center">
                No warranty certificate issued yet
              </div>
            )}

            {latestInspection && (
              <div className="text-xs text-slate-600 flex items-center justify-between py-1.5 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <ClipboardCheck size={13} className="text-[#2F9FE3]" />
                  Inspection Score
                </span>
                <span className="font-black text-slate-800">
                  {latestInspection.roof_health_score}/100
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Warranties: {warranties.length}</span>
            <Link
              href="/admin/warranties"
              className="text-[#0284C7] font-semibold hover:underline flex items-center gap-1"
            >
              Open Warranties Hub
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Tasks & Follow-up Checklist */}
      <div className="admin-card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <h3 className="font-bold text-[#0B1E33] text-sm">Next Follow-ups & Reminders</h3>
          </div>
          <button
            onClick={() => onSelectTab('tasks')}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>All Tasks ({tasks.length})</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {pendingTasks.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {pendingTasks.slice(0, 3).map(task => (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="font-semibold text-slate-800">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={12} />
                  <span>{new Date(task.due_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No pending tasks for this client. You're all caught up!
          </p>
        )}
      </div>
    </div>
  );
}

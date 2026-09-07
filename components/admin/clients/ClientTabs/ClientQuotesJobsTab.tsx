'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Hammer,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Calendar,
} from 'lucide-react';

interface ClientQuotesJobsTabProps {
  client: any;
  estimates: any[];
  jobs: any[];
  leads: any[];
}

export default function ClientQuotesJobsTab({
  client,
  estimates,
  jobs,
  leads,
}: ClientQuotesJobsTabProps) {
  const primaryLead = leads[0];

  function getEstBadge(status: string) {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'sent':
      case 'viewed':
        return { label: 'Proposal Sent', bg: 'bg-sky-50 text-sky-800 border-sky-300' };
      case 'declined':
        return { label: 'Declined', bg: 'bg-rose-50 text-rose-800 border-rose-300' };
      case 'draft':
      default:
        return { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  }

  function getJobBadge(status: string) {
    switch (status) {
      case 'complete':
        return { label: 'Complete', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'scheduled':
        return { label: 'Scheduled', bg: 'bg-sky-50 text-sky-800 border-sky-300' };
      default:
        return { label: status.replace(/_/g, ' '), bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  }

  const createEstUrl = `/admin/estimates/new?${new URLSearchParams({
    client_id: String(client.id),
    lead_id: primaryLead ? String(primaryLead.id) : '',
    name: client.full_name || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    city: client.city || '',
    zip: client.zip || '',
  }).toString()}`;

  return (
    <div className="space-y-8">
      {/* 1. Production Jobs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Hammer size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">Production Roofing Projects</h3>
              <p className="text-xs text-slate-500">Active and historical roof tear-off & installs</p>
            </div>
          </div>

          <Link
            href="/admin/jobs"
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1"
          >
            <span>Open Jobs Board</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {jobs.map(job => {
              const badge = getJobBadge(job.status);
              const val = Number(job.contract_value || 0);

              return (
                <div
                  key={job.id}
                  className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{job.job_number}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.service_type || 'Roof Replacement'} • Started:{' '}
                        {job.scheduled_start
                          ? new Date(job.scheduled_start).toLocaleDateString()
                          : 'Pending schedule'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Contract Value
                        </span>
                        <span className="text-base font-black text-slate-800">
                          ${val.toLocaleString()}
                        </span>
                      </div>

                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>Manage</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Permit Status</span>
                      <span className="font-semibold capitalize text-slate-700">
                        {job.permit_status ? job.permit_status.replace(/_/g, ' ') : 'Not filed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Material PO</span>
                      <span className="font-semibold capitalize text-slate-700">
                        {job.material_status ? job.material_status.replace(/_/g, ' ') : 'Not ordered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Crew Foreman</span>
                      <span className="font-semibold text-slate-700">{job.crew_lead || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Duration Est</span>
                      <span className="font-semibold text-slate-700">{job.estimated_days || 3} Days</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white border border-slate-200/80 rounded-2xl">
            <p className="text-xs text-slate-500 font-semibold mb-2">
              No roofing projects have been started for this client yet.
            </p>
          </div>
        )}
      </div>

      {/* 2. Estimates & Proposals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">Quotes & Cost Estimates</h3>
              <p className="text-xs text-slate-500">Digital proposals, squares calculation, pricing</p>
            </div>
          </div>

          <Link
            href={createEstUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2F9FE3] to-[#1878B8] text-white font-bold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>New Estimate</span>
          </Link>
        </div>

        {estimates.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {estimates.map(est => {
              const badge = getEstBadge(est.status);
              const total = Number(est.total || 0);

              return (
                <div
                  key={est.id}
                  className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">
                          {est.estimate_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {est.material_type || 'Architectural Shingle'} • {est.roof_squares || 0} Squares
                        ({Number(est.roof_squares || 0) * 100} sq ft)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">Total Price</span>
                        <span className="text-base font-black text-slate-800">
                          ${total.toLocaleString()}
                        </span>
                      </div>

                      <Link
                        href={`/admin/estimates/${est.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>View / Edit</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white border border-slate-200/80 rounded-2xl">
            <p className="text-xs text-slate-500 font-semibold mb-2">No estimates created yet.</p>
            <Link
              href={createEstUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100"
            >
              <Plus size={12} />
              <span>Create First Estimate for {client.full_name}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

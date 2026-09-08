'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ChevronRight,
  HardHat,
  Hammer,
  CheckCircle2,
} from 'lucide-react';

export interface ActiveJobItem {
  id: number;
  job_number: string;
  customer_name: string;
  customer_phone?: string | null;
  address: string;
  city?: string | null;
  service_type?: string | null;
  status: string;
  crew_lead?: string | null;
  contract_value?: string | number | null;
  scheduled_start?: string | null;
}

interface DashboardActiveJobsProps {
  jobs: ActiveJobItem[];
  isFieldCrew?: boolean;
  totalActiveCount?: number;
}

const STAGE_LABELS: Record<string, { label: string; style: string }> = {
  permit_pending: { label: 'Permit Pending', style: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  material_order: { label: 'Material Order', style: 'bg-blue-50 text-blue-800 border-blue-200' },
  scheduled: { label: 'Scheduled', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  in_progress: { label: 'In Progress', style: 'bg-orange-50 text-orange-800 border-orange-200' },
  punch_list: { label: 'Punch List', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  final_inspection: { label: 'Final Inspection', style: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  complete: { label: 'Complete', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export default function DashboardActiveJobs({
  jobs,
  isFieldCrew = false,
  totalActiveCount,
}: DashboardActiveJobsProps) {
  const count = totalActiveCount ?? jobs.length;

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1878B8] flex items-center justify-center font-bold">
            <Hammer size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">
                {isFieldCrew ? "Today's Active Roofs" : 'Active Jobs in Field'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {count} {count === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isFieldCrew
                ? 'Assigned jobsites scheduled for today'
                : 'Current roofing production & site orders'}
            </p>
          </div>
        </div>

        <Link
          href="/admin/jobs"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* List */}
      {jobs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <CheckCircle2 size={24} className="text-slate-300" />
          <p className="font-semibold text-slate-600">No active jobs in production.</p>
          <p className="text-[11px] text-slate-400">
            {isFieldCrew ? 'No roofs scheduled for your crew today.' : 'All production runs are current.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 space-y-2">
          {jobs.map((job) => {
            const stage = STAGE_LABELS[job.status] || {
              label: job.status.replace('_', ' '),
              style: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const phone = job.customer_phone?.replace(/\D/g, '');

            return (
              <div key={job.id} className="pt-2.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#1878B8]">
                      {job.job_number}
                    </span>
                    <Link
                      href={`/admin/jobs?id=${job.id}`}
                      className="text-sm font-bold text-[#0B1E33] hover:text-[#1878B8] transition-colors truncate"
                    >
                      {job.customer_name}
                    </Link>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${stage.style}`}>
                      {stage.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 truncate">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{job.address}, {job.city || 'San Diego'}</span>
                    </span>
                    {job.crew_lead && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <HardHat size={11} className="text-slate-400" />
                          <span>Foreman: {job.crew_lead}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions & Optional Value */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  {!isFieldCrew && job.contract_value && Number(job.contract_value) > 0 && (
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#0B1E33] block">
                        ${parseFloat(String(job.contract_value)).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Contract</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {phone && (
                      <>
                        <a
                          href={`tel:${phone}`}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors shadow-2xs"
                          title="Call Customer"
                        >
                          <Phone size={13} />
                        </a>
                        <a
                          href={`sms:${phone}`}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-[#1878B8] border border-slate-200 transition-colors shadow-2xs"
                          title="Text Customer"
                        >
                          <MessageSquare size={13} />
                        </a>
                      </>
                    )}
                    <Link
                      href={`/admin/jobs?id=${job.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                      title="View Job"
                    >
                      <span>Details</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

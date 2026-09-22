import React from 'react';
import { JobRecord } from '@/types/jobTypes';
import { MapPin, CheckCircle2, Clock, Hammer, ShieldCheck, ChevronRight, Eye } from 'lucide-react';

interface JobsTableViewProps {
  jobs: JobRecord[];
  onSelectJob: (job: JobRecord) => void;
}

export function JobsTableView({ jobs, onSelectJob }: JobsTableViewProps) {
  return (
    <div className="light-glass-panel rounded-2xl overflow-hidden shadow-xs border border-white/80">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Job #</th>
              <th className="py-3 px-4">Customer & Property</th>
              <th className="py-3 px-4">Service Scope</th>
              <th className="py-3 px-4">Milestones Progress</th>
              <th className="py-3 px-4">Contract Value</th>
              <th className="py-3 px-4">Crew Lead</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {jobs.map((job) => {
              const totalMilestones = job.milestones?.length || 0;
              const completedMilestones = job.milestones?.filter((m) => m.status === 'completed').length || 0;
              const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : (job.status === 'complete' ? 100 : 0);

              return (
                <tr
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                >
                  {/* Job # */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-md bg-[#1878B8]/10 text-[#0284C7] border border-[#1878B8]/20">
                      {job.job_number}
                    </span>
                  </td>

                  {/* Customer & Address */}
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900 group-hover:text-[#0284C7] transition-colors">
                      {job.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-[#0284C7]" />
                      <span className="truncate max-w-[200px]">
                        {job.address ? `${job.address}, ${job.city || ''}` : 'San Diego County, CA'}
                      </span>
                    </div>
                  </td>

                  {/* Scope */}
                  <td className="py-3 px-4 font-medium text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/70 text-[11px] font-semibold">
                      {job.service_type || 'Roofing'}
                    </span>
                  </td>

                  {/* Milestone progress */}
                  <td className="py-3 px-4 min-w-[160px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-slate-700">
                          {totalMilestones > 0 ? `${completedMilestones}/${totalMilestones} Completed` : 'No milestones'}
                        </span>
                        <span className="font-black text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5]'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Contract value */}
                  <td className="py-3 px-4 font-black text-slate-900">
                    ${job.contract_value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </td>

                  {/* Crew Lead */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">
                        {job.crew_lead ? job.crew_lead.charAt(0) : 'U'}
                      </div>
                      <span>{job.crew_lead || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {job.status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 size={11} />
                        <span>Completed</span>
                      </span>
                    ) : job.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                        <Clock size={11} />
                        <span>Scheduled</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectJob(job);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition-all hover:scale-105 cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                  No work orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

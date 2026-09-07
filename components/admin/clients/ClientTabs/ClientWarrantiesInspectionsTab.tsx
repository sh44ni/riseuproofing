'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ClipboardCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Calendar,
  Clock,
} from 'lucide-react';

interface ClientWarrantiesInspectionsTabProps {
  client: any;
  warranties: any[];
  inspections: any[];
}

export default function ClientWarrantiesInspectionsTab({
  client,
  warranties,
  inspections,
}: ClientWarrantiesInspectionsTabProps) {
  return (
    <div className="space-y-8">
      {/* 1. 50-Year Warranties Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">
                Warranties & Certificates
              </h3>
              <p className="text-xs text-slate-500">
                50-year manufacturer protection & workmanship guarantees
              </p>
            </div>
          </div>

          <Link
            href="/admin/warranties"
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1"
          >
            <span>Warranties Hub</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {warranties.length > 0 ? (
          <div className="space-y-3">
            {warranties.map(war => {
              return (
                <div
                  key={war.id}
                  className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-teal-600 flex-shrink-0" />
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {war.warranty_type || '50-Year Owens Corning Platinum Protection'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                          {war.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Certificate #{war.warranty_number} • Job: {war.job_number || 'Direct'}
                      </p>
                    </div>

                    <Link
                      href="/admin/warranties"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <span>Certificate Details</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Start Date</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(war.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expiration</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(war.expiration_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">6-Month Follow-up</span>
                      <span
                        className={`font-bold ${
                          war.checkin_6mo_completed ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {war.checkin_6mo_completed ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">1-Year Follow-up</span>
                      <span
                        className={`font-bold ${
                          war.checkin_1yr_completed ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {war.checkin_1yr_completed ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  {war.coverage_details && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                      <span className="font-semibold text-slate-700">Coverage: </span>
                      {war.coverage_details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl">
            <ShieldCheck size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-semibold mb-1">
              No warranty certificates issued yet.
            </p>
            <p className="text-xs text-slate-400">
              When a roof replacement reaches final stage in the Jobs section, a 50-year warranty certificate can be issued with 1 click.
            </p>
          </div>
        )}
      </div>

      {/* 2. Roof Health Inspections Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ClipboardCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">
                12-Point Roof Health Inspections
              </h3>
              <p className="text-xs text-slate-500">
                Digital condition reports, findings, and score assessments
              </p>
            </div>
          </div>

          <Link
            href={`/admin/inspections/new?client_id=${client.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>New Inspection</span>
          </Link>
        </div>

        {inspections.length > 0 ? (
          <div className="space-y-3">
            {inspections.map(insp => {
              const score = insp.roof_health_score || 85;
              const isUrgent = Boolean(insp.urgent_action_required);

              return (
                <div
                  key={insp.id}
                  className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {insp.inspection_number}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Urgent Repairs Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conducted by {insp.inspector_name} on{' '}
                        {new Date(insp.inspection_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Health Score
                        </span>
                        <span
                          className={`text-lg font-black ${
                            score >= 80
                              ? 'text-emerald-700'
                              : score >= 60
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {score}/100
                        </span>
                      </div>

                      <Link
                        href="/admin/inspections"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>Report</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400">Est. Remaining Roof Life: </span>
                      <span className="font-bold text-slate-800">
                        {insp.estimated_remaining_years || 5} Years
                      </span>
                    </div>

                    {insp.notes && (
                      <p className="text-xs text-slate-500 italic truncate max-w-md">
                        "{insp.notes}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl">
            <ClipboardCheck size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-semibold mb-2">
              No roof health inspection reports on record.
            </p>
            <Link
              href={`/admin/inspections/new?client_id=${client.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
            >
              <Plus size={12} />
              <span>Conduct 12-Point Roof Inspection</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

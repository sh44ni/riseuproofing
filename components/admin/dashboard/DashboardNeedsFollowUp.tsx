'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Phone,
  MessageSquare,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';

export interface StaleLeadItem {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  service_type?: string | null;
  estimated_value?: number | string | null;
  pipeline_stage?: string | null;
  status: string;
  priority?: string | null;
  assigned_to_name?: string | null;
  assigned_to_user_id?: number | null;
  last_activity_at?: string | null;
  days_idle: number;
}

interface DashboardNeedsFollowUpProps {
  leads: StaleLeadItem[];
  thresholdHours: number;
  onRefresh?: () => void;
}

export default function DashboardNeedsFollowUp({
  leads,
  thresholdHours,
  onRefresh,
}: DashboardNeedsFollowUpProps) {
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [logText, setLogText] = useState('');
  const [logging, setLogging] = useState(false);
  const [loggedSuccessId, setLoggedSuccessId] = useState<number | null>(null);

  async function handleLogActivity(e: React.FormEvent, leadId: number) {
    e.preventDefault();
    if (!logText.trim()) return;

    setLogging(true);
    try {
      await fetch(`/api/admin/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call',
          title: 'Follow-Up Attempt',
          body: logText.trim(),
        }),
      });
      setLoggedSuccessId(leadId);
      setLogText('');
      setActiveLogId(null);
      setTimeout(() => setLoggedSuccessId(null), 3000);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card border border-amber-200/80 bg-white shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">Needs Follow-Up</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                &gt;{thresholdHours}h Idle
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active prospects awaiting homeowner proposal decision
            </p>
          </div>
        </div>

        <Link
          href="/admin/leads?status=quoted"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* List */}
      {leads.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <p className="font-semibold text-slate-700">All proposals are up to date!</p>
          <p className="text-[11px] text-slate-400">No leads idle over {thresholdHours} hours.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 space-y-2">
          {leads.map(lead => {
            const idleDays = Math.max(1, lead.days_idle || Math.round(thresholdHours / 24));
            const isLogging = activeLogId === lead.id;

            return (
              <div key={lead.id} className="pt-2 pb-2 space-y-2 group">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="min-w-0 flex-1 block hover:text-[#1878B8] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B1E33] group-hover:text-[#1878B8] truncate">
                        {lead.full_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        #{lead.id}
                      </span>
                      {lead.priority === 'hot' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 uppercase">
                          Hot
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                      <span>{lead.service_type || 'Residential Roofing'}</span>
                      <span>•</span>
                      <span>{lead.city || 'San Diego'}</span>
                      {lead.assigned_to_name && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">Rep: {lead.assigned_to_name}</span>
                        </>
                      )}
                    </div>
                  </Link>

                  {/* Days Idle Badge + Estimated Value */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                      <AlertCircle size={10} className="text-amber-600" />
                      <span>{idleDays} {idleDays === 1 ? 'day' : 'days'} idle</span>
                    </span>
                    {lead.estimated_value && Number(lead.estimated_value) > 0 ? (
                      <p className="font-black text-[#0B1E33] text-xs tabular-nums mt-0.5">
                        ${Number(lead.estimated_value).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Inline 1-Touch Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {lead.phone ? (
                      <>
                        <a
                          href={`tel:${lead.phone.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all active:scale-95"
                          title={`Call ${lead.phone}`}
                        >
                          <Phone size={11} className="text-emerald-600" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`sms:${lead.phone.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold transition-all active:scale-95"
                          title={`Text ${lead.phone}`}
                        >
                          <MessageSquare size={11} className="text-sky-600" />
                          <span>Text</span>
                        </a>
                      </>
                    ) : null}

                    {/* Log Activity Inline Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLogId(isLogging ? null : lead.id);
                        setLogText('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <FileText size={11} className="text-slate-500" />
                      <span>{isLogging ? 'Cancel' : 'Log Touch'}</span>
                    </button>

                    {loggedSuccessId === lead.id && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Logged!
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="text-[11px] font-bold text-[#1878B8] hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    <span>Open Lead</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>

                {/* Inline Log Activity Input */}
                {isLogging && (
                  <form
                    onSubmit={e => handleLogActivity(e, lead.id)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Log Follow-up Call / Message with {lead.full_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLogId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={logText}
                      onChange={e => setLogText(e.target.value)}
                      placeholder="e.g. Left voicemail regarding Owens Corning proposal discount..."
                      className="admin-input w-full text-xs p-2.5 rounded-lg resize-none"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={logging || !logText.trim()}
                        className="admin-btn-gold px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {logging ? 'Saving...' : 'Save Activity Note'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

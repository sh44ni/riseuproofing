'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  ExternalLink,
  Clock,
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Lead } from '../LeadsTable';
import StatusBadge from '../shared/StatusBadge';
import SourceAttributionBadge from '../shared/SourceAttributionBadge';

interface LeadQuickDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}

const STATUS_PIPELINE = [
  { key: 'new', label: 'New Lead', color: 'sky' },
  { key: 'contacted', label: 'Contacted', color: 'amber' },
  { key: 'inspected', label: 'Inspected', color: 'purple' },
  { key: 'quoted', label: 'Proposal Sent', color: 'indigo' },
  { key: 'won', label: 'Deal Won', color: 'emerald' },
  { key: 'lost', label: 'Closed Lost', color: 'rose' },
];

export default function LeadQuickDrawer({
  lead,
  isOpen,
  onClose,
  onStatusChange,
}: LeadQuickDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const mapsUrl = lead.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${lead.address}, ${lead.city || ''} ${lead.zip || ''}`
      )}`
    : null;

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!quickNote.trim() || !lead) return;

    setSavingNote(true);
    try {
      await fetch(`/api/admin/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          title: 'Quick Note via Table Drawer',
          body: quickNote.trim(),
        }),
      });
      setNoteSuccess(true);
      setQuickNote('');
      setTimeout(() => setNoteSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1E33]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200/80 flex flex-col transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1E33] to-[#1878B8] flex items-center justify-center text-white font-black text-lg shadow-xs">
                    {lead.full_name ? lead.full_name[0].toUpperCase() : 'L'}
                  </div>
                  {lead.priority === 'hot' && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-[#0B1E33] truncate">
                      {lead.full_name}
                    </h2>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      #{lead.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-[#1878B8]">
                      {lead.service_type || 'Roofing Inquiry'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick 1-Tap Communications Strip */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {lead.phone ? (
                <>
                  <a
                    href={`tel:${lead.phone.replace(/\D/g, '')}`}
                    className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-bold transition-all active:scale-95 group"
                    title={`Call ${lead.phone}`}
                  >
                    <Phone size={14} className="text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`sms:${lead.phone.replace(/\D/g, '')}`}
                    className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-800 text-xs font-bold transition-all active:scale-95 group"
                    title={`Text ${lead.phone}`}
                  >
                    <MessageSquare size={14} className="text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span>SMS</span>
                  </a>
                </>
              ) : (
                <div className="col-span-2 py-2 px-2 text-center text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                  No Phone
                </div>
              )}

              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-800 text-xs font-bold transition-all active:scale-95 group"
                  title={`Email ${lead.email}`}
                >
                  <Mail size={14} className="text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span>Email</span>
                </a>
              ) : (
                <div className="py-2 px-2 text-center text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                  No Email
                </div>
              )}

              <Link
                href={`/admin/leads/${lead.id}`}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 group"
                title="Open full lead profile"
              >
                <ExternalLink size={14} className="text-slate-600 mb-1 group-hover:scale-110 transition-transform" />
                <span>Full Bio</span>
              </Link>
            </div>
          </div>

          {/* Pipeline Stage Transition Strip */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sales Pipeline Stage
              </span>
              <span className="text-xs font-bold capitalize text-[#1878B8]">
                {lead.status}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {STATUS_PIPELINE.map((st, i) => {
                const isCurrent = lead.status === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onStatusChange(lead.id, st.key)}
                    className={`h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1878B8] text-white shadow-xs scale-105 z-10'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                    title={`Change to ${st.label}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-semibold px-0.5">
              <span>New</span>
              <span>Contact</span>
              <span>Inspect</span>
              <span>Quote</span>
              <span>Won</span>
              <span>Lost</span>
            </div>
          </div>

          {/* Drawer Body Tabs */}
          <div className="flex border-b border-slate-200 px-5 pt-2 bg-white">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#1878B8] text-[#1878B8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Roof & Property Specs
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'notes'
                  ? 'border-[#1878B8] text-[#1878B8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Quick Notes & Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {activeTab === 'overview' ? (
              <>
                {/* Deal Value Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-amber-500/10 border border-sky-200/80 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Estimated Deal Value
                    </span>
                    <p className="text-xl font-black text-[#0B1E33] tabular-nums mt-0.5">
                      {lead.estimated_value && Number(lead.estimated_value) > 0
                        ? `$${Number(lead.estimated_value).toLocaleString()}`
                        : '$18,500 (Projected)'}
                    </p>
                  </div>
                  {lead.priority && (
                    <StatusBadge priority={lead.priority} size="md" />
                  )}
                </div>

                {/* Property & Roof Specs Card */}
                <div className="space-y-3 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#0B1E33] uppercase tracking-wider flex items-center gap-1.5">
                    <Home size={14} className="text-[#1878B8]" />
                    <span>Property & Roofing Specifications</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">
                        Roof Area
                      </span>
                      <p className="font-bold text-[#0B1E33] mt-0.5">
                        {lead.roof_sqf && lead.roof_sqf > 0
                          ? `${lead.roof_sqf.toLocaleString()} sq ft`
                          : 'Standard (1,800 sq ft)'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">
                        Roof Material
                      </span>
                      <p className="font-bold text-[#0B1E33] mt-0.5">
                        {lead.roof_type || 'Architectural Shingle'}
                      </p>
                    </div>
                  </div>

                  {/* Location with Google Maps link */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1">
                      Job Site Address
                    </span>
                    {lead.address ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span>
                            {lead.address}
                            {lead.city ? `, ${lead.city}` : ''}
                            {lead.zip ? ` ${lead.zip}` : ''}
                          </span>
                        </div>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#1878B8] hover:underline shrink-0 flex items-center gap-1"
                          >
                            <span>Map</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No address provided</p>
                    )}
                  </div>
                </div>

                {/* Attribution & Intake Source */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2.5 shadow-2xs">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Origin & Acquisition
                  </span>
                  <SourceAttributionBadge
                    sourceType={lead.source_type}
                    sourceDetail={lead.lead_source_detail}
                    teamMemberName={lead.created_by_name}
                    teamMemberRole={lead.created_by_role}
                    teamMemberAvatar={lead.created_by_avatar}
                    variant="card"
                  />
                  {lead.form_type && (
                    <p className="text-[11px] text-slate-500">
                      Intake Form: <span className="font-semibold text-slate-700">{lead.form_type}</span>
                    </p>
                  )}
                </div>

                {/* Client Message */}
                {lead.message && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-300/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                      Homeowner Message
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Quick Note Tab */
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Add Field / Sales Note
                    </label>
                    <textarea
                      rows={3}
                      value={quickNote}
                      onChange={e => setQuickNote(e.target.value)}
                      placeholder="e.g. Homeowner requested tile relay inspection on Thursday at 2pm..."
                      className="admin-input w-full text-xs p-3 rounded-xl resize-none"
                    />
                  </div>
                  {noteSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Note logged to timeline successfully!</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={savingNote || !quickNote.trim()}
                    className="admin-btn-gold px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileText size={13} />
                    <span>{savingNote ? 'Saving...' : 'Post Quick Note'}</span>
                  </button>
                </form>

                {lead.notes && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Existing Internal Notes
                    </span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      {lead.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <Link
              href={`/admin/leads/${lead.id}`}
              className="admin-btn-gold py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Complete Profile</span>
              <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

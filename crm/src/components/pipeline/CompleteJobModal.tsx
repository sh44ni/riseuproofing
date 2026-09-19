import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  MapPin,
  DollarSign,
  Loader2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cleanseAuthor } from '@/lib/noteUtils';

export interface CompleteJobModalProps {
  isOpen: boolean;
  deal: {
    id: string;
    name: string;
    value?: number;
    service?: string;
    location?: string;
    address?: string;
  } | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (note: string, authorInfo?: { name: string; role: string }) => Promise<void>;
}

const PRESET_NOTES = [
  'Roof installation 100% complete. Clean-up & magnetic nail sweep passed. 50-Year Golden Pledge warranty activated.',
  'Final walkthrough signed off with homeowner on-site. All city permits cleared and final invoice collected in full.',
  'Drone completion photos verified. Flashing and valley sealed. Client 5-star Google review requested.',
];

export function CompleteJobModal({
  isOpen,
  deal,
  isSubmitting,
  onClose,
  onConfirm,
}: CompleteJobModalProps) {
  const { user } = useAuth();
  const clean = cleanseAuthor(user?.name, user?.role);
  const authorName = clean.name;
  const authorRole = clean.role || 'Owner';

  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen || !deal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(note.trim(), { name: authorName, role: authorRole });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_24px_72px_rgba(15,23,42,0.30)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Emerald Glow Header Bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              <CheckCircle2 size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Complete Roofing Job</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300/80">
                  Lifetime Client
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Certify project completion and record field notes in Client 360
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Callout (Per User Specification) */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-sky-50/90 border border-sky-200/80 text-sky-900 text-xs flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-lg bg-sky-500/20 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
            <ExternalLink size={12} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-[#0284C7]">Dashboard Sync Notice:</span>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
              Once completed, this job will move off the dashboard. You can find completed jobs in the <strong>Pipeline</strong> or in <strong>Client 360</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Deal Metadata Snapshot */}
          <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">{deal.name}</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                ${deal.value ? deal.value.toLocaleString() : '18,500'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-slate-400" />
                <span>{deal.address || deal.location || 'Oceanside, CA'}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{deal.service || 'Residential Roofing'}</span>
            </div>
          </div>

          {/* Completion Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText size={13} className="text-[#1878B8]" />
                <span>Completion & Closeout Note (Added to Client 360)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Recorded in Timeline</span>
            </div>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add field closeout details, warranty registration notes, or inspection sign-off..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 focus:outline-none focus:border-[#1878B8] text-slate-800 placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>

          {/* Quick-Fill Presets */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              <span>Quick Presets:</span>
            </span>
            <div className="space-y-1">
              {PRESET_NOTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(p)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/90 text-slate-700 text-[10.5px] font-medium transition-colors line-clamp-1 cursor-pointer"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving & Completing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Complete Job & Add to 360</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

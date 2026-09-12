'use client';

import React, { useState, useEffect } from 'react';
import {
  UserX,
  X,
  AlertTriangle,
  FileText,
  DollarSign,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const LOST_REASON_PRESETS = [
  { id: 'price_high', label: 'Price / Budget Too High', icon: '💰' },
  { id: 'competitor', label: 'Went with Competitor', icon: '🥊' },
  { id: 'postponed', label: 'Project Postponed / Not Ready', icon: '⏳' },
  { id: 'unresponsive', label: 'Unresponsive / Ghosted', icon: '👻' },
  { id: 'insurance_denied', label: 'Insurance Denied Claim', icon: '📑' },
  { id: 'out_of_area', label: 'Out of Service Area', icon: '📍' },
  { id: 'other', label: 'Other / Disqualified', icon: '📝' },
] as const;

export interface MoveToLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes: string }) => Promise<void> | void;
  lead: {
    id: number | string;
    fullName: string;
    phone?: string | null;
    serviceType?: string | null;
    address?: string | null;
    estimatedValue?: number | string | null;
  } | null;
  title?: string;
  isClient?: boolean;
}

export default function MoveToLostModal({
  isOpen,
  onClose,
  onConfirm,
  lead,
  title,
  isClient = false,
}: MoveToLostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(LOST_REASON_PRESETS[0].label);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(LOST_REASON_PRESETS[0].label);
      setCustomReason('');
      setNotes('');
      setLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen || !lead) return null;

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = selectedReason === 'Other / Disqualified' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    setLoading(true);
    try {
      await onConfirm({
        reason: finalReason,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error confirming move to lost:', err);
    } finally {
      setLoading(false);
    }
  }

  const estVal = lead.estimatedValue ? Number(lead.estimatedValue) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E33]/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-[24px] shadow-[0_20px_60px_rgba(11,30,51,0.22)] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-xs shrink-0">
              <UserX size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#0B1E33]">
                  {title || (isClient ? 'Move Client to Lost Archive' : 'Move Lead to Lost Archive')}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                  Archive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Remove from active pipelines and safely archive in Lost Leads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0B1E33] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirmSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Lead Summary Ribbon */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#0B1E33] truncate">
                  {lead.fullName}
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  #{lead.id}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-500 text-[11px]">
                <span className="font-semibold text-[#1878B8]">
                  {lead.serviceType || 'Roofing Inquiry'}
                </span>
                {lead.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone size={10} />
                      {lead.phone}
                    </span>
                  </>
                )}
              </div>
            </div>

            {estVal > 0 && (
              <div className="text-right shrink-0">
                <div className="font-black text-emerald-600 text-sm">
                  ${estVal.toLocaleString()}
                </div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Est. Value</div>
              </div>
            )}
          </div>

          {/* Warning / Active Removal Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/70 flex items-start gap-2.5 text-rose-900">
            <AlertTriangle size={17} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold text-rose-950">
                This lead will be removed from active sales queues.
              </p>
              <p className="text-rose-800/90">
                The profile will be removed from the active Leads list and Pipeline stages, but{' '}
                <span className="font-bold underline decoration-rose-400">
                  fully preserved inside the Lost Leads tab
                </span>{' '}
                in Clients 360, keeping all estimates, inspection logs, and historical notes intact.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 text-xs">
              Primary Loss Reason <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {LOST_REASON_PRESETS.map(preset => {
                const isSelected = selectedReason === preset.label;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedReason(preset.label)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm shrink-0">{preset.icon}</span>
                    <span className="truncate text-xs">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedReason === 'Other / Disqualified' && (
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Specify reason (e.g., Unresponsive after 5 follow-ups)..."
                required
                className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            )}
          </div>

          {/* Optional Sales Context Notes */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">
              Sales Context &amp; Feedback Notes{' '}
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Homeowner chose ABC Roofing due to $1,500 difference. Follow up in 6 months for maintenance."
              className="w-full px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1878B8] focus:ring-1 focus:ring-[#1878B8] resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || (selectedReason === 'Other / Disqualified' && !customReason.trim())}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Archiving...</span>
                </>
              ) : (
                <>
                  <UserX size={14} />
                  <span>Confirm &amp; Move to Lost</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

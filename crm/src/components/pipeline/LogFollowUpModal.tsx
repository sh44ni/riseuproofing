import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Loader2,
  Calendar,
} from 'lucide-react';
import { PipelineDealItem } from './pipelineTypes';
import { useAuth } from '@/context/AuthContext';
import { cleanseAuthor, serializeProfileNote } from '@/lib/noteUtils';

export interface LogFollowUpModalProps {
  deal: PipelineDealItem | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmitFollowUp: (payload: {
    method: 'call' | 'sms' | 'email' | 'in_person';
    notes: string;
    outcome?: string;
  }) => Promise<void>;
}

const QUICK_NOTES = [
  'Spoke with homeowner — reviewing proposal tiers',
  'Left voicemail regarding scope & warranties',
  'Sent SMS follow-up with estimate link',
  'Discussing options with spouse; scheduled callback',
  'Answering questions on manufacturer financing',
  'Insurance claim adjuster inspection pending',
];

export function LogFollowUpModal({
  deal,
  isOpen,
  isSaving,
  onClose,
  onSubmitFollowUp,
}: LogFollowUpModalProps) {
  const { user } = useAuth();
  const clean = cleanseAuthor(user?.name, user?.role);
  const authorName = clean.name;
  const authorRole = clean.role || 'Owner';

  const [method, setMethod] = useState<'call' | 'sms' | 'email' | 'in_person'>('call');
  const [outcome, setOutcome] = useState<string>('spoke_with_client');
  const [notes, setNotes] = useState<string>('');

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setMethod('call');
      setOutcome('spoke_with_client');
      setNotes('');
    }
  }, [isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit, Esc to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, method, notes, outcome]);

  if (!isOpen || !deal) return null;

  const handleSubmit = async () => {
    const serializedNotes = notes.trim()
      ? serializeProfileNote(notes.trim(), authorName, authorRole)
      : '';
    await onSubmitFollowUp({
      method,
      notes: serializedNotes,
      outcome,
    });
  };

  // Compute the future date (7 days from today)
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 7);
  const formattedNextDate = nextDueDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl overflow-hidden flex flex-col transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <RotateCcw size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#1F1F1F]">Log Follow-Up Contact</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Resets 7-Day SLA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Record interaction for <strong className="text-slate-800">{deal.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Lead Summary Strip */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
            <div>
              <span className="font-black text-slate-900">{deal.name}</span>
              <span className="text-slate-500 ml-1.5">({deal.service})</span>
              <div className="text-[10.5px] text-slate-500 mt-0.5">{deal.address}, {deal.city}</div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-slate-900">${deal.value.toLocaleString()}</span>
              {deal.isFollowupOverdue ? (
                <span className="block text-[9.5px] font-black text-rose-600 mt-0.5">⚠️ Overdue (7d exceeded)</span>
              ) : (
                <span className="block text-[9.5px] font-bold text-purple-700 mt-0.5">
                  Due in {deal.followupDaysRemaining ?? 0}d
                </span>
              )}
            </div>
          </div>

          {/* Contact Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              Contact Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'call', label: 'Phone Call', icon: Phone },
                { id: 'sms', label: 'SMS / Text', icon: MessageSquare },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'in_person', label: 'Meeting', icon: Users },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 border-purple-400 ring-2 ring-purple-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-purple-600' : 'text-slate-400'} />
                    <span className="text-[10.5px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call / SMS Outcome Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              Outcome
            </label>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'spoke_with_client', label: 'Connected with Client' },
                { id: 'left_voicemail', label: 'Left Voicemail' },
                { id: 'sent_text_link', label: 'Sent Text / Link' },
                { id: 'no_answer', label: 'No Answer / Busy' },
              ].map((o) => {
                const isSel = outcome === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOutcome(o.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-sky-50 text-[#0284c7] border-sky-400 ring-1 ring-sky-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note Snippets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Note Snippets</span>
              <span className="text-[9.5px] font-normal text-slate-400">Click to insert</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {QUICK_NOTES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(q)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-600 transition-colors border border-slate-200/60 text-left cursor-pointer"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Follow-Up Details &amp; Notes
              </label>
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Spoke to homeowner, answered questions regarding Owens Corning shingles warranty, callback on Thursday..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* 7-Day Timer Reset Assurance Banner */}
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-600 shrink-0" />
              <div>
                <span className="font-bold text-purple-950 block">Resets 7-Day Follow-Up Window</span>
                <span className="text-[10.5px] text-purple-700">
                  Next follow-up deadline will be <strong>{formattedNextDate}</strong>
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-purple-700 px-2 py-0.5 bg-white rounded-md border border-purple-200">
              +7 Days
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200/70 font-bold transition-all cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black shadow-md shadow-purple-500/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving Follow-Up...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Reset 7-Day Timer &amp; Save</span>
                <span className="text-[10px] text-white/70 font-normal hidden sm:inline">(⌘↵)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

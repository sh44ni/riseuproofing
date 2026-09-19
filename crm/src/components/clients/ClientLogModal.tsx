import React, { useState } from 'react';
import { X, Phone, MessageSquare, FileText, CheckCircle2, Flame, Clock } from 'lucide-react';
import { TimelineEvent } from '@/types/client360Types';
import { useAuth } from '@/context/AuthContext';
import { formatTimestamp12h, cleanseAuthor } from '@/lib/noteUtils';

interface ClientLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, 'id'>) => void;
  clientName: string;
  isLostClient?: boolean;
}

export function ClientLogModal({
  isOpen,
  onClose,
  onSave,
  clientName,
  isLostClient,
}: ClientLogModalProps) {
  if (!isOpen) return null;

  const { user } = useAuth();
  const clean = cleanseAuthor(user?.name, user?.role);
  const authorName = clean.name;
  const authorRole = clean.role || 'Owner';

  const [type, setType] = useState<TimelineEvent['type']>(isLostClient ? 'call' : 'note');
  const [title, setTitle] = useState(isLostClient ? 'Win-Back Outreach Call' : 'Homeowner Follow-Up');
  const [details, setDetails] = useState('');
  const [sentiment, setSentiment] = useState<TimelineEvent['sentiment']>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    onSave({
      type,
      title: title.trim() || 'Log Entry',
      date: formatTimestamp12h(new Date()),
      author: `${authorName} (${authorRole})`,
      details: details.trim(),
      sentiment,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {isLostClient ? 'Log Win-Back / Client Touchpoint' : `Log Note or Call: ${clientName}`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Records will be added to the unified 360 client audit trail.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Interaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setType('call'); setTitle(isLostClient ? 'Win-Back Call' : 'Phone Call'); }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  type === 'call' ? 'bg-[#0284C7] text-white border-[#0284C7]' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <Phone size={13} />
                <span>Call</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('sms'); setTitle('SMS Message'); }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  type === 'sms' ? 'bg-[#0284C7] text-white border-[#0284C7]' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <MessageSquare size={13} />
                <span>Text / SMS</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('note'); setTitle('Internal Site Note'); }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  type === 'note' ? 'bg-[#0284C7] text-white border-[#0284C7]' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <FileText size={13} />
                <span>Note</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Subject / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
              placeholder="e.g. Discussed valley repair timeline"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Discussion / Notes</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
              placeholder="Spoke with homeowner regarding quote terms, color selection, or win-back re-inspection..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Outcome / Sentiment</label>
            <div className="flex items-center gap-2">
              {(['positive', 'neutral', 'negative'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSentiment(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border ${
                    sentiment === s
                      ? s === 'positive'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : s === 'negative'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-sky-50 text-sky-700 border-sky-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md"
            >
              Save to Timeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

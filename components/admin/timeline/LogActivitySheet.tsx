'use client';

import React, { useState } from 'react';
import BottomSheet from '../shared/BottomSheet';
import CustomSelect from '../shared/CustomSelect';
import { Phone, FileText, MessageSquare, MapPin } from 'lucide-react';

interface LogActivitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
  onCreated: () => void;
}

const OUTCOMES = ['Spoke with Homeowner', 'Left Voicemail', 'No Answer', 'Wrong Number', 'Inspection Scheduled'];

export default function LogActivitySheet({
  isOpen,
  onClose,
  leadId,
  leadName,
  onCreated,
}: LogActivitySheetProps) {
  const [activityType, setActivityType] = useState<'call' | 'note' | 'text' | 'visit'>('call');
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [durationMins, setDurationMins] = useState('3');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let title = '';
    let description = notes;
    let callDuration: number | undefined;

    if (activityType === 'call') {
      title = `Phone Call: ${outcome}`;
      callDuration = parseInt(durationMins || '0', 10) * 60;
      if (notes) {
        description = `Outcome: ${outcome}\nNotes: ${notes}`;
      } else {
        description = `Outcome: ${outcome}`;
      }
    } else if (activityType === 'note') {
      title = 'Note Added';
      description = notes;
    } else if (activityType === 'text') {
      title = 'SMS Sent / Received';
      description = notes;
    } else if (activityType === 'visit') {
      title = 'On-site Roof Inspection';
      description = notes;
    }

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          title,
          description,
          performedBy,
          callDuration,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save activity');
      }

      onCreated();
      onClose();
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Error saving activity');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Log Activity"
      subtitle={`Record interaction for ${leadName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Activity Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
            Activity Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActivityType('call')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activityType === 'call'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:text-[#0B1E33] bg-white hover:bg-slate-50'
              }`}
            >
              <Phone size={16} className="mb-1" />
              Call
            </button>
            <button
              type="button"
              onClick={() => setActivityType('note')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activityType === 'note'
                  ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:text-[#0B1E33] bg-white hover:bg-slate-50'
              }`}
            >
              <FileText size={16} className="mb-1" />
              Note
            </button>
            <button
              type="button"
              onClick={() => setActivityType('text')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activityType === 'text'
                  ? 'bg-sky-50 text-[#1878B8] border-sky-300 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:text-[#0B1E33] bg-white hover:bg-slate-50'
              }`}
            >
              <MessageSquare size={16} className="mb-1" />
              SMS
            </button>
            <button
              type="button"
              onClick={() => setActivityType('visit')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activityType === 'visit'
                  ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:text-[#0B1E33] bg-white hover:bg-slate-50'
              }`}
            >
              <MapPin size={16} className="mb-1" />
              Visit
            </button>
          </div>
        </div>

        {/* Call-specific fields */}
        {activityType === 'call' && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call Outcome</label>
                <CustomSelect
                  value={outcome}
                  onChange={setOutcome}
                  size="sm"
                  options={OUTCOMES}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={durationMins}
                  onChange={e => setDurationMins(e.target.value)}
                  className="admin-input text-xs w-full px-3 py-2 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Team Member */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Logged By</label>
          <input
            type="text"
            value={performedBy}
            onChange={e => setPerformedBy(e.target.value)}
            className="admin-input text-xs w-full px-3 py-2 rounded-xl"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {activityType === 'call' ? 'Call Discussion Notes' : 'Details / Notes'}
          </label>
          <textarea
            rows={3}
            required={activityType !== 'call'}
            placeholder="e.g. Homeowner confirmed roof is 20 years old. Scheduled drone inspection for Thursday 10 AM..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="admin-input text-sm w-full px-3.5 py-2.5 rounded-xl"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="admin-btn-gold text-sm font-bold shadow-[0_4px_16px_rgba(0,0,0,0.25)] w-full py-3 px-4 rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save to Activity Timeline'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

'use client';

import React, { useState } from 'react';
import {
  PhoneCall,
  MessageSquare,
  Mail,
  FileText,
  Hammer,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  StickyNote,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ActivityItem {
  id: number;
  activity_type: string;
  title: string;
  description?: string;
  performed_by?: string;
  created_at: string;
  call_duration?: number;
  metadata?: any;
}

interface ClientTimelineTabProps {
  clientId: number;
  activities: ActivityItem[];
  onActivityAdded: () => void;
}

export default function ClientTimelineTab({
  clientId,
  activities,
  onActivityAdded,
}: ClientTimelineTabProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [quickType, setQuickType] = useState<'note' | 'call' | 'text' | 'email'>('note');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handlePostQuickActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: quickType,
          title: quickTitle,
          description: quickDescription,
        }),
      });

      if (res.ok) {
        setQuickTitle('');
        setQuickDescription('');
        onActivityAdded();
      }
    } catch (err) {
      console.error('Failed to post activity', err);
    } finally {
      setSubmitting(false);
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'call':
        return { icon: PhoneCall, bg: 'bg-sky-100 text-sky-700' };
      case 'text':
        return { icon: MessageSquare, bg: 'bg-emerald-100 text-emerald-700' };
      case 'email':
        return { icon: Mail, bg: 'bg-indigo-100 text-indigo-700' };
      case 'status_change':
        return { icon: Hammer, bg: 'bg-amber-100 text-amber-700' };
      case 'form_submission':
        return { icon: Sparkles, bg: 'bg-purple-100 text-purple-700' };
      case 'note':
      default:
        return { icon: StickyNote, bg: 'bg-slate-100 text-slate-700' };
    }
  }

  const filtered = activities.filter(a => {
    if (filterType === 'all') return true;
    return a.activity_type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Quick Activity Logger Form */}
      <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex rounded-xl p-1 bg-slate-100 text-xs font-semibold">
            {(['note', 'call', 'text', 'email'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setQuickType(type)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  quickType === type ? 'bg-white text-[#0B1E33] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'note' ? '📝 Internal Note' : type === 'call' ? '📞 Log Call' : type === 'text' ? '💬 SMS' : '📧 Email'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handlePostQuickActivity} className="space-y-2.5">
          <input
            type="text"
            placeholder={
              quickType === 'call'
                ? 'Call outcome (e.g. Discussed tile sample delivery for Thursday)'
                : quickType === 'note'
                ? 'Note title (e.g. Customer prefers morning site visits)'
                : 'Subject / summary...'
            }
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#2F9FE3] outline-none transition-all"
          />

          <textarea
            rows={2}
            placeholder="Additional details, scope, or next steps..."
            value={quickDescription}
            onChange={e => setQuickDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#2F9FE3] outline-none transition-all resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !quickTitle.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1E33] hover:bg-[#1878B8] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Send size={12} />
              <span>{submitting ? 'Saving...' : 'Post to Timeline'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'note', label: 'Notes' },
            { id: 'call', label: 'Calls' },
            { id: 'form_submission', label: 'Inquiries' },
            { id: 'status_change', label: 'Stages' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-sky-50 text-[#0284C7] font-bold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-slate-400 font-medium whitespace-nowrap">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filtered.map(act => {
          const { icon: Icon, bg } = getActivityIcon(act.activity_type);
          const date = new Date(act.created_at);

          return (
            <div key={act.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${bg} ring-4 ring-white shadow-2xs`}
              >
                <Icon size={12} />
              </div>

              {/* Event Content Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs ml-2 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-[#0B1E33] text-sm">{act.title}</h4>
                  <time className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {act.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>By {act.performed_by || 'Staff'}</span>
                  {act.call_duration && act.call_duration > 0 && (
                    <>
                      <span>•</span>
                      <span>Duration: {Math.round(act.call_duration / 60)} min</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl">
            <Clock size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No timeline activities recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

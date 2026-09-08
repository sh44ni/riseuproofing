'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  auto: boolean;
  completed_at?: string;
}

interface LeadStageChecklistCardProps {
  leadId: number;
  stage?: string;
}

const STAGE_TITLES: Record<string, string> = {
  stage_1_lead_gen: 'Stage 1 — Lead Generation',
  stage_2_initial_contact: 'Stage 2 — Initial Contact',
  stage_3_site_visit_estimate: 'Stage 3 — Site Visit & Estimate',
  stage_4_closing: 'Stage 4 — Closing & Contract',
  stage_5_completion_followup: 'Stage 5 — Completion & Follow-Up',
};

export default function LeadStageChecklistCard({
  leadId,
  stage = 'stage_1_lead_gen',
}: LeadStageChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageName, setStageName] = useState('');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/checklist?stage=${stage}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items || []);
        setStageName(data.stageName || STAGE_TITLES[stage] || 'Stage Activities');
      }
    } catch (err) {
      console.error('Error fetching lead checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId, stage]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const handleToggle = async (itemKey: string, currentCompleted: boolean) => {
    setTogglingKey(itemKey);
    const nextCompleted = !currentCompleted;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.key === itemKey ? { ...it, completed: nextCompleted } : it))
    );

    try {
      const res = await fetch(`/api/admin/pipeline/${leadId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_key: itemKey,
          completed: nextCompleted,
          stage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Rollback on failure
        setItems((prev) =>
          prev.map((it) => (it.key === itemKey ? { ...it, completed: currentCompleted } : it))
        );
      }
    } catch (err) {
      // Rollback on error
      setItems((prev) =>
        prev.map((it) => (it.key === itemKey ? { ...it, completed: currentCompleted } : it))
      );
    } finally {
      setTogglingKey(null);
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <CheckSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Sales Chart Checklist
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {stageName || STAGE_TITLES[stage] || 'Current Stage SOP'}
            </p>
          </div>
        </div>

        <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
          {completedCount}/{items.length} Done ({progressPct}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            progressPct === 100
              ? 'bg-emerald-500'
              : progressPct >= 50
              ? 'bg-amber-500'
              : 'bg-sky-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400">Loading checklist activities...</div>
      ) : items.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-400 italic">No checklist items defined for this stage.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key, item.completed)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                item.completed
                  ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800'
                  : 'bg-slate-50/60 border-slate-200/60 hover:bg-slate-100/70 text-slate-700'
              } ${togglingKey === item.key ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-xs font-medium leading-snug ${
                      item.completed ? 'line-through text-slate-500' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.auto && (
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Auto-synced
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

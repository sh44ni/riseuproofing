'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PipelineLead } from '@/app/api/admin/pipeline/route';

interface StageChecklistPopoverProps {
  isOpen: boolean;
  lead?: PipelineLead;
  leadId?: number;
  leadName?: string;
  stage?: string;
  onClose: () => void;
  onChecklistUpdated?: () => void;
}

export default function StageChecklistPopover({
  isOpen,
  lead,
  leadId,
  leadName,
  stage,
  onClose,
  onChecklistUpdated,
}: StageChecklistPopoverProps) {
  const targetLeadId = lead?.id ?? leadId;
  const targetStage = lead?.pipeline_stage ?? stage ?? 'stage_1_lead_gen';
  const targetName = lead?.full_name || leadName || 'Prospect';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageName, setStageName] = useState('');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!targetLeadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${targetLeadId}/checklist?stage=${targetStage}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items || []);
        setStageName(data.stageName || 'Stage Activities');
      }
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [targetLeadId, targetStage]);

  useEffect(() => {
    if (isOpen && targetLeadId) {
      fetchChecklist();
    }
  }, [isOpen, targetLeadId, fetchChecklist]);

  if (!isOpen || !targetLeadId) return null;

  const handleToggle = async (itemKey: string, currentCompleted: boolean) => {
    setTogglingKey(itemKey);
    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.key === itemKey ? { ...it, completed: newCompleted } : it))
    );

    try {
      const res = await fetch(`/api/admin/pipeline/${targetLeadId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_key: itemKey,
          completed: newCompleted,
          stage: targetStage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Rollback
        setItems((prev) =>
          prev.map((it) => (it.key === itemKey ? { ...it, completed: currentCompleted } : it))
        );
      } else {
        if (onChecklistUpdated) onChecklistUpdated();
      }
    } catch (err) {
      // Rollback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Sales Chart Stage Checklist
              </h2>
              <div className="text-[11px] text-slate-500">
                {stageName} • <span className="font-semibold text-slate-700">{targetName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span>Progress:</span>
            <span className={progressPct === 100 ? 'text-emerald-600' : 'text-amber-600'}>
              {completedCount} of {items.length} completed ({progressPct}%)
            </span>
          </div>
          <div className="w-28 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Loading Sales Chart activities...
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No checklist activities for this stage.
            </div>
          ) : (
            items.map((item) => {
              const isBusy = togglingKey === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => !isBusy && handleToggle(item.key, item.completed)}
                  className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    item.completed
                      ? 'border-emerald-200 bg-emerald-50/40 text-slate-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-600 transition-colors"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-semibold text-xs ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.isRequired && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                          Required
                        </span>
                      )}
                      {item.isAutoCompleted && (
                        <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-1 rounded">
                          Auto-verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs">
          <span className="text-[11px] text-slate-500">
            Synced with official Rise Up Sales Chart
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

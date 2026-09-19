import React from 'react';
import {
  Users,
  FileText,
  Filter,
  Layers,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { TaskCategory } from '@/types/taskTypes';

interface TasksFilterBarProps {
  activeTab: 'operations' | 'personal_notes';
  onTabChange: (tab: 'operations' | 'personal_notes') => void;
  selectedCategory: 'all' | TaskCategory;
  onSelectCategory: (cat: 'all' | TaskCategory) => void;
  activeTasksCount: number;
  personalTasksCount?: number;
  categoryCounts: Record<string, number>;
}

export function TasksFilterBar({
  activeTab,
  onTabChange,
  selectedCategory,
  onSelectCategory,
  activeTasksCount,
  personalTasksCount = 0,
  categoryCounts,
}: TasksFilterBarProps) {
  const CATEGORIES: Array<{ id: 'all' | TaskCategory; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'rise_up', label: 'Rise Up' },
    { id: 'estimate_followup', label: 'Estimate Follow-ups' },
    { id: 'permits_city', label: 'City Permits' },
    { id: 'content_creation', label: 'Content Creation' },
    { id: 'marketing', label: 'Marketing' },
  ];

  return (
    <div className="space-y-3 select-none">
      {/* 1. Main Mode Switcher Tabs Matching Mockup */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => onTabChange('operations')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs ${
            activeTab === 'operations'
              ? 'bg-slate-950 text-white shadow-md shadow-slate-900/20'
              : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90'
          }`}
        >
          <Users size={14} className={activeTab === 'operations' ? 'text-sky-400' : 'text-slate-500'} />
          <span>Team Operations &amp; Client Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'operations'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {activeTasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('personal_notes')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs ${
            activeTab === 'personal_notes'
              ? 'bg-slate-950 text-white shadow-md shadow-slate-900/20'
              : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90'
          }`}
        >
          <FileText size={14} className={activeTab === 'personal_notes' ? 'text-amber-400' : 'text-slate-500'} />
          <span>My Personal Notes &amp; Reminders</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'personal_notes'
                ? 'bg-amber-400/25 text-amber-300 border border-amber-400/30'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {personalTasksCount}
          </span>
        </button>
      </div>

      {/* 2. Category Filter Pills (when in operations mode) Matching Mockup */}
      {activeTab === 'operations' && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                    : 'bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

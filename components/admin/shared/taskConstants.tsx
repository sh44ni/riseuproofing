import React from 'react';
import { SelectOption } from '@/components/admin/shared/CustomSelect';

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type WorkCategory = 'Rise Up' | 'Content Creation' | 'Marketing';

export const TASK_PRIORITY_OPTIONS: SelectOption[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0 shadow-xs" />,
  },
  {
    value: 'high',
    label: 'High',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0 shadow-xs" />,
  },
  {
    value: 'normal',
    label: 'Normal',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0 shadow-xs" />,
  },
  {
    value: 'low',
    label: 'Low',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shrink-0 shadow-xs" />,
  },
];

export const WORK_CATEGORY_OPTIONS: SelectOption[] = [
  {
    value: 'Rise Up',
    label: 'Rise Up',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shrink-0 shadow-xs" />,
  },
  {
    value: 'Content Creation',
    label: 'Content Creation',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0 shadow-xs" />,
  },
  {
    value: 'Marketing',
    label: 'Marketing',
    icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-xs" />,
  },
];

export const PRIORITY_BADGE_MAP: Record<string, { label: string; badgeClass: string; dot: string; rank: number }> = {
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    rank: 1,
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    rank: 2,
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    rank: 3,
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    rank: 4,
  },
};

export const CATEGORY_BADGE_MAP: Record<string, { label: string; badgeClass: string }> = {
  'Rise Up': {
    label: 'Rise Up',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  'Content Creation': {
    label: 'Content Creation',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  'Marketing': {
    label: 'Marketing',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

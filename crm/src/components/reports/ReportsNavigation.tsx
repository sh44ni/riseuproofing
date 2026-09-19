import React from 'react';
import {
  DollarSign,
  Target,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { ReportTab } from '@/types/reportTypes';

interface ReportsNavigationProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

export function ReportsNavigation({
  activeTab,
  onTabChange,
}: ReportsNavigationProps) {
  const TABS: Array<{ id: ReportTab; label: string; icon: any; accentColor: string }> = [
    {
      id: 'revenue',
      label: 'Revenue & Financial Velocity',
      icon: DollarSign,
      accentColor: 'text-[#0284c7]',
    },
    {
      id: 'lead_sources',
      label: 'Lead Acquisition & Channel ROI',
      icon: Target,
      accentColor: 'text-amber-500',
    },
    {
      id: 'sales_reps',
      label: 'Estimator & Sales Leaderboard',
      icon: Trophy,
      accentColor: 'text-purple-500',
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 select-none">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 ${
              isActive
                ? 'bg-slate-950 text-white shadow-md shadow-slate-900/20 scale-[1.01]'
                : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90'
            }`}
          >
            <Icon size={14} className={isActive ? tab.accentColor : 'text-slate-500'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

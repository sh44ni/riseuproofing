import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, FileDown, RotateCcw, TrendingUp, Award } from 'lucide-react';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { ReportsKpis } from '@/components/reports/ReportsKpis';
import { ReportsNavigation } from '@/components/reports/ReportsNavigation';
import { RevenueVelocityTab } from '@/components/reports/RevenueVelocityTab';
import { LeadSourcesRoiTab } from '@/components/reports/LeadSourcesRoiTab';
import { SalesRepLeaderboardTab } from '@/components/reports/SalesRepLeaderboardTab';
import { ExecutiveInsightsBar } from '@/components/reports/ExecutiveInsightsBar';
import { DateRangeFilter, ReportTab } from '@/types/reportTypes';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('this_quarter');
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [search, setSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Global keyboard shortcut: ⌘ / Win + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search reports"]') as HTMLInputElement;
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExportPdf = () => {
    alert('Generating High-Resolution Executive PDF Analytics Briefing for Rise Up Roofing Executive Board...');
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Category,Metric,Value,Period\nRevenue,Booked YTD,$1626500,2026\nWin Rate,Average,68.4%,Q3\nGross Margin,Blended,39.4%,Q3\nSpeed to Lead,Average,4.2 min,Q3\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rise_up_analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-20">
      {/* 1. Unified 220px Hero Banner with Top Search & Actions */}
      <CrmPageHero
        pageId="reports"
        defaultEyebrow="Executive Business Intelligence • North County"
        defaultTitle="EXECUTIVE ANALYTICS & INTELLIGENCE"
        defaultSubtitle="Real-time revenue performance, lead source ROI, gross margins, and win rates across North County."
        showSearch={true}
        searchPlaceholder="Search reports, sales reps, material categories, channels..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        topRightActions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                className="h-9 appearance-none pl-3 pr-8 rounded-xl bg-white/95 border border-slate-300/90 text-xs font-bold text-slate-800 shadow-2xs hover:border-sky-400 focus:outline-none focus:border-[#1878B8] cursor-pointer"
              >
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_quarter">This Quarter (Q3 2026)</option>
                <option value="ytd">Year to Date (YTD 2026)</option>
                <option value="last_year">Full Year 2025</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown size={13} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              title="Download Raw CSV"
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl liquid-glass-btn text-xs font-bold text-slate-800 shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
            >
              <Download size={13} className="text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="h-9 inline-flex items-center gap-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileDown size={13} />
              <span>Executive PDF</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh Intelligence Data"
              className="w-9 h-9 rounded-xl liquid-glass-btn flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-sky-400 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw
                size={14}
                className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`}
              />
            </button>
          </div>
        }
        bottomRightBadges={
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>YTD Revenue: $1,626,500</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs shrink-0">
              <TrendingUp size={11} className="text-sky-600" />
              <span>+18.4% YoY Expansion</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/90 text-[10px] font-bold text-amber-800 shadow-2xs shrink-0">
              <Award size={11} className="text-amber-600" />
              <span>68.4% Closing Ratio</span>
            </span>
          </div>
        }
      />

      {/* 2. 4 Frosted Glass Executive KPI Cards */}
      <ReportsKpis />

      {/* 3. AI Executive Intelligence & Profit Recommendations */}
      <ExecutiveInsightsBar />

      {/* 4. Sleek Tab Navigation */}
      <ReportsNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 5. Deep-Dive Viewport by Selected Tab */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'revenue' && <RevenueVelocityTab />}
        {activeTab === 'lead_sources' && <LeadSourcesRoiTab />}
        {activeTab === 'sales_reps' && <SalesRepLeaderboardTab />}
      </div>
    </div>
  );
}

export default ReportsPage;

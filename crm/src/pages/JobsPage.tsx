import React, { useState } from 'react';
import { Users, MapPin, Calendar, Clock, CheckCircle2, User } from 'lucide-react';
import { DevelopmentInProgressBanner } from '@/components/common/DevelopmentInProgressBanner';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';

export function JobsPage() {
  const [search, setSearch] = useState('');
  const JOBS = [
    { id: 'RUP-481', client: 'Carlos Morales (Homeowner: Lisa Chen)', address: '4520 Highland Dr, Carlsbad', assignedLead: 'Marco Silva (Field Foreman)', stage: 'In Progress', progress: 65, startDate: 'Mar 13, 2026', estComplete: 'Mar 15, 2026', scope: 'Tile Tear-Off & Synthetic Underlayment' },
    { id: 'RUP-480', client: 'David Henderson', address: '2214 Sunset Blvd, Oceanside', assignedLead: 'Carlos Ramirez (Project Manager)', stage: 'Scheduled', progress: 10, startDate: 'Mar 16, 2026', estComplete: 'Mar 18, 2026', scope: 'Owens Corning TruDefinition Duration Cool Roof' },
    { id: 'RUP-479', client: 'Miriam Chang', address: '118 Vista Way, Oceanside', assignedLead: 'Sarah Jenkins (Field Inspector)', stage: 'Materials Delivered', progress: 25, startDate: 'Mar 14, 2026', estComplete: 'Mar 16, 2026', scope: 'Spanish S-Tile Restoration' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-16">
      <CrmPageHero
        pageId="jobs"
        defaultEyebrow="Field Operations & Production"
        defaultTitle="Production Jobs & Work Orders"
        defaultSubtitle="Active job sites, team assignments, material deliveries, and tear-off timeline progress"
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        searchPlaceholder="Search jobs, team leads, addresses, scopes..."
        bottomRightBadges={
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>3 Active Jobsites</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
              <span>All Materials Delivered</span>
            </span>
          </div>
        }
      />

      <DevelopmentInProgressBanner
        moduleName="Production Jobs & Field Work Orders"
        expectedVersion="v3.2 Operations Sprint"
        description="This field jobs module is currently undergoing active engineering. Live jobsite dispatching, team task tracking, and dumpster staging feeds are scheduled for rollout shortly."
      />

      {/* Operations KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UniversalStatCard
          label="Active Jobsites"
          value="3 Sites"
          delta={15}
          deltaLabel="+1 This Wk"
          icon={Users}
          iconGradient="from-emerald-600 to-teal-400"
          color="#10b981"
          hoverBorderColor="hover:border-emerald-400"
          blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
          footnoteLeft="2 Carlsbad • 1 Oceanside"
          footnoteRight="100% On Schedule"
          sharePct={100}
          shareLabel="Site capacity"
          stageLabel="Production"
          miniSvgPath="M 2 24 Q 18 18, 36 14 T 54 8 T 73 2"
        />

        <UniversalStatCard
          label="On-Time Completion"
          value="96.4%"
          delta={4.2}
          deltaLabel="+4.2% MoM"
          icon={Clock}
          iconGradient="from-[#1878B8] to-[#55C4F5]"
          color="#0284c7"
          hoverBorderColor="hover:border-sky-400"
          blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
          footnoteLeft="Avg teardown 1.4 days"
          footnoteRight="Weather Clear"
          sharePct={96}
          shareLabel="SLA target"
          stageLabel="Milestone Tracking"
          miniSvgPath="M 2 20 Q 20 18, 38 12 T 58 6 T 73 3"
        />

        <UniversalStatCard
          label="Team Assignments"
          value="3 Deployed"
          delta={8}
          deltaLabel="Full Attendance"
          icon={CheckCircle2}
          iconGradient="from-purple-600 to-indigo-400"
          color="#8b5cf6"
          hoverBorderColor="hover:border-purple-400"
          blurColor="bg-purple-400/15 group-hover:bg-purple-400/25"
          footnoteLeft="Foremen & PMs active"
          footnoteRight="OSHA Compliant"
          sharePct={100}
          shareLabel="Team allocation"
          stageLabel="Field Operations"
          miniSvgPath="M 2 18 Q 18 12, 36 14 T 73 8"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {JOBS.map((job) => (
          <div key={job.id} className="bg-[#0B1E33] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1878B8]/20 text-[#2F9FE3]">
                  {job.id}
                </span>
                <h3 className="font-bold text-sm text-white mt-1.5">{job.client}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-[#2F9FE3]" />
                  <span>{job.address}</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                {job.stage}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-300 font-medium">{job.scope}</div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                <span>Assigned Lead:</span>
                <span className="text-white font-medium">{job.assignedLead}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Timeline:</span>
                <span className="text-slate-300">{job.startDate} ➔ {job.estComplete}</span>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Job Progress</span>
                  <span className="text-white font-bold">{job.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1878B8] to-[#2F9FE3] rounded-full" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

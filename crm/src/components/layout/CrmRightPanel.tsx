import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Trophy,
  Crown,
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { CoastalWeatherWidget } from '@/components/common/CoastalWeatherWidget';
import { QuoteBannerWidget } from '@/components/common/QuoteBannerWidget';
import { SidebarScheduleWidget } from '@/components/common/SidebarScheduleWidget';
import { SidebarTasksWidget } from '@/components/common/SidebarTasksWidget';

interface Performer {
  rank: number;
  name: string;
  initials: string;
  jobs: number;
  revenue: string;
  avatarBg?: string;
}

const PERFORMERS: Performer[] = [
  { rank: 1, name: 'Marc Sarellano', initials: 'MS', jobs: 8, revenue: '$94k', avatarBg: 'bg-gradient-to-tr from-[#1878B8] to-[#55C4F5]' },
  { rank: 2, name: 'Daniel', initials: 'DA', jobs: 5, revenue: '$62k', avatarBg: 'bg-slate-200 text-slate-700' },
  { rank: 3, name: 'Silvester', initials: 'SI', jobs: 4, revenue: '$48k', avatarBg: 'bg-amber-100 text-amber-800' },
  { rank: 4, name: 'Chris', initials: 'CH', jobs: 3, revenue: '$36k', avatarBg: 'bg-slate-200 text-slate-700' },
  { rank: 5, name: 'Maria', initials: 'MR', jobs: 3, revenue: '$31k', avatarBg: 'bg-slate-200 text-slate-700' },
  { rank: 6, name: 'Tony', initials: 'TB', jobs: 2, revenue: '$24k', avatarBg: 'bg-slate-200 text-slate-700' },
];

export function CrmRightPanel({ onQuickAdd }: { onQuickAdd?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { licenseNumber, licenseType } = useCompany();
  const [showAllPerformers, setShowAllPerformers] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const displayName = user?.name || 'Marc Sarellano';
  const displayEmail = user?.email || 'owner@riseuprac.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Owner / Qualifier';
      case 'project_manager':
        return 'Project Manager';
      case 'sales_rep':
        return 'Sales Rep / Closer';
      case 'foreman':
        return 'Crew Foreman';
      default:
        return 'Owner / Estimator';
    }
  };

  const currentRoleLabel = getRoleLabel(user?.role);

  return (
    <aside className="w-76 h-screen flex flex-col light-glass-canvas border-l border-slate-200/80 shrink-0 select-none overflow-y-auto no-scrollbar px-3.5 py-3 space-y-2.5 sticky top-0 z-20 text-slate-800 relative">
      {/* Background Architectural Dot Texture & Coastal Sunlight Diffusion */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. User Profile Pill & Floating Dropdown */}
      <div ref={userMenuRef} className="relative z-30">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="true"
          className={`w-full flex items-center justify-between p-2 rounded-xl light-glass-card glossy-sheen border transition-all cursor-pointer text-left ${
            isUserMenuOpen
              ? 'border-[#1878B8]/60 shadow-[0_0_15px_rgba(24,120,184,0.18)] ring-2 ring-[#1878B8]/15 bg-white/90'
              : 'border-white/85 shadow-2xs hover:shadow-xs hover:border-[#1878B8]/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1878B8] to-[#55C4F5] flex items-center justify-center font-black text-white text-xs shadow-xs">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1F1F1F] group-hover:text-[#1878B8] transition-colors leading-tight truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <span>{currentRoleLabel}</span>
              </div>
            </div>
          </div>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
              isUserMenuOpen ? 'rotate-180 text-[#1878B8]' : ''
            }`}
          />
        </button>

        {/* Floating Liquid Glass Dropdown Menu */}
        {isUserMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
            {/* Header: User Identity & Licensing */}
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1878B8] to-[#55C4F5] flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 truncate leading-tight">{displayName}</div>
                <div className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">{displayEmail}</div>
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1878B8]/10 text-[#1878B8] border border-[#1878B8]/20 text-[9px] font-bold tracking-tight">
                  <ShieldCheck size={10} className="shrink-0" />
                  <span>{licenseNumber || 'CSLB #1115874'} • {licenseType || 'Class C-39'}</span>
                </div>
              </div>
            </div>

            {/* Menu Options: Profile Settings, Settings, Logout */}
            <div className="space-y-0.5 pt-0.5">
              {/* Profile Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 transition-all text-left cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-50 text-[#1878B8] border border-sky-100/80 flex items-center justify-center group-hover:bg-[#1878B8] group-hover:text-white transition-colors shrink-0">
                  <User size={13} />
                </div>
                <span className="flex-1 truncate">Profile Settings</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 transition-all text-left cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors shrink-0">
                  <Settings size={13} />
                </div>
                <span className="flex-1 truncate">Settings</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={async () => {
                  setIsUserMenuOpen(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all text-left group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                  <LogOut size={13} />
                </div>
                <span className="flex-1 truncate">Log Out</span>
              </button>
            </div>

            {/* System Info & Version Footer */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between px-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Rise Up CRM v2.0.0</span>
              </div>
              <span className="text-[9px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Coastal Weather Widget (Customizable, Glowing Standalone Icons, High Visibility) */}
      <CoastalWeatherWidget />

      {/* 3. Today's Schedule (Synchronized with Calendar Store & Backend API) */}
      <SidebarScheduleWidget />

      {/* 4. Quote & Media Banner (Clean Image-Only, Single or Slideshow Carousel) */}
      <QuoteBannerWidget />

      {/* 5. User Personal Sticky Notes / To-Dos Widget (User-Specific, Priority & Work Category Dropdowns) */}
      <SidebarTasksWidget />

      {/* 6. Top Performers (Podium View & Full Leaderboard) */}
      <div className="relative z-10 rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-500" />
            <h3 className="text-xs font-bold text-[#1F1F1F]">Top Performers</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] text-slate-500 font-medium">This Month</span>
            <Crown size={11} className="text-amber-500" />
          </div>
        </div>

        {!showAllPerformers ? (
          /* Podium View (Top 3) */
          <div className="pt-2 pb-0.5">
            <div className="flex items-end justify-center gap-2 px-1">
              {/* 2nd Place - Daniel */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-1">
                  <div className="w-8 h-8 rounded-full bg-white/90 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-2xs backdrop-blur-xs">
                    DA
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-400 text-white text-[8px] font-black flex items-center justify-center border border-white">
                    2
                  </span>
                </div>
                <span className="font-bold text-[#1F1F1F] text-[10px] truncate max-w-full text-center">
                  Daniel
                </span>
                <span className="text-[9px] font-semibold text-slate-500">5 jobs</span>
                {/* Pedestal */}
                <div className="w-full h-10 mt-1 rounded-t-lg bg-gradient-to-b from-slate-100/90 to-slate-200/80 border-t-2 border-x border-slate-300/80 flex items-center justify-center shadow-2xs backdrop-blur-xs">
                  <span className="text-xs font-black text-slate-500">2nd</span>
                </div>
              </div>

              {/* 1st Place - Marc Sarellano (Center / Tallest) */}
              <div className="flex-1 flex flex-col items-center -mt-2 z-10">
                <Crown size={13} className="text-amber-500 fill-amber-400 mb-0.5 animate-bounce" />
                <div className="relative mb-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1878B8] to-[#55C4F5] p-[2px] shadow-xs">
                    <div className="w-full h-full rounded-full bg-[#1878B8] flex items-center justify-center text-[10.5px] font-bold text-white">
                      MS
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[8.5px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                    1
                  </span>
                </div>
                <span className="font-black text-[#1F1F1F] text-[10.5px] truncate max-w-full text-center">
                  Marc S.
                </span>
                <span className="text-[9px] font-bold text-amber-600">8 jobs</span>
                {/* Pedestal */}
                <div className="w-full h-14 mt-1 rounded-t-lg bg-gradient-to-b from-amber-100/90 via-amber-50/80 to-amber-100/50 border-t-2 border-x border-amber-300/90 flex flex-col items-center justify-center shadow-xs backdrop-blur-xs">
                  <span className="text-[13px] font-black text-amber-700 leading-none">1st</span>
                  <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-amber-600 mt-0.5">Top</span>
                </div>
              </div>

              {/* 3rd Place - Silvester */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber-50/90 border-2 border-amber-200/80 flex items-center justify-center text-[10px] font-bold text-amber-800 shadow-2xs backdrop-blur-xs">
                    SI
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-600/80 text-white text-[8px] font-black flex items-center justify-center border border-white">
                    3
                  </span>
                </div>
                <span className="font-bold text-[#1F1F1F] text-[10px] truncate max-w-full text-center">
                  Silvester
                </span>
                <span className="text-[9px] font-semibold text-slate-500">4 jobs</span>
                {/* Pedestal */}
                <div className="w-full h-8 mt-1 rounded-t-lg bg-gradient-to-b from-amber-50/80 to-amber-100/40 border-t-2 border-x border-amber-200/70 flex items-center justify-center shadow-2xs backdrop-blur-xs">
                  <span className="text-xs font-black text-amber-700/80">3rd</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Ranked List (Expanded View) */
          <div className="space-y-1 text-xs pt-1">
            {PERFORMERS.map((perf) => {
              const isFirst = perf.rank === 1;
              const isTopThree = perf.rank <= 3;
              return (
                <div
                  key={perf.rank}
                  className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors ${
                    isFirst
                      ? 'bg-amber-50/90 border border-amber-200/90 shadow-2xs backdrop-blur-xs'
                      : 'liquid-glass-tile border-white/80 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-black text-[11px] w-2.5 ${
                        isFirst
                          ? 'text-amber-700'
                          : isTopThree
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {perf.rank}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        perf.avatarBg || 'bg-slate-200 text-slate-700'
                      } ${isFirst ? 'text-white shadow-xs' : ''}`}
                    >
                      {perf.initials}
                    </div>
                    <span
                      className={`text-[10.5px] truncate ${
                        isFirst ? 'font-bold text-[#1F1F1F]' : 'font-medium text-slate-800'
                      }`}
                    >
                      {perf.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9.5px] font-semibold text-slate-400">
                      {perf.revenue}
                    </span>
                    <span
                      className={`text-[10.5px] font-bold ${
                        isFirst ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      {perf.jobs} jobs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setShowAllPerformers((prev) => !prev)}
          className="w-full py-1.5 px-3 rounded-xl liquid-glass-btn text-[10px] font-bold text-slate-600 hover:text-[#0284c7] flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
        >
          <span>{showAllPerformers ? 'Podium View' : `Full Leaderboard (${PERFORMERS.length})`}</span>
          <ChevronDown
            size={12}
            className={`text-slate-400 group-hover:text-[#0284c7] transition-transform duration-200 ${
              showAllPerformers ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    </aside>
  );
}

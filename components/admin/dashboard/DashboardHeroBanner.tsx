'use client';

import React from 'react';
import { Edit3, Users, Settings, BarChart3, Flag } from 'lucide-react';

interface DashboardHeroBannerProps {
  headline?: string;
  tagline?: string;
  subquote?: string;
  imageUrl?: string;
  pillars?: string[];
  onOpenCustomizer?: () => void;
  canCustomize?: boolean;
}

export default function DashboardHeroBanner({
  headline = 'MORE ROOFS. A STRONGER TOMORROW.',
  tagline = 'DISCIPLINE BUILDS FREEDOM',
  subquote = 'GOOD ROOFS. BETTER PEOPLE. — RISE UP',
  imageUrl = '/hero-bg.jpg',
  pillars = ['PEOPLE', 'PROCESS', 'PROFIT', 'FREEDOM'],
  onOpenCustomizer,
  canCustomize = true,
}: DashboardHeroBannerProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-white shadow-[0_6px_25px_rgba(255,255,255,0.95),0_3px_12px_rgba(160,223,255,0.35)] bg-white text-slate-900 min-h-[170px] sm:min-h-[195px] flex flex-col justify-between p-6 sm:p-8 transition-all">
      {/* Background Image — positioned right so house + truck show on right */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right transition-transform duration-700 ease-out hover:scale-[1.02]"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      {/* Whitish Sunlit Daylight Overlay — soft white left coverage for crisp dark text, fading to transparent on right */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/98 via-white/90 35% via-white/70 55% to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />

      {/* Top Row: Tagline left + "GOOD ROOFS." callout right */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[2px] text-[#008fff]">
            {tagline}
          </span>
        </div>

        {/* Right callout — matches "GOOD ROOFS. BETTER PEOPLE. — RISE UP" */}
        <div className="text-right hidden sm:block shrink-0">
          <p className="text-sm sm:text-base font-black uppercase tracking-tight text-[#090d26] leading-tight drop-shadow-xs">
            GOOD ROOFS.<br />BETTER PEOPLE.
          </p>
          <p className="text-[10px] font-bold tracking-widest text-[#008fff] mt-0.5">— RISE UP</p>
          {canCustomize && onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-white shadow-xs backdrop-blur-md transition-all cursor-pointer group"
              title="Edit hero"
            >
              <Edit3 size={11} className="text-slate-500 group-hover:text-[#008fff] transition-colors" />
              <span>Customize</span>
            </button>
          )}
        </div>
      </div>

      {/* Center / Main Typography: Hero Headline */}
      <div className="relative z-10 my-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-[1.08]">
          <span className="text-[#090d26] drop-shadow-xs">MORE ROOFS.</span>
          <br />
          <span className="text-[#008fff] drop-shadow-xs">A STRONGER TOMORROW.</span>
        </h1>
        {subquote && (
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium tracking-wide italic flex items-center gap-2">
            <span>{subquote}</span>
          </p>
        )}
      </div>

      {/* Bottom Row: 4 Pillars Badge Group */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2">
        {pillars.map((pillar, idx) => {
          let IconComponent = Users;
          if (pillar.toUpperCase().includes('PROCESS')) IconComponent = Settings;
          else if (pillar.toUpperCase().includes('PROFIT')) IconComponent = BarChart3;
          else if (pillar.toUpperCase().includes('FREEDOM')) IconComponent = Flag;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 font-light select-none">|</span>}
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase text-[#090d26]">
                <IconComponent size={14} className="text-[#008fff]" />
                <span>{pillar}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

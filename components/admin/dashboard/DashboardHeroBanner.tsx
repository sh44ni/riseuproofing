'use client';

import React from 'react';
import { Sparkles, Edit3 } from 'lucide-react';

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
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800/40 bg-slate-950 text-white min-h-[170px] sm:min-h-[190px] flex flex-col justify-between p-6 sm:p-8 transition-all">
      {/* Background Image — positioned right so house+truck show on right, text reads on left */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right transition-transform duration-700 ease-out hover:scale-105"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      {/* Deep gradient: heavy left coverage for text, fades to transparent on right */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/98 via-slate-950/75 to-slate-950/20" />
      <div className="absolute inset-0 z-0 bg-radial-at-tl from-amber-500/10 via-transparent to-transparent" />

      {/* Top Row: Tagline left + "GOOD ROOFS." callout right */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Sparkles size={11} className="text-amber-300 animate-pulse" />
            {tagline}
          </span>
        </div>

        {/* Right callout — matches template "GOOD ROOFS. BETTER PEOPLE. — RISE UP" */}
        <div className="text-right hidden sm:block shrink-0">
          <p className="text-sm sm:text-base font-black uppercase tracking-tight text-white drop-shadow-lg leading-tight">
            GOOD ROOFS.<br />BETTER PEOPLE.
          </p>
          <p className="text-[10px] font-bold tracking-widest text-amber-300 mt-0.5">— RISE UP</p>
          {canCustomize && onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/90 border border-white/10 backdrop-blur-md transition-all cursor-pointer group shadow-xs"
              title="Edit hero"
            >
              <Edit3 size={11} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
              <span>Customize</span>
            </button>
          )}
        </div>
      </div>

      {/* Center / Main Typography: Hero Headline */}
      <div className="relative z-10 my-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
          {headline}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium tracking-wide italic flex items-center gap-2">
          <span>{subquote}</span>
        </p>
      </div>

      {/* Bottom Row: 4 Pillars Badge Group */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 backdrop-blur-sm transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{pillar}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

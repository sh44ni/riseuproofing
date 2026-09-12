'use client';

import React from 'react';
import { Quote, Edit3 } from 'lucide-react';

interface DashboardQuoteCardProps {
  quote?: string;
  subtext?: string;
  imageUrl?: string;
  onOpenCustomizer?: () => void;
  canCustomize?: boolean;
}

export default function DashboardQuoteCard({
  quote = 'PROGRESS BUILDS FREEDOM.',
  subtext = 'Rise Up Roofing • Oceanside, CA',
  imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  onOpenCustomizer,
  canCustomize = true,
}: DashboardQuoteCardProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-950 text-white min-h-[140px] flex flex-col justify-between p-5 group">
      {/* Background Image with Deep Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/50" />

      {/* Top Bar: Quote Icon & Customize Trigger */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400">
          <Quote size={14} className="rotate-180" />
        </div>

        {canCustomize && onOpenCustomizer && (
          <button
            type="button"
            onClick={onOpenCustomizer}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
            title="Edit dynamic quote"
          >
            <Edit3 size={13} />
          </button>
        )}
      </div>

      {/* Main Quote Text */}
      <div className="relative z-10 my-2">
        <blockquote className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-sans drop-shadow-sm">
          "{quote}"
        </blockquote>
      </div>

      {/* Subtext */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
        <span className="font-medium tracking-wide">{subtext}</span>
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Mission</span>
      </div>
    </div>
  );
}

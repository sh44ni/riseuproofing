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
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-white shadow-[0_4px_16px_rgba(255,255,255,0.9),0_2px_8px_rgba(160,223,255,0.3)] bg-white text-slate-900 min-h-[140px] flex flex-col justify-between p-5 group">
      {/* Background Image with Whitish Sunlit Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/95 via-white/80 to-white/20" />

      {/* Top Bar: Quote Icon & Customize Trigger */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-[#008fff] shadow-xs">
          <Quote size={14} className="rotate-180" />
        </div>

        {canCustomize && onOpenCustomizer && (
          <button
            type="button"
            onClick={onOpenCustomizer}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-white shadow-xs cursor-pointer"
            title="Edit dynamic quote"
          >
            <Edit3 size={13} />
          </button>
        )}
      </div>

      {/* Main Quote Text */}
      <div className="relative z-10 my-2">
        <blockquote className="text-base sm:text-lg font-black tracking-tight text-[#090d26] uppercase font-sans drop-shadow-xs">
          "{quote}"
        </blockquote>
      </div>

      {/* Subtext */}
      <div className="relative z-10 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-medium tracking-wide">{subtext}</span>
        <span className="text-[10px] uppercase font-bold text-[#008fff] tracking-wider">Mission</span>
      </div>
    </div>
  );
}

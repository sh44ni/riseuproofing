'use client';

import React from 'react';
import { Sun, Cloud, CloudRain, Wind, MapPin } from 'lucide-react';

interface DashboardWeatherWidgetProps {
  location?: string;
  temp?: number;
  condition?: string;
  high?: number;
  low?: number;
  backgroundImage?: string;
}

export default function DashboardWeatherWidget({
  location = 'Oceanside, CA',
  temp = 72,
  condition = 'Sunny',
  high = 76,
  low = 62,
  backgroundImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
}: DashboardWeatherWidgetProps) {
  const getConditionIcon = () => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('shower')) {
      return <CloudRain className="w-8 h-8 text-sky-200" />;
    }
    if (c.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-slate-200" />;
    }
    return <Sun className="w-8 h-8 text-amber-300 animate-spin-slow" />;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-900 text-white min-h-[125px] flex flex-col justify-between p-4 group">
      {/* Background with Ocean Photography & Subtle Dark Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-900/40" />

      {/* Top Header: Location and Live Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
          <MapPin size={13} className="text-amber-400" />
          <span>{location}</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
          Live Weather
        </span>
      </div>

      {/* Main Temperature and Conditions */}
      <div className="relative z-10 flex items-end justify-between mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-white font-mono">
            {temp}°
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">{condition}</span>
            <span className="text-[11px] text-slate-300 font-medium">
              H: {high}° &nbsp; L: {low}°
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
          {getConditionIcon()}
        </div>
      </div>
    </div>
  );
}

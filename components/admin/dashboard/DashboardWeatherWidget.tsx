'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  MapPin, RefreshCw, CloudRain, Cloud, Zap, Sun,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherCurrent {
  temp_f: number;
  feelslike_f: number;
  humidity: number;
  wind_mph: number;
  wind_dir: string;
  uv: number;
  precip_in: number;
  vis_miles: number;
  cloud: number;
  is_day: number;
  condition: { text: string; icon: string; code: number };
  air_quality: { us_epa_index: number; pm2_5: number } | null;
}

interface WeatherForecastDay {
  date: string;
  maxtemp_f: number;
  mintemp_f: number;
  avgtemp_f: number;
  daily_chance_of_rain: number;
  condition: { text: string; icon: string };
  sunrise: string;
  sunset: string;
  uv: number;
}

interface WeatherHour {
  time: string;
  temp_f: number;
  chance_of_rain: number;
  condition: string;
}

interface WeatherData {
  location: string;
  localtime: string;
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  hourly: WeatherHour[];
  isFallback: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr: string): { day: string; date: number; month: string } {
  const d = new Date(dateStr + 'T12:00:00');
  return { day: DAYS[d.getDay()], date: d.getDate(), month: MONTHS[d.getMonth()] };
}

function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-emerald-500' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-amber-500' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-500' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-500' };
  return { label: 'Extreme', color: 'text-purple-500' };
}



// ─── Skeleton ──────────────────────────────────────────────────────────────────

function WeatherSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden animate-pulse">
      <div className="h-36 bg-gradient-to-br from-sky-100 to-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-2/3 bg-slate-100 rounded-full" />
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

interface DashboardWeatherWidgetProps {
  location?: string;
  backgroundImage?: string;
  // Legacy static props (ignored when live data available)
  temp?: number;
  condition?: string;
  high?: number;
  low?: number;
}

export default function DashboardWeatherWidget({
  location = 'Oceanside, CA',
  backgroundImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
}: DashboardWeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/weather?location=${encodeURIComponent(location)}`);
      if (res.ok) {
        const data: WeatherData = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.error('[WeatherWidget] fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    // Auto-refresh every 30 minutes
    const timer = setInterval(() => fetchWeather(true), 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchWeather]);

  if (loading) return <WeatherSkeleton />;

  // If we have no data at all, show a minimal fallback
  if (!weather) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 text-center text-slate-400 text-sm">
        Weather unavailable
      </div>
    );
  }

  const { current, forecast } = weather;
  const uv = uvLabel(current.uv);
  const today = forecast[0];

  // Pick icon source: use weatherapi icon if available
  const hasApiIcon = current.condition.icon && current.condition.icon.includes('cdn.weatherapi.com');
  const iconSrc = hasApiIcon
    ? (current.condition.icon.startsWith('//') ? 'https:' + current.condition.icon : current.condition.icon)
    : null;

  // Fallback condition icon
  function FallbackIcon() {
    const text = current.condition.text.toLowerCase();
    if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-sky-300" />;
    }
    if (text.includes('thunder') || text.includes('storm')) {
      return <Zap className="w-8 h-8 text-amber-300" />;
    }
    if (text.includes('cloud') || text.includes('overcast')) {
      return <Cloud className="w-8 h-8 text-slate-300" />;
    }
    return <Sun className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
      {/* ── Hero strip ── */}
      <div className="relative min-h-[150px] flex flex-col justify-between p-4 group overflow-hidden">
        {/* BG photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-900/70 to-slate-800/40" />

        {/* Header row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
            <MapPin size={12} className="text-amber-400 flex-shrink-0" />
            <span>{weather.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchWeather(true)}
              disabled={refreshing}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh weather"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Temp + condition + icon */}
        <div className="relative z-10 flex items-end justify-between mt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black tracking-tight text-white font-mono leading-none">
                {current.temp_f}°
              </span>
              <span className="text-sm text-slate-200 font-medium pb-1">F</span>
            </div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">{current.condition.text}</div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">
              Feels {current.feelslike_f}° &nbsp;·&nbsp; H: {today?.maxtemp_f ?? '--'}° &nbsp; L: {today?.mintemp_f ?? '--'}°
            </div>
          </div>

          {/* Condition icon */}
          <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex-shrink-0">
            {iconSrc ? (
              <Image
                src={iconSrc}
                alt={current.condition.text}
                width={48}
                height={48}
                className="w-10 h-10 object-contain"
                unoptimized
              />
            ) : (
              <FallbackIcon />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


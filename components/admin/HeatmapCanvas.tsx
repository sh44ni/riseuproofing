'use client';

import { useEffect, useRef, useState } from 'react';
import { MousePointer2, ScrollText } from 'lucide-react';

interface ClickPoint {
  x_pct: number;
  y_pct: number;
  count: number;
}

interface ScrollBucket {
  bucket: number;
  count: string;
}

interface HeatmapCanvasProps {
  clicks: ClickPoint[];
  scrollDepth: ScrollBucket[];
  width?: number;
  height?: number;
}

function heatColor(density: number, max: number): string {
  const t = density / max;
  if (t < 0.25) {
    const s = t / 0.25;
    return `rgba(59,130,246,${0.3 + s * 0.4})`;      // blue
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return `rgba(${Math.round(59 + s * 196)},${Math.round(130 - s * 70)},${Math.round(246 - s * 246)},${0.6 + s * 0.2})`;  // blue→green
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return `rgba(${Math.round(255 - s * 0)},${Math.round(200 - s * 100)},0,${0.7 + s * 0.2})`; // yellow→orange
  } else {
    const s = (t - 0.75) / 0.25;
    return `rgba(239,${Math.round(68 - s * 68)},${Math.round(68 - s * 68)},${0.8 + s * 0.2})`; // red
  }
}

export default function HeatmapCanvas({ clicks, scrollDepth, width = 800, height = 500 }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<'clicks' | 'scroll'>('clicks');

  useEffect(() => {
    if (tab !== 'clicks') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Draw page outline
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Add grid lines to represent page sections
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += height / 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (clicks.length === 0) {
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No click data yet — visit the site to generate data', width / 2, height / 2);
      return;
    }

    const maxCount = Math.max(...clicks.map(c => c.count));
    const radius = Math.max(18, Math.min(40, width / 20));

    for (const pt of clicks) {
      const x = (pt.x_pct / 100) * width;
      const y = (pt.y_pct / 100) * height;
      const color = heatColor(pt.count, maxCount);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    // Draw dots on top
    for (const pt of clicks) {
      const x = (pt.x_pct / 100) * width;
      const y = (pt.y_pct / 100) * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
  }, [clicks, tab, width, height]);

  const maxScroll = scrollDepth.length > 0
    ? Math.max(...scrollDepth.map(s => parseInt(s.count)))
    : 1;

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key: 'clicks', label: 'Click Map', icon: MousePointer2 },
          { key: 'scroll', label: 'Scroll Depth', icon: ScrollText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as 'clicks' | 'scroll')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
              ${tab === key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'clicks' ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10">
          {/* Legend */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
            <div className="flex gap-1 items-center">
              {['#3B82F6','#22C55E','#EAB308','#F97316','#EF4444'].map(c => (
                <div key={c} className="w-4 h-2 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs text-slate-400">Low → High</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ display: 'block', background: '#1e293b' }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          {scrollDepth.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No scroll data yet</p>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-4">% of visitors who scrolled to each depth</p>
              {Array.from({ length: 11 }, (_, i) => i * 10).map(pct => {
                const bucket = scrollDepth.find(s => s.bucket === pct);
                const count = bucket ? parseInt(bucket.count) : 0;
                const pctWidth = maxScroll > 0 ? (count / maxScroll) * 100 : 0;
                const color = pct < 25 ? '#3B82F6' : pct < 50 ? '#22C55E' : pct < 75 ? '#EAB308' : pct < 90 ? '#F97316' : '#EF4444';
                return (
                  <div key={pct} className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-12 text-right flex-shrink-0">{pct}%</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${pctWidth}%`, background: color }}
                      >
                        {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

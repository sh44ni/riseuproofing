'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, ChevronDown } from 'lucide-react';
import HeatmapCanvas from '@/components/admin/HeatmapCanvas';

interface HeatmapData {
  clicks: { x_pct: number; y_pct: number; count: number }[];
  scrollDepth: { bucket: number; count: string }[];
  topElements: { element: string; count: string }[];
  pages: { page_path: string; views: string }[];
}

export default function HeatmapsPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState('/');
  const [days, setDays] = useState(30);
  const router = useRouter();

  async function load(page: string, d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/heatmap?page=${encodeURIComponent(page)}&days=${d}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(selectedPage, days); }, [selectedPage, days]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame size={22} className="text-amber-400" /> Heatmaps
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Click density & scroll depth per page</p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          {/* Page selector */}
          <div className="relative">
            <select
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
              className="appearance-none bg-slate-800/60 border border-white/10 text-white text-sm rounded-xl px-4 py-2 pr-8 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              {(data?.pages ?? []).length === 0 && (
                <option value="/">/</option>
              )}
              {(data?.pages ?? []).map(p => (
                <option key={p.page_path} value={p.page_path}>
                  {p.page_path} ({p.views} views)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Days filter */}
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${days === d ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Heatmap (takes 2 cols) */}
          <div className="xl:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">
              Interaction Map — <span className="text-amber-400">{selectedPage}</span>
            </h2>
            <HeatmapCanvas
              clicks={data.clicks}
              scrollDepth={data.scrollDepth}
              width={700}
              height={440}
            />
          </div>

          {/* Top elements sidebar */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Most Clicked Elements</h2>
            {data.topElements.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No click data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topElements.map((el, i) => {
                  const maxCount = parseInt(data.topElements[0]?.count ?? '1');
                  const pct = (parseInt(el.count) / maxCount) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs truncate max-w-[70%]" title={el.element}>
                          {el.element}
                        </span>
                        <span className="text-amber-400 text-xs font-bold">{el.count}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary stats */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-amber-400 text-xl font-bold">{data.clicks.length}</p>
                <p className="text-slate-500 text-xs mt-0.5">Click Zones</p>
              </div>
              <div className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-amber-400 text-xl font-bold">
                  {data.scrollDepth.length > 0
                    ? `${Math.max(...data.scrollDepth.map(s => s.bucket))}%`
                    : '—'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">Max Scroll</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Clock } from 'lucide-react';
import { AdminAreaChart, AdminBarChart, AdminPieChart } from '@/components/admin/Charts';

interface CallsData {
  daily: { day: string; count: string }[];
  byPage: { page_path: string; count: string }[];
  byDevice: { device_type: string; count: string }[];
  recent: { id: number; session_id: string; page_path: string; device_type: string; country: string; city: string; created_at: string }[];
}

export default function CallsPage() {
  const [data, setData] = useState<CallsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/calls?days=${days}`)
      .then(r => { if (r.status === 401) { router.push('/admin/login'); throw new Error(); } return r.json(); })
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const totalCalls = data?.daily.reduce((s, d) => s + parseInt(d.count), 0) ?? 0;
  const deviceData = (data?.byDevice ?? []).map(d => ({ name: d.device_type ?? 'unknown', value: parseInt(d.count) }));

  function formatDate(d: string) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone size={22} className="text-amber-400" /> Call Clicks
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track phone number taps from your site</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${days === d ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 border border-white/10 hover:text-white hover:border-white/20'}`}>
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
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Calls ({days}d)</p>
              <p className="text-3xl font-bold text-amber-400">{totalCalls}</p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Best Source Page</p>
              <p className="text-3xl font-bold text-white truncate">{data.byPage[0]?.page_path || '—'}</p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Top Device</p>
              <p className="text-3xl font-bold text-white capitalize">{data.byDevice[0]?.device_type || '—'}</p>
            </div>
          </div>

          {/* Daily trend */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Call Clicks Per Day</h2>
            {data.daily.length > 0
              ? <AdminAreaChart data={data.daily} keys={['count']} />
              : <p className="text-slate-500 text-sm text-center py-10">No calls tracked yet. Visit your site and click the phone number.</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By page */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Calls by Page</h2>
              {data.byPage.length > 0
                ? <AdminBarChart data={data.byPage} dataKey="count" labelKey="page_path" horizontal color="#F59E0B" />
                : <p className="text-slate-500 text-sm text-center py-8">No data yet</p>}
            </div>

            {/* By device */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Calls by Device</h2>
              {deviceData.length > 0
                ? <AdminPieChart data={deviceData} label="Calls" />
                : <p className="text-slate-500 text-sm text-center py-8">No data yet</p>}
            </div>
          </div>

          {/* Recent calls */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Recent Call Events</h2>
            {data.recent.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No calls yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Time', 'Page', 'Device', 'Location'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recent.map(c => (
                      <tr key={c.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                          <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-500" />{formatDate(c.created_at)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-amber-400">{c.page_path}</td>
                        <td className="px-3 py-2.5 text-slate-300 capitalize">{c.device_type}</td>
                        <td className="px-3 py-2.5 text-slate-400">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

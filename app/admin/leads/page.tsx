'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Download, Filter } from 'lucide-react';
import LeadsTable from '@/components/admin/LeadsTable';
import { AdminAreaChart } from '@/components/admin/Charts';

interface Lead {
  id: number;
  form_type: string;
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  status: string;
  created_at: string;
  address?: string;
  zip?: string;
  notes?: string;
  message?: string;
  subject?: string;
}

const STATUSES = ['all', 'new', 'contacted', 'quoted', 'won', 'lost'];
const FORM_TYPES = ['all', 'estimate', 'contact'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [daily, setDaily] = useState<{ day: string; count: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [formType, setFormType] = useState('all');
  const [page, setPage] = useState(1);
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== 'all') params.set('status', status);
      if (formType !== 'all') params.set('form_type', formType);
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const d = await res.json();
      setLeads(d.leads);
      setTotal(d.total);
      setDaily(d.daily);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, formType, page]);

  async function handleStatusChange(id: number, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
  }

  function exportCsv() {
    const header = ['ID', 'Type', 'Name', 'Phone', 'Email', 'Service', 'Address', 'ZIP', 'Status', 'Date'];
    const rows = leads.map(l => [
      l.id, l.form_type, l.full_name, l.phone, l.email, l.service_type, l.address, l.zip, l.status, l.created_at,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-amber-400" /> Leads
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total submissions</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-medium transition-all cursor-pointer"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Daily trend */}
      {daily.length > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Leads Per Day (30d)</h2>
          <AdminAreaChart data={daily} keys={['count']} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-400" />
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer
                ${status === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {FORM_TYPES.map(f => (
            <button
              key={f}
              onClick={() => { setFormType(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer
                ${formType === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'}`}
            >
              {f === 'all' ? 'All Forms' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <LeadsTable leads={leads} onStatusChange={handleStatusChange} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer
                ${p === page ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

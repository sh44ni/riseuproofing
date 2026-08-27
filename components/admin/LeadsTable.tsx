'use client';

import { useState } from 'react';
import { Phone, Monitor, Smartphone, Tablet, Clock } from 'lucide-react';

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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  quoted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: number, status: string) => void;
}

export default function LeadsTable({ leads, onStatusChange }: LeadsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function formatDate(d: string) {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {['Name', 'Contact', 'Service', 'Date', 'Status', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">No leads yet</td>
            </tr>
          )}
          {leads.map(lead => (
            <>
              <tr
                key={lead.id}
                className="hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {lead.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{lead.full_name}</p>
                      <p className="text-slate-500 text-xs capitalize">{lead.form_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {lead.phone && (
                      <p className="text-slate-300 flex items-center gap-1">
                        <Phone size={11} className="text-slate-500" />
                        {lead.phone}
                      </p>
                    )}
                    {lead.email && (
                      <p className="text-slate-500 text-xs truncate max-w-[160px]">{lead.email}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 capitalize">{lead.service_type ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
                    <Clock size={12} />
                    <span className="text-xs">{formatDate(lead.created_at)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={e => { e.stopPropagation(); onStatusChange(lead.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer bg-transparent outline-none ${STATUS_COLORS[lead.status] ?? STATUS_COLORS.new}`}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-slate-800 text-white capitalize">{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {expanded === lead.id ? '▲' : '▼'}
                </td>
              </tr>
              {expanded === lead.id && (
                <tr key={`${lead.id}-detail`} className="bg-slate-800/30">
                  <td colSpan={6} className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {lead.address && <div><p className="text-slate-500 mb-0.5">Address</p><p className="text-white">{lead.address}{lead.zip ? `, ${lead.zip}` : ''}</p></div>}
                      {lead.notes && <div><p className="text-slate-500 mb-0.5">Notes</p><p className="text-white">{lead.notes}</p></div>}
                      {lead.message && <div className="col-span-2"><p className="text-slate-500 mb-0.5">Message</p><p className="text-white">{lead.message}</p></div>}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

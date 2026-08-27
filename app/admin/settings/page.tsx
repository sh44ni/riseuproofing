'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Lock, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const router = useRouter();

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'Passwords do not match' }); return; }
    if (newPw.length < 8) { setPwMsg({ type: 'err', text: 'Password must be at least 8 characters' }); return; }
    setPwLoading(true);
    // Verify current via login
    const verify = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPw }),
    });
    if (!verify.ok) { setPwMsg({ type: 'err', text: 'Current password is incorrect' }); setPwLoading(false); return; }
    // NOTE: password is stored in .env.local — user needs to update it manually
    setPwMsg({ type: 'ok', text: 'Update ADMIN_PASSWORD in your .env.local file to: ' + newPw });
    setPwLoading(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} className="text-amber-400" /> Settings
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Admin panel configuration</p>
      </div>

      {/* Password section */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Lock size={16} className="text-amber-400" /> Change Password
        </h2>
        <p className="text-slate-500 text-xs mb-5">The new password must also be updated in your <code className="bg-white/10 px-1 rounded text-amber-400">.env.local</code> file.</p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { id: 'cur', label: 'Current Password', val: currentPw, set: setCurrentPw },
            { id: 'new', label: 'New Password', val: newPw, set: setNewPw },
            { id: 'confirm', label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
              <input
                id={f.id}
                type="password"
                value={f.val}
                onChange={e => f.set(e.target.value)}
                required
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          ))}

          {pwMsg && (
            <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 border
              ${pwMsg.type === 'ok'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {pwMsg.type === 'ok' ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {pwLoading ? 'Verifying…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Database info */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1">Database</h2>
        <p className="text-slate-500 text-xs mb-4">Neon PostgreSQL (pooled connection)</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'analytics_events', desc: 'Clicks, pageviews, scrolls' },
            { label: 'leads', desc: 'Form submissions' },
            { label: 'call_events', desc: 'Phone click tracking' },
            { label: 'admin_sessions', desc: 'Auth tokens' },
          ].map(t => (
            <div key={t.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-amber-400 text-xs font-mono font-semibold">{t.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            const r = await fetch('/api/admin/migrate', { method: 'POST' });
            const d = await r.json();
            alert(d.message ?? d.error);
          }}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-xl transition-all cursor-pointer"
        >
          Re-run Migrations
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
          <Trash2 size={16} /> Danger Zone
        </h2>
        <p className="text-slate-500 text-xs mb-4">These actions cannot be undone.</p>
        <button
          onClick={() => {
            if (confirm('Delete ALL analytics events? This cannot be undone.')) {
              fetch('/api/admin/stats') // placeholder — implement purge if needed
                .then(() => alert('Not implemented — query DB directly to purge data.'));
            }
          }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm rounded-xl transition-all cursor-pointer"
        >
          Clear Analytics Data
        </button>
      </div>
    </div>
  );
}

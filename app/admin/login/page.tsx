'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, User } from 'lucide-react';

export default function AdminLogin() {
  const [mode, setMode] = useState<'team' | 'quick'>('team');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = mode === 'team' ? { email, password } : { password };

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        // Run migration/seeding check if needed
        await fetch('/api/admin/migrate', { method: 'POST' });
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  function setDemoAccount(userEmail: string, userPass: string) {
    setMode('team');
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#080b0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs & subtle gold radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,164,71,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4a447]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c4923a]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10 admin-fade-in-1">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#d4a447] to-[#b8873a] shadow-[0_8px_40px_rgba(212,164,71,0.25)] mb-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Zap size={28} className="text-[#0c1117] font-black relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-[#f0f2f5] tracking-tight">Rise Up Roofing CRM</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[#d4a447] text-xs font-bold uppercase tracking-widest">
              CSLB #1096492
            </span>
            <span className="text-[#5e6a7a]">•</span>
            <span className="text-[#8a95a5] text-xs">Role-Based Access Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="admin-card rounded-[24px] p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)] relative">
          {/* Card inner glow */}
          <div className="absolute inset-0 rounded-[24px] border border-white/[0.06] pointer-events-none" />
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Mode Switcher */}
          <div className="flex bg-[#0a0f14] p-1 rounded-xl border border-white/[0.04] mb-6 text-xs font-bold relative z-10 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('team');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-300 ease-out flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'team'
                  ? 'bg-gradient-to-r from-[#d4a447] to-[#c4923a] text-[#0c1117] shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                  : 'text-[#8a95a5] hover:text-[#f0f2f5]'
              }`}
            >
              <User size={14} />
              Team Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('quick');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-300 ease-out flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'quick'
                  ? 'bg-gradient-to-r from-[#d4a447] to-[#c4923a] text-[#0c1117] shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                  : 'text-[#8a95a5] hover:text-[#f0f2f5]'
              }`}
            >
              <ShieldCheck size={14} />
              Owner Quick Pass
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {mode === 'team' && (
              <div>
                <label className="block text-xs font-bold text-[#a0aab8] mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e6a7a]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@riseuproofing.com"
                    required
                    className="w-full bg-[#0a0f14] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-[#f0f2f5] placeholder-[#5e6a7a] text-sm focus:outline-none focus:border-[#d4a447]/60 focus:ring-2 focus:ring-[#d4a447]/20 transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#a0aab8] mb-1.5">
                {mode === 'team' ? 'Password' : 'Admin / Master Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e6a7a]" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'team' ? 'Enter your password' : 'Enter admin password'}
                  required
                  className="w-full bg-[#0a0f14] border border-white/[0.06] rounded-xl pl-10 pr-10 py-2.5 text-[#f0f2f5] placeholder-[#5e6a7a] text-sm focus:outline-none focus:border-[#d4a447]/60 focus:ring-2 focus:ring-[#d4a447]/20 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5e6a7a] hover:text-[#a0aab8] transition-colors cursor-pointer"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5 admin-fade-in-1">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || (mode === 'team' && !email)}
              className="w-full admin-btn-gold py-3 px-6 rounded-xl shadow-[0_4px_24px_rgba(212,164,71,0.25)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(212,164,71,0.35)] cursor-pointer text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-[#0c1117]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  `Sign In to ${mode === 'team' ? 'CRM' : 'Owner Command'}`
                )}
              </div>
            </button>
          </form>

          {/* Role Test Preset Pills */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center relative z-10">
            <p className="text-[11px] font-bold text-[#5e6a7a] uppercase tracking-wider mb-2.5">
              Quick Role Test Logins
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setDemoAccount('owner@riseuproofing.com', 'RiseUp2025!')}
                className="px-2.5 py-1 rounded-lg bg-[#d4a447]/10 hover:bg-[#d4a447]/20 border border-[#d4a447]/20 text-[#d4a447] text-[11px] font-medium transition-colors cursor-pointer"
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('pm@riseuproofing.com', 'RiseUpPM2025!')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-medium transition-colors cursor-pointer"
              >
                🏗️ PM
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('sales@riseuproofing.com', 'RiseUpSales2025!')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors cursor-pointer"
              >
                💼 Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('foreman@riseuproofing.com', 'RiseUpCrew2025!')}
                className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-[11px] font-medium transition-colors cursor-pointer"
              >
                🔨 Foreman
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('office@riseuproofing.com', 'RiseUpOffice2025!')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[11px] font-medium transition-colors cursor-pointer"
              >
                📋 Office
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[#5e6a7a] text-xs mt-6 admin-fade-in-2">
          Rise Up Roofing &amp; Construction · Internal Staff Access
        </p>
      </div>
    </div>
  );
}

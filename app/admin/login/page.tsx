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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30 mb-3">
            <Zap size={28} className="text-slate-950 font-black" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Rise Up Roofing CRM</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              CSLB #1096492
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs">Role-Based Access Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
          {/* Mode Switcher */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/10 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('team');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'team'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'quick'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} />
              Owner Quick Pass
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'team' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@riseuproofing.com"
                    required
                    className="w-full bg-slate-800/70 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {mode === 'team' ? 'Password' : 'Admin / Master Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'team' ? 'Enter your password' : 'Enter admin password'}
                  required
                  className="w-full bg-slate-800/70 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || (mode === 'team' && !email)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3 px-6 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40 cursor-pointer text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating…
                </span>
              ) : (
                `Sign In to ${mode === 'team' ? 'CRM' : 'Owner Command'}`
              )}
            </button>
          </form>

          {/* Role Test Preset Pills */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Role Test Logins
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setDemoAccount('owner@riseuproofing.com', 'RiseUp2025!')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[11px] font-medium transition-colors cursor-pointer"
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

        <p className="text-center text-slate-600 text-xs mt-6">
          Rise Up Roofing &amp; Construction · Internal Staff Access
        </p>
      </div>
    </div>
  );
}


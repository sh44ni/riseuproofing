'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { RoleIcon } from '@/components/admin/shared/RoleBadge';

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
        // Run migration/seeding check in background without blocking redirect
        fetch('/api/admin/migrate', { method: 'POST' }).catch(() => {});
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Connection error. Please check your network and try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#F4F8FD] via-[#EAF2FB] to-[#F0F5FC] flex items-center justify-center p-4 relative overflow-hidden text-[#0B1E33]">
      {/* Background blobs & subtle coastal sky glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(47,159,227,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(11,30,51,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10 admin-fade-in-1">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#EAA636] to-[#d49428] shadow-[0_8px_30px_rgba(234,166,54,0.3)] mb-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Zap size={28} className="text-white font-black relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-[#0B1E33] tracking-tight">Rise Up Roofing CRM</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[#EAA636] text-xs font-bold uppercase tracking-widest">
              CSLB #1096492
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Role-Based Access Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-[24px] p-6 sm:p-8 shadow-[0_16px_48px_rgba(11,30,51,0.08)] relative">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 text-xs font-bold relative z-10">
            <button
              type="button"
              onClick={() => {
                setMode('team');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'team'
                  ? 'bg-white text-[#0B1E33] shadow-xs'
                  : 'text-slate-500 hover:text-[#0B1E33]'
              }`}
            >
              <User size={14} className={mode === 'team' ? 'text-[#1878B8]' : ''} />
              Team Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('quick');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'quick'
                  ? 'bg-white text-[#0B1E33] shadow-xs'
                  : 'text-slate-500 hover:text-[#0B1E33]'
              }`}
            >
              <ShieldCheck size={14} className={mode === 'quick' ? 'text-[#1878B8]' : ''} />
              Owner Quick Pass
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {mode === 'team' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@riseuproofing.com"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[#0B1E33] placeholder-slate-400 text-sm focus:outline-none focus:border-[#1878B8] focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {mode === 'team' ? 'Password' : 'Admin / Master Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'team' ? 'Enter your password' : 'Enter admin password'}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-[#0B1E33] placeholder-slate-400 text-sm focus:outline-none focus:border-[#1878B8] focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 admin-fade-in-1">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || (mode === 'team' && !email)}
              className="w-full admin-btn-gold py-3 px-6 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md cursor-pointer text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed font-black"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-[#0B1E33]" viewBox="0 0 24 24" fill="none">
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
          <div className="mt-6 pt-5 border-t border-slate-100 text-center relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Role Test Logins
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setDemoAccount('owner@riseuproofing.com', 'RiseUp2025!')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RoleIcon role="owner" size={12} />
                Owner
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('pm@riseuproofing.com', 'RiseUpPM2025!')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RoleIcon role="project_manager" size={12} />
                PM
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('sales@riseuproofing.com', 'RiseUpSales2025!')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RoleIcon role="sales_rep" size={12} />
                Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('foreman@riseuproofing.com', 'RiseUpCrew2025!')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RoleIcon role="field_foreman" size={12} />
                Foreman
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('office@riseuproofing.com', 'RiseUpOffice2025!')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RoleIcon role="office_admin" size={12} />
                Office
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6 admin-fade-in-2">
          Rise Up Roofing &amp; Construction · Internal Staff Access
        </p>
      </div>
    </div>
  );
}

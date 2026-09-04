'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Lock,
  CheckCircle2,
  AlertCircle,
  Database,
  Download,
  Building2,
  DollarSign,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Save,
  RefreshCw,
  ExternalLink,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface TableStat {
  table: string;
  label: string;
  desc: string;
  count: number;
}

interface DbHealth {
  status: string;
  latencyMs: number;
  provider: string;
  connected: boolean;
}

export default function SettingsPage() {
  const router = useRouter();

  // Settings State
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'Rise Up Roofing & Construction',
    license_cslb: '1096492',
    phone: '(619) 432-7663',
    email: 'info@riseuproofing.com',
    office_address: 'Escondido & San Diego County, CA',
    google_review_url: 'https://g.page/r/riseuproofing/review',
    owens_corning_id: 'OC-PREFERRED-1096492',
  });

  const [pricingDefaults, setPricingDefaults] = useState({
    target_margin_pct: 30,
    labor_rate_per_sq: 95,
    dumpster_flat_fee: 650,
    permit_base_fee: 450,
    default_shingle_per_sq: 135,
    default_tile_per_sq: 220,
    default_tpo_per_sq: 275,
  });

  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [companySuccess, setCompanySuccess] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  // Password section
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 403) {
        setIsForbidden(true);
        setLoadingData(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.company_profile) {
          setCompanyProfile(prev => ({ ...prev, ...data.settings.company_profile }));
        }
        if (data.settings?.pricing_defaults) {
          setPricingDefaults(prev => ({ ...prev, ...data.settings.pricing_defaults }));
        }
        setTableStats(data.tableStats || []);
        setDbHealth(data.dbHealth || null);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'company_profile',
          value: companyProfile,
        }),
      });
      if (res.ok) {
        setCompanySuccess(true);
        setTimeout(() => setCompanySuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'pricing_defaults',
          value: pricingDefaults,
        }),
      });
      if (res.ok) {
        setPricingSuccess(true);
        setTimeout(() => setPricingSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPricing(false);
    }
  };

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'err', text: 'Passwords do not match' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'err', text: 'Password must be at least 8 characters' });
      return;
    }
    setPwLoading(true);
    const verify = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPw }),
    });
    if (!verify.ok) {
      setPwMsg({ type: 'err', text: 'Current password is incorrect' });
      setPwLoading(false);
      return;
    }
    setPwMsg({ type: 'ok', text: 'Update ADMIN_PASSWORD in your .env.local file to: ' + newPw });
    setPwLoading(false);
  }

  const exportTypes = [
    { type: 'leads', label: 'Leads & Inquiries', desc: 'Contact info, priority scores, statuses' },
    { type: 'jobs', label: 'Jobs Pipeline', desc: 'Contracts, stages, start dates, crew' },
    { type: 'estimates', label: 'Quotes & Proposals', desc: 'Squares, materials, monthly financing' },
    { type: 'finances', label: 'Milestone Invoices', desc: 'CSLB payments, amounts, due dates' },
    { type: 'inspections', label: 'Roof Inspections', desc: 'Health scores, 12-point damage findings' },
    { type: 'reviews', label: 'Customer Reviews', desc: 'Star ratings, testimonials, feedback' },
  ];

  if (isForbidden) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center my-16 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-black text-white">Owner Access Required</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          CRM pricing configurations, database health monitors, and system settings can only be accessed by the primary Owner / Qualifier.
        </p>
        <div className="pt-2">
          <a
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/10"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Settings size={26} className="text-amber-400" />
            CRM Settings &amp; Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure business license information, default estimator pricing, accounting backups, and database monitoring.
          </p>
        </div>

        {dbHealth && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Neon DB Latency: {dbHealth.latencyMs}ms
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Company Profile & License */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-amber-400" />
              Company Profile &amp; CSLB Credentials
            </h2>
            {companySuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyProfile.company_name}
                onChange={e => setCompanyProfile({ ...companyProfile, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">California License (CSLB)</label>
                <input
                  type="text"
                  value={companyProfile.license_cslb}
                  onChange={e => setCompanyProfile({ ...companyProfile, license_cslb: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owens Corning ID</label>
                <input
                  type="text"
                  value={companyProfile.owens_corning_id}
                  onChange={e => setCompanyProfile({ ...companyProfile, owens_corning_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={companyProfile.phone}
                  onChange={e => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notification Email</label>
                <input
                  type="email"
                  value={companyProfile.email}
                  onChange={e => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Google Business Review Link</label>
              <input
                type="text"
                value={companyProfile.google_review_url}
                onChange={e => setCompanyProfile({ ...companyProfile, google_review_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Region / Office</label>
              <input
                type="text"
                value={companyProfile.office_address}
                onChange={e => setCompanyProfile({ ...companyProfile, office_address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingCompany}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={13} /> {savingCompany ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Estimator & Pricing Defaults */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-amber-400" />
              Estimator &amp; Pricing Baseline Rates
            </h2>
            {pricingSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSavePricing} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Gross Margin (%)</label>
                <input
                  type="number"
                  value={pricingDefaults.target_margin_pct}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, target_margin_pct: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Labor Rate ($/Square)</label>
                <input
                  type="number"
                  value={pricingDefaults.labor_rate_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, labor_rate_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dumpster Flat Fee ($)</label>
                <input
                  type="number"
                  value={pricingDefaults.dumpster_flat_fee}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, dumpster_flat_fee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City Building Permit ($)</label>
                <input
                  type="number"
                  value={pricingDefaults.permit_base_fee}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, permit_base_fee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Shingle Material ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_shingle_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_shingle_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tile Material ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_tile_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_tile_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">TPO Flat ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_tpo_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_tpo_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              These values populate the instant cost calculator wizard when building proposals for homeowners.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPricing}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={13} /> {savingPricing ? 'Saving...' : 'Save Pricing Rates'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 1-Click Data Backup & CSV Exports Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              1-Click Data Backup &amp; Accounting CSV Exports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly export CRM records in standard RFC 4180 CSV format for QuickBooks, Excel, or offline compliance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {exportTypes.map(({ type, label, desc }) => (
            <a
              key={type}
              href={`/api/admin/export?type=${type}`}
              download
              className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-amber-400/40 transition-all flex items-start justify-between group cursor-pointer"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors block">
                  {label}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{desc}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 transition-all flex-shrink-0">
                <Download size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Live Neon PostgreSQL Database Health Monitor */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database size={18} className="text-cyan-400" />
              Live Database Health &amp; Table Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Neon Serverless PostgreSQL connection status and real-time record volumes across all 16 tables.
            </p>
          </div>

          <button
            onClick={fetchSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh table metrics"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loadingData ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-amber-400 animate-spin" /> Querying table metrics...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tableStats.map(t => (
              <div key={t.table} className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="font-mono text-xs font-bold text-amber-400 block truncate">
                  {t.table}
                </span>
                <div className="text-xl font-black text-white mt-1">{t.count}</div>
                <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={t.desc}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security & Password Change */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock size={18} className="text-amber-400" /> Security &amp; Admin Password
        </h2>
        <p className="text-slate-400 text-xs">
          Verify and generate a new secure password for the CRM administrative session.
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs max-w-md">
          {[
            { id: 'cur', label: 'Current Admin Password', val: currentPw, set: setCurrentPw },
            { id: 'new', label: 'New Password (min 8 chars)', val: newPw, set: setNewPw },
            { id: 'confirm', label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block font-semibold text-slate-300 mb-1">{f.label}</label>
              <input
                id={f.id}
                type="password"
                value={f.val}
                onChange={e => f.set(e.target.value)}
                required
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          ))}

          {pwMsg && (
            <div className={`flex items-start gap-2 text-xs rounded-xl px-3.5 py-2.5 border ${
              pwMsg.type === 'ok'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {pwMsg.type === 'ok' ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />}
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {pwLoading ? 'Verifying…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

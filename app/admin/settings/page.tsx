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
  User as UserIcon,
  Camera,
} from 'lucide-react';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge from '@/components/admin/shared/RoleBadge';
import AvatarPickerModal from '@/components/admin/shared/AvatarPickerModal';
import { UserRole } from '@/lib/rbac';

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

  // Profile & Avatar State
  const [profile, setProfile] = useState<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: UserRole | string;
    avatar_url?: string | null;
  } | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [showProfileAvatarPicker, setShowProfileAvatarPicker] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password section
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setProfileName(data.user.name || '');
          setProfilePhone(data.user.phone || '');
          setProfileAvatarUrl(data.user.avatar_url || null);
        }
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

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
    fetchProfile();
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          avatar_url: profileAvatarUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2500);
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch {
      setProfileError('Connection error while updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

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

  const renderProfileSection = () => (
    <div className="p-6 rounded-[20px] admin-card border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] bg-[#141b24]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#d4a447]/20 text-[#d4a447] flex items-center justify-center">
            <UserIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f0f2f5]">My Profile &amp; Avatar</h2>
            <p className="text-xs text-[#8a95a5]">
              Manage your personal portrait photo, contact information, and role identity
            </p>
          </div>
        </div>
        {profile?.role && (
          <div className="flex items-center gap-2">
            <RoleBadge role={profile.role} size="sm" />
          </div>
        )}
      </div>

      {profileSuccess && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={15} /> Profile updated successfully! Changes reflect across the CRM.
        </div>
      )}
      {profileError && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          <AlertCircle size={15} /> {profileError}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-[#0a0f14] border border-white/[0.05]">
          <div className="relative flex-shrink-0">
            <UserAvatar
              name={profileName || profile?.name || 'User'}
              avatarUrl={profileAvatarUrl}
              role={profile?.role}
              size="2xl"
              showStatus
              showRoleBadge
            />
            <button
              type="button"
              onClick={() => setShowProfileAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#d4a447] text-[#0c1117] hover:bg-amber-400 shadow-md transition-all cursor-pointer"
              title="Change Photo"
            >
              <Camera size={14} className="stroke-[2.5]" />
            </button>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="text-sm font-bold text-[#f0f2f5] flex items-center gap-2">
              <span>Portrait Photo</span>
              {profileAvatarUrl ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Custom Portrait Active
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8a95a5] border border-white/[0.08] font-semibold">
                  Initial Monogram
                </span>
              )}
            </div>
            <p className="text-xs text-[#8a95a5]">
              Choose from 10 realistic contractor portraits, upload any photo from your device (auto-compressed), or paste an external image link.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowProfileAvatarPicker(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1a2332] hover:bg-[#1e2736] border border-white/[0.08] text-[#f0f2f5] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Camera size={13} className="text-[#d4a447]" />
                Change Photo
              </button>
              {profileAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfileAvatarUrl(null)}
                  className="px-3 py-1.5 text-xs text-[#8a95a5] hover:text-red-400 font-medium cursor-pointer transition-colors"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[#a0aab8] font-semibold mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#a0aab8] font-semibold mb-1">Direct Phone Number</label>
            <input
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="(818) 555-0100"
              className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#a0aab8] font-semibold mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0f14]/80 border border-white/[0.04] text-[#5e6a7a] cursor-not-allowed"
              title="Email is fixed to your account login"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-amber-400 hover:to-orange-400 text-[#0c1117] font-bold text-xs shadow-[0_4px_16px_rgba(0,0,0,0.25)] shadow-[0_4px_20px_rgba(212,164,71,0.12)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Save size={14} />
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );

  if (isForbidden) {
    return (
      <div className="space-y-8 pb-24 md:pb-12 max-w-6xl mx-auto admin-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#f0f2f5] flex items-center gap-2.5">
            <Settings size={26} className="text-[#d4a447]" />
            Personal Settings &amp; Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#8a95a5] mt-0.5">
            Manage your personal portrait photo, contact details, and role credentials.
          </p>
        </div>

        {renderProfileSection()}

        <div className="p-8 max-w-2xl mx-auto text-center my-6 space-y-3 bg-[#141b24] border border-white/[0.06] rounded-[20px]">
          <div className="w-12 h-12 rounded-[14px] bg-[#d4a447]/10 border border-[#d4a447]/20 text-[#d4a447] flex items-center justify-center mx-auto shadow-[0_4px_16px_rgba(212,164,71,0.08)]">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-base font-black text-[#f0f2f5]">Company &amp; System Settings Restricted</h3>
          <p className="text-xs text-[#8a95a5] leading-relaxed">
            CRM pricing configurations, database health monitors, and system backups can only be accessed by the primary Owner / Qualifier.
          </p>
        </div>

        <AvatarPickerModal
          isOpen={showProfileAvatarPicker}
          onClose={() => setShowProfileAvatarPicker(false)}
          currentAvatarUrl={profileAvatarUrl}
          userName={profileName || profile?.name || 'User'}
          userRole={profile?.role || 'owner'}
          onSelectAvatar={(url) => setProfileAvatarUrl(url)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12 max-w-6xl mx-auto admin-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#f0f2f5] flex items-center gap-2.5">
            <Settings size={26} className="text-[#d4a447]" />
            CRM Settings &amp; Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#8a95a5] mt-0.5">
            Configure business license information, default estimator pricing, accounting backups, and database monitoring.
          </p>
        </div>

        {dbHealth && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold self-start sm:self-auto shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Neon DB Latency: {dbHealth.latencyMs}ms
          </div>
        )}
      </div>

      {/* Featured: My Profile & Avatar Card */}
      {renderProfileSection()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 admin-fade-in-1">
        {/* Card 1: Company Profile & License */}
        <div className="p-6 rounded-[20px] admin-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
              <Building2 size={18} className="text-[#d4a447]" />
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
              <label className="block text-[#a0aab8] font-semibold mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyProfile.company_name}
                onChange={e => setCompanyProfile({ ...companyProfile, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">California License (CSLB)</label>
                <input
                  type="text"
                  value={companyProfile.license_cslb}
                  onChange={e => setCompanyProfile({ ...companyProfile, license_cslb: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Owens Corning ID</label>
                <input
                  type="text"
                  value={companyProfile.owens_corning_id}
                  onChange={e => setCompanyProfile({ ...companyProfile, owens_corning_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={companyProfile.phone}
                  onChange={e => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Notification Email</label>
                <input
                  type="email"
                  value={companyProfile.email}
                  onChange={e => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a0aab8] font-semibold mb-1">Google Business Review Link</label>
              <input
                type="text"
                value={companyProfile.google_review_url}
                onChange={e => setCompanyProfile({ ...companyProfile, google_review_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[#a0aab8] font-semibold mb-1">Service Region / Office</label>
              <input
                type="text"
                value={companyProfile.office_address}
                onChange={e => setCompanyProfile({ ...companyProfile, office_address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingCompany}
                className="px-5 py-2 rounded-xl admin-btn-gold text-[#0c1117] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={13} /> {savingCompany ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Estimator & Pricing Defaults */}
        <div className="p-6 rounded-[20px] admin-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
              <DollarSign size={18} className="text-[#d4a447]" />
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
                <label className="block text-[#a0aab8] font-semibold mb-1">Target Gross Margin (%)</label>
                <input
                  type="number"
                  value={pricingDefaults.target_margin_pct}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, target_margin_pct: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Labor Rate ($/Square)</label>
                <input
                  type="number"
                  value={pricingDefaults.labor_rate_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, labor_rate_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Dumpster Flat Fee ($)</label>
                <input
                  type="number"
                  value={pricingDefaults.dumpster_flat_fee}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, dumpster_flat_fee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">City Building Permit ($)</label>
                <input
                  type="number"
                  value={pricingDefaults.permit_base_fee}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, permit_base_fee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Shingle Material ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_shingle_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_shingle_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">Tile Material ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_tile_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_tile_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a0aab8] font-semibold mb-1">TPO Flat ($/sq)</label>
                <input
                  type="number"
                  value={pricingDefaults.default_tpo_per_sq}
                  onChange={e => setPricingDefaults({ ...pricingDefaults, default_tpo_per_sq: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl admin-input text-[#f0f2f5] focus:outline-none font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#5e6a7a] italic">
              These values populate the instant cost calculator wizard when building proposals for homeowners.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPricing}
                className="px-5 py-2 rounded-xl admin-btn-gold text-[#0c1117] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={13} /> {savingPricing ? 'Saving...' : 'Save Pricing Rates'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 1-Click Data Backup & CSV Exports Section */}
      <div className="p-6 rounded-[20px] admin-card space-y-4 admin-fade-in-2">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              1-Click Data Backup &amp; Accounting CSV Exports
            </h2>
            <p className="text-xs text-[#8a95a5] mt-0.5">
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
              className="p-4 rounded-[16px] bg-[#0a0f14] hover:bg-[#141b24] border border-white/[0.04] hover:border-[#d4a447]/30 transition-all flex items-start justify-between group cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(212,164,71,0.08)]"
            >
              <div>
                <span className="text-sm font-bold text-[#f0f2f5] group-hover:text-[#e8c06a] transition-colors block">
                  {label}
                </span>
                <span className="text-[11px] text-[#8a95a5] mt-0.5 block">{desc}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] group-hover:bg-[#d4a447] group-hover:text-[#0c1117] text-[#8a95a5] transition-all flex-shrink-0">
                <Download size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Live Neon PostgreSQL Database Health Monitor */}
      <div className="p-6 rounded-[20px] admin-card space-y-4 admin-fade-in-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
              <Database size={18} className="text-cyan-400" />
              Live Database Health &amp; Table Telemetry
            </h2>
            <p className="text-xs text-[#8a95a5] mt-0.5">
              Neon Serverless PostgreSQL connection status and real-time record volumes across all 16 tables.
            </p>
          </div>

          <button
            onClick={fetchSettings}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#8a95a5] hover:text-[#f0f2f5] transition-colors cursor-pointer"
            title="Refresh table metrics"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loadingData ? (
          <div className="p-8 text-center text-[#8a95a5] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-[#d4a447] admin-shimmer" /> Querying table metrics...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tableStats.map(t => (
              <div key={t.table} className="p-3.5 rounded-[16px] bg-[#0a0f14] border border-white/[0.04]">
                <span className="font-mono text-xs font-bold text-[#d4a447] block truncate">
                  {t.table}
                </span>
                <div className="text-xl font-black text-[#f0f2f5] mt-1">{t.count}</div>
                <span className="text-[10px] text-[#5e6a7a] line-clamp-1 mt-0.5" title={t.desc}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security & Password Change */}
      <div className="p-6 rounded-[20px] admin-card space-y-4 admin-fade-in-4">
        <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
          <Lock size={18} className="text-[#d4a447]" /> Security &amp; Admin Password
        </h2>
        <p className="text-[#8a95a5] text-xs">
          Verify and generate a new secure password for the CRM administrative session.
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs max-w-md">
          {[
            { id: 'cur', label: 'Current Admin Password', val: currentPw, set: setCurrentPw },
            { id: 'new', label: 'New Password (min 8 chars)', val: newPw, set: setNewPw },
            { id: 'confirm', label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block font-semibold text-[#a0aab8] mb-1">{f.label}</label>
              <input
                id={f.id}
                type="password"
                value={f.val}
                onChange={e => f.set(e.target.value)}
                required
                className="w-full admin-input rounded-xl px-3.5 py-2.5 text-[#f0f2f5] focus:outline-none"
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
            className="admin-btn-gold text-[#0c1117] font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {pwLoading ? 'Verifying…' : 'Update Password'}
          </button>
        </form>
      </div>

      <AvatarPickerModal
        isOpen={showProfileAvatarPicker}
        onClose={() => setShowProfileAvatarPicker(false)}
        currentAvatarUrl={profileAvatarUrl}
        userName={profileName || profile?.name || 'User'}
        userRole={profile?.role || 'owner'}
        onSelectAvatar={(url) => setProfileAvatarUrl(url)}
      />
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Shield,
  MapPin,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { RoleType, TeamMember, UserRole } from '@/types/settingsTypes';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (member: {
    name: string;
    email: string;
    phone: string;
    role: RoleType;
    roleLabel: string;
    branch: string;
    avatarColor: string;
    initials: string;
    status: 'active' | 'invited';
    twoFactorEnabled: boolean;
  }) => void;
  roles: UserRole[];
}

export function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
  roles,
}: InviteUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('senior_estimator');
  const [branch, setBranch] = useState('Oceanside HQ');
  const [require2FA, setRequire2FA] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const roleMeta = roles.find((r) => r.id === selectedRole) || roles[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const gradientColors = [
      'from-sky-500 to-blue-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-purple-500 to-indigo-600',
      'from-rose-500 to-pink-600',
    ];
    const avatarColor =
      gradientColors[Math.floor(Math.random() * gradientColors.length)];

    setTimeout(() => {
      onInvite({
        name,
        email,
        phone: phone || '(760) 842-7899',
        role: selectedRole,
        roleLabel: roleMeta.title,
        branch,
        avatarColor,
        initials: initials || 'RU',
        status: 'invited',
        twoFactorEnabled: require2FA,
      });
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="light-glass-card rounded-3xl border border-white/80 bg-white/95 backdrop-blur-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-sky-50/60 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1878B8] to-[#2F9FE3] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(47,159,227,0.3)]">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Invite Team Member
              </h3>
              <p className="text-xs text-slate-500">
                Add an estimator, crew lead, or office administrator to Rise Up CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Bradley"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus@riseuproofing.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mobile Phone
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(760) 842-7898"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Role Picker */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Operational Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
            >
              <option value="senior_estimator">Senior Estimator (Proposals & Contracts)</option>
              <option value="crew_lead">Crew Lead Foreman (Field Work Orders & Safety)</option>
              <option value="production_manager">Production Manager (Suppliers & Schedules)</option>
              <option value="office_admin">Office Administrator (Inbound Leads & City Permits)</option>
              <option value="owner">Owner & Executive (Full Unrestricted Access)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              {roleMeta.description}
            </p>
          </div>

          {/* Branch Assignment */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Territory / Operating Branch
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              >
                <option value="Oceanside HQ">Oceanside HQ (1942 Oceanside Blvd)</option>
                <option value="Carlsbad Yard">Carlsbad Industrial Yard (Production)</option>
                <option value="Coastal Mobile">Coastal Mobile Rig (Encinitas / Del Mar)</option>
              </select>
            </div>
          </div>

          {/* Security & Notification Checkboxes */}
          <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={require2FA}
                onChange={(e) => setRequire2FA(e.target.checked)}
                className="w-4 h-4 rounded text-[#1878B8] focus:ring-[#1878B8] border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-600" />
                Enforce Mandatory Two-Factor Authentication (2FA)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="w-4 h-4 rounded text-[#1878B8] focus:ring-[#1878B8] border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                Send Welcome SMS & Email with one-time secure setup token
              </span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#1878B8] to-[#2F9FE3] text-white hover:brightness-110 shadow-[0_3px_12px_rgba(47,159,227,0.35)] transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Send Member Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

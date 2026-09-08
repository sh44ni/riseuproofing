'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface InvitationData {
  id: number;
  email: string;
  roles: string[];
  expires_at: string;
}

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link. Token is missing.');
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/admin/invitations/${token}`);
        const data = await res.json();
        if (data.ok && data.invitation) {
          setInvitation(data.invitation);
        } else {
          setLoadError(data.error || 'This invitation is invalid, expired, or has already been accepted.');
        }
      } catch {
        setLoadError('Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      } else {
        setFormError(data.error || 'Failed to accept invitation. Please try again.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#EAA636]/30 border-t-[#EAA636] rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Validating invitation...</p>
      </div>
    );
  }

  if (loadError || !invitation) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 text-center backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invitation Unavailable</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {loadError || 'This invitation is invalid or has expired.'}
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition shadow-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 text-center backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Welcome to the Team!</h1>
          <p className="text-slate-400 text-sm mb-4">
            Your account is ready. Redirecting to your Rise Up CRM dashboard...
          </p>
          <div className="w-8 h-8 border-3 border-[#EAA636]/30 border-t-[#EAA636] rounded-full animate-spin mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B1E33] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-5">
          <Image
            src="/logo.svg"
            alt="Rise Up Roofing & Construction"
            width={160}
            height={48}
            priority
            className="h-10 w-auto object-contain brightness-0 invert"
          />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Accept Team Invitation
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Set up your profile and password to access the Rise Up CRM workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-xl">
          {/* Assigned Roles Banner */}
          <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#EAA636]" /> Assigned Role(s)
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {invitation.roles && invitation.roles.length > 0 ? (
                invitation.roles.map((roleName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1878B8]/20 text-sky-300 border border-[#1878B8]/30"
                  >
                    {roleName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-300">Staff</span>
              )}
            </div>
          </div>

          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  readOnly
                  value={invitation.email}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-sm cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-[#EAA636] focus:ring-1 focus:ring-[#EAA636] text-white text-sm outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Create Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-[#EAA636] focus:ring-1 focus:ring-[#EAA636] text-white text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-[#EAA636] focus:ring-1 focus:ring-[#EAA636] text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-[#0B1E33] bg-gradient-to-r from-[#EAA636] to-[#F3BA58] hover:from-[#d9972c] hover:to-[#eaa636] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EAA636] focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B1E33]/30 border-t-[#0B1E33] rounded-full animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Accept &amp; Enter CRM</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/admin/login" className="text-sky-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

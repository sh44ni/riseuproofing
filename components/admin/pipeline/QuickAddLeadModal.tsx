'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Mail,
  Hammer,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import CustomSelect from '@/components/admin/shared/CustomSelect';

interface QuickAddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: any) => void;
  currentUserId?: number;
}

const LEAD_SOURCE_OPTIONS = [
  { value: 'door_knock', label: '🚪 Door Knock (Field Canvassing)' },
  { value: 'referral', label: '🤝 Client Referral' },
  { value: 'website_form', label: '🌐 Website Inbound' },
  { value: 'google_ads', label: '🔍 Google Ads' },
  { value: 'yelp', label: '⭐ Yelp Directory' },
  { value: 'thumbtack', label: '📌 Thumbtack' },
  { value: 'angies_list', label: '📋 Angi / Angie\'s List' },
  { value: 'nextdoor', label: '🏡 Nextdoor' },
  { value: 'phone', label: '📞 Direct Phone Call' },
];

const SERVICE_OPTIONS = [
  'Full Tile Roof Replacement',
  'Tile Roof Leak Repair',
  'Architectural Shingle Replacement',
  'Shingle Leak & Storm Repair',
  'General Roof Repair & Maintenance',
  'Commercial Flat Roof (TPO)',
];

export default function QuickAddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}: QuickAddLeadModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_OPTIONS[0]);
  const [leadSource, setLeadSource] = useState('door_knock');
  const [notes, setNotes] = useState('');
  const [claimImmediately, setClaimImmediately] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Homeowner full name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        zip: zip.trim() || undefined,
        serviceType,
        leadSource,
        sourceType: leadSource === 'door_knock' ? 'team_member' : 'website',
        leadSourceDetail: leadSource === 'door_knock' ? 'Door Knock / Field Canvassing' : undefined,
        notes: notes.trim() || undefined,
        createdByUserId: currentUserId,
        assignedToUserId: claimImmediately ? currentUserId : undefined,
      };

      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create lead');
      }

      onSuccess(data.lead);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred creating the lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quick Add Lead — Field Entry
              </h2>
              <p className="text-xs text-slate-500">
                Capture door knock, referral, or incoming lead directly to Stage 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Lead Source Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Lead Source Tag <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={leadSource}
              onChange={setLeadSource}
              options={LEAD_SOURCE_OPTIONS}
              size="sm"
            />
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Homeowner Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="(760) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Address, City, Zip */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Property Street Address
            </label>
            <div className="relative mb-2">
              <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="1234 Sunny View Way"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City (e.g. Oceanside)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Email & Service Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="homeowner@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Service Needed
              </label>
              <CustomSelect
                value={serviceType}
                onChange={setServiceType}
                options={SERVICE_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          {/* Field Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Field Notes / Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Noticeable missing ridge tiles on front slope; homeowner expressed leak into hallway."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Assignment Toggle */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Claim Lead Immediately</div>
                <div className="text-[11px] text-slate-500">
                  Assign this lead directly to you rather than landing in Unassigned Pool
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={claimImmediately}
                onChange={(e) => setClaimImmediately(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold shadow-sm hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {submitting ? 'Creating Lead...' : 'Create Lead & Land in Stage 1'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

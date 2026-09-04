'use client';

import React, { useState } from 'react';
import BottomSheet from '../shared/BottomSheet';
import { UserPlus } from 'lucide-react';

interface AddLeadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SERVICE_TYPES = [
  'Residential Roofing',
  'Commercial Roofing (TPO/Coating)',
  'Roof Leak & Tile Repair',
  'Solar + Roofing',
  'General Construction / Dry Rot',
  'Inspection / Assessment',
];

const LEAD_SOURCES = [
  { value: 'phone', label: 'Phone Call (Inbound)' },
  { value: 'door_knocker', label: 'Door-to-Door / Field Rep' },
  { value: 'referral', label: 'Customer / Partner Referral' },
  { value: 'website', label: 'Website / Online' },
  { value: 'google_ads', label: 'Google Search / Ads' },
  { value: 'yelp', label: 'Yelp / Directory' },
  { value: 'event', label: 'Trade Show / Event' },
];

export default function AddLeadSheet({ isOpen, onClose, onCreated }: AddLeadSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    serviceType: SERVICE_TYPES[0],
    leadSource: 'phone',
    address: '',
    zip: '',
    roofSqf: '',
    roofType: 'Concrete Tile',
    stories: '1',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      setError('Contact Name and Phone number are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create lead');
      }

      onCreated();
      onClose();
      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        serviceType: SERVICE_TYPES[0],
        leadSource: 'phone',
        address: '',
        zip: '',
        roofSqf: '',
        roofType: 'Concrete Tile',
        stories: '1',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Error creating lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lead"
      subtitle="Enter property & contact details for instant scoring"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Contact Information
          </h4>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Johnson"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone *</label>
              <input
                type="tel"
                required
                placeholder="(760) 000-0000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Project & Source */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Project & Pipeline
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Service Type</label>
              <select
                value={formData.serviceType}
                onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                {SERVICE_TYPES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Source</label>
              <select
                value={formData.leadSource}
                onChange={e => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                {LEAD_SOURCES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Roofing Specs */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Property Specifications (Roofing)
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Est. SQF</label>
              <input
                type="number"
                placeholder="2500"
                value={formData.roofSqf}
                onChange={e => setFormData({ ...formData, roofSqf: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Roof Type</label>
              <select
                value={formData.roofType}
                onChange={e => setFormData({ ...formData, roofType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="Concrete Tile">Concrete Tile</option>
                <option value="Clay Tile">Clay Tile</option>
                <option value="Architectural Shingle">Shingle</option>
                <option value="Flat / TPO">Flat / TPO</option>
                <option value="Metal">Metal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stories</label>
              <select
                value={formData.stories}
                onChange={e => setFormData({ ...formData, stories: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="1">1 Story</option>
                <option value="2">2 Stories</option>
                <option value="3">3+ Stories</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Address / City</label>
              <input
                type="text"
                placeholder="e.g. 1245 Grand Ave, Escondido"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ZIP Code</label>
              <input
                type="text"
                placeholder="92025"
                value={formData.zip}
                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Active leak in master bedroom ceiling; needs urgent inspection..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold text-sm shadow-lg hover:from-amber-300 hover:to-orange-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus size={18} />
            {loading ? 'Creating Lead...' : 'Save & Calculate Score'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

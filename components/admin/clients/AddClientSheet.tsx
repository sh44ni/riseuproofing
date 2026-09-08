'use client';

import React, { useState } from 'react';
import BottomSheet from '../shared/BottomSheet';
import SourceSelector from '../shared/SourceSelector';
import CustomSelect from '../shared/CustomSelect';
import { UserPlus, Home, Phone, Mail, MapPin } from 'lucide-react';

interface AddClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newClient?: any) => void;
}

const PROPERTY_TYPES = [
  'Single Family',
  'Commercial / Industrial',
  'Condo / Townhouse',
  'Multi-Unit Residential',
  'HOA Community',
];

const ROOF_TYPES = [
  'Concrete Tile',
  'Clay Tile',
  'Architectural Shingle',
  'Flat / TPO / Coating',
  'Standing Seam Metal',
  'Wood Shake / Composite',
];

export default function AddClientSheet({ isOpen, onClose, onCreated }: AddClientSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    secondaryPhone: '',
    address: '',
    city: 'San Diego',
    zip: '',
    propertyType: PROPERTY_TYPES[0],
    roofType: ROOF_TYPES[0],
    roofSqf: '',
    roofAge: '',
    stories: '1',
    hoa: false,
    notes: '',
    sourceType: 'team_member' as 'website' | 'team_member',
    sourceDetail: 'Sales Rep Outreach',
    acquiredByUserId: null as number | null,
  });

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Client full name is required');
      return;
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      setError('At least one contact method (phone or email) is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sourceType: formData.sourceType,
          acquiredByUserId: formData.acquiredByUserId,
          leadSourceDetail: formData.sourceDetail,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create client');
      }

      const data = await res.json();
      onCreated(data.client);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add New Client Profile">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto pb-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Primary Contact Details */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <UserPlus size={14} className="text-[#2F9FE3]" />
            <span>Contact Information</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Client Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Henderson"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
              <input
                type="tel"
                placeholder="(760) 555-0199"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="robert@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Property & Location */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-[#2F9FE3]" />
            <span>Property & Roof Specifications</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="1234 Grand Ave"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Escondido / San Diego"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ZIP Code</label>
              <input
                type="text"
                placeholder="92025"
                value={formData.zip}
                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property Type</label>
              <CustomSelect
                value={formData.propertyType}
                onChange={(val) => setFormData({ ...formData, propertyType: val })}
                options={PROPERTY_TYPES}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Material</label>
              <CustomSelect
                value={formData.roofType}
                onChange={(val) => setFormData({ ...formData, roofType: val })}
                options={ROOF_TYPES}
                size="sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Sq Ft</label>
              <input
                type="number"
                placeholder="2,400"
                value={formData.roofSqf}
                onChange={e => setFormData({ ...formData, roofSqf: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Age (Yrs)</label>
              <input
                type="number"
                placeholder="18"
                value={formData.roofAge}
                onChange={e => setFormData({ ...formData, roofAge: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stories</label>
              <CustomSelect
                value={formData.stories}
                onChange={(val) => setFormData({ ...formData, stories: val })}
                options={[
                  { value: '1', label: '1 Story' },
                  { value: '2', label: '2 Stories' },
                  { value: '3', label: '3+ Stories' },
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Source Attribution */}
        <div className="pt-2 border-t border-slate-200/80">
          <SourceSelector
            sourceType={formData.sourceType}
            sourceDetail={formData.sourceDetail}
            userId={formData.acquiredByUserId}
            entityType="client"
            onChange={({ sourceType, sourceDetail, userId }) =>
              setFormData(prev => ({
                ...prev,
                sourceType: 'team_member',
                sourceDetail: sourceDetail || '',
                acquiredByUserId: userId ?? null,
              }))
            }
          />
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Initial Notes / Inquiries
          </label>
          <textarea
            rows={3}
            placeholder="Homeowner reported missing tiles after storm, interested in Owens Corning duration shingles..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2F9FE3] to-[#1878B8] hover:opacity-95 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Profile...' : 'Save Client Profile'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Phone,
  Mail,
  Home,
  MapPin,
  FileText,
  ChevronDown,
  Layers,
  Building,
  Hash,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cleanseAuthor, serializeProfileNote } from '@/lib/noteUtils';

export interface CreateLeadPayload {
  name: string;
  phone: string;
  email: string;
  service: string;
  serviceColor: 'sky' | 'amber' | 'emerald' | 'purple' | 'coral' | 'indigo' | 'blue';
  sqf: string;
  roofType: string;
  stories: string;
  address: string;
  zipCode: string;
  notes: string;
  city: string;
  stageId?: string;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLead?: (lead: CreateLeadPayload) => void;
  initialStageId?: string;
}

export function CreateLeadModal({
  isOpen,
  initialStageId = 'cold_lead',
  onClose,
  onSubmitLead,
}: CreateLeadModalProps) {
  const { user } = useAuth();
  const clean = cleanseAuthor(user?.name, user?.role);
  const authorName = clean.name;
  const authorRole = clean.role || 'Owner';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Residential Roofing',
    sqf: '2500',
    roofType: 'Concrete Tile',
    stories: '1 Story',
    address: '',
    zipCode: '92025',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: 'Residential Roofing',
        sqf: '2500',
        roofType: 'Concrete Tile',
        stories: '1 Story',
        address: '',
        zipCode: '92025',
        notes: '',
      });
      setError(null);
      setSuccessNotice(false);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Phone number format helper: (760) 000-0000
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
    } else if (raw.length > 0) {
      formatted = `(${raw}`;
    }
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  // Service to serviceColor mapping
  const getServiceColor = (service: string): 'sky' | 'amber' | 'emerald' | 'purple' | 'coral' | 'indigo' | 'blue' => {
    if (service.includes('Tile')) return 'coral';
    if (service.includes('Commercial') || service.includes('Flat')) return 'sky';
    if (service.includes('Repair') || service.includes('Emergency')) return 'amber';
    if (service.includes('Solar')) return 'purple';
    if (service.includes('Gutters') || service.includes('Maintenance')) return 'emerald';
    return 'blue';
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter the homeowner / company full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const addressParts = formData.address.split(',');
      const city = addressParts.length > 1 ? addressParts[1].trim() : 'Oceanside, CA';
      const stampedNotes = formData.notes.trim()
        ? serializeProfileNote(formData.notes.trim(), authorName, authorRole)
        : '';

      const payload: CreateLeadPayload = {
        ...formData,
        notes: stampedNotes,
        serviceColor: getServiceColor(formData.service),
        city: city.includes('CA') ? city : `${city}, CA`,
        stageId: initialStageId,
      };

      try {
        await api.createLead({
          name: formData.name,
          fullName: formData.name,
          full_name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: payload.city,
          zip: formData.zipCode,
          service: formData.service,
          serviceType: formData.service,
          service_type: formData.service,
          notes: stampedNotes,
          leadSource: 'manual',
          lead_source: 'manual',
        });
      } catch (apiErr) {
        console.warn('API sync deferred; added lead locally to active pipeline:', apiErr);
      }

      if (onSubmitLead) {
        await onSubmitLead(payload);
      }

      setSuccessNotice(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Portal directly to document.body to blanket BOTH side panels
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Ambient Caustic Light Behind Modal */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-sky-400/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-80 h-80 bg-amber-400/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Centered Optical Glass Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-[26px] bg-white/94 backdrop-blur-3xl border border-white/95 shadow-[0_25px_90px_rgba(0,0,0,0.40),0_0_0_1px_rgba(255,255,255,0.9)_inset] overflow-hidden my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Specular Top Highlight Bevel */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3.5 border-b border-slate-200/75 flex items-start justify-between gap-4 bg-white/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Create New Lead
              </h2>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7] border border-sky-300/70 shadow-2xs">
                Pipeline Intake
              </span>
            </div>

            {/* Minimal Autofetched Account Tag */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>Enter property & contact details</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] font-bold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Rep: {authorName} ({authorRole.toUpperCase()})</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            title="Close dialog (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>Lead created successfully! Added to pipeline.</span>
            </div>
          )}

          {/* ========================================================
              SECTION 1: CONTACT INFORMATION
              ======================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#1878B8] to-[#55C4F5]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Contact Information
              </span>
              <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
            </div>

            {/* Full Name * */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1878B8] transition-colors pointer-events-none" />
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Robert Johnson"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1878B8] transition-colors pointer-events-none" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(760) 000-0000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1878B8] transition-colors pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 2: PROJECT & PIPELINE
              ======================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#1878B8] to-[#55C4F5]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Project & Service
              </span>
              <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
            </div>

            {/* Service Type Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Service Type
              </label>
              <div className="relative group">
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-bold text-slate-900 appearance-none outline-none cursor-pointer pr-9 transition-all shadow-2xs"
                >
                  <option value="Residential Roofing">Residential Roofing</option>
                  <option value="Concrete / Spanish Tile Relay & Reset">Concrete / Spanish Tile Relay & Reset</option>
                  <option value="Asphalt & Architectural Shingle">Asphalt & Architectural Shingle</option>
                  <option value="Emergency Roof Leak Repair">Emergency Roof Leak Repair</option>
                  <option value="Commercial Flat Roofing">Commercial Flat Roofing</option>
                  <option value="Solar Detach & Reset (R&R)">Solar Detach & Reset (R&R)</option>
                  <option value="Full Gutters & Maintenance">Full Gutters & Maintenance</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-700 pointer-events-none transition-colors" />
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 3: PROPERTY SPECIFICATIONS (ROOFING)
              ======================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#1878B8] to-[#55C4F5]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Property Specifications (Roofing)
              </span>
              <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
            </div>

            {/* 3-Column Spec Row */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Est. SQF */}
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Est. SQF
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={formData.sqf}
                    onChange={(e) => setFormData({ ...formData, sqf: e.target.value })}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Roof Type */}
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Roof Type
                </label>
                <div className="relative group">
                  <select
                    value={formData.roofType}
                    onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 appearance-none outline-none cursor-pointer pr-6 truncate transition-all shadow-2xs"
                  >
                    <option value="Concrete Tile">Concrete Tile</option>
                    <option value="Spanish Clay Tile">Spanish Clay Tile</option>
                    <option value="Architectural Shingle">Architectural Shingle</option>
                    <option value="Standing Seam Metal">Standing Seam Metal</option>
                    <option value="Flat / Torch Down">Flat / Torch Down</option>
                    <option value="Wood Shake">Wood Shake</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Stories */}
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Stories
                </label>
                <div className="relative group">
                  <select
                    value={formData.stories}
                    onChange={(e) => setFormData({ ...formData, stories: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 appearance-none outline-none cursor-pointer pr-6 transition-all shadow-2xs"
                  >
                    <option value="1 Story">1 Story</option>
                    <option value="2 Story">2 Story</option>
                    <option value="3 Story">3 Story</option>
                    <option value="Split Level">Split Level</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Address / City & ZIP Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Address / City
                </label>
                <div className="relative group">
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1878B8] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 1245 Grand Ave, Escondido"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  ZIP Code
                </label>
                <div className="relative group">
                  <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1878B8] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="92025"
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Project Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-bold text-slate-700">
                  Project Notes & Intake Details
                </label>
              </div>

              <div className="relative group">
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Active leak in master bedroom ceiling; needs urgent inspection..."
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all resize-none font-medium shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#1878B8] via-[#0284c7] to-[#38bdf8] hover:brightness-105 active:scale-[0.98] text-white text-xs font-black shadow-[0_4px_16px_rgba(24,120,184,0.35)] hover:shadow-[0_6px_22px_rgba(24,120,184,0.45)] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>{submitting ? 'Creating Lead...' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

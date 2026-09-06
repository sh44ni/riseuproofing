'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  ShieldCheck,
  DollarSign,
  Layers,
  Wrench,
  Percent,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import {
  ROOFING_MATERIALS,
  DEFAULT_ADDONS,
  PITCH_MULTIPLIERS,
  calculateRoofEstimate,
} from '@/lib/crm-calculator';
import CustomSelect from '@/components/admin/shared/CustomSelect';

const PITCH_OPTIONS = [
  { value: '4:12', label: '4:12 (Standard Low Pitch)', badge: 'Standard', badgeColor: 'slate' as const },
  { value: '5:12', label: '5:12 (Low-Mid Pitch)', badge: 'Standard', badgeColor: 'slate' as const },
  { value: '6:12', label: '6:12 (Average Residential)', badge: 'Average', badgeColor: 'sky' as const },
  { value: '7:12', label: '7:12 (Moderate Pitch)', badge: 'Moderate', badgeColor: 'sky' as const },
  { value: '8:12', label: '8:12 (Steep +18% labor)', badge: '+18% Labor', badgeColor: 'amber' as const },
  { value: '9:12', label: '9:12 (Steep +25% labor)', badge: '+25% Labor', badgeColor: 'amber' as const },
  { value: '10:12+', label: '10:12+ (Very Steep +35% labor)', badge: '+35% Labor', badgeColor: 'rose' as const },
];

const STORIES_OPTIONS = [
  { value: '1', label: '1 Story (Ground level)', badge: 'Base', badgeColor: 'emerald' as const },
  { value: '2', label: '2 Stories (+10% labor)', badge: '+10% Labor', badgeColor: 'amber' as const },
  { value: '3', label: '3+ Stories (+25% labor)', badge: '+25% Labor', badgeColor: 'rose' as const },
];

export default function NewEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead_id');

  const [step, setStep] = useState(1);
  const [loadingLead, setLoadingLead] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    customerZip: '',
    serviceType: 'Residential Roofing',
    roofSquares: 25,
    roofPitch: '4:12',
    stories: 1,
    tearoffLayers: 1,
    materialId: 'oc_duration',
    marginPct: 30,
    financingMonths: 60,
    notes: '',
  });

  // Addons state: { [id]: quantity }
  const [addonsState, setAddonsState] = useState<Record<string, number>>({
    plywood: 4,
    permit: 1,
    dumpster: 1,
  });

  // Pre-fill from lead if lead_id is provided
  useEffect(() => {
    if (!leadId) return;

    setLoadingLead(true);
    fetch(`/api/admin/leads/${leadId}`)
      .then(res => res.json())
      .then(data => {
        if (data.lead) {
          const l = data.lead;
          const sq = l.roof_sqf ? Math.round(l.roof_sqf / 100) : 25;
          let matId = 'oc_duration';
          const rType = (l.roof_type || '').toLowerCase();
          if (rType.includes('tile')) matId = 'eagle_tile';
          if (rType.includes('tpo') || rType.includes('commercial')) matId = 'tpo_commercial';

          setFormData(prev => ({
            ...prev,
            customerName: l.full_name || '',
            customerPhone: l.phone || '',
            customerEmail: l.email || '',
            customerAddress: l.address || '',
            customerZip: l.zip || '',
            serviceType: l.service_type || 'Residential Roofing',
            roofSquares: sq,
            stories: l.stories || 1,
            materialId: matId,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingLead(false));
  }, [leadId]);

  // Live calculation
  const calculation = useMemo(() => {
    const addonsArray = Object.entries(addonsState).map(([id, quantity]) => ({
      id,
      quantity,
    }));

    return calculateRoofEstimate({
      roofSquares: Number(formData.roofSquares) || 1,
      materialId: formData.materialId,
      pitch: formData.roofPitch,
      stories: Number(formData.stories),
      tearoffLayers: Number(formData.tearoffLayers),
      addons: addonsArray,
      marginPct: Number(formData.marginPct),
      financingMonths: Number(formData.financingMonths),
    });
  }, [formData, addonsState]);

  async function handleSaveEstimate() {
    setSubmitting(true);
    try {
      const addonsPayload = Object.entries(addonsState)
        .filter(([_, q]) => q > 0)
        .map(([id, quantity]) => ({ id, quantity }));

      const res = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leadId,
          addons: addonsPayload,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create estimate');
      }

      const d = await res.json();
      router.push(`/admin/estimates/${d.estimate.id}`);
    } catch (err: any) {
      alert(err.message || 'Error creating estimate');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back button — Sleek Apple Liquid Glass Bar */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2 lg:mx-0 lg:px-0 lg:py-0 bg-white/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-b border-white/80 lg:border-none flex items-center justify-between shadow-2xs lg:shadow-none">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0B1E33] px-3 py-1.5 rounded-full bg-white/85 hover:bg-white border border-slate-200/80 shadow-2xs apple-spring-press"
        >
          <ArrowLeft size={14} />
          <span>Back to Estimates</span>
        </Link>
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
          Step {step} of 4
        </span>
      </div>

      {/* Step Indicator - Apple Liquid Glass Pills */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { num: 1, label: 'Specs' },
          { num: 2, label: 'Material' },
          { num: 3, label: 'Scope' },
          { num: 4, label: 'Pricing' },
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`py-2.5 px-2 rounded-2xl text-center border text-xs font-bold transition-all duration-200 cursor-pointer apple-spring-press ${
              step === s.num
                ? 'bg-gradient-to-r from-[#FBBF24] via-[#EAA636] to-[#D97706] text-white border-white/40 shadow-[0_4px_16px_rgba(234,166,54,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-[1.02]'
                : step > s.num
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 shadow-2xs'
                : 'bg-white/80 text-slate-400 border-slate-200/70 hover:bg-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Roof & Property Specifications ── */}
      {step === 1 && (
        <div className="admin-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-[#0B1E33] flex items-center gap-2">
              <Home size={20} className="text-[#EAA636]" />
              1. Homeowner &amp; Property Specs
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Enter customer contact info and roof square footage measurements
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. David Martinez"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="admin-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="(760) 000-0000"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                className="admin-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 742 Evergreen Terrace"
                value={formData.customerAddress}
                onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                className="admin-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
              <input
                type="text"
                placeholder="Escondido"
                value={formData.customerCity}
                onChange={e => setFormData({ ...formData, customerCity: e.target.value })}
                className="admin-input w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Roofing Measurements */}
          <div className="pt-3 border-t border-slate-100/80 space-y-4">
            <h3 className="admin-section-label">
              Roofing Dimensions &amp; Pitch
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Roof Squares (100 sq ft = 1 sq)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.roofSquares}
                    onChange={e => setFormData({ ...formData, roofSquares: Number(e.target.value) })}
                    className="admin-input w-full px-3.5 py-2.5 text-base font-black text-[#0B1E33]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#1878B8] px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-200">
                    SQ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  ≈ {(Number(formData.roofSquares) * 100).toLocaleString()} sq ft roof surface
                </p>
              </div>

              <div>
                <CustomSelect
                  label="Roof Slope / Pitch"
                  value={formData.roofPitch}
                  onChange={val => setFormData({ ...formData, roofPitch: val })}
                  options={PITCH_OPTIONS}
                />
              </div>

              <div>
                <CustomSelect
                  label="Building Stories"
                  value={String(formData.stories)}
                  onChange={val => setFormData({ ...formData, stories: Number(val) })}
                  options={STORIES_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Tear-Off Existing Roof</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {[
                  { val: 1, label: '1 Layer Tear-Off ($45/sq)' },
                  { val: 2, label: '2 Layers Tear-Off ($85/sq)' },
                  { val: 0, label: 'Overlay (No Tear-Off)' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, tearoffLayers: opt.val })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer text-center apple-spring-press ${
                      formData.tearoffLayers === opt.val
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                        : 'border-slate-200/80 bg-white/70 text-slate-600 hover:text-[#0B1E33] hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => {
                if (!formData.customerName) {
                  alert('Please enter a customer name');
                  return;
                }
                setStep(2);
              }}
              className="admin-btn-gold px-6 py-2.5 text-sm shadow-xs flex items-center gap-2 cursor-pointer apple-spring-press"
            >
              <span>Next: Material Selection</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Material Selection ── */}
      {step === 2 && (
        <div className="admin-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-[#0B1E33] flex items-center gap-2">
              <Layers size={20} className="text-[#EAA636]" />
              2. Select Roofing Material
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Choose manufacturer specification and warranty tier
            </p>
          </div>

          <div className="space-y-3">
            {ROOFING_MATERIALS.map(mat => {
              const isSelected = formData.materialId === mat.id;

              return (
                <div
                  key={mat.id}
                  onClick={() => setFormData({ ...formData, materialId: mat.id })}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 apple-spring-press ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-300/90 shadow-xs'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#EAA636] bg-[#EAA636]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-[#0B1E33] font-black text-base">{mat.name}</h4>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-200/90 text-amber-800 shadow-2xs">
                        {mat.warrantyYears}-Year Warranty
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mat.description}</p>

                    <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-600">
                      <span>Base Material: <strong className="text-[#0B1E33]">${mat.materialCostPerSq}/sq</strong></span>
                      <span>•</span>
                      <span>Labor Base: <strong className="text-[#0B1E33]">${mat.laborCostPerSq}/sq</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer shadow-2xs apple-spring-press"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="admin-btn-gold px-6 py-2.5 text-sm shadow-xs flex items-center gap-2 cursor-pointer apple-spring-press"
            >
              <span>Next: Scope &amp; Add-ons</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Add-ons & Scope of Work (Responsive Liquid Glass Stepper) ── */}
      {step === 3 && (
        <div className="admin-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-[#0B1E33] flex items-center gap-2">
              <Wrench size={20} className="text-[#EAA636]" />
              3. Scope Add-ons &amp; Inclusions
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Specify quantity for decking, dry rot, gutters, vents, and permits
            </p>
          </div>

          <div className="space-y-3">
            {DEFAULT_ADDONS.map(add => {
              const qty = addonsState[add.id] || 0;
              const hasQty = qty > 0;

              return (
                <div
                  key={add.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasQty
                      ? 'bg-gradient-to-r from-sky-50/70 via-white to-white border-sky-300/80 shadow-xs'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Full Title & Unit Rate Without Text Truncation */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#0B1E33] leading-snug">
                        {add.name}
                      </h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 shadow-2xs">
                        ${add.unitPrice} per {add.unit}
                      </span>
                    </div>
                  </div>

                  {/* Tactile Apple Liquid Glass Counter Capsule */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="admin-pill-counter flex items-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setAddonsState(prev => ({
                            ...prev,
                            [add.id]: Math.max(0, (prev[add.id] || 0) - 1),
                          }))
                        }
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[#0B1E33] font-black text-sm flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 apple-spring-press"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={e =>
                          setAddonsState(prev => ({
                            ...prev,
                            [add.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-12 text-center py-1 bg-transparent text-[#0B1E33] font-black text-sm tabular-nums focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setAddonsState(prev => ({
                            ...prev,
                            [add.id]: (prev[add.id] || 0) + 1,
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white font-black text-sm flex items-center justify-center cursor-pointer transition-all shadow-2xs apple-spring-press"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className={`w-20 text-right text-xs font-black tabular-nums ${
                      hasQty ? 'text-[#0284C7]' : 'text-slate-400'
                    }`}>
                      ${(qty * add.unitPrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer shadow-2xs apple-spring-press"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="admin-btn-gold px-6 py-2.5 text-sm shadow-xs flex items-center gap-2 cursor-pointer apple-spring-press"
            >
              <span>Next: Pricing &amp; Margins</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Pricing & Margin Review (Luminous Liquid Glass) ── */}
      {step === 4 && (
        <div className="admin-card p-5 sm:p-6 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-[#0B1E33] flex items-center gap-2">
              <Percent size={20} className="text-[#EAA636]" />
              4. Review Pricing &amp; Target Margin
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Fine-tune gross margin and review 0% APR financing options
            </p>
          </div>

          {/* Frosted Cost Breakdown */}
          <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4.5 space-y-2.5 text-xs shadow-2xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Materials Subtotal ({calculation.squares} sq)</span>
              <span className="font-bold text-[#0B1E33] tabular-nums">${calculation.materialSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Labor Subtotal (Factoring slope &amp; height)</span>
              <span className="font-bold text-[#0B1E33] tabular-nums">${calculation.laborSubtotal.toLocaleString()}</span>
            </div>
            {calculation.tearoffSubtotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Tear-off Labor</span>
                <span className="font-bold text-[#0B1E33] tabular-nums">${calculation.tearoffSubtotal.toLocaleString()}</span>
              </div>
            )}
            {calculation.addonsSubtotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Add-ons Subtotal</span>
                <span className="font-bold text-[#0B1E33] tabular-nums">${calculation.addonsSubtotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2.5 border-t border-slate-200 text-sm font-extrabold text-slate-800">
              <span>Total Estimated Cost</span>
              <span className="tabular-nums font-black text-[#0B1E33]">${calculation.costSubtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Apple-Style Margin Slider */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-white/70 border border-slate-200/70 shadow-2xs">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-700">Gross Profit Margin</span>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FBBF24] to-[#EAA636] text-white font-black text-xs shadow-xs">
                {formData.marginPct}% Margin
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="1"
              value={formData.marginPct}
              onChange={e => setFormData({ ...formData, marginPct: Number(e.target.value) })}
              className="w-full accent-[#EAA636] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold tracking-tight">
              <span>15% (Aggressive)</span>
              <span>30% (Standard)</span>
              <span>45% (High Margin)</span>
            </div>
          </div>

          {/* Luminous Liquid Glass Final Contract Price */}
          <div className="p-6 rounded-[24px] bg-gradient-to-b from-amber-50/90 via-amber-50/40 to-white border border-amber-200/90 text-center space-y-2.5 shadow-[0_8px_30px_rgba(234,166,54,0.14),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
            <p className="text-xs uppercase font-extrabold text-amber-800 tracking-wider">
              Total Contract Price
            </p>
            <p className="text-3xl sm:text-4xl font-black text-[#0B1E33] tabular-nums tracking-tight">
              ${calculation.totalPrice.toLocaleString()}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-slate-700 shadow-2xs">
              <span>or</span>
              <strong className="text-[#0284C7] font-black">${calculation.monthlyPayment}/mo</strong>
              <span>with 0% APR financing (60 months)</span>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Proposal Notes / Inclusions</label>
            <textarea
              rows={2}
              placeholder="e.g. Includes Owens Corning 50-year warranty, clean-up, and city permit..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="admin-input w-full px-3.5 py-2.5 text-xs font-medium"
            />
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer shadow-2xs apple-spring-press"
            >
              Back
            </button>

            <button
              onClick={handleSaveEstimate}
              disabled={submitting}
              className="admin-btn-gold px-7 py-3 text-sm shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 apple-spring-press"
            >
              <FileCheck size={16} />
              <span>{submitting ? 'Saving Estimate...' : 'Generate & Review Proposal'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

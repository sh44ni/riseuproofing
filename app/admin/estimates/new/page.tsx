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
      {/* Back button — Sticky on mobile */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2.5 lg:mx-0 lg:px-0 lg:py-0 bg-[#0c1117]/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-white/[0.04] lg:border-none flex items-center justify-between">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8a95a5] hover:text-[#f0f2f5] transition-all duration-300 ease-out"
        >
          <ArrowLeft size={16} />
          Back to Estimates
        </Link>
        <span className="text-xs font-semibold text-[#5e6a7a] uppercase tracking-widest">
          Step {step} of 4
        </span>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: 'Specs' },
          { num: 2, label: 'Material' },
          { num: 3, label: 'Scope' },
          { num: 4, label: 'Pricing' },
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`py-2 px-2 rounded-xl text-center border text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
              step === s.num
                ? 'bg-[#d4a447] text-[#0c1117] border-[#d4a447] shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                : step > s.num
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#141b24]/50 text-[#5e6a7a] border-white/[0.04]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Roof & Property Specifications ── */}
      {step === 1 && (
        <div className="admin-card rounded-[20px] p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#f0f2f5] flex items-center gap-2">
              <Home size={20} className="text-[#d4a447]" />
              1. Homeowner & Property Specs
            </h2>
            <p className="text-[#8a95a5] text-xs mt-0.5">
              Enter customer contact info and roof square footage measurements
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. David Martinez"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="(760) 000-0000"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 742 Evergreen Terrace"
                value={formData.customerAddress}
                onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a0aab8] mb-1">City</label>
              <input
                type="text"
                placeholder="Escondido"
                value={formData.customerCity}
                onChange={e => setFormData({ ...formData, customerCity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
              />
            </div>
          </div>

          {/* Roofing Measurements */}
          <div className="pt-3 border-t border-white/[0.04] space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#8a95a5] tracking-wider">
              Roofing Dimensions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#a0aab8] mb-1">
                  Roof Squares (100 sq ft = 1 sq)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.roofSquares}
                    onChange={e => setFormData({ ...formData, roofSquares: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] font-bold text-base focus:outline-none focus:border-[#d4a447]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d4a447]">
                    SQ
                  </span>
                </div>
                <p className="text-[11px] text-[#5e6a7a] mt-1">
                  ≈ {(Number(formData.roofSquares) * 100).toLocaleString()} sq ft roof surface
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Roof Slope / Pitch</label>
                <select
                  value={formData.roofPitch}
                  onChange={e => setFormData({ ...formData, roofPitch: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
                >
                  <option value="4:12">4:12 (Standard Low Pitch)</option>
                  <option value="5:12">5:12</option>
                  <option value="6:12">6:12 (Average Residential)</option>
                  <option value="7:12">7:12</option>
                  <option value="8:12">8:12 (Steep +18% labor)</option>
                  <option value="9:12">9:12</option>
                  <option value="10:12+">10:12+ (Very Steep +35% labor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Building Stories</label>
                <select
                  value={formData.stories}
                  onChange={e => setFormData({ ...formData, stories: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] text-sm focus:outline-none focus:border-[#d4a447]"
                >
                  <option value="1">1 Story (Ground level)</option>
                  <option value="2">2 Stories (+10% labor)</option>
                  <option value="3">3+ Stories (+25% labor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Tear-Off Existing Roof</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 1, label: '1 Layer Tear-Off ($45/sq)' },
                  { val: 2, label: '2 Layers Tear-Off ($85/sq)' },
                  { val: 0, label: 'Overlay (No Tear-Off)' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, tearoffLayers: opt.val })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ease-out cursor-pointer text-center ${
                      formData.tearoffLayers === opt.val
                        ? 'bg-[#d4a447]/15 text-[#d4a447] border-[#d4a447]/30 shadow-inner'
                        : 'border-white/[0.06] text-[#8a95a5] hover:text-[#f0f2f5]'
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
              className="px-6 py-2.5 rounded-xl bg-[#d4a447] hover:bg-[#d4a447] text-[#0c1117] font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Material Selection</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Material Selection ── */}
      {step === 2 && (
        <div className="admin-card rounded-[20px] p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#f0f2f5] flex items-center gap-2">
              <Layers size={20} className="text-[#d4a447]" />
              2. Select Roofing Material
            </h2>
            <p className="text-[#8a95a5] text-xs mt-0.5">
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
                  className={`p-4 rounded-[16px] border transition-all duration-300 ease-out cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'bg-[#d4a447]/12 border-amber-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
                      : 'bg-[#1a2332]/60 border-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-[#d4a447] bg-[#d4a447]' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-[#0c1117] stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-[#f0f2f5] font-bold text-base">{mat.name}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[#d4a447]">
                        {mat.warrantyYears}-Year Warranty
                      </span>
                    </div>

                    <p className="text-xs text-[#8a95a5] mt-1">{mat.description}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-[#a0aab8]">
                      <span>Base Material: <strong className="text-[#f0f2f5]">${mat.materialCostPerSq}/sq</strong></span>
                      <span>•</span>
                      <span>Labor Base: <strong className="text-[#f0f2f5]">${mat.laborCostPerSq}/sq</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#a0aab8] font-semibold text-sm cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-[#d4a447] hover:bg-[#d4a447] text-[#0c1117] font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Scope & Add-ons</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Add-ons & Scope of Work ── */}
      {step === 3 && (
        <div className="admin-card rounded-[20px] p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#f0f2f5] flex items-center gap-2">
              <Wrench size={20} className="text-[#d4a447]" />
              3. Scope Add-ons & Inclusions
            </h2>
            <p className="text-[#8a95a5] text-xs mt-0.5">
              Specify quantity for decking, dry rot, gutters, vents, and permits
            </p>
          </div>

          <div className="space-y-3">
            {DEFAULT_ADDONS.map(add => {
              const qty = addonsState[add.id] || 0;

              return (
                <div
                  key={add.id}
                  className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#1a2332]/60 border border-white/[0.04] gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-[#f0f2f5] truncate">{add.name}</h4>
                    <p className="text-xs text-[#8a95a5]">
                      ${add.unitPrice} per {add.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setAddonsState(prev => ({
                          ...prev,
                          [add.id]: Math.max(0, (prev[add.id] || 0) - 1),
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-[#f0f2f5] font-bold text-sm flex items-center justify-center cursor-pointer"
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
                      className="w-14 text-center py-1 admin-card rounded-lg text-[#f0f2f5] font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAddonsState(prev => ({
                          ...prev,
                          [add.id]: (prev[add.id] || 0) + 1,
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-[#f0f2f5] font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>

                    <span className="w-20 text-right text-xs font-bold text-[#d4a447] tabular-nums">
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
              className="px-5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#a0aab8] font-semibold text-sm cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-[#d4a447] hover:bg-[#d4a447] text-[#0c1117] font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Pricing & Margins</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Pricing & Margin Review ── */}
      {step === 4 && (
        <div className="admin-card rounded-[20px] p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#f0f2f5] flex items-center gap-2">
              <Percent size={20} className="text-[#d4a447]" />
              4. Review Pricing & Target Margin
            </h2>
            <p className="text-[#8a95a5] text-xs mt-0.5">
              Fine-tune gross margin and review 0% APR financing options
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-[#1a2332]/70 rounded-[16px] p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-[#a0aab8]">
              <span>Materials Subtotal ({calculation.squares} sq)</span>
              <span className="font-bold text-[#f0f2f5] tabular-nums">${calculation.materialSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#a0aab8]">
              <span>Labor Subtotal (Factoring slope & height)</span>
              <span className="font-bold text-[#f0f2f5] tabular-nums">${calculation.laborSubtotal.toLocaleString()}</span>
            </div>
            {calculation.tearoffSubtotal > 0 && (
              <div className="flex justify-between text-[#a0aab8]">
                <span>Tear-off Labor</span>
                <span className="font-bold text-[#f0f2f5] tabular-nums">${calculation.tearoffSubtotal.toLocaleString()}</span>
              </div>
            )}
            {calculation.addonsSubtotal > 0 && (
              <div className="flex justify-between text-[#a0aab8]">
                <span>Add-ons Subtotal</span>
                <span className="font-bold text-[#f0f2f5] tabular-nums">${calculation.addonsSubtotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/[0.06] text-sm font-semibold text-[#c8cfd8]">
              <span>Total Estimated Cost</span>
              <span className="tabular-nums font-bold text-[#f0f2f5]">${calculation.costSubtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Margin Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-[#a0aab8]">Gross Profit Margin</span>
              <span className="text-[#d4a447] text-base">{formData.marginPct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="1"
              value={formData.marginPct}
              onChange={e => setFormData({ ...formData, marginPct: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#5e6a7a] font-semibold">
              <span>15% (Aggressive)</span>
              <span>30% (Standard)</span>
              <span>45% (High Margin)</span>
            </div>
          </div>

          {/* Final Contract Price Highlight */}
          <div className="p-5 rounded-[16px] bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-[#d4a447]/25 text-center space-y-2">
            <p className="text-xs uppercase font-bold text-[#d4a447] tracking-wider">
              Total Contract Price
            </p>
            <p className="text-3xl sm:text-4xl font-black text-[#f0f2f5] tabular-nums">
              ${calculation.totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-[#a0aab8]">
              or <strong className="text-[#e8c06a]">${calculation.monthlyPayment}/mo</strong> with 0% APR financing (60 months)
            </p>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#a0aab8] mb-1">Proposal Notes / Inclusions</label>
            <textarea
              rows={2}
              placeholder="e.g. Includes Owens Corning 50-year warranty, clean-up, and city permit..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] placeholder-slate-500 text-xs focus:outline-none focus:border-[#d4a447]"
            />
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#a0aab8] font-semibold text-sm cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={handleSaveEstimate}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-[#e8c06a] hover:to-[#c4923a] text-[#0c1117] font-bold text-sm shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-95 transition-all duration-300 ease-out flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileCheck size={16} />
              {submitting ? 'Saving Estimate...' : 'Generate & Review Proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

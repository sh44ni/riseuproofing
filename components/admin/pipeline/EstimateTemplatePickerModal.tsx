'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  DollarSign,
  ShieldCheck,
  Calendar,
  Calculator,
  Info,
} from 'lucide-react';
import { PipelineLead } from '@/app/api/admin/pipeline/route';

interface EstimateTemplatePickerModalProps {
  isOpen: boolean;
  lead: PipelineLead | null;
  onClose: () => void;
  onSuccess: (newEstimate: any) => void;
}

export default function EstimateTemplatePickerModal({
  isOpen,
  lead,
  onClose,
  onSuccess,
}: EstimateTemplatePickerModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('full_reroof_tile');
  const [tier, setTier] = useState<'budget' | 'premium'>('premium');
  const [sqft, setSqft] = useState<number>(2400);
  const [customScope, setCustomScope] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates on open
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/admin/pipeline/estimate-templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.templates) {
          setTemplates(data.templates);
          if (data.templates.length > 0) {
            setSelectedTemplateKey(data.templates[0].template_key);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load estimate templates:', err);
      })
      .finally(() => setLoading(false));

    // Preset square footage if lead already has roof_sqf
    if (lead?.service_type?.toLowerCase().includes('shingle')) {
      setSelectedTemplateKey('full_reroof_shingle');
    } else if (lead?.service_type?.toLowerCase().includes('repair')) {
      setSelectedTemplateKey('repair_tile');
    }
  }, [isOpen, lead]);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.template_key === selectedTemplateKey) || templates[0];
  }, [templates, selectedTemplateKey]);

  // Update boilerplate scope whenever template or tier changes
  useEffect(() => {
    if (!activeTemplate) return;
    const initialScope =
      tier === 'premium'
        ? activeTemplate.premium_tier?.scope_of_work
        : activeTemplate.budget_tier?.scope_of_work;
    setCustomScope(initialScope || '');
  }, [activeTemplate, tier]);

  if (!isOpen || !lead) return null;

  // Pricing calculation
  const squares = Math.max(1, Math.round(sqft / 100));
  const pricingRule = activeTemplate?.pricing_rule;
  const ratePerSqft =
    tier === 'premium'
      ? pricingRule?.premium_rate_sqft || 6.5
      : pricingRule?.budget_rate_sqft || 4.2;
  const baseFee = tier === 'premium' ? pricingRule?.base_fee_high || 950 : pricingRule?.base_fee_low || 500;
  const calculatedTotal = Math.round((sqft * ratePerSqft + baseFee) / 100) * 100;
  const monthlyInstallment = Math.round(calculatedTotal / 60);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const activeTierObj = tier === 'premium' ? activeTemplate.premium_tier : activeTemplate.budget_tier;

      const payload = {
        leadId: lead.id,
        customerName: lead.full_name,
        customerPhone: lead.phone || '',
        customerEmail: lead.email || '',
        customerAddress: lead.address || '',
        customerCity: lead.city || '',
        customerZip: lead.zip || '',
        serviceType: activeTemplate.service_type,
        roofSquares: squares,
        materialType: `${activeTemplate.name} — ${activeTierObj?.name}`,
        total: calculatedTotal,
        subtotal: calculatedTotal,
        marginPct: 32,
        financingMonths: 60,
        monthlyPayment: monthlyInstallment,
        notes: `ESTIMATE SCOPE OF WORK (${tier.toUpperCase()} TIER):\n\n${customScope}\n\nSPECIFICATIONS:\n${activeTierObj?.materials}`,
      };

      const res = await fetch('/api/admin/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create estimate');
      }

      onSuccess(data.estimate);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error generating estimate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Estimate Template Picker
              </h2>
              <p className="text-xs text-slate-500">
                Generate standardized estimate &amp; scope of work for{' '}
                <span className="font-semibold text-slate-700">{lead.full_name}</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Template Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Official Service Template (5 Variants)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map((tmpl) => {
                const isSelected = tmpl.template_key === selectedTemplateKey;
                return (
                  <button
                    key={tmpl.template_key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(tmpl.template_key)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900 truncate text-xs">
                        {tmpl.name}
                      </span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tier Selection: Budget vs Premium */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Underlayment &amp; Material Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier('budget')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  tier === 'budget'
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 text-xs">
                    Standard / Budget Tier
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                    ${pricingRule?.budget_rate_sqft || 4.2}/sq ft
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {activeTemplate?.budget_tier?.name}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {activeTemplate?.budget_tier?.materials}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTier('premium')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  tier === 'premium'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                  RECOMMENDED
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-900 text-xs">
                    Premium / Lifetime Tier
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                    ${pricingRule?.premium_rate_sqft || 6.5}/sq ft
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-semibold">
                  {activeTemplate?.premium_tier?.name}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  {activeTemplate?.premium_tier?.materials}
                </p>
              </button>
            </div>
          </div>

          {/* 3. Roof Size (Square Footage) & Pricing Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Roof Area (Sq Ft)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={200}
                  max={20000}
                  step={50}
                  value={sqft}
                  onChange={(e) => setSqft(Math.max(100, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-purple-500 focus:outline-hidden"
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Approx. {squares} squares</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Calculated Price
              </div>
              <div className="text-lg font-black text-slate-900">
                ${calculatedTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">
                Unit pricing via Estimator Settings
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                HEARTH Financing
              </div>
              <div className="text-lg font-black text-purple-700">
                ${monthlyInstallment}/mo
              </div>
              <div className="text-[10px] text-slate-500">60-month term estimate</div>
            </div>
          </div>

          {/* 4. Reusable Scope of Work Boilerplate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Scope of Work Boilerplate (Standardized Contract Terms)
              </label>
              <span className="text-[10px] text-slate-400">
                Verified Rise Up standard checklist
              </span>
            </div>
            <textarea
              rows={6}
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 font-mono leading-relaxed focus:border-purple-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>50-Year Golden Protection Included</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold shadow-sm hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {submitting ? 'Generating...' : `Generate Estimate ($${calculatedTotal.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

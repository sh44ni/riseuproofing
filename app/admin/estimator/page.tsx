'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Layers,
  History,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { calculateEstimate, type EstimatorPricingRule } from '@/lib/estimator';
import { calculateFinancing, type FinancingPlan, type FinancingSettings } from '@/lib/financing';

interface ServicePricing {
  id: number;
  pricePerSqftLow: number;
  pricePerSqftHigh: number;
  baseFeeLow: number;
  baseFeeHigh: number;
  minSqft: number;
  maxSqft: number;
  aprAvailable: boolean;
  financingApr: number;
  financingTermMonths: number;
  updatedAt?: string;
  updatedBy?: string;
}

interface ServiceItem {
  id: number;
  slug: string;
  name: string;
  shortLabel: string;
  iconKey: string;
  badgeLabel: string | null;
  sortOrder: number;
  isActive: boolean;
  pricing: ServicePricing;
}

interface PresetItem {
  id: number;
  serviceId: number | null;
  label: string;
  sqftValue: number;
  sortOrder: number;
}

interface LeadLog {
  id: string;
  serviceName: string;
  sqftEntered: number;
  estimateLow: number;
  estimateHigh: number;
  source: string;
  sessionId: string | null;
  createdAt: string;
}

interface FinancingCalculationItem {
  id: string;
  planName: string;
  projectCost: number;
  downPayment: number;
  monthlyPayment: number;
  sessionId: string | null;
  createdAt: string;
}

export default function EstimatorAdminPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'services' | 'presets' | 'financing' | 'logs'>('pricing');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estimator State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [leads, setLeads] = useState<LeadLog[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [pricingForm, setPricingForm] = useState<ServicePricing>({
    id: 0,
    pricePerSqftLow: 4.0,
    pricePerSqftHigh: 6.2,
    baseFeeLow: 500,
    baseFeeHigh: 950,
    minSqft: 800,
    maxSqft: 8000,
    aprAvailable: true,
    financingApr: 0,
    financingTermMonths: 60,
  });
  const [testSqft, setTestSqft] = useState(2800);

  // Financing State
  const [financingPlans, setFinancingPlans] = useState<FinancingPlan[]>([]);
  const [financingSettings, setFinancingSettings] = useState<FinancingSettings>({
    minProjectCost: 5000,
    maxProjectCost: 50000,
    defaultProjectCost: 16500,
    creditCheckCopyFlag: true,
  });
  const [financingCalculations, setFinancingCalculations] = useState<FinancingCalculationItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState<FinancingPlan>({
    id: 0,
    name: '',
    apr: 0,
    termMonths: 12,
    minDownPaymentPct: 0,
    isDefault: false,
    isActive: true,
    sortOrder: 1,
    badgeLabel: '',
    description: '',
  });
  const [testFinancingCost, setTestFinancingCost] = useState(16500);
  const [testFinancingDown, setTestFinancingDown] = useState(0);

  // Modals / forms
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    shortLabel: '',
    iconKey: 'home',
    badgeLabel: '',
    sortOrder: 5,
    isActive: true,
  });

  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetForm, setNewPresetForm] = useState({
    label: '',
    sqftValue: 3000,
    sortOrder: 4,
  });

  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Estimator data
      const estRes = await fetch('/api/admin/estimator');
      const estData = await estRes.json();
      if (!estData.ok) throw new Error(estData.error || 'Failed to load estimator data');

      setServices(estData.services || []);
      setPresets(estData.presets || []);
      setLeads(estData.leads || []);

      if (estData.services && estData.services.length > 0) {
        const initialService =
          estData.services.find((s: ServiceItem) => s.id === selectedServiceId) || estData.services[0];
        setSelectedServiceId(initialService.id);
        setPricingForm({ ...initialService.pricing });
      }

      // 2. Fetch Financing data
      const finRes = await fetch('/api/admin/financing');
      const finData = await finRes.json();
      if (finData.ok) {
        setFinancingPlans(finData.plans || []);
        if (finData.settings) setFinancingSettings(finData.settings);
        setFinancingCalculations(finData.calculations || []);

        if (finData.plans && finData.plans.length > 0) {
          const defaultP = finData.plans.find((p: FinancingPlan) => p.isDefault) || finData.plans[0];
          setSelectedPlanId(defaultP.id);
          setPlanForm({ ...defaultP });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectServiceForPricing = (sId: number) => {
    setSelectedServiceId(sId);
    const found = services.find((s) => s.id === sId);
    if (found) {
      setPricingForm({ ...found.pricing });
    }
  };

  const handleSelectPlanForEditing = (pId: number) => {
    setSelectedPlanId(pId);
    const found = financingPlans.find((p) => p.id === pId);
    if (found) {
      setPlanForm({ ...found });
    }
  };

  // Live simulated estimate using current unsaved pricing form values
  const liveSimulation = useMemo(() => {
    const pricingRule: EstimatorPricingRule = {
      pricePerSqftLow: pricingForm.pricePerSqftLow,
      pricePerSqftHigh: pricingForm.pricePerSqftHigh,
      baseFeeLow: pricingForm.baseFeeLow,
      baseFeeHigh: pricingForm.baseFeeHigh,
      minSqft: pricingForm.minSqft,
      maxSqft: pricingForm.maxSqft,
      aprAvailable: pricingForm.aprAvailable,
      financingApr: pricingForm.financingApr,
      financingTermMonths: pricingForm.financingTermMonths,
    };
    return calculateEstimate(pricingRule, testSqft);
  }, [pricingForm, testSqft]);

  // Live simulated financing payment using current unsaved plan values
  const liveFinancingSimulation = useMemo(() => {
    return calculateFinancing(
      {
        name: planForm.name || 'Sample Plan',
        apr: planForm.apr,
        termMonths: planForm.termMonths,
      },
      testFinancingCost,
      testFinancingDown
    );
  }, [planForm, testFinancingCost, testFinancingDown]);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    setSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pricing',
          serviceId: selectedServiceId,
          ...pricingForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save pricing rules');

      setSaveSuccess('Pricing rules updated and public cache invalidated!');
      setServices((prev) =>
        prev.map((s) => (s.id === selectedServiceId ? { ...s, pricing: { ...pricingForm } } : s))
      );
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_plan',
          ...planForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save plan');

      setSaveSuccess('Financing plan saved and public cache invalidated!');
      setIsAddingPlan(false);
      await loadData();
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultPlan = async (pId: number) => {
    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default', id: pId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setFinancingPlans((prev) =>
        prev.map((p) => ({ ...p, isDefault: p.id === pId }))
      );
      if (planForm.id === pId) {
        setPlanForm((prev) => ({ ...prev, isDefault: true }));
      }
      setSaveSuccess('Default plan updated across public calculator and banner!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update default plan');
    }
  };

  const handleSaveFinancingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          ...financingSettings,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save settings');

      setSaveSuccess('Financing calculator settings updated!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this financing plan?')) return;
    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_plan', id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleToggleServiceActive = async (s: ServiceItem) => {
    try {
      const res = await fetch('/api/admin/estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_service',
          id: s.id,
          name: s.name,
          shortLabel: s.shortLabel,
          iconKey: s.iconKey,
          badgeLabel: s.badgeLabel,
          sortOrder: s.sortOrder,
          isActive: !s.isActive,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setServices((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_service', ...newServiceForm }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setIsAddingService(false);
      setNewServiceForm({
        name: '',
        shortLabel: '',
        iconKey: 'home',
        badgeLabel: '',
        sortOrder: services.length + 1,
        isActive: true,
      });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create service');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_preset', ...newPresetForm }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setIsAddingPreset(false);
      setNewPresetForm({ label: '', sqftValue: 3000, sortOrder: presets.length + 1 });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this size preset button?')) return;
    try {
      const res = await fetch('/api/admin/estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_preset', id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete preset');
    }
  };

  const currentServiceObj = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Calculator size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
              Estimator &amp; Financing Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure dynamic pricing formulas, financing loan plans, bounds, and live telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-px">
        {[
          { key: 'pricing', label: 'Estimator Pricing Rules', icon: Sliders },
          { key: 'services', label: 'Services Manager', icon: Layers },
          { key: 'presets', label: 'Size Presets', icon: Calculator },
          { key: 'financing', label: 'Financing Plans & Settings', icon: DollarSign },
          { key: 'logs', label: 'Calculation Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-[#2F9FE3] text-[#0284C7] bg-sky-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-[#0B1E33] hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="animate-spin text-sky-500" />
          <span>Loading configuration...</span>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: ESTIMATOR PRICING RULES & LIVE SIMULATOR
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Service Select Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Select Service:
                </span>
                {services.map((s) => {
                  const selected = s.id === selectedServiceId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectServiceForPricing(s.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {s.name} {!s.isActive && '(Inactive)'}
                    </button>
                  );
                })}
              </div>

              {/* Two Column Layout: Editor Form + Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Form (7 cols) */}
                <form
                  onSubmit={handleSavePricing}
                  className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-[#0B1E33]">
                        Formula Rules: {currentServiceObj?.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Changes immediately recalculate public hero estimates.
                      </p>
                    </div>
                    {currentServiceObj?.pricing.updatedBy && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Last edited by {currentServiceObj.pricing.updatedBy}
                      </span>
                    )}
                  </div>

                  {/* Price per sqft Low / High */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Price Per Square Foot ($/sq ft)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Low Rate ($)
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            required
                            value={pricingForm.pricePerSqftLow}
                            onChange={(e) =>
                              setPricingForm({
                                ...pricingForm,
                                pricePerSqftLow: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          High Rate ($)
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            required
                            value={pricingForm.pricePerSqftHigh}
                            onChange={(e) =>
                              setPricingForm({
                                ...pricingForm,
                                pricePerSqftHigh: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Base Fee Low / High */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Flat Base Fee Add-on ($)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Fixed setup or inspection charge added regardless of roof size.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Base Fee Low ($)
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            required
                            value={pricingForm.baseFeeLow}
                            onChange={(e) =>
                              setPricingForm({
                                ...pricingForm,
                                baseFeeLow: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Base Fee High ($)
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            required
                            value={pricingForm.baseFeeHigh}
                            onChange={(e) =>
                              setPricingForm({
                                ...pricingForm,
                                baseFeeHigh: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clamping: Min / Max Sq Ft */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Property Size Bounds (Clamping)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Min Sq Ft
                        </span>
                        <input
                          type="number"
                          step="100"
                          min="100"
                          required
                          value={pricingForm.minSqft}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              minSqft: parseInt(e.target.value, 10) || 500,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Max Sq Ft
                        </span>
                        <input
                          type="number"
                          step="500"
                          min="500"
                          required
                          value={pricingForm.maxSqft}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              maxSqft: parseInt(e.target.value, 10) || 10000,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financing Parameters */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Financing Options
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pricingForm.aprAvailable}
                          onChange={(e) =>
                            setPricingForm({ ...pricingForm, aprAvailable: e.target.checked })
                          }
                          className="w-4 h-4 text-sky-600 rounded-sm border-slate-300"
                        />
                        <span className="text-xs font-bold text-emerald-700">0% APR Badge Enabled</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          APR Interest Rate (%)
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pricingForm.financingApr}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              financingApr: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Loan Term (Months)
                        </span>
                        <input
                          type="number"
                          step="12"
                          min="1"
                          value={pricingForm.financingTermMonths}
                          onChange={(e) =>
                            setPricingForm({
                              ...pricingForm,
                              financingTermMonths: parseInt(e.target.value, 10) || 60,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33] focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      <Save size={16} />
                      <span>{saving ? 'Saving...' : 'Save Pricing Rules'}</span>
                    </button>
                  </div>
                </form>

                {/* Right: Live Preview & Sanity Check (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-gradient-to-br from-[#0B1E33] to-[#081524] rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-5 sticky top-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-sky-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Live Public Simulator
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                        Unsaved Math Test
                      </span>
                    </div>

                    {/* Test Sqft Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-white/70 font-semibold">Test Square Footage</span>
                        <span className="text-sky-400 font-extrabold text-sm">
                          {testSqft.toLocaleString()} sq ft
                        </span>
                      </div>
                      <input
                        type="range"
                        min={pricingForm.minSqft || 500}
                        max={pricingForm.maxSqft || 10000}
                        step="50"
                        value={testSqft}
                        onChange={(e) => setTestSqft(parseInt(e.target.value, 10))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-white/40 mt-1">
                        <span>Min: {pricingForm.minSqft} sqft</span>
                        <span>Max: {pricingForm.maxSqft} sqft</span>
                      </div>
                    </div>

                    {/* Output Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                          Estimated Ballpark
                        </span>
                        {pricingForm.aprAvailable && (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            0% APR Available
                          </span>
                        )}
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {liveSimulation.formattedRange}
                      </p>
                      <p className="text-xs text-white/80 font-semibold">
                        (or as low as{' '}
                        <strong className="text-amber-300 font-black">
                          {liveSimulation.formattedMonthly}
                        </strong>
                        )
                      </p>
                    </div>

                    {/* Formula Transparency Breakdown */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5 font-mono text-white/75">
                      <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider font-sans mb-1">
                        Formula Math Breakdown:
                      </p>
                      <p>
                        Low: ${pricingForm.baseFeeLow} + ({testSqft} × ${pricingForm.pricePerSqftLow.toFixed(2)}) ={' '}
                        <span className="text-white font-bold">${liveSimulation.low.toLocaleString()}</span>
                      </p>
                      <p>
                        High: ${pricingForm.baseFeeHigh} + ({testSqft} × ${pricingForm.pricePerSqftHigh.toFixed(2)}) ={' '}
                        <span className="text-white font-bold">${liveSimulation.high.toLocaleString()}</span>
                      </p>
                      <p className="text-[10px] text-white/50 pt-1 font-sans">
                        Rounded to nearest $100. Clamped within [{pricingForm.minSqft} – {pricingForm.maxSqft}] sq ft.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: SERVICES MANAGER
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'services' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B1E33]">Active Roofing Services</h3>
                  <p className="text-xs text-slate-500">
                    Service cards rendered on Step 1 of the hero estimate widget.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Service</span>
                </button>
              </div>

              {isAddingService && (
                <form
                  onSubmit={handleCreateService}
                  className="bg-white rounded-3xl p-5 border border-sky-200 shadow-sm space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Add New Estimator Service
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Full Name *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metal Roofing"
                        value={newServiceForm.name}
                        onChange={(e) =>
                          setNewServiceForm({ ...newServiceForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Short Label *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metal Roof"
                        value={newServiceForm.shortLabel}
                        onChange={(e) =>
                          setNewServiceForm({ ...newServiceForm, shortLabel: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Badge Text (Optional)
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 50-Yr Life"
                        value={newServiceForm.badgeLabel}
                        onChange={(e) =>
                          setNewServiceForm({ ...newServiceForm, badgeLabel: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingService(false)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] cursor-pointer"
                    >
                      Save Service
                    </button>
                  </div>
                </form>
              )}

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                      s.isActive
                        ? 'bg-white border-slate-200/80 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Order #{s.sortOrder}
                        </span>
                        {s.badgeLabel && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                            {s.badgeLabel}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-[#0B1E33]">{s.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Short: {s.shortLabel}</p>
                      <p className="text-xs font-mono text-slate-400 mt-2">
                        ${s.pricing.pricePerSqftLow} – ${s.pricing.pricePerSqftHigh} /sqft
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleServiceActive(s)}
                        className={`text-xs font-bold cursor-pointer ${
                          s.isActive ? 'text-emerald-700 hover:underline' : 'text-slate-400 hover:underline'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => {
                          handleSelectServiceForPricing(s.id);
                          setActiveTab('pricing');
                        }}
                        className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                      >
                        Edit Pricing →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: SIZE PRESETS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'presets' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B1E33]">Quick-Select Property Size Buttons</h3>
                  <p className="text-xs text-slate-500">
                    Controls the 3 preset buttons displayed in Step 2.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingPreset(!isAddingPreset)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Size Preset</span>
                </button>
              </div>

              {isAddingPreset && (
                <form
                  onSubmit={handleSavePreset}
                  className="bg-white rounded-3xl p-5 border border-sky-200 shadow-sm space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Add Size Preset Button
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Button Label *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2,000 – 3,500 sq ft"
                        value={newPresetForm.label}
                        onChange={(e) =>
                          setNewPresetForm({ ...newPresetForm, label: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Formula Sq Ft Value *
                      </span>
                      <input
                        type="number"
                        step="50"
                        min="500"
                        required
                        value={newPresetForm.sqftValue}
                        onChange={(e) =>
                          setNewPresetForm({
                            ...newPresetForm,
                            sqftValue: parseInt(e.target.value, 10) || 2500,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Sort Order
                      </span>
                      <input
                        type="number"
                        value={newPresetForm.sortOrder}
                        onChange={(e) =>
                          setNewPresetForm({
                            ...newPresetForm,
                            sortOrder: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPreset(false)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] cursor-pointer"
                    >
                      Save Preset
                    </button>
                  </div>
                </form>
              )}

              {/* Presets Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Display Button Label</th>
                      <th className="px-5 py-3">Representative Sq Ft</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#0B1E33]">
                    {presets.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-400">#{p.sortOrder}</td>
                        <td className="px-5 py-3.5 font-bold text-sky-800">{p.label}</td>
                        <td className="px-5 py-3.5 font-mono">{p.sqftValue.toLocaleString()} sq ft</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDeletePreset(p.id)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete Preset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: FINANCING PLANS & CALCULATOR SETTINGS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'financing' && (
            <div className="space-y-8">
              {/* Plans Row */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0B1E33]">
                      San Diego Roof Financing Plans
                    </h3>
                    <p className="text-xs text-slate-500">
                      Plans appear in the interactive monthly calculator on /roof-financing-san-diego. The plan marked as Default sources the banner &amp; trust strip claims.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingPlan(true);
                      setPlanForm({
                        id: 0,
                        name: '',
                        apr: 0,
                        termMonths: 12,
                        minDownPaymentPct: 0,
                        isDefault: false,
                        isActive: true,
                        sortOrder: financingPlans.length + 1,
                        badgeLabel: '',
                        description: '',
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Add Financing Plan</span>
                  </button>
                </div>

                {/* Plan Selection Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Select Plan to Edit:
                  </span>
                  {financingPlans.map((p) => {
                    const selected = p.id === selectedPlanId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPlanForEditing(p.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          selected
                            ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.isDefault && <Star size={12} className={selected ? 'text-amber-300' : 'text-amber-500'} />}
                        <span>{p.name}</span>
                        {!p.isActive && <span className="opacity-60 text-[10px]">(Inactive)</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Editor & Live Simulator Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Plan Form (7 cols) */}
                  <form
                    onSubmit={handleSavePlan}
                    className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-[#0B1E33]">
                          {planForm.id ? `Edit Plan: ${planForm.name}` : 'Create New Financing Plan'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Configure term, interest rate, down payment rules, and default status.
                        </p>
                      </div>
                      {planForm.isDefault && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200 flex items-center gap-1">
                          <Star size={11} className="text-amber-500" /> Default Banner Source
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Plan Name *
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0% APR 12-Month Same-As-Cash"
                          value={planForm.name}
                          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Badge Label (Optional)
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Most Popular"
                          value={planForm.badgeLabel || ''}
                          onChange={(e) => setPlanForm({ ...planForm, badgeLabel: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          APR Rate (%) *
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={planForm.apr}
                            onChange={(e) =>
                              setPlanForm({ ...planForm, apr: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full pr-7 pl-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                          />
                          <span className="absolute right-2.5 top-2.5 text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Term (Months) *
                        </span>
                        <input
                          type="number"
                          step="6"
                          min="1"
                          required
                          value={planForm.termMonths}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              termMonths: parseInt(e.target.value, 10) || 12,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Min Down (%)
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={planForm.minDownPaymentPct}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                minDownPaymentPct: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pr-7 pl-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                          />
                          <span className="absolute right-2.5 top-2.5 text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Description
                      </span>
                      <textarea
                        rows={2}
                        placeholder="e.g. 12 Months zero interest with regular monthly payments."
                        value={planForm.description || ''}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-[#0B1E33]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={planForm.isActive}
                            onChange={(e) =>
                              setPlanForm({ ...planForm, isActive: e.target.checked })
                            }
                            className="w-4 h-4 text-sky-600 rounded-sm border-slate-300"
                          />
                          <span>Plan Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800">
                          <input
                            type="checkbox"
                            checked={planForm.isDefault}
                            onChange={(e) =>
                              setPlanForm({ ...planForm, isDefault: e.target.checked })
                            }
                            className="w-4 h-4 text-amber-600 rounded-sm border-slate-300"
                          />
                          <span>Make Default Plan</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {planForm.id > 0 && !planForm.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(planForm.id)}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-75"
                        >
                          {saving ? 'Saving...' : 'Save Plan'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Right: Live Amortization Simulator Preview (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-gradient-to-br from-[#0B1E33] to-[#081524] rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-5 sticky top-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-amber-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Amortization Simulator
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                          Real-Time Sandbox
                        </span>
                      </div>

                      {/* Test Project Cost Slider */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/70 font-semibold">Test Project Budget</span>
                          <span className="text-amber-400 font-extrabold text-sm font-mono">
                            ${testFinancingCost.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5000}
                          max={50000}
                          step={500}
                          value={testFinancingCost}
                          onChange={(e) => setTestFinancingCost(parseInt(e.target.value, 10))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Test Down Payment Slider */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-white/70 font-semibold">Down Payment</span>
                          <span className="text-emerald-400 font-extrabold text-sm font-mono">
                            ${testFinancingDown.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={testFinancingCost}
                          step={500}
                          value={testFinancingDown}
                          onChange={(e) => setTestFinancingDown(parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-400 cursor-pointer"
                        />
                      </div>

                      {/* Output Monthly Card */}
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                            Estimated Monthly Payment
                          </span>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                            {planForm.termMonths} Mo @ {planForm.apr}% APR
                          </span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
                          {liveFinancingSimulation.formattedMonthly}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10 text-white/70">
                          <div>
                            <span className="block text-[10px] text-white/50 uppercase">Principal Loan</span>
                            <span className="font-bold text-white">{liveFinancingSimulation.formattedPrincipal}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-white/50 uppercase">Total Interest</span>
                            <span className="font-bold text-white">{liveFinancingSimulation.formattedInterest}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sanity Check Alert */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5 text-amber-200">
                        <ShieldAlert size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Sanity Check Verification</p>
                          <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                            Ensure the resulting monthly figure aligns with household roofing affordability before publishing to production.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculator Bounds & Safety Flags */}
              <form
                onSubmit={handleSaveFinancingSettings}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-[#0B1E33]">
                      Global Calculator Settings &amp; Compliance Flags
                    </h4>
                    <p className="text-xs text-slate-500">
                      Configure min/max project budget boundaries and the credit check claim safety valve.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369a1] shadow-xs cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Settings</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Min Project Cost ($)
                    </span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      required
                      value={financingSettings.minProjectCost}
                      onChange={(e) =>
                        setFinancingSettings({
                          ...financingSettings,
                          minProjectCost: parseInt(e.target.value, 10) || 5000,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Max Project Cost ($)
                    </span>
                    <input
                      type="number"
                      step="1000"
                      min="10000"
                      required
                      value={financingSettings.maxProjectCost}
                      onChange={(e) =>
                        setFinancingSettings({
                          ...financingSettings,
                          maxProjectCost: parseInt(e.target.value, 10) || 50000,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Default Project Cost ($)
                    </span>
                    <input
                      type="number"
                      step="500"
                      required
                      value={financingSettings.defaultProjectCost}
                      onChange={(e) =>
                        setFinancingSettings({
                          ...financingSettings,
                          defaultProjectCost: parseInt(e.target.value, 10) || 16500,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-[#0B1E33]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block">
                      &quot;No Credit Score Impact Check&quot; Safety Valve Flag
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      When enabled, confirms all active programs support soft credit pre-qualification inquiries.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={financingSettings.creditCheckCopyFlag}
                      onChange={(e) =>
                        setFinancingSettings({
                          ...financingSettings,
                          creditCheckCopyFlag: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300"
                    />
                    <span className="text-xs font-bold text-emerald-700">True (Soft Pulls Verified)</span>
                  </label>
                </div>
              </form>

              {/* Financing Calculations Telemetry Table */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#0B1E33]">
                    Recent Financing Calculations Telemetry
                  </h4>
                  <p className="text-xs text-slate-500">
                    Anonymous loan simulation activity from visitors exploring financing options.
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3">Date / Time</th>
                        <th className="px-5 py-3">Plan Used</th>
                        <th className="px-5 py-3">Project Cost</th>
                        <th className="px-5 py-3">Down Payment</th>
                        <th className="px-5 py-3">Resulting Monthly</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[#0B1E33]">
                      {financingCalculations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                            No financing calculations recorded yet.
                          </td>
                        </tr>
                      ) : (
                        financingCalculations.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                              {new Date(c.createdAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 font-bold text-sky-800">{c.planName}</td>
                            <td className="px-5 py-3 font-mono">${c.projectCost.toLocaleString()}</td>
                            <td className="px-5 py-3 font-mono text-emerald-600">
                              ${c.downPayment.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 font-extrabold text-amber-700 font-mono">
                              ${c.monthlyPayment.toLocaleString()}/mo
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: RECENT CALCULATION LOGS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0B1E33]">Anonymous Estimator Telemetry Log</h3>
                <p className="text-xs text-slate-500">
                  Real-time calculations from website visitors (no PII captured until formal quote request).
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Date / Time</th>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Sq Ft Entered</th>
                      <th className="px-5 py-3">Estimate Range Shown</th>
                      <th className="px-5 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[#0B1E33]">
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                          No recent calculations recorded yet.
                        </td>
                      </tr>
                    ) : (
                      leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 font-bold text-sky-800">{l.serviceName}</td>
                          <td className="px-5 py-3 font-mono">{l.sqftEntered.toLocaleString()} sq ft</td>
                          <td className="px-5 py-3 font-extrabold text-[#0B1E33]">
                            ${l.estimateLow.toLocaleString()} – ${l.estimateHigh.toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                l.source === 'custom'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              {l.source}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

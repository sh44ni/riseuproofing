'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  User,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Phone,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface InspectionPoint {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'good' | 'fair' | 'critical';
  notes: string;
  quickTags: string[];
}

const DEFAULT_INSPECTION_POINTS: Omit<InspectionPoint, 'status' | 'notes'>[] = [
  // 1. Roof Surface & Covering
  {
    id: 'shingle_condition',
    category: 'Roof Surface & Covering',
    name: 'Shingle / Tile Physical Condition',
    description: 'Cracked, curling, missing, or storm-damaged roofing units.',
    quickTags: ['Normal wear', 'Missing shingles', 'Curling edges', 'Broken clay tiles', 'Impact damage'],
  },
  {
    id: 'granule_loss',
    category: 'Roof Surface & Covering',
    name: 'Granule Retention & UV Weathering',
    description: 'Protective ceramic granule loss, fiberglass substrate showing, UV blistered shingles.',
    quickTags: ['Even granule cover', 'Moderate granule wear', 'Heavy loss in gutters', 'Fiberglass exposed'],
  },
  {
    id: 'underlayment_wear',
    category: 'Roof Surface & Covering',
    name: 'Underlayment Integrity',
    description: 'Condition of waterproof barrier beneath shingles/tile along eaves, ridges, and valleys.',
    quickTags: ['Intact & sealed', 'Brittle felt paper', 'Torn / slipping underlayment', 'Exposed decking'],
  },

  // 2. Flashings & Drainage
  {
    id: 'valley_metal',
    category: 'Flashings & Drainage',
    name: 'Valley Metal & Water Corridors',
    description: 'Open or closed valley flashing, rust spots, debris damming, and sealant joints.',
    quickTags: ['Clean flow', 'Surface rust', 'Organic silt build-up', 'Corroded / leaking pan'],
  },
  {
    id: 'wall_flashing',
    category: 'Flashings & Drainage',
    name: 'Step & Chimney Counter Flashing',
    description: 'Metal step flashing into sidewalls, headwalls, chimney cricket, and polyurethane sealants.',
    quickTags: ['Firmly sealed', 'Aged / dry sealant', 'Loose counter-flashing', 'Active wall leak risk'],
  },
  {
    id: 'pipe_boots',
    category: 'Flashings & Drainage',
    name: 'Plumbing Vent Boots & Jacks',
    description: 'Neoprene or lead roof jacks around plumbing vents, HVAC vents, and electrical masts.',
    quickTags: ['Pliable & tight', 'Sun-checked neoprene', 'Split collar gasket', 'Open water entry'],
  },

  // 3. Structural Integrity & Decking
  {
    id: 'plywood_decking',
    category: 'Structural & Decking',
    name: 'Plywood Decking & Rafter Firmness',
    description: 'Decking deflection, soft/spongy feel underfoot, and rafter sag.',
    quickTags: ['Solid underfoot', 'Minor bounce', 'Spongy dry rot spot', 'Major sagging decking'],
  },
  {
    id: 'fascia_eaves',
    category: 'Structural & Decking',
    name: 'Fascia Boards & Eave Overhangs',
    description: 'Rake edges, starter boards, and fascia behind gutters for dry rot or termite damage.',
    quickTags: ['Sound wood', 'Gutter line peeling', 'Soft dry rot at corners', 'Termite / water decay'],
  },
  {
    id: 'attic_moisture',
    category: 'Structural & Decking',
    name: 'Attic Space & Moisture Intrusion',
    description: 'Underside of roof deck, nail rust, daylight gaps, condensation, and attic mold.',
    quickTags: ['Dry attic', 'Rusty shingle nails', 'Staining on rafters', 'Active drip / mold detected'],
  },

  // 4. Ventilation & Perimeter
  {
    id: 'ridge_venting',
    category: 'Ventilation & Perimeter',
    name: 'Ridge Venting & Airflow Exhaust',
    description: 'Ridge vent baffles, O’Hagin dormers, soffit intake airflow, and heat buildup prevention.',
    quickTags: ['Optimal airflow', 'Partial debris blockage', 'Cracked plastic vent cap', 'Inadequate attic exhaust'],
  },
  {
    id: 'gutters_drainage',
    category: 'Ventilation & Perimeter',
    name: 'Gutters & Downspout Clearances',
    description: 'Gutter slope, standing water, downspout discharge away from foundation.',
    quickTags: ['Proper drainage', 'Standing water / poor pitch', 'Heavy granule sludge', 'Loose hanging brackets'],
  },
  {
    id: 'solar_clearances',
    category: 'Ventilation & Perimeter',
    name: 'Solar Stanchions & Clearances',
    description: 'Lag bolt penetrations, flashing boots beneath solar brackets, and debris under panels.',
    quickTags: ['No solar / N/A', 'Properly flashed brackets', 'Pigeon / debris accumulation', 'Compromised lag boot'],
  },
];

function InspectionBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead_id');

  const [loadingLead, setLoadingLead] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<any | null>(null);

  // Homeowner / Property info
  const [propertyData, setPropertyData] = useState({
    leadId: leadId || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    zip: '',
    roofType: 'Asphalt Shingle',
    inspectorName: 'Michael (Rise Up Lead Inspector)',
    inspectionDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // 12-point inspection state
  const [findings, setFindings] = useState<InspectionPoint[]>(() =>
    DEFAULT_INSPECTION_POINTS.map(p => ({
      ...p,
      status: 'good',
      notes: '',
    }))
  );

  // Manual override for remaining years, or auto suggested
  const [customRemainingYears, setCustomRemainingYears] = useState<number | null>(null);

  // Fetch lead data if leadId is in query
  useEffect(() => {
    if (!leadId) return;

    setLoadingLead(true);
    fetch(`/api/admin/leads/${leadId}`)
      .then(res => res.json())
      .then(data => {
        if (data.lead) {
          const l = data.lead;
          setPropertyData(prev => ({
            ...prev,
            customerName: l.full_name || '',
            customerPhone: l.phone || '',
            customerEmail: l.email || '',
            address: l.address || '',
            city: l.city || '',
            zip: l.zip || '',
            roofType: l.roof_type || 'Asphalt Shingle',
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingLead(false));
  }, [leadId]);

  // Health score calculation
  // 100 base. Fair = -6 pts. Critical = -18 pts. Clamped [15, 100].
  const { healthScore, urgentRequired, criticalCount, fairCount, suggestedYears } = useMemo(() => {
    let score = 100;
    let critical = 0;
    let fair = 0;

    findings.forEach(f => {
      if (f.status === 'critical') {
        score -= 18;
        critical += 1;
      } else if (f.status === 'fair') {
        score -= 6;
        fair += 1;
      }
    });

    const finalScore = Math.max(15, Math.min(100, score));

    // Dynamic suggested lifespan
    let years = 15;
    if (finalScore >= 90) years = 18;
    else if (finalScore >= 80) years = 12;
    else if (finalScore >= 65) years = 6;
    else if (finalScore >= 50) years = 3;
    else years = 1;

    return {
      healthScore: finalScore,
      urgentRequired: critical > 0,
      criticalCount: critical,
      fairCount: fair,
      suggestedYears: years,
    };
  }, [findings]);

  const effectiveRemainingYears = customRemainingYears !== null ? customRemainingYears : suggestedYears;

  const handleStatusChange = (id: string, newStatus: 'good' | 'fair' | 'critical') => {
    setFindings(prev =>
      prev.map(f => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setFindings(prev =>
      prev.map(f => (f.id === id ? { ...f, notes } : f))
    );
  };

  const handleTagToggle = (id: string, tag: string) => {
    setFindings(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const current = f.notes ? f.notes.split(', ').filter(Boolean) : [];
        const exists = current.includes(tag);
        const updated = exists ? current.filter(t => t !== tag) : [...current, tag];
        return { ...f, notes: updated.join(', ') };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        leadId: propertyData.leadId || undefined,
        inspectorName: propertyData.inspectorName,
        inspectionDate: propertyData.inspectionDate,
        findings: findings.map(f => ({
          id: f.id,
          name: f.name,
          category: f.category,
          status: f.status,
          notes: f.notes,
        })),
        estimatedRemainingYears: effectiveRemainingYears,
        notes: propertyData.notes || undefined,
      };

      const res = await fetch('/api/admin/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save roof inspection.');
      }

      const data = await res.json();
      setSaveSuccess(data.inspection);
    } catch (err: any) {
      alert(err.message || 'Error saving inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group findings by category
  const categories = useMemo(() => {
    const cats: { [name: string]: InspectionPoint[] } = {};
    findings.forEach(f => {
      if (!cats[f.category]) cats[f.category] = [];
      cats[f.category].push(f);
    });
    return Object.entries(cats);
  }, [findings]);

  if (saveSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl animate-in zoom-in-95">
          <CheckCircle2 size={44} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Inspection Report Published!
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Inspection <span className="font-mono font-bold text-amber-400">{saveSuccess.inspection_number}</span> has been logged to the CRM activity timeline.
        </p>

        {/* Score & Summary Card */}
        <div className="mt-8 p-6 rounded-3xl bg-slate-900 border border-white/10 text-left space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Roof Health Score</span>
              <div className="text-3xl font-black text-white mt-0.5">{saveSuccess.roof_health_score}%</div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              saveSuccess.roof_health_score >= 80
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : saveSuccess.roof_health_score >= 60
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {saveSuccess.roof_health_score >= 80 ? 'Good / Passing' : saveSuccess.roof_health_score >= 60 ? 'Maintenance Needed' : 'Critical Hazard'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Remaining Lifespan</span>
              <p className="font-bold text-white mt-0.5">~{saveSuccess.estimated_remaining_years} Years</p>
            </div>
            <div>
              <span className="text-slate-500">Inspector</span>
              <p className="font-bold text-white mt-0.5">{saveSuccess.inspector_name}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/inspection/${saveSuccess.inspection_number}`}
            target="_blank"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} /> Open Public Homeowner Report
          </Link>

          {propertyData.leadId && (
            <Link
              href={`/admin/estimates/new?lead_id=${propertyData.leadId}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileText size={16} /> Build Estimate &amp; Proposal
            </Link>
          )}

          <Link
            href="/admin/inspections"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
          >
            Back to Inspections List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/inspections"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Inspections
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ClipboardCheck size={28} className="text-amber-400" />
            12-Point Roof Damage Inspection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Conduct a standardized field inspection. Evaluates surface wear, flashing leaks, structural dry rot, and ventilation.
          </p>
        </div>

        {/* Floating Health Score Widget (Desktop & Mobile) */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-xl ${
          healthScore >= 80
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            : healthScore >= 60
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
        }`}>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Live Health Score</span>
            <span className="text-xs font-bold text-slate-300">
              {urgentRequired ? '⚠️ Critical Hazard' : fairCount > 0 ? `${fairCount} Issues Noted` : 'All Points Clear'}
            </span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center font-black">
            <span className="text-xl leading-none">{healthScore}%</span>
            <span className="text-[8px] uppercase tracking-tighter opacity-70">Grade</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Inspection Meta & Homeowner Info */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User size={18} className="text-amber-400" />
            Homeowner &amp; Inspection Details
          </h2>

          {loadingLead && (
            <div className="text-xs text-amber-400 flex items-center gap-2 animate-pulse">
              <Sparkles size={14} /> Loading lead details from CRM...
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer / Property Name</label>
              <input
                type="text"
                placeholder="e.g. John Miller"
                value={propertyData.customerName}
                onChange={e => setPropertyData({ ...propertyData, customerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="(619) 000-0000"
                value={propertyData.customerPhone}
                onChange={e => setPropertyData({ ...propertyData, customerPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Property Address</label>
              <input
                type="text"
                placeholder="Street address"
                value={propertyData.address}
                onChange={e => setPropertyData({ ...propertyData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Inspector Name</label>
              <input
                type="text"
                value={propertyData.inspectorName}
                onChange={e => setPropertyData({ ...propertyData, inspectorName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Inspection Date</label>
              <input
                type="date"
                value={propertyData.inspectionDate}
                onChange={e => setPropertyData({ ...propertyData, inspectionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Roof Type / Material</label>
              <select
                value={propertyData.roofType}
                onChange={e => setPropertyData({ ...propertyData, roofType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Asphalt Shingle">Asphalt Architectural Shingle</option>
                <option value="Concrete Tile">Concrete / Clay Tile</option>
                <option value="Commercial TPO">Commercial TPO Flat Roof</option>
                <option value="Standing Seam Metal">Standing Seam Metal</option>
                <option value="Torch Down">Torch Down Modified Bitumen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: 12 Inspection Points Grouped By Category */}
        <div className="space-y-6">
          {categories.map(([categoryName, items]) => (
            <div
              key={categoryName}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4"
            >
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    {categoryName}
                  </h3>
                  <span className="text-xs text-slate-400">Standard field diagnostic check</span>
                </div>
              </div>

              <div className="space-y-4">
                {items.map(item => {
                  const isGood = item.status === 'good';
                  const isFair = item.status === 'fair';
                  const isCritical = item.status === 'critical';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isGood
                          ? 'bg-slate-950/40 border-white/5'
                          : isFair
                          ? 'bg-amber-950/15 border-amber-500/30'
                          : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      {/* Point Header & Status Toggle Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{item.name}</span>
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase">
                                Urgent Hazard
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>

                        {/* 3-State Buttons: Good / Fair / Critical */}
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'good')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isGood
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            Good
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'fair')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isFair
                                ? 'bg-amber-400 text-slate-950 shadow-md'
                                : 'text-slate-400 hover:text-amber-300'
                            }`}
                          >
                            <AlertTriangle size={13} />
                            Fair (-6%)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'critical')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isCritical
                                ? 'bg-rose-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <XCircle size={13} />
                            Critical (-18%)
                          </button>
                        </div>
                      </div>

                      {/* Observations & Fast Tap Tags */}
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-500">Quick Observation:</span>
                          {item.quickTags.map(tag => {
                            const isSelected = item.notes.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagToggle(item.id, tag)}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>

                        <input
                          type="text"
                          placeholder="Specific observation or photo note..."
                          value={item.notes}
                          onChange={e => handleNotesChange(item.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Section: Overall Prognosis & Remaining Lifespan */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            Lifespan Forecast &amp; Inspector Recommendations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Estimated Remaining Roof Lifespan: <span className="text-amber-400 font-bold">{effectiveRemainingYears} Years</span>
              </label>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={effectiveRemainingYears}
                onChange={e => setCustomRemainingYears(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Yrs (Replace Now)</span>
                <span>10 Yrs</span>
                <span>25 Yrs (New)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-semibold text-slate-300 block mb-1">Health Score Evaluation</span>
              <p className="text-xs text-slate-400">
                {healthScore >= 80
                  ? 'Roof is performing well. Minor routine maintenance and periodic flash sealing recommended.'
                  : healthScore >= 60
                  ? 'Moderate wear detected. Flashing repairs or partial tune-up advised within 3-6 months to prevent drywall water damage.'
                  : 'Severe damage or advanced aging detected. Recommend full replacement with Owens Corning architectural system.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              General Inspector Recommendations for Homeowner
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Recommended complete tear-off of 2 existing layers. Replace 3 sheets of dry-rotted starter plywood near rear valley..."
              value={propertyData.notes}
              onChange={e => setPropertyData({ ...propertyData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/inspections"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {submitting ? 'Generating Report...' : 'Publish & Save Inspection Report'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewInspectionPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Sparkles size={16} className="text-amber-400 animate-spin" /> Loading inspection wizard...
      </div>
    }>
      <InspectionBuilderContent />
    </Suspense>
  );
}

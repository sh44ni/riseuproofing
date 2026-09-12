'use client';

import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Save, Loader2, CheckCircle2, RefreshCw, Sun, Quote } from 'lucide-react';
import { DashboardConfig } from '@/lib/dashboard-config';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DashboardConfig;
  onConfigUpdated: (newConfig: DashboardConfig) => void;
}

const PRESET_HERO_IMAGES = [
  {
    name: 'Modern Architectural Roof',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Roofing Craftsmen at Sunrise',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Coastal Tile & Blue Sky',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Residential Slate & Shingle',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
  },
];

const PRESET_QUOTE_IMAGES = [
  {
    name: 'Pacific Ocean Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Mountain Horizon',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Coastal Palm Trees',
    url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=800&auto=format&fit=crop',
  },
];

export default function DashboardCustomizerModal({
  isOpen,
  onClose,
  currentConfig,
  onConfigUpdated,
}: DashboardCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'quote' | 'weather'>('hero');
  const [formData, setFormData] = useState<DashboardConfig>(currentConfig);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if initial changes
  React.useEffect(() => {
    setFormData(currentConfig);
  }, [currentConfig]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/dashboard-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save dashboard customization');
      }

      onConfigUpdated(data.config);
      setSuccessMsg('Dashboard customization saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Customize Dashboard</h2>
              <p className="text-xs text-slate-500">Update motivational quotes, hero banner and imagery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 gap-6 text-xs font-semibold bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'hero'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon size={14} />
            <span>Hero Banner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'quote'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Quote size={14} />
            <span>Right Quote Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'weather'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sun size={14} />
            <span>Weather Settings</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: HERO BANNER */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline (Gold Pill)
                </label>
                <input
                  type="text"
                  value={formData.hero.tagline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, tagline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  placeholder="e.g. DISCIPLINE BUILDS FREEDOM"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Headline (Main Title)
                </label>
                <input
                  type="text"
                  value={formData.hero.headline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, headline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  placeholder="e.g. MORE ROOFS. A STRONGER TOMORROW."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subquote / Slogan
                </label>
                <input
                  type="text"
                  value={formData.hero.subquote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, subquote: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  placeholder="e.g. GOOD ROOFS. BETTER PEOPLE. — RISE UP"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  value={formData.hero.imageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, imageUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-xs"
                  placeholder="https://..."
                  required
                />

                {/* Preset Presets */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500 py-1">Presets:</span>
                  {PRESET_HERO_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          hero: { ...formData.hero, imageUrl: preset.url },
                        })
                      }
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUOTE CARD */}
          {activeTab === 'quote' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Motivational Quote
                </label>
                <textarea
                  rows={2}
                  value={formData.quoteCard.quote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quoteCard: { ...formData.quoteCard, quote: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  placeholder="e.g. PROGRESS BUILDS FREEDOM."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Card Background Image URL
                </label>
                <input
                  type="url"
                  value={formData.quoteCard.imageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quoteCard: { ...formData.quoteCard, imageUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-xs"
                  placeholder="https://..."
                  required
                />

                {/* Preset Presets */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500 py-1">Presets:</span>
                  {PRESET_QUOTE_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          quoteCard: { ...formData.quoteCard, imageUrl: preset.url },
                        })
                      }
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEATHER SETTINGS */}
          {activeTab === 'weather' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={formData.weather.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather: { ...formData.weather, location: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    placeholder="e.g. Oceanside, CA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={formData.weather.condition}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather: { ...formData.weather, condition: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    placeholder="e.g. Sunny"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Temp (°F)
                  </label>
                  <input
                    type="number"
                    value={formData.weather.temp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather: { ...formData.weather, temp: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    High Temp (°F)
                  </label>
                  <input
                    type="number"
                    value={formData.weather.high}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather: { ...formData.weather, high: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Low Temp (°F)
                  </label>
                  <input
                    type="number"
                    value={formData.weather.low}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weather: { ...formData.weather, low: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#0B1E33] hover:bg-[#122b49] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

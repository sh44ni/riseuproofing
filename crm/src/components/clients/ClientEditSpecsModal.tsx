import React, { useState } from 'react';
import { X, Home, Check } from 'lucide-react';
import { RoofSpecs } from '@/types/client360Types';

interface ClientEditSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: RoofSpecs;
  onSave: (updated: RoofSpecs) => void;
}

export function ClientEditSpecsModal({
  isOpen,
  onClose,
  specs,
  onSave,
}: ClientEditSpecsModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<RoofSpecs>({ ...specs });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2F9FE3]">
              <Home size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Edit Property & Roof Specs</h3>
              <p className="text-xs text-slate-400">Update dimensions, material, and architectural parameters.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">City & ZIP</label>
              <input
                type="text"
                value={formData.cityZip}
                onChange={(e) => setFormData({ ...formData, cityZip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Roof Material</label>
              <select
                value={formData.roofMaterial}
                onChange={(e) => setFormData({ ...formData, roofMaterial: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7] bg-white"
              >
                <option value="Concrete Tile">Concrete Tile</option>
                <option value="Spanish Clay S-Tile">Spanish Clay S-Tile</option>
                <option value="Architectural Shingle">Architectural Shingle</option>
                <option value="Standing Seam Metal">Standing Seam Metal</option>
                <option value="Flat TPO Commercial">Flat TPO Commercial</option>
                <option value="Tile Relay & Underlayment">Tile Relay & Underlayment</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Roof Area (sq ft)</label>
              <input
                type="number"
                value={formData.roofAreaSqFt}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    roofAreaSqFt: val,
                    roofSquares: Math.round(val / 100),
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Stories</label>
              <input
                type="text"
                value={formData.stories}
                onChange={(e) => setFormData({ ...formData, stories: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                placeholder="e.g. 1 Story"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Roof Age (Years)</label>
              <input
                type="number"
                value={formData.roofAgeYears}
                onChange={(e) => setFormData({ ...formData, roofAgeYears: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">HOA Community</label>
              <input
                type="text"
                value={formData.hoaCommunity}
                onChange={(e) => setFormData({ ...formData, hoaCommunity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                placeholder="e.g. No, or Capistrano HOA"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Roof Pitch</label>
              <input
                type="text"
                value={formData.pitch || ''}
                onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
                placeholder="e.g. 4/12"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Decking Condition & Notes</label>
            <textarea
              rows={2}
              value={formData.deckingCondition || ''}
              onChange={(e) => setFormData({ ...formData, deckingCondition: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0284C7]"
              placeholder="e.g. Original 1/2 inch plywood, dry rot near chimney"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Update Specs</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

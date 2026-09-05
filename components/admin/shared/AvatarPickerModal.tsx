'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Check,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { UserRole, CURATED_PORTRAITS } from '@/lib/rbac';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  userRole?: UserRole | string;
  onSelectAvatar: (url: string | null) => void;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName = 'User',
  userRole = 'owner',
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentAvatarUrl || null);
  const [customUrl, setCustomUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'gallery' | 'upload' | 'url'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process local file and compress to base64
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedUrl(compressedDataUrl);
        }
        setUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onSelectAvatar(selectedUrl);
    onClose();
  }

  function handleRemove() {
    setSelectedUrl(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#141b24] border border-white/[0.08] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4a447]/15 border border-[#d4a447]/30 flex items-center justify-center text-[#d4a447]">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#f0f2f5]">Choose Avatar Photo</h3>
              <p className="text-[11px] text-[#8a95a5]">Upload, paste URL, or pick from executive gallery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-[#8a95a5] hover:text-[#f0f2f5] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Live Preview Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0c1117] border border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                name={userName}
                avatarUrl={selectedUrl}
                role={userRole}
                size="xl"
                showStatus
                showRoleBadge
              />
              <div>
                <p className="text-sm font-bold text-[#f0f2f5]">{userName}</p>
                <div className="mt-1">
                  <RoleBadge role={userRole} size="xs" />
                </div>
                <p className="text-[10px] text-[#8a95a5] mt-1">
                  {selectedUrl ? 'Custom photo selected' : 'Initial monogram fallback'}
                </p>
              </div>
            </div>

            {selectedUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Remove photo"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0c1117] border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setTab('gallery')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'gallery'
                  ? 'bg-[#d4a447] text-[#0c1117] shadow-sm'
                  : 'text-[#8a95a5] hover:text-[#f0f2f5]'
              }`}
            >
              <Sparkles size={13} />
              Gallery Presets
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'upload'
                  ? 'bg-[#d4a447] text-[#0c1117] shadow-sm'
                  : 'text-[#8a95a5] hover:text-[#f0f2f5]'
              }`}
            >
              <Upload size={13} />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'url'
                  ? 'bg-[#d4a447] text-[#0c1117] shadow-sm'
                  : 'text-[#8a95a5] hover:text-[#f0f2f5]'
              }`}
            >
              <LinkIcon size={13} />
              Photo Link
            </button>
          </div>

          {/* Tab 1: Curated Gallery */}
          {tab === 'gallery' && (
            <div className="space-y-3">
              <p className="text-xs text-[#8a95a5]">
                Select a high-resolution portrait matching your team member's role:
              </p>
              <div className="grid grid-cols-5 gap-2.5">
                {CURATED_PORTRAITS.map((p) => {
                  const isSelected = selectedUrl === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedUrl(p.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                        isSelected
                          ? 'border-[#d4a447] ring-2 ring-[#d4a447]/30 scale-105 shadow-[0_0_12px_rgba(212,164,71,0.3)]'
                          : 'border-white/[0.08] hover:border-white/30'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#d4a447]/30 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#d4a447] text-[#0c1117] flex items-center justify-center shadow-md">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: File Upload */}
          {tab === 'upload' && (
            <div className="space-y-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-white/[0.12] hover:border-[#d4a447]/60 rounded-2xl bg-[#0c1117]/60 hover:bg-[#0c1117] transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/[0.04] group-hover:bg-[#d4a447]/15 border border-white/[0.08] group-hover:border-[#d4a447]/30 flex items-center justify-center text-[#8a95a5] group-hover:text-[#d4a447] transition-all">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#d4a447] transition-colors">
                    {uploading ? 'Compressing photo...' : 'Click to upload image'}
                  </p>
                  <p className="text-[10px] text-[#8a95a5] mt-0.5">PNG, JPG, or WEBP (auto-scaled for high performance)</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Custom URL */}
          {tab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#a0aab8]">Image Web URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 bg-[#0c1117] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#f0f2f5] placeholder-slate-600 focus:outline-none focus:border-[#d4a447]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrl.trim()) {
                      setSelectedUrl(customUrl.trim());
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#f0f2f5] text-xs font-bold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/[0.06] bg-[#0c1117]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-[#a0aab8] text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-[#c4923a] hover:to-[#b8873a] text-[#0c1117] text-xs font-black shadow-[0_2px_12px_rgba(212,164,71,0.25)] transition-all cursor-pointer active:scale-95"
          >
            Confirm Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

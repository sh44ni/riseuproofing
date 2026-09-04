'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Maximize2,
  Upload,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';

interface JobPhoto {
  id: number;
  job_id: number;
  phase: 'before' | 'during' | 'inspection' | 'after' | 'damage';
  url: string;
  caption?: string;
  uploaded_by: string;
  created_at: string;
}

interface JobPhotoGalleryProps {
  jobId: number;
  jobNumber: string;
}

const PHASES = [
  { id: 'all', label: 'All Photos' },
  { id: 'before', label: 'Before' },
  { id: 'during', label: 'Tear-Off / During' },
  { id: 'inspection', label: 'City Inspection' },
  { id: 'after', label: 'Completed Roof' },
  { id: 'damage', label: 'Rot / Damage' },
];

export default function JobPhotoGallery({ jobId, jobNumber }: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<string>('before');
  const [caption, setCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Lightbox State
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<JobPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/photos?job_id=${jobId}&phase=${phaseFilter}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to load photos', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, phaseFilter]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use HTML Canvas to compress image down to ~1200px max width for super fast load
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setFileDataUrl(compressedDataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalUrl = fileDataUrl || photoUrl;
    if (!finalUrl) {
      alert('Please take/select a photo or provide an image URL');
      return;
    }

    setUploading(true);
    try {
      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          phase: uploadPhase,
          url: finalUrl,
          caption,
          uploadedBy: 'Field Crew',
        }),
      });

      if (res.ok) {
        setIsUploadOpen(false);
        setFileDataUrl(null);
        setPhotoUrl('');
        setCaption('');
        fetchPhotos();
      } else {
        alert('Failed to save photo');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this photo from project documentation?')) return;
    await fetch(`/api/admin/photos?id=${id}`, { method: 'DELETE' });
    fetchPhotos();
  }

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Camera size={18} className="text-cyan-400" />
            Field Photo Documentation
          </h3>
          <p className="text-xs text-slate-400">
            Before, tear-off, building inspection passings, and final warranty imagery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Add Field Photo
          </button>
        </div>
      </div>

      {/* Phase Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PHASES.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPhaseFilter(p.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              phaseFilter === p.id
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
          <RefreshCw size={20} className="animate-spin text-cyan-400" />
          <span className="text-xs font-semibold">Loading photos...</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
          <ImageIcon size={32} className="mx-auto text-slate-600" />
          <p className="text-xs text-slate-400">
            No photos uploaded for this phase yet. Click &quot;Add Field Photo&quot; to take photos on-site.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(p => (
            <div
              key={p.id}
              onClick={() => setActiveLightboxPhoto(p)}
              className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 aspect-square cursor-pointer hover:border-cyan-400/50 transition-all shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || 'Roof photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Phase Badge */}
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-cyan-400 border border-white/10 uppercase tracking-wider backdrop-blur-sm">
                {p.phase}
              </span>

              {/* Delete Button */}
              <button
                type="button"
                onClick={e => handleDeletePhoto(p.id, e)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Photo"
              >
                <Trash2 size={13} />
              </button>

              {/* Caption & Date at bottom */}
              <div className="absolute bottom-2 left-2 right-2 text-left">
                {p.caption && (
                  <p className="text-xs font-semibold text-white truncate drop-shadow">
                    {p.caption}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Bottom Sheet */}
      {isUploadOpen && (
        <BottomSheet
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setFileDataUrl(null);
          }}
          title="Add Field Photo"
          subtitle={`Upload documentation for ${jobNumber}`}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Phase
              </label>
              <select
                value={uploadPhase}
                onChange={e => setUploadPhase(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="before">Before Starting (Initial Condition)</option>
                <option value="during">Tear-Off &amp; Underlayment (In Progress)</option>
                <option value="inspection">City Building Inspection Pass</option>
                <option value="after">Completed Roof (Final Warranty Photo)</option>
                <option value="damage">Dry Rot / Subdecking Damage</option>
              </select>
            </div>

            {/* Camera / File Capture */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Take Photo or Select File
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Camera size={16} className="text-cyan-400" />
                  Take Photo / Browse File
                </button>
              </div>

              {fileDataUrl && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-cyan-500/30 max-h-48 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileDataUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setFileDataUrl(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Direct Web URL Alternative */}
            {!fileDataUrl && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Paste Image URL (Drone / Cloud Link)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or cloud link"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Caption / Observation
              </label>
              <input
                type="text"
                placeholder="e.g. South slope valley flashing installed with Owens Corning Ice & Water barrier"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload size={14} />
                {uploading ? 'Uploading...' : 'Save to Project Documentation'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxPhoto.url}
              alt={activeLightboxPhoto.caption || 'Expanded roof photo'}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
            />

            <div className="mt-3 text-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                {activeLightboxPhoto.phase} Phase
              </span>
              {activeLightboxPhoto.caption && (
                <p className="text-sm font-semibold text-white mt-1">
                  {activeLightboxPhoto.caption}
                </p>
              )}
              <span className="text-xs text-slate-400 font-mono">
                Uploaded {new Date(activeLightboxPhoto.created_at).toLocaleString()} by {activeLightboxPhoto.uploaded_by}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

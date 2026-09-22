import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TwoOptionsEstimate } from '@/types/estimateContractTypes';
import { API_BASE, api } from '@/lib/api';

interface PreviewPanelProps {
  estimateId: string | null;
  data: TwoOptionsEstimate;
  currentStep: number;
  previewPage: 1 | 2;
  lastSaved: Date | null;
}

// Estimate Page dimensions at 96 DPI: 8.5in x 11in ≈ 816px x 1056px
const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;

export function PreviewPanel({ estimateId, data, currentStep, previewPage, lastSaved }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initialLoadRef = useRef(false);

  const fetchPreview = useCallback(async () => {
    if (!estimateId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/estimates/${estimateId}/render-html?page=${previewPage}&t=${Date.now()}`,
        { headers: api.getAuthHeaders() }
      );
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      }
    } catch (err) {
      console.error('Preview fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [estimateId, previewPage]);

  // Initial fetch as soon as estimateId is available or page changes
  useEffect(() => {
    if (estimateId) {
      fetchPreview();
      initialLoadRef.current = true;
    }
  }, [estimateId, previewPage, fetchPreview]);

  // Refresh preview after autosave completes (lastSaved updates)
  useEffect(() => {
    if (!estimateId || !lastSaved || !initialLoadRef.current) return;
    fetchPreview();
  }, [lastSaved, estimateId, previewPage]);

  // Scale calculation to fit container cleanly
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const availWidth = Math.max(100, width - 32);
        const availHeight = Math.max(100, height - 56);
        const newScale = Math.min(availWidth / PAGE_WIDTH_PX, availHeight / PAGE_HEIGHT_PX);
        setScale(newScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateScale);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-200/70 flex flex-col items-center justify-center relative overflow-hidden select-none" ref={containerRef}>
      <div 
        className="relative shadow-2xl rounded-sm bg-white overflow-hidden"
        style={{
          width: `${Math.round(PAGE_WIDTH_PX * scale)}px`,
          height: `${Math.round(PAGE_HEIGHT_PX * scale)}px`,
        }}
      >
        <div
          className="absolute top-0 left-0 bg-white"
          style={{
            width: `${PAGE_WIDTH_PX}px`,
            height: `${PAGE_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {previewHtml ? (
            <iframe 
              srcDoc={previewHtml}
              className="w-full h-full border-0 overflow-hidden bg-white"
              title="Estimate PDF Preview"
              scrolling="no"
              sandbox="allow-same-origin"
            />
          ) : estimateId ? (
            <div className="w-full h-full flex items-center justify-center border border-slate-200 text-slate-400 bg-white">
              <div className="text-center p-8">
                <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-[#1878B8] border-t-transparent animate-spin" />
                <p className="text-sm font-medium text-slate-600">Rendering Preview...</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 bg-white">
              <div className="text-center p-8">
                <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-[#1a5ba5] border-t-transparent animate-spin" />
                <p className="font-semibold text-base mb-1 text-slate-700">Initializing Draft...</p>
                <p className="text-xs text-slate-500">Connecting to estimate engine</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {loading && previewHtml && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 shadow-md text-[11px] font-bold text-[#1a5ba5] flex items-center gap-1.5 backdrop-blur-sm border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-[#1a5ba5] animate-ping" />
          Updating preview...
        </div>
      )}
      <div className="absolute bottom-3 bg-white/90 backdrop-blur-xs px-3 py-0.5 rounded-full shadow-xs text-[10px] text-slate-600 font-bold tracking-wider uppercase border border-slate-200/80">
        Page {previewPage} of 2 &bull; Estimate
      </div>
    </div>
  );
}

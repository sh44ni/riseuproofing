/**
 * Rise Up CRM — Sidebar Quote Banner API Client
 * 
 * Handles fetching, updating, and uploading media for the sidebar quote banner widget.
 * Designed with a resilient fallback pattern: if the backend is not yet available,
 * operations seamlessly complete via local storage caching.
 */

export interface QuoteSlidePayload {
  id: string;
  imageUrl: string;
  title?: string;
  altText?: string;
}

export interface QuoteBannerConfigPayload {
  mode: 'single' | 'slideshow';
  singleImageUrl: string;
  slides: QuoteSlidePayload[];
  autoplay: boolean;
  slideDuration: number; // in seconds (e.g. 5)
  transitionEffect: 'fade' | 'slide';
  cardHeight: 'compact' | 'balanced' | 'tall';
  imageFit: 'cover' | 'contain';
  linkUrl?: string;
  updatedAt?: string;
}

export interface QuoteBannerApiResponse {
  success: boolean;
  data: QuoteBannerConfigPayload;
  message?: string;
}

import { api } from '@/lib/api';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE}/api/admin/quote-banner`;
const UPLOAD_ENDPOINT = `${API_BASE}/api/admin/quote-banner/upload`;

/**
 * Fetches the quote banner configuration from the backend.
 * Falls back to null if backend is offline.
 */
export async function fetchQuoteBannerFromBackend(): Promise<QuoteBannerConfigPayload | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: api.getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const json: QuoteBannerApiResponse = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    // Silent failover to local store in dev/offline
    return null;
  }
}

/**
 * Saves the quote banner configuration to the backend.
 */
export async function saveQuoteBannerToBackend(
  payload: QuoteBannerConfigPayload
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(API_ENDPOINT, {
      method: 'PUT',
      headers: {
        ...api.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    // Client remains operational even if backend save fails
    return false;
  }
}

/**
 * Uploads a quote banner image file to cloud storage via backend.
 * Returns the permanent HTTPS URL or base64 data URL as fallback.
 */
export async function uploadQuoteBannerImage(
  file: File
): Promise<{ success: boolean; url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const baseHeaders = api.getAuthHeaders();
    // Do not set Content-Type header so browser sets multipart/form-data with boundary
    const uploadHeaders: Record<string, string> = {};
    if (baseHeaders['X-API-Key']) uploadHeaders['X-API-Key'] = baseHeaders['X-API-Key'];
    if (baseHeaders['Authorization']) uploadHeaders['Authorization'] = baseHeaders['Authorization'];
    if (baseHeaders['X-Client-Platform']) uploadHeaders['X-Client-Platform'] = baseHeaders['X-Client-Platform'];

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.url) {
        return { success: true, url: data.data.url };
      }
    }
  } catch {
    // Fall back to base64 data URL
  }

  // Local fallback: read file as base64 data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, url: '' });
    };
    reader.readAsDataURL(file);
  });
}

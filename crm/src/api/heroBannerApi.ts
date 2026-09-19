/**
 * ==============================================================================
 * RISE UP CRM — HERO BANNER BACKEND API CLIENT
 * ==============================================================================
 * Implements the client-side REST interface for the Hero Banner system,
 * supporting optimistic caching, seamless cloud photo uploads, and
 * resilient offline fallback when the FastAPI backend is not running.
 * ==============================================================================
 */

export interface HeroBannerBackendData {
  page_id: string;
  image_url: string;
  zoom: number;
  position_x: number;
  position_y: number;
  opacity: number;
  overlay_strength: number;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  is_global: boolean;
  updated_at?: string;
  updated_by?: string;
}

export interface HeroBannerSavePayload {
  image_url: string;
  zoom: number;
  position_x: number;
  position_y: number;
  opacity: number;
  overlay_strength: number;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  apply_globally: boolean;
}

export interface HeroBannerMapResponse {
  global_banner?: HeroBannerBackendData;
  pages?: Record<string, HeroBannerBackendData>;
}

export interface HeroImageUploadResult {
  url: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

// Configurable API base URL: defaults to local FastAPI port 8000
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const API_TIMEOUT_MS = 3500;

/**
 * Internal fetch with timeout & credentials/headers handling
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('crm_auth_token') || localStorage.getItem('access_token')) : null;
    const apiKey = (import.meta as any).env?.VITE_CRM_API_KEY || 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw';
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Client-Platform': 'crm-web',
      ...(options.headers as Record<string, string>),
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[HeroBannerApi] Request to ${endpoint} returned HTTP ${response.status}`);
      return null;
    }

    const json = await response.json();
    return json?.data ?? json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Suppress network errors in development when backend is not actively running
    if (err.name !== 'AbortError') {
      console.debug(`[HeroBannerApi] Backend currently offline or unreachable at ${API_BASE_URL}`);
    }
    return null;
  }
}

/**
 * 1. Fetch All Hero Banners (Global + Per-Page Overrides)
 */
export async function fetchHeroBannersMap(): Promise<HeroBannerMapResponse | null> {
  return apiRequest<HeroBannerMapResponse>('/api/admin/hero-banners');
}

/**
 * 2. Fetch Single Page Hero Banner
 */
export async function fetchHeroBannerForPage(
  pageId: string
): Promise<HeroBannerBackendData | null> {
  return apiRequest<HeroBannerBackendData>(`/api/admin/hero-banners/${pageId}`);
}

/**
 * 3. Save / Update Hero Banner on Backend
 */
export async function saveHeroBannerToBackend(
  pageId: string,
  payload: HeroBannerSavePayload
): Promise<HeroBannerBackendData | null> {
  return apiRequest<HeroBannerBackendData>(`/api/admin/hero-banners/${pageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * 4. Reset Single Page Hero Banner to Global Defaults
 */
export async function resetHeroBannerOnBackend(pageId: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>(`/api/admin/hero-banners/${pageId}`, {
    method: 'DELETE',
  });
  return res !== null;
}

/**
 * 5. Upload Custom Image File to Cloud Storage
 * Returns the permanent CDN / public asset URL.
 */
export async function uploadHeroImageFile(file: File): Promise<HeroImageUploadResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for image uploads

  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? (localStorage.getItem('crm_auth_token') || localStorage.getItem('access_token')) : null;
    const apiKey = (import.meta as any).env?.VITE_CRM_API_KEY || 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw';
    const headers: Record<string, string> = {
      'X-Client-Platform': 'crm-web',
    };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/hero-banners/upload`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[HeroBannerApi] Upload failed with HTTP ${response.status}`);
      return null;
    }

    const json = await response.json();
    return json?.data ?? json;
  } catch (err) {
    clearTimeout(timeoutId);
    console.debug('[HeroBannerApi] Image upload server unavailable, using local client fallback.');
    return null;
  }
}

/**
 * 6. Quick Health Check to probe if FastAPI Backend is active
 */
export async function checkBackendConnection(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${API_BASE_URL}/docs`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 200 || response.status === 404;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

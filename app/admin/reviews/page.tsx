'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Filter,
  Sparkles,
  Send,
  X,
  Phone,
  MessageSquare,
  Globe,
  Award,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import CustomSelect from '@/components/admin/shared/CustomSelect';

function YelpLogo({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D32323">
      <path d="M20.16 12.74c-.11-.53-.44-.92-.93-1.07l-4.88-1.52c-.52-.16-1.05.15-1.21.67-.16.52.15 1.05.67 1.21l4.47 1.39-2.77 3.96c-.32.45-.21 1.07.24 1.38.45.32 1.07.21 1.38-.24l3.03-4.33c.27-.38.31-.87.08-1.45zm-7.79-1.92l1.52-4.88c.16-.52-.15-1.05-.67-1.21-.52-.16-1.05.15-1.21.67l-1.39 4.47-3.96-2.77c-.45-.32-1.07-.21-1.38.24-.32.45-.21 1.07.24 1.38l4.33 3.03c.38.27.87.31 1.45.08.53-.11.92-.44 1.07-.93zm-1.89 3.53l-4.88 1.52c-.52.16-.83.69-.67 1.21.16.52.69.83 1.21.67l4.47-1.39 2.77 3.96c.32.45.93.56 1.38.24.45-.32.56-.93.24-1.38l-3.03-4.33c-.27-.38-.76-.62-1.49-.5zm-4.73-3.41l4.88-1.52c.52-.16.83-.69.67-1.21-.16-.52-.69-.83-1.21-.67l-4.47 1.39-2.77-3.96c-.32-.45-.93-.56-1.38-.24-.45.32-.56.93-.24 1.38l3.03 4.33c.27.38.76.62 1.49.5z" />
    </svg>
  );
}

interface ReviewItem {
  id: number;
  lead_id?: number;
  job_id?: number;
  customer_name: string;
  customer_city?: string;
  rating: number;
  feedback?: string;
  service_type?: string;
  source: string;
  status: 'pending' | 'published' | 'escalated';
  review_token?: string;
  google_clicked: boolean;
  created_at: string;
  customer_phone?: string;
  customer_email?: string;
  job_number?: string;
  google_review_id?: string;
  yelp_review_id?: string;
  yelp_review_url?: string;
  author_photo?: string;
  owner_reply?: string;
  original_time?: string;
}

interface SummaryStats {
  totalReviews: number;
  avgRating: number;
  fiveStarPct: number;
  escalatedCount: number;
  googleClickedCount: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalReviews: 0,
    avgRating: 5.0,
    fiveStarPct: 100,
    escalatedCount: 0,
    googleClickedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Google Reviews Auto-Sync State
  const [googleSync, setGoogleSync] = useState<{
    isConnected: boolean;
    businessName: string | null;
    lastSyncedAt: string | null;
    lastSyncStatus: string | null;
    lastSyncCount: number;
    lastError: string | null;
  }>({
    isConnected: false,
    businessName: null,
    lastSyncedAt: null,
    lastSyncStatus: null,
    lastSyncCount: 0,
    lastError: null,
  });
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  // Yelp Reviews Auto-Sync State
  const [yelpSync, setYelpSync] = useState<{
    isConnected: boolean;
    businessName: string | null;
    businessRating: number;
    businessReviewCount: number;
    businessUrl: string | null;
    lastSyncedAt: string | null;
    lastSyncStatus: string | null;
    lastSyncCount: number;
    lastError: string | null;
    apiKeyMasked: string | null;
  }>({
    isConnected: false,
    businessName: null,
    businessRating: 5.0,
    businessReviewCount: 1,
    businessUrl: null,
    lastSyncedAt: null,
    lastSyncStatus: null,
    lastSyncCount: 0,
    lastError: null,
    apiKeyMasked: null,
  });
  const [syncingYelp, setSyncingYelp] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Send Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestResult, setRequestResult] = useState<{ link: string; review: any } | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerCity: 'Carlsbad',
    serviceType: 'Roof Replacement',
    leadId: '',
  });

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch('/api/admin/google-sync');
      if (res.ok) {
        const data = await res.json();
        setGoogleSync(data);
      }
    } catch (err) {
      console.error('Failed to load Google sync status', err);
    }
  };

  const fetchYelpStatus = async () => {
    try {
      const res = await fetch('/api/admin/yelp-sync');
      if (res.ok) {
        const data = await res.json();
        setYelpSync(data);
      }
    } catch (err) {
      console.error('Failed to load Yelp sync status', err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchGoogleStatus();
    fetchYelpStatus();

    // Check query params for Google auth feedback
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_connected')) {
        const synced = params.get('synced');
        setSyncFeedback({
          type: 'success',
          message: `Google Account successfully authorized! ${synced ? `${synced} reviews synchronized.` : ''}`,
        });
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('google_error')) {
        setSyncFeedback({
          type: 'error',
          message: `Google authentication notice: ${decodeURIComponent(params.get('google_error') || '')}`,
        });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleManualGoogleSync = async () => {
    setSyncingGoogle(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/google-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSyncFeedback({
          type: 'success',
          message: data.message || `Successfully synchronized ${data.syncedCount} reviews!`,
        });
        await fetchReviews();
        await fetchGoogleStatus();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || data.message || 'Synchronization failed',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Network error executing sync',
      });
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleManualYelpSync = async () => {
    setSyncingYelp(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/yelp-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSyncFeedback({
          type: 'success',
          message: data.message || `Successfully synchronized Yelp reviews!`,
        });
        await fetchReviews();
        await fetchYelpStatus();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || data.message || 'Yelp synchronization failed',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Network error executing Yelp sync',
      });
    } finally {
      setSyncingYelp(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'pending' : 'published';
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReviews(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus as any } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update review status', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerCity: formData.customerCity,
          serviceType: formData.serviceType,
          leadId: formData.leadId ? parseInt(formData.leadId, 10) : undefined,
          source: 'sms_request',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRequestResult({
          link: `${window.location.origin}${data.reviewLink}`,
          review: data.review,
        });
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to send review request', err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (ratingFilter !== 'all') {
        if (ratingFilter === '5' && r.rating !== 5) return false;
        if (ratingFilter === '4' && r.rating !== 4) return false;
        if (ratingFilter === 'below_4' && r.rating >= 4) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = r.customer_name.toLowerCase().includes(q);
        const matchesCity = (r.customer_city || '').toLowerCase().includes(q);
        const matchesFeedback = (r.feedback || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesFeedback) return false;
      }
      return true;
    });
  }, [reviews, statusFilter, ratingFilter, search]);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-sky-50 border border-sky-200/80 text-[#1878B8]">
            <Star size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Reputation &amp; Google Review Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Automated 5-star Google review generation with private feedback resolution.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setRequestResult(null);
            setFormData({ customerName: '', customerCity: 'Carlsbad', serviceType: 'Roof Replacement', leadId: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> Send Review Request
        </button>
      </div>

      {/* Sync Feedback Toast/Notice */}
      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{syncFeedback.message}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="p-1 hover:text-slate-900 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Google Business Profile Auto-Sync Panel */}
      <div className="p-4 rounded-[18px] bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-[#1878B8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0B1E33]">
                {googleSync.businessName || 'Google Business Profile Sync'}
              </h2>
              {googleSync.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Sync Active (Weekly Mondays 3AM UTC)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {googleSync.isConnected ? (
                <>
                  Last Synced:{' '}
                  {googleSync.lastSyncedAt
                    ? new Date(googleSync.lastSyncedAt).toLocaleString('en-US')
                    : 'Awaiting initial sync'}{' '}
                  • {googleSync.lastSyncCount} reviews synced from Google
                </>
              ) : (
                'Connect your Google account (marc@riseuprac.com) once to enable automatic weekly review synchronization.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          {googleSync.isConnected ? (
            <>
              <button
                onClick={handleManualGoogleSync}
                disabled={syncingGoogle}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200/80 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={13} className={syncingGoogle ? 'animate-spin' : ''} />
                <span>{syncingGoogle ? 'Syncing...' : 'Sync Reviews Now'}</span>
              </button>
              <a
                href="/api/admin/google-auth"
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0B1E33] border border-slate-200/80 text-xs font-semibold transition-all shadow-2xs"
                title="Reconnect Google Account"
              >
                Reconnect
              </a>
            </>
          ) : (
            <a
              href="/api/admin/google-auth"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F9FE3] hover:bg-[#1878B8] text-white font-bold text-xs shadow-xs transition-all"
            >
              <Globe size={14} />
              <span>Connect Google Account</span>
            </a>
          )}
        </div>
      </div>

      {/* Yelp Business Profile Auto-Sync Panel */}
      <div className="p-4 rounded-[18px] bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center flex-shrink-0">
            <YelpLogo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#0B1E33]">
                {yelpSync.businessName || 'Yelp Business Profile Sync'}
              </h2>
              {yelpSync.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Yelp Fusion Connected (Weekly Sync Active)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Not Configured
                </span>
              )}
              {yelpSync.businessRating && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  ★ {yelpSync.businessRating.toFixed(1)} ({yelpSync.businessReviewCount} on Yelp)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {yelpSync.isConnected ? (
                <>
                  Last Synced:{' '}
                  {yelpSync.lastSyncedAt
                    ? new Date(yelpSync.lastSyncedAt).toLocaleString('en-US')
                    : 'Awaiting initial sync'}{' '}
                  • {yelpSync.lastSyncCount} reviews synced from Yelp • API Key:{' '}
                  {yelpSync.apiKeyMasked || 'Active'}
                </>
              ) : (
                'Add YELP_API_KEY to environment variables to enable Yelp review synchronization.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <button
            onClick={handleManualYelpSync}
            disabled={syncingYelp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={13} className={syncingYelp ? 'animate-spin' : ''} />
            <span>{syncingYelp ? 'Syncing...' : 'Sync Yelp Reviews Now'}</span>
          </button>
          {yelpSync.businessUrl && (
            <a
              href={yelpSync.businessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0B1E33] border border-slate-200/80 text-xs font-semibold transition-all shadow-2xs"
              title="View on Yelp"
            >
              <span>View Listing</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[16px] admin-card shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Average Rating</span>
            <Star size={15} className="text-[#EAA636] fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33] flex items-center gap-1.5">
            {summary.avgRating} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Excellent Reputation</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>5-Star Promoters</span>
            <TrendingUp size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.fiveStarPct}%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">{summary.totalReviews} Total Verified</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Google Profile Boost</span>
            <Globe size={15} className="text-[#1878B8]" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.googleClickedCount}</div>
          <div className="text-xs text-sky-700 font-semibold mt-1">Confirmed Google Clicks</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Private Escalations</span>
            <AlertTriangle size={15} className="text-rose-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1E33]">{summary.escalatedCount}</div>
          <div className="text-xs text-rose-700 font-semibold mt-1">
            {summary.escalatedCount > 0 ? 'Requires Owner Follow-up' : 'Zero Active Complaints'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#EAA636] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200/60'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200/60'
            }`}
          >
            Published on Website
          </button>
          <button
            onClick={() => setStatusFilter('escalated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'escalated'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200/60'
            }`}
          >
            <AlertTriangle size={12} /> Needs Attention
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-52">
            <CustomSelect
              value={ratingFilter}
              onChange={setRatingFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All Star Ratings' },
                { value: '5', label: '5 Stars Only ★★★★★', badge: '5★', badgeColor: 'gold' },
                { value: '4', label: '4 Stars ★★★★', badge: '4★', badgeColor: 'sky' },
                { value: 'below_4', label: '1–3 Stars (Detractors)', badge: '1-3★', badgeColor: 'amber' },
              ]}
            />
          </div>

          <div className="relative flex-1 md:w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-[#1878B8] animate-spin" /> Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] bg-white border border-slate-200/80 shadow-xs">
          <Star size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-[#0B1E33] font-bold text-base">No Reviews Found</h3>
          <p className="text-slate-500 text-xs mt-1">Send your first review request to a completed roofing job.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map(r => {
            const is5Star = r.rating === 5;
            const isEscalated = r.status === 'escalated';
            const isPublished = r.status === 'published';

            return (
              <div
                key={r.id}
                className={`p-5 rounded-[20px] border transition-all flex flex-col justify-between shadow-xs ${
                  isEscalated
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-white border-slate-200/80 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Top Bar: Stars + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= r.rating
                              ? 'text-[#EAA636] fill-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-[#0B1E33] ml-1.5">{r.rating}.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.source === 'yelp' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                          <YelpLogo className="w-2.5 h-2.5" /> Yelp
                        </span>
                      )}

                      {(r.source === 'google' || r.google_clicked) && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#1878B8] border border-sky-200 text-[10px] font-bold flex items-center gap-1">
                          <Globe size={10} /> Google
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isEscalated
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & City */}
                  <div className="flex items-center gap-3">
                    {r.author_photo ? (
                      <img
                        src={r.author_photo}
                        alt={r.customer_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-[#1878B8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {r.customer_name
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-black text-[#0B1E33]">{r.customer_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{r.customer_city || 'San Diego County, CA'}</span>
                        <span>•</span>
                        <span className="text-[#1878B8] font-semibold">{r.service_type || 'Roofing Service'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Quote */}
                  <div className="mt-3 p-3.5 rounded-[16px] bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                    "{r.feedback || 'Homeowner submitted star rating without additional comments.'}"
                  </div>

                  {/* Owner Reply if present */}
                  {r.owner_reply && (
                    <div className="mt-2.5 p-3 rounded-[14px] bg-sky-50 border border-sky-200 text-xs text-[#1878B8]">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[#1878B8] block mb-0.5">
                        Rise Up Response:
                      </span>
                      "{r.owner_reply}"
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStatusToggle(r.id, r.status)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isPublished
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isPublished ? 'Unpublish' : 'Publish to Website'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {r.review_token && (
                      <button
                        onClick={() => handleCopyLink(r.review_token!)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy Public Review Portal Link"
                      >
                        {copiedToken === r.review_token ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}

                    {r.yelp_review_url && (
                      <a
                        href={r.yelp_review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        title="View Review on Yelp"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}

                    {r.review_token && (
                      <Link
                        href={`/review/${r.review_token}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1878B8] border border-sky-200 transition-colors"
                        title="View Homeowner Review Page"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Send Review Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-[20px] p-6 sm:p-8 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-[#EAA636] border border-amber-200/80">
                  <Star size={20} />
                </div>
                <h2 className="text-lg font-black text-[#0B1E33]">Send Google Review Request</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {requestResult ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-base font-bold text-[#0B1E33]">Review Request Created!</h3>
                <p className="text-xs text-slate-500">
                  Share this personalized link with {requestResult.review.customer_name} via SMS or Email:
                </p>

                <div className="p-3 rounded-[16px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#1878B8] truncate">{requestResult.link}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(requestResult.link);
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#EAA636] text-white font-bold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-xs"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Richard Henderson"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Oceanside"
                      value={formData.customerCity}
                      onChange={e => setFormData({ ...formData, customerCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                    <CustomSelect
                      value={formData.serviceType}
                      onChange={(val) => setFormData({ ...formData, serviceType: val })}
                      size="sm"
                      options={[
                        'Roof Replacement',
                        'Tile Relayment',
                        'Leak Repair',
                        'Commercial TPO',
                      ]}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-[16px] bg-slate-50 border border-slate-200/80 space-y-1.5 text-slate-600">
                  <span className="font-bold text-slate-800 block">How Reputation Gating Works:</span>
                  <p>• If homeowner selects 5 Stars, they are prompted to submit directly to Google Business.</p>
                  <p>• If homeowner selects 1-3 Stars, feedback is sent privately to the owner to resolve.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-6 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={13} /> {submittingRequest ? 'Generating...' : 'Generate Review Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

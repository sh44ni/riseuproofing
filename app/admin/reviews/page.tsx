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

  useEffect(() => {
    fetchReviews();
    fetchGoogleStatus();

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
          <div className="p-2.5 rounded-[16px] bg-[#d4a447]/10 border border-[#d4a447]/20 text-[#d4a447]">
            <Star size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#f0f2f5]">
              Reputation &amp; Google Review Engine
            </h1>
            <p className="text-xs sm:text-sm text-[#8a95a5] mt-0.5">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-amber-300 hover:to-orange-400 text-[#0c1117] font-bold text-xs shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> Send Review Request
        </button>
      </div>

      {/* Sync Feedback Toast/Notice */}
      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{syncFeedback.message}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="p-1 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Google Business Profile Auto-Sync Panel */}
      <div className="p-4 rounded-[18px] admin-card border border-white/[0.08] bg-gradient-to-r from-[#111923] to-[#14202e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#f0f2f5]">
                {googleSync.businessName || 'Google Business Profile Sync'}
              </h2>
              {googleSync.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Active (Weekly Mondays 3AM UTC)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8a95a5] mt-0.5">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={syncingGoogle ? 'animate-spin' : ''} />
                <span>{syncingGoogle ? 'Syncing...' : 'Sync Reviews Now'}</span>
              </button>
              <a
                href="/api/admin/google-auth"
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.06] text-xs font-semibold transition-all"
                title="Reconnect Google Account"
              >
                Reconnect
              </a>
            </>
          ) : (
            <a
              href="/api/admin/google-auth"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Globe size={14} />
              <span>Connect Google Account</span>
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Average Rating</span>
            <Star size={15} className="text-[#d4a447] fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5] flex items-center gap-1.5">
            {summary.avgRating} <span className="text-sm font-semibold text-[#8a95a5]">/ 5.0</span>
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">Excellent Reputation</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>5-Star Promoters</span>
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.fiveStarPct}%</div>
          <div className="text-xs text-[#8a95a5] font-medium mt-1">{summary.totalReviews} Total Verified</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Google Profile Boost</span>
            <Globe size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.googleClickedCount}</div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">Confirmed Google Clicks</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Private Escalations</span>
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.escalatedCount}</div>
          <div className="text-xs text-rose-400 font-semibold mt-1">
            {summary.escalatedCount > 0 ? 'Requires Owner Follow-up' : 'Zero Active Complaints'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-[16px] admin-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#d4a447] text-[#0c1117] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-emerald-500 text-[#f0f2f5] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
            }`}
          >
            Published on Website
          </button>
          <button
            onClick={() => setStatusFilter('escalated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'escalated'
                ? 'bg-rose-500 text-[#f0f2f5] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
            }`}
          >
            <AlertTriangle size={12} /> Needs Attention
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#d4a447]"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only ★★★★★</option>
            <option value="4">4 Stars ★★★★</option>
            <option value="below_4">1–3 Stars (Detractors)</option>
          </select>

          <div className="relative flex-1 md:w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a95a5]" />
            <input
              type="text"
              placeholder="Search customer, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] placeholder-slate-500 text-xs focus:outline-none focus:border-[#d4a447]"
            />
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="p-12 text-center text-[#8a95a5] text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-[#d4a447] animate-spin" /> Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] admin-card">
          <Star size={36} className="text-[#4a5568] mx-auto mb-3" />
          <h3 className="text-[#f0f2f5] font-bold text-base">No Reviews Found</h3>
          <p className="text-[#8a95a5] text-xs mt-1">Send your first review request to a completed roofing job.</p>
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
                className={`p-5 rounded-[20px] border transition-all flex flex-col justify-between ${
                  isEscalated
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-[#141b24] border-white/[0.06] hover:border-[#d4a447]/25'
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
                              ? 'text-[#d4a447] fill-amber-400'
                              : 'text-[#4a5568]'
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-[#f0f2f5] ml-1.5">{r.rating}.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.google_clicked && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Globe size={10} /> Google
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPublished
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isEscalated
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-[#d4a447]/20 text-[#d4a447] border border-[#d4a447]/30'
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
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {r.customer_name
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-black text-[#f0f2f5]">{r.customer_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-[#8a95a5] mt-0.5">
                        <span>{r.customer_city || 'San Diego County, CA'}</span>
                        <span>•</span>
                        <span className="text-[#d4a447] font-semibold">{r.service_type || 'Roofing Service'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Quote */}
                  <div className="mt-3 p-3.5 rounded-[16px] bg-[#0a0f14] border border-white/[0.04] text-xs text-[#c8cfd8] leading-relaxed italic">
                    "{r.feedback || 'Homeowner submitted star rating without additional comments.'}"
                  </div>

                  {/* Owner Reply if present */}
                  {r.owner_reply && (
                    <div className="mt-2.5 p-3 rounded-[14px] bg-blue-950/20 border border-blue-500/20 text-xs text-blue-200">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-blue-400 block mb-0.5">
                        Rise Up Response:
                      </span>
                      "{r.owner_reply}"
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStatusToggle(r.id, r.status)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isPublished
                        ? 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5]'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {isPublished ? 'Unpublish' : 'Publish to Website'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {r.review_token && (
                      <button
                        onClick={() => handleCopyLink(r.review_token!)}
                        className="p-2 rounded-xl bg-[#1a2332] hover:bg-[#1e2736] text-[#a0aab8] text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy Public Review Portal Link"
                      >
                        {copiedToken === r.review_token ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}

                    {r.review_token && (
                      <Link
                        href={`/review/${r.review_token}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-[#1a2332] hover:bg-[#1e2736] text-cyan-300 transition-colors"
                        title="View Homeowner Review Page"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm backdrop-blur-sm backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#141b24] border border-white/[0.10] rounded-[20px] p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)] z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-[#d4a447]">
                  <Star size={20} />
                </div>
                <h2 className="text-lg font-black text-[#f0f2f5]">Send Google Review Request</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center text-[#8a95a5] hover:text-[#f0f2f5] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {requestResult ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-base font-bold text-[#f0f2f5]">Review Request Created!</h3>
                <p className="text-xs text-[#8a95a5]">
                  Share this personalized link with {requestResult.review.customer_name} via SMS or Email:
                </p>

                <div className="p-3 rounded-[16px] bg-[#0c1117] border border-[#d4a447]/25 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#d4a447] truncate">{requestResult.link}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(requestResult.link);
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#d4a447] text-[#0c1117] font-bold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#1a2332] hover:bg-[#1e2736] text-[#f0f2f5] font-semibold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#a0aab8] mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Richard Henderson"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] placeholder-slate-500 focus:outline-none focus:border-[#d4a447]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#a0aab8] mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Oceanside"
                      value={formData.customerCity}
                      onChange={e => setFormData({ ...formData, customerCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] focus:outline-none focus:border-[#d4a447]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#a0aab8] mb-1">Service Type</label>
                    <select
                      value={formData.serviceType}
                      onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2332] border border-white/[0.06] text-[#f0f2f5] focus:outline-none focus:border-[#d4a447]"
                    >
                      <option value="Roof Replacement">Roof Replacement</option>
                      <option value="Tile Relayment">Tile Relayment</option>
                      <option value="Leak Repair">Leak Repair</option>
                      <option value="Commercial TPO">Commercial TPO</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-[16px] bg-[#0a0f14] border border-white/[0.04] space-y-1.5 text-[#8a95a5]">
                  <span className="font-bold text-[#a0aab8] block">How Reputation Gating Works:</span>
                  <p>• If homeowner selects 5 Stars, they are prompted to submit directly to Google Business.</p>
                  <p>• If homeowner selects 1-3 Stars, feedback is sent privately to the owner to resolve.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#1a2332] hover:bg-[#1e2736] text-[#a0aab8] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-amber-300 hover:to-orange-400 text-[#0c1117] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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

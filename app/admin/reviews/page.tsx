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

  useEffect(() => {
    fetchReviews();
  }, []);

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
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Star size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Reputation &amp; Google Review Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> Send Review Request
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Average Rating</span>
            <Star size={15} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-center gap-1.5">
            {summary.avgRating} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">Excellent Reputation</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>5-Star Promoters</span>
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.fiveStarPct}%</div>
          <div className="text-xs text-slate-400 font-medium mt-1">{summary.totalReviews} Total Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Google Profile Boost</span>
            <Globe size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.googleClickedCount}</div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">Confirmed Google Clicks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Private Escalations</span>
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.escalatedCount}</div>
          <div className="text-xs text-rose-400 font-semibold mt-1">
            {summary.escalatedCount > 0 ? 'Requires Owner Follow-up' : 'Zero Active Complaints'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Published on Website
          </button>
          <button
            onClick={() => setStatusFilter('escalated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'escalated'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <AlertTriangle size={12} /> Needs Attention
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only ★★★★★</option>
            <option value="4">4 Stars ★★★★</option>
            <option value="below_4">1–3 Stars (Detractors)</option>
          </select>

          <div className="relative flex-1 md:w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-amber-400 animate-spin" /> Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-white/10">
          <Star size={36} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-base">No Reviews Found</h3>
          <p className="text-slate-400 text-xs mt-1">Send your first review request to a completed roofing job.</p>
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
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isEscalated
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-900 border-white/10 hover:border-amber-400/30'
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
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-white ml-1.5">{r.rating}.0</span>
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
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & City */}
                  <div>
                    <h3 className="text-base font-black text-white">{r.customer_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{r.customer_city || 'San Diego County, CA'}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{r.service_type || 'Roofing Service'}</span>
                    </div>
                  </div>

                  {/* Feedback Quote */}
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-200 leading-relaxed italic">
                    "{r.feedback || 'Homeowner submitted star rating without additional comments.'}"
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStatusToggle(r.id, r.status)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isPublished
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {isPublished ? 'Unpublish' : 'Publish to Website'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {r.review_token && (
                      <button
                        onClick={() => handleCopyLink(r.review_token!)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Star size={20} />
                </div>
                <h2 className="text-lg font-black text-white">Send Google Review Request</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {requestResult ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-base font-bold text-white">Review Request Created!</h3>
                <p className="text-xs text-slate-400">
                  Share this personalized link with {requestResult.review.customer_name} via SMS or Email:
                </p>

                <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/30 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-amber-400 truncate">{requestResult.link}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(requestResult.link);
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Richard Henderson"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Oceanside"
                      value={formData.customerCity}
                      onChange={e => setFormData({ ...formData, customerCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Service Type</label>
                    <select
                      value={formData.serviceType}
                      onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Roof Replacement">Roof Replacement</option>
                      <option value="Tile Relayment">Tile Relayment</option>
                      <option value="Leak Repair">Leak Repair</option>
                      <option value="Commercial TPO">Commercial TPO</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5 text-slate-400">
                  <span className="font-bold text-slate-300 block">How Reputation Gating Works:</span>
                  <p>• If homeowner selects 5 Stars, they are prompted to submit directly to Google Business.</p>
                  <p>• If homeowner selects 1-3 Stars, feedback is sent privately to the owner to resolve.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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

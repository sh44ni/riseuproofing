

import Link from 'next/link';
import { Phone, ClipboardCheck } from 'lucide-react';
import { PHONE_HREF } from '@/lib/utils';

export function StickyCTA() {
  return (
    <div className="fixed bottom-3 inset-x-3 z-40 md:hidden pointer-events-none">
      <div className="glass-nav-surface rounded-2xl p-2 flex items-center gap-2 shadow-2xl border border-white/25 dark:border-white/25 [data-theme=light]:border-slate-200/80 pointer-events-auto backdrop-blur-2xl">
        <a
          href={PHONE_HREF}
          className="flex-1 inline-flex items-center justify-center gap-2
            bg-slate-100 dark:bg-white/10
            hover:bg-slate-200 dark:hover:bg-white/20
            border border-slate-200 dark:border-white/20
            text-[#0B1E33] dark:text-white
            font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all"
        >
          <Phone className="w-4 h-4 text-brand-blue" />
          <span>Call Now</span>
        </a>
        <Link
          href="/contact"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-brand-blue/30 transition-all"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Free Estimate</span>
        </Link>
      </div>
    </div>
  );
}

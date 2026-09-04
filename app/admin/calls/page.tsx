'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/analytics?tab=calls');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 text-xs">
      Redirecting to Inbound Call Tracker in Web &amp; Marketing Hub...
    </div>
  );
}

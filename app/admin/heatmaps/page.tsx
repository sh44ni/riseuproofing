'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HeatmapsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/analytics?tab=heatmaps');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-500 text-xs">
      Redirecting to Click Heatmaps in Web &amp; Marketing Hub...
    </div>
  );
}

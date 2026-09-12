'use client';

import React from 'react';

interface CrmSparklineProps {
  id: string | number;
  points?: number[];
  color?: string;
}

export default function CrmSparkline({ id, points, color = '#00b3ef' }: CrmSparklineProps) {
  const toPolyline = (pts: number[]): string => {
    const max = Math.max(...pts, 1);
    const w = 100 / (pts.length - 1 || 1);
    return pts
      .map((v, i) => `${(i * w).toFixed(1)},${(26 - (v / max) * 24).toFixed(1)}`)
      .join(' ');
  };

  const hasPts = points && points.length >= 2;
  const polyline = hasPts ? toPolyline(points!) : null;
  const area = hasPts ? `${polyline} 100,27 0,27` : null;

  return (
    <svg className="crm-sparkline" viewBox="0 0 100 27" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`crm-sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".5" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {hasPts ? (
        <>
          <polygon points={area!} fill={`url(#crm-sg-${id})`} />
          <polyline points={polyline!} fill="none" stroke={color} strokeWidth="2.3" strokeLinejoin="round" />
        </>
      ) : (
        <line x1="0" y1="22" x2="100" y2="22" stroke={color} strokeWidth="2" strokeDasharray="4 3" opacity=".5" />
      )}
    </svg>
  );
}

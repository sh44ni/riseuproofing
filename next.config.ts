import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.base44.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 's3-media0.fl.yelpcdn.com' },
      { protocol: 'https', hostname: 's3-media1.fl.yelpcdn.com' },
      { protocol: 'https', hostname: 's3-media2.fl.yelpcdn.com' },
      { protocol: 'https', hostname: 'cdn.weatherapi.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/services/repairs',
        destination: '/services/roof-repair',
        permanent: true,
      },
      {
        source: '/services/commercial',
        destination: '/services/commercial-roofing',
        permanent: true,
      },
      {
        source: '/services/solar',
        destination: '/services/solar-roofing',
        permanent: true,
      },
      {
        source: '/services/residential-roofing',
        destination: '/services/residential',
        permanent: true,
      },
      {
        source: '/roof-inspection',
        destination: '/services/roof-inspection',
        permanent: true,
      },
      {
        source: '/commercial-roofing',
        destination: '/services/commercial-roofing',
        permanent: true,
      },
      {
        source: '/commercial-roof-inspection',
        destination: '/services/commercial-roof-inspection',
        permanent: true,
      },
      {
        source: '/roof-repair',
        destination: '/services/roof-repair',
        permanent: true,
      },
      {
        source: '/metal-roofs',
        destination: '/services/metal-roofing',
        permanent: true,
      },
      {
        source: '/tile-roofing',
        destination: '/services/tile-roofing',
        permanent: true,
      },
      {
        source: '/solar-installation',
        destination: '/services/solar-roofing',
        permanent: true,
      },
      {
        source: '/modified-bitumen',
        destination: '/services/modified-bitumen',
        permanent: true,
      },
      {
        source: '/industrial-roofing',
        destination: '/services/industrial-roofing',
        permanent: true,
      },
      {
        source: '/roof-coating',
        destination: '/services/roof-coating',
        permanent: true,
      },
      {
        source: '/deck-builder',
        destination: '/services/deck-builder',
        permanent: true,
      },
    ];
  },
};


export default nextConfig;

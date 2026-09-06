import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/inspection/',
        '/proposal/',
        '/warranty/',
        '/review/',
      ],
    },
    sitemap: 'https://riseuprac.com/sitemap.xml',
  };
}

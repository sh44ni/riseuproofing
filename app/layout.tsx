import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { buildLocalBusinessJsonLd } from '@/lib/seo/metadata';
import { COMPANY_NAME } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: `${COMPANY_NAME} | San Diego County Roofing Experts`,
    template: `%s | ${COMPANY_NAME}`,
  },
  description: 'San Diego County\'s trusted roofing and construction company. Residential, commercial, solar roofing, repairs, and general construction. Licensed, bonded & insured. Free estimates.',
  metadataBase: new URL('https://riseuproofing.com'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="antialiased">
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-82QZ88P6TK"
        />
        <Script id="google-tag-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            if (!window.location.pathname.startsWith('/admin')) {
              gtag('config', 'G-82QZ88P6TK');
            }
          `}
        </Script>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {/* Rich analytics tracking — pageviews, clicks, scroll, forms, CTAs, session duration, UTMs */}
        <Script src="/tracker.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}

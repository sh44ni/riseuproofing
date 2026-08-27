import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { buildLocalBusinessJsonLd } from '@/lib/seo/metadata';
import { COMPANY_NAME } from '@/lib/utils';
import { ThemeProvider } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: `${COMPANY_NAME} | San Diego County Roofing Experts`,
    template: `%s | ${COMPANY_NAME} | San Diego County`,
  },
  description: 'San Diego County\'s trusted roofing and construction company. Residential, commercial, solar roofing, repairs, and general construction. Licensed, bonded & insured. Free estimates.',
  metadataBase: new URL('https://riseuproofing.com'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

// Inline script to set theme before first paint — prevents flash of wrong theme
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = t;
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}


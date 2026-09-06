import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  dark?: boolean;
  className?: string;
}

export function Breadcrumbs({ items, dark = true, className }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://riseuproofing.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Desktop Breadcrumbs — 100% untouched */}
      <nav aria-label="Breadcrumb" className={cn('mb-6 hidden md:block', className)}>
        <ol className="inline-flex items-center gap-1.5 glass-chip px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border-white/20">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <Icon name="chevron-right" className="w-3.5 h-3.5 text-white/50" />}
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="text-white/70 hover:text-brand-blue transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white font-bold">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Mobile Breadcrumb App Pill — Touch-friendly back navigation */}
      <nav aria-label="Breadcrumb" className={cn('mb-4 md:hidden', className)}>
        {items.length > 1 && (
          <div className="inline-flex items-center gap-2">
            {items[items.length - 2]?.href ? (
              <Link
                href={items[items.length - 2].href!}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs font-bold text-white transition-all active:scale-95 shadow-2xs"
              >
                <span className="text-brand-blue">←</span>
                <span>Back to {items[items.length - 2].label}</span>
              </Link>
            ) : null}
          </div>
        )}
      </nav>
    </>
  );
}

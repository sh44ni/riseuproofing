import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { cn, BASE_URL } from '@/lib/utils';

export interface BreadcrumbItem {
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
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Desktop Breadcrumbs */}
      <nav aria-label="Breadcrumb" className={cn('mb-6 hidden md:block', className)}>
        <ol
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all',
            dark
              ? 'bg-slate-900/60 border border-white/15 text-white/80 shadow-xs'
              : 'bg-slate-100/90 border border-slate-200/90 text-slate-700 shadow-xs'
          )}
        >
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <Icon
                  name="chevron-right"
                  className={cn('w-3.5 h-3.5', dark ? 'text-white/40' : 'text-slate-400')}
                />
              )}
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className={cn(
                    'transition-colors',
                    dark ? 'text-white/75 hover:text-brand-blue' : 'text-slate-600 hover:text-brand-blue'
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn('font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
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
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-bold transition-all active:scale-95 shadow-2xs',
                  dark
                    ? 'bg-slate-900/60 hover:bg-slate-900/80 border-white/15 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                )}
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

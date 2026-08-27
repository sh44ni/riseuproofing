import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
      <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
        <ol className="inline-flex items-center gap-1.5 glass-chip px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border-white/20">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
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
    </>
  );
}

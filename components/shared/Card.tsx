import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  variant?: 'default' | 'glass' | 'glass-hero';
  as?: 'div' | 'article' | 'a';
  href?: string;
}

export function Card({
  children,
  className,
  interactive = false,
  variant = 'glass',
  as: Tag = 'div',
  href,
}: CardProps) {
  const props = Tag === 'a' ? { href } : {};

  return (
    <Tag
      className={cn(
        'rounded-2xl overflow-hidden p-6 md:p-8 transition-all duration-300',
        variant === 'glass' && [
          'glass-card-interactive text-[var(--text-primary)]',
          interactive && 'hover:-translate-y-1.5'
        ],
        variant === 'glass-hero' && 'glass-card-hero text-[var(--text-primary)]',
        variant === 'default' && [
          'bg-white rounded-2xl shadow-sm text-brand-navy border border-slate-100',
          interactive && 'hover:shadow-md hover:-translate-y-1'
        ],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

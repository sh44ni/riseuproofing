import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  label,
  title,
  subtitle,
  centered = true,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-10 lg:mb-14', centered && 'text-center', className)}>
      {label && (
        <div className={cn('mb-4 inline-flex', centered && 'justify-center')}>
          <span className="section-label-pill px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-brand-blue bg-blue-50/80 border border-blue-100/80 shadow-[0_1px_3px_rgba(47,159,227,0.10)]">
            {label}
          </span>
        </div>
      )}
      <h2
        className={cn(
          'text-2xl sm:text-3xl lg:text-[2.375rem] font-extrabold tracking-tight mb-4 text-[var(--text-primary)] leading-[1.15]'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-sm sm:text-[15px] lg:text-base leading-relaxed text-[var(--text-muted)] max-w-2xl',
            centered && 'mx-auto'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

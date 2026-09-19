import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all',
  {
    variants: {
      variant: {
        outline: 'border border-white/20 text-white/80 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full',
        solid: 'bg-brand-blue text-white px-3 py-1 rounded-full shadow-md shadow-brand-blue/20',
        glass: 'glass-chip text-white px-3 py-1 rounded-full border-white/20',
        glow: 'bg-brand-blue/20 border border-brand-blue/40 text-blue-200 px-3 py-1 rounded-full shadow-sm backdrop-blur-md',
      },
    },
    defaultVariants: { variant: 'glass' },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}

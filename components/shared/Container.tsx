import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
  id?: string;
}

export function Container({ children, className, as: Tag = 'div', id }: ContainerProps) {
  return (
    <Tag id={id} className={cn('w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12', className)}>
      {children}
    </Tag>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
  alternate?: boolean;
}

export function Section({
  children,
  className,
  id,
  alternate = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'section-padding relative overflow-hidden text-[var(--text-primary)] transition-colors duration-300',
        alternate ? 'theme-section-alt' : 'glass-section-dark',
        className
      )}
    >
      {/* Living Ambient Drift Orbs */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-brand-blue/10 dark:bg-brand-blue/5 blur-3xl pointer-events-none animate-ambient-drift-1" />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-amber-400/8 dark:bg-brand-blue/5 blur-3xl pointer-events-none animate-ambient-drift-2" />
      
      {/* Delicate Architectural Micro-Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#2F9FE3_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] dark:opacity-[0.02] pointer-events-none" />

      <Container className="relative z-10">{children}</Container>
    </section>
  );
}

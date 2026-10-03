import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'horizontal' | 'icon';
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = 'horizontal',
  className,
  priority = true,
}: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <Image
        src="/favicon.svg"
        alt="Rise Up Roofing & Construction"
        width={42}
        height={42}
        className={cn('h-10 w-auto object-contain', className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/logo.svg"
      alt="Rise Up Roofing & Construction"
      width={180}
      height={55}
      className={cn('h-10 w-auto object-contain', className)}
      priority={priority}
    />
  );
}

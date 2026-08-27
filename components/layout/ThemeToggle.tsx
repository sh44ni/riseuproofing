'use client';

import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        border-[var(--border-default)] bg-[var(--surface-raised)] hover:border-brand-blue hover:bg-brand-blue/15 shadow-xs
        focus-visible:outline-2 focus-visible:outline-brand-blue focus-visible:outline-offset-2"
    >
      {/* Sun icon — visible in dark mode (click to go light) */}
      <Sun
        className={`absolute w-4 h-4 text-brand-gold transition-all duration-300 ${
          isLight
            ? 'opacity-0 rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      {/* Moon icon — visible in light mode (click to go dark) */}
      <Moon
        className={`absolute w-4 h-4 text-brand-navy dark:text-brand-blue transition-all duration-300 ${
          isLight
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
        }`}
      />
    </button>
  );
}

'use client';

import type { ReactNode } from 'react';

export function useTheme() {
  return { theme: 'light' as const, toggle: () => {} };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

'use client';

import { Button } from '@/components/shared/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <p className="typo-display text-brand-error mb-4">Oops</p>
        <h1 className="typo-h1 text-brand-navy mb-3">Something went wrong</h1>
        <p className="typo-body text-brand-muted mb-8">
          We apologize for the inconvenience. Please try again.
        </p>
        <Button size="lg" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

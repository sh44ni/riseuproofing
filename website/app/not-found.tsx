import Link from 'next/link';
import { Button } from '@/components/shared/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <p className="typo-display text-brand-blue mb-4">404</p>
        <h1 className="typo-h1 text-brand-navy mb-3">Page Not Found</h1>
        <p className="typo-body text-brand-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/"><Button size="lg">Back to Home</Button></Link>
      </div>
    </div>
  );
}

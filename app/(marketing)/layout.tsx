import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { StormPromoModal } from '@/components/marketing/StormPromoModal';
import { getReviewStats } from '@/lib/reviews-server';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getReviewStats();

  return (
    <>
      <Header stats={stats} />
      <main className="relative min-h-screen pb-20 md:pb-0">{children}</main>
      <Footer stats={stats} />
      <StickyCTA />
      <StormPromoModal />
    </>
  );
}

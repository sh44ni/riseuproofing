import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { StormPromoModal } from '@/components/marketing/StormPromoModal';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="relative min-h-screen">{children}</main>
      <Footer />
      <StickyCTA />
      <StormPromoModal />
    </>
  );
}

import { ReviewCardSkeleton, Skeleton } from '@/components/shared/Skeleton';
import { Container } from '@/components/shared/Container';

export default function ReviewsLoading() {
  return (
    <div className="min-h-screen bg-[#07131F] text-white pt-28 pb-20">
      <Container>
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <Skeleton className="w-28 h-5 mx-auto rounded-lg" />
          <Skeleton className="w-80 h-10 mx-auto rounded-xl" />
          <Skeleton className="w-96 h-4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </div>
      </Container>
    </div>
  );
}

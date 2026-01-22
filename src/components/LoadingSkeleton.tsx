import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'content' | 'grid' | 'search';
  count?: number;
}

/**
 * Reusable loading skeleton component for various content types
 *
 * Variants:
 * - card: Single content card skeleton (for ContentPage)
 * - content: Content viewer skeleton with metadata
 * - grid: Grid of card skeletons (for BrowsePage)
 * - search: Search results skeleton (for SearchPage)
 */
export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  if (variant === 'search') {
    return (
      <div className="space-y-4" role="status" aria-label="Loading search results">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="border rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="status"
        aria-label="Loading content"
      >
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'content') {
    return (
      <div className="space-y-6" role="status" aria-label="Loading content details">
        {/* Header Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardContent>
        </Card>

        {/* Metadata Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>

        {/* Summary Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: single card variant
  return (
    <Card role="status" aria-label="Loading">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

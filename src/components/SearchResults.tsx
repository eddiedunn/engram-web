import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ContentCard } from '@/components/ContentCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import type { SearchResult } from '@/api/types';

export interface SearchResultsProps {
  results: SearchResult[];
  searchTerm: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * SearchResults component displays search results with virtualization for performance
 *
 * Features:
 * - Virtualized list using @tanstack/react-virtual for handling large result sets
 * - Loading skeleton during search
 * - Empty state when no results
 * - Error state with retry functionality
 * - Individual result cards with highlighting
 */
export function SearchResults({
  results,
  searchTerm,
  isLoading = false,
  error = null,
  onRetry,
}: SearchResultsProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Set up virtualizer for efficient rendering of large lists
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated height of each card in pixels
    overscan: 5, // Number of items to render outside visible area
  });

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton variant="search" count={5} />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Error loading search results"
        message={error.message || 'An unexpected error occurred while searching.'}
        onRetry={onRetry}
      />
    );
  }

  // Show empty state
  if (results.length === 0) {
    return <EmptyState variant="search" />;
  }

  // Render virtualized list
  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-muted-foreground px-1">
        Found <span className="font-semibold">{results.length}</span> result
        {results.length !== 1 ? 's' : ''}
      </div>

      {/* Virtualized list container */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: '600px',
          width: '100%',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const result = results[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="pb-4 px-1">
                  <ContentCard result={result} searchTerm={searchTerm} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

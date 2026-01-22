import { Search, FileX, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  variant?: 'search' | 'content' | 'filter';
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

/**
 * Reusable empty state component for zero results scenarios
 *
 * Variants:
 * - search: No search results found
 * - content: No content available
 * - filter: No results with current filters
 */
export function EmptyState({
  variant = 'search',
  title,
  description,
  onAction,
  actionLabel,
  icon,
}: EmptyStateProps) {
  // Default content based on variant
  const defaults: Record<string, { icon: React.ReactNode; title: string; description: string; actionLabel?: string }> = {
    search: {
      icon: <Search className="h-16 w-16 text-muted-foreground" aria-hidden="true" />,
      title: 'No results found',
      description: 'Try adjusting your search query or filters to find what you\'re looking for.',
    },
    content: {
      icon: <FileX className="h-16 w-16 text-muted-foreground" aria-hidden="true" />,
      title: 'No content available',
      description: 'There is no content to display at the moment.',
    },
    filter: {
      icon: <Filter className="h-16 w-16 text-muted-foreground" aria-hidden="true" />,
      title: 'No content found',
      description: 'No content matches your current filters. Try adjusting your filters.',
      actionLabel: 'Clear Filters',
    },
  };

  const defaultContent = defaults[variant];
  const displayIcon = icon || defaultContent.icon;
  const displayTitle = title || defaultContent.title;
  const displayDescription = description || defaultContent.description;
  const displayActionLabel = actionLabel || defaultContent.actionLabel || '';

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label={displayTitle}
    >
      {displayIcon}
      <h3 className="text-xl font-semibold mb-2 mt-4">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-md mb-4">{displayDescription}</p>
      {onAction && displayActionLabel && (
        <Button variant="outline" onClick={onAction} aria-label={displayActionLabel}>
          {displayActionLabel}
        </Button>
      )}
    </div>
  );
}

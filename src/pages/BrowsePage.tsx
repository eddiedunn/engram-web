import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContentList } from '@/hooks/useContentList';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentType } from '@/api/types';
import type { Content } from '@/api/types';

/**
 * Sort options for content list (applied client-side to the current page)
 */
type SortOption = 'newest' | 'oldest' | 'title-az' | 'most-chunks';

/**
 * Get color variant for content type badge
 */
function getContentTypeColor(contentType: ContentType): string {
  const colors: Record<ContentType, string> = {
    YOUTUBE: 'bg-red-500 text-white hover:bg-red-600',
    ARTICLE: 'bg-blue-500 text-white hover:bg-blue-600',
    PODCAST: 'bg-purple-500 text-white hover:bg-purple-600',
    DOCUMENT: 'bg-green-500 text-white hover:bg-green-600',
    NOTE: 'bg-amber-500 text-white hover:bg-amber-600',
    OTHER: 'bg-gray-500 text-white hover:bg-gray-600',
  };
  return colors[contentType];
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sort content based on selected option (operates on current page items only)
 */
function sortContent(content: Content[], sortOption: SortOption): Content[] {
  const sorted = [...content];

  switch (sortOption) {
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case 'title-az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'most-chunks':
      return sorted.sort((a, b) => b.chunk_count - a.chunk_count);
    default:
      return sorted;
  }
}

/**
 * BrowsePage component - Paginated content browser
 *
 * Route: /browse
 *
 * Features:
 * - Server-side pagination (50 items per page, uses limit/offset)
 * - Total count from API response envelope
 * - Filter controls: content type dropdown
 * - Sort controls: newest/oldest/title/chunks (client-side, within current page)
 * - URL sync for filters and page
 * - Pagination controls at bottom
 * - Each item shows: title, type, created date, chunk count, tags
 * - Click item to navigate to ContentPage
 */
export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse URL parameters
  const pageParam = searchParams.get('page');
  const typeParam = searchParams.get('type') as ContentType | null;
  const sortParam = searchParams.get('sort') as SortOption | null;
  const tagsParam = searchParams.get('tags');

  // State
  const [currentPage, setCurrentPage] = useState(
    pageParam ? parseInt(pageParam, 10) : 1
  );
  const [contentType, setContentType] = useState<ContentType | undefined>(
    typeParam || undefined
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    sortParam || 'newest'
  );
  const [selectedTags] = useState<string[]>(
    tagsParam ? tagsParam.split(',') : []
  );

  // Pagination constants
  const ITEMS_PER_PAGE = 50;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch current page from server
  const { data: response, isLoading, error } = useContentList({
    content_type: contentType,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  // Derive totals from the response envelope
  const total = response?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Sort current page items client-side
  const pageItems = useMemo(() => {
    if (!response?.items) return [];
    return sortContent(response.items, sortOption);
  }, [response?.items, sortOption]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();

    if (currentPage > 1) {
      newParams.set('page', currentPage.toString());
    }

    if (contentType) {
      newParams.set('type', contentType);
    }

    if (sortOption !== 'newest') {
      newParams.set('sort', sortOption);
    }

    if (selectedTags.length > 0) {
      newParams.set('tags', selectedTags.join(','));
    }

    setSearchParams(newParams);
  }, [currentPage, contentType, sortOption, selectedTags, setSearchParams]);

  // Set page title
  useEffect(() => {
    document.title = 'Browse Content - Engram Knowledge Base';
  }, []);

  // Handle filter changes — reset to page 1
  const handleContentTypeChange = (value: string) => {
    if (value === 'all') {
      setContentType(undefined);
    } else {
      setContentType(value as ContentType);
    }
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
    setCurrentPage(1);
  };

  // Handle content click
  const handleContentClick = (contentId: string) => {
    navigate(`/content/${contentId}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse Content</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : `${total} ${total === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          {/* Filters and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Content Type Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Content Type</label>
              <Select value={contentType || 'all'} onValueChange={handleContentTypeChange}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="ARTICLE">Article</SelectItem>
                  <SelectItem value="PODCAST">Podcast</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Control */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title-az">Title A-Z</SelectItem>
                  <SelectItem value="most-chunks">Most Chunks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Loading State */}
        {isLoading && <LoadingSkeleton variant="grid" count={9} />}

        {/* Error State */}
        {error && (
          <ErrorMessage
            error={error}
            title="Failed to load content"
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && pageItems.length === 0 && (
          <EmptyState
            variant={(contentType || selectedTags.length > 0) ? 'filter' : 'content'}
            onAction={
              (contentType || selectedTags.length > 0)
                ? () => {
                    setContentType(undefined);
                    setCurrentPage(1);
                  }
                : undefined
            }
          />
        )}

        {/* Content Grid */}
        {!isLoading && !error && pageItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageItems.map((content) => (
                <Card
                  key={content.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow min-h-[44px]"
                  onClick={() => handleContentClick(content.content_id)}
                >
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold line-clamp-2 flex-1">
                        {content.title}
                      </h3>
                      <Badge className={`${getContentTypeColor(content.content_type)} shrink-0`}>
                        {content.content_type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="font-medium">{formatDate(content.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Chunks:</span>
                        <span className="font-medium">{content.chunk_count}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {content.tags && content.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {content.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {content.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{content.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-8">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                {/* Page Numbers */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-3 py-2">
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

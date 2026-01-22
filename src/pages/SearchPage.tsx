import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import type { SearchParams as SearchBarParams } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import type { ContentType } from '@/api/types';

/**
 * SearchPage component - Main search interface for Engram Knowledge Base
 *
 * Features:
 * - SearchBar component at top (fixed header)
 * - SearchResults component below (scrollable)
 * - URL sync: Read/write search params from URL query string
 * - Browser back/forward support
 * - Loading, error, and empty states
 * - Responsive mobile-friendly design
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSearch, setCurrentSearch] = useState<SearchBarParams | null>(null);

  // Parse URL params on mount
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      const mode = searchParams.get('mode') as 'hybrid' | 'semantic' | 'fts' | null;
      const contentType = searchParams.get('type') as ContentType | null;
      const topK = searchParams.get('top_k');
      const tagsParam = searchParams.get('tags');

      const searchParamsFromUrl: SearchBarParams = {
        query,
        mode: mode || 'hybrid',
        top_k: topK ? parseInt(topK, 10) : 10,
        content_type: contentType || undefined,
        tags: tagsParam ? tagsParam.split(',') : undefined,
      };

      setCurrentSearch(searchParamsFromUrl);
    }
  }, [searchParams]);

  // Use the search hook with current search parameters
  const { data: results, isLoading, error, refetch } = useSearch({
    query: currentSearch?.query || '',
    top_k: currentSearch?.top_k,
    content_type: currentSearch?.content_type,
    tags: currentSearch?.tags,
  });

  // Handle search submission from SearchBar
  const handleSearch = (params: SearchBarParams) => {
    // Update URL with new search params
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('q', params.query);
    newSearchParams.set('mode', params.mode);
    newSearchParams.set('top_k', params.top_k.toString());

    if (params.content_type) {
      newSearchParams.set('type', params.content_type);
    }

    if (params.tags && params.tags.length > 0) {
      newSearchParams.set('tags', params.tags.join(','));
    }

    setSearchParams(newSearchParams);
    setCurrentSearch(params);
  };

  // Handle retry on error
  const handleRetry = () => {
    refetch();
  };

  // Set page title
  useEffect(() => {
    document.title = 'Engram Knowledge Base';
  }, []);

  return (
    <>
      {/* Fixed Header with SearchBar */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Engram Knowledge Base</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Search your personal knowledge base
            </p>
          </div>

          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            defaultMode={currentSearch?.mode || 'hybrid'}
          />
        </div>
      </header>

      {/* Scrollable Results Area */}
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {currentSearch ? (
          <SearchResults
            results={results || []}
            searchTerm={currentSearch.query}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
            <div className="max-w-md">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">Welcome to Engram</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Start searching your knowledge base by entering a query above.
              </p>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
                <p><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> to focus search</p>
                <p>Choose between Hybrid, Semantic, or Full-Text search modes</p>
                <p>Filter by content type and tags for more precise results</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

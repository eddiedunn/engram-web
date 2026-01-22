import { useQuery } from '@tanstack/react-query';
import { engramClient } from '../api/client';
import type { SearchParams } from '../api/client';
import type { SearchResult } from '../api/types';

/**
 * React Query hook for searching content
 *
 * @param params - Search parameters including query, filters, and pagination
 * @returns Query result containing search results
 *
 * Features:
 * - Enabled only when query.length > 0
 * - Stale time: 5 minutes (300000ms)
 * - Automatic caching and deduplication
 */
export function useSearch(params: SearchParams) {
  return useQuery<SearchResult[], Error>({
    queryKey: ['search', params],
    queryFn: () => engramClient.search(params),
    enabled: params.query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

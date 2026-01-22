import { useQuery } from '@tanstack/react-query';
import { engramClient } from '../api/client';
import type { ListParams } from '../api/client';
import type { Content } from '../api/types';

/**
 * React Query hook for fetching a paginated list of content
 *
 * @param params - List parameters including filters and pagination
 * @returns Query result containing array of content items
 *
 * Features:
 * - High stale time since content rarely changes
 * - Automatic caching based on parameters
 * - Pagination support via offset/limit
 */
export function useContentList(params: ListParams) {
  return useQuery<Content[], Error>({
    queryKey: ['contentList', params],
    queryFn: () => engramClient.listContent(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - content rarely changes
  });
}

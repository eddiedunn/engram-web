import { useQuery } from '@tanstack/react-query';
import { engramClient } from '../api/client';
import type { ContentType } from '../api/types';

/**
 * React Query hook for fetching unique content sources (authors) by type
 */
export function useSources(contentType?: ContentType) {
  return useQuery<Record<string, string[]>, Error>({
    queryKey: ['sources', contentType],
    queryFn: () => engramClient.getSources(contentType),
    staleTime: 10 * 60 * 1000,
    enabled: !!contentType,
  });
}

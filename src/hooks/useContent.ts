import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { engramClient } from '../api/client';
import type { Content, ContentListResponse } from '../api/types';

/**
 * React Query hook for fetching a single content item by ID
 *
 * @param contentId - The unique identifier of the content to fetch
 * @returns Query result containing the content item
 *
 * Features:
 * - Automatic caching with content ID as key
 * - Inherits default stale time from provider
 * - Automatic refetching on mount if stale
 */
export function useContent(contentId: string) {
  return useQuery<Content, Error>({
    queryKey: ['content', contentId],
    queryFn: () => engramClient.getContent(contentId),
  });
}

/**
 * React Query mutation hook for deleting content
 *
 * @returns Mutation object with deleteContent function
 *
 * Features:
 * - Automatic cache invalidation after successful deletion
 * - Invalidates both content list and individual content queries
 * - Optimistic updates: Immediately removes content from cache
 * - Rollback on error to restore previous state
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousContent: unknown; previousContentList: unknown }>({
    mutationFn: (contentId: string) => engramClient.deleteContent(contentId),
    // Optimistic update: Remove content from cache immediately
    onMutate: async (contentId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['content', contentId] });
      await queryClient.cancelQueries({ queryKey: ['contentList'] });

      // Snapshot the previous values
      const previousContent = queryClient.getQueryData(['content', contentId]);
      const previousContentList = queryClient.getQueryData(['contentList']);

      // Optimistically remove the content from the specific content query
      queryClient.setQueryData(['content', contentId], undefined);

      // Optimistically remove the content from all content list queries
      queryClient.setQueriesData<ContentListResponse>(
        { queryKey: ['contentList'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((content) => content.content_id !== contentId),
            total: old.total - 1,
          };
        }
      );

      // Return context with previous values for rollback
      return { previousContent, previousContentList };
    },
    // Rollback on error
    onError: (err, contentId, context) => {
      // Restore previous values if the mutation fails
      if (context?.previousContent) {
        queryClient.setQueryData(['content', contentId], context.previousContent);
      }
      if (context?.previousContentList) {
        queryClient.setQueryData(['contentList'], context.previousContentList);
      }
      console.error('Failed to delete content:', err);
    },
    // Always refetch after error or success to ensure cache is in sync
    onSettled: (_, __, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['contentList'] });
    },
  });
}

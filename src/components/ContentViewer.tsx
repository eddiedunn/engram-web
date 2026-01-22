import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import type { Content } from '@/api/types';
import type { ContentType } from '@/api/types';
import { cn } from '@/lib/utils';

export interface ContentViewerProps {
  content: Content;
  onDelete?: (contentId: string) => void;
  highlightChunk?: number;
}

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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Split text into chunks based on chunk_count
 * This attempts to split the text evenly while respecting word boundaries
 */
function splitTextIntoChunks(text: string, chunkCount: number): string[] {
  if (chunkCount <= 1) {
    return [text];
  }

  const chunks: string[] = [];
  const approximateChunkSize = Math.ceil(text.length / chunkCount);

  let currentPosition = 0;
  for (let i = 0; i < chunkCount; i++) {
    if (currentPosition >= text.length) {
      break;
    }

    // For the last chunk, take everything remaining
    if (i === chunkCount - 1) {
      chunks.push(text.slice(currentPosition));
      break;
    }

    // Find the next chunk boundary
    let endPosition = currentPosition + approximateChunkSize;

    // Try to find a good break point (period, newline, or space)
    if (endPosition < text.length) {
      // Look ahead up to 200 characters for a sentence boundary
      const searchEnd = Math.min(endPosition + 200, text.length);
      const searchText = text.slice(endPosition, searchEnd);

      // Try to find a period followed by space or newline
      const periodMatch = searchText.match(/\.\s/);
      if (periodMatch && periodMatch.index !== undefined) {
        endPosition += periodMatch.index + 1;
      } else {
        // Fallback to finding a newline or space
        const newlineIndex = searchText.indexOf('\n');
        if (newlineIndex !== -1) {
          endPosition += newlineIndex + 1;
        } else {
          const spaceIndex = searchText.indexOf(' ');
          if (spaceIndex !== -1) {
            endPosition += spaceIndex + 1;
          }
        }
      }
    }

    chunks.push(text.slice(currentPosition, endPosition));
    currentPosition = endPosition;
  }

  return chunks;
}

/**
 * ContentViewer component displays full content with metadata and chunked text
 */
export function ContentViewer({
  content,
  onDelete,
  highlightChunk,
}: ContentViewerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [collapsedChunks, setCollapsedChunks] = useState<Set<number>>(new Set());
  const chunkRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Split text into chunks
  const chunks = splitTextIntoChunks(content.text, content.chunk_count);

  // Scroll to highlighted chunk
  useEffect(() => {
    if (highlightChunk !== undefined && chunkRefs.current[highlightChunk]) {
      chunkRefs.current[highlightChunk]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightChunk]);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(content.id);
      setDeleteDialogOpen(false);
    }
  };

  const toggleChunkCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedChunks);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedChunks(newCollapsed);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl mb-2 leading-tight">{content.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getContentTypeColor(content.content_type)}>
                  {content.content_type}
                </Badge>
                {content.tags && content.tags.length > 0 && (
                  <>
                    {content.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">Created:</span>
              <span>{formatDate(content.created_at)}</span>
            </div>
            {content.url && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium">URL:</span>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1 break-all min-h-[44px] sm:min-h-0"
                >
                  {content.url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">Chunks:</span>
              <span>{content.chunk_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <MetadataDisplay
        metadata={content.metadata}
        contentType={content.content_type}
      />

      {/* Summary Section */}
      {content.summary && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="min-h-[44px] min-w-[44px]"
              >
                {summaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {summaryExpanded && (
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm leading-relaxed whitespace-pre-wrap max-w-prose">
                {content.summary}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Full Text with Chunks */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Full Content</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {chunks.map((chunk, index) => {
              const isHighlighted = highlightChunk === index;
              const isCollapsed = collapsedChunks.has(index);

              return (
                <div
                  key={index}
                  ref={(el) => {
                    chunkRefs.current[index] = el;
                  }}
                  className={cn(
                    'border rounded-lg p-3 sm:p-4 transition-all',
                    isHighlighted
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  {/* Chunk Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        Chunk {index + 1}/{chunks.length}
                      </Badge>
                      {isHighlighted && (
                        <Badge variant="default" className="text-xs">
                          Highlighted
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleChunkCollapse(index)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Chunk Content */}
                  {!isCollapsed && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap max-w-prose">
                      {chunk}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{content.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="min-h-[44px] w-full sm:w-auto">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

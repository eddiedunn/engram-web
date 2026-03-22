import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HighlightedText } from '@/components/HighlightedText';
import type { SearchResult } from '@/api/types';
import type { ContentType } from '@/api/types';

export interface ContentCardProps {
  result: SearchResult;
  searchTerm: string;
}

/**
 * Get color variant for content type badge
 */
function getContentTypeColor(contentType: ContentType): string {
  const colors: Record<ContentType, string> = {
    youtube: 'bg-red-500 text-white hover:bg-red-600',
    article: 'bg-blue-500 text-white hover:bg-blue-600',
    podcast: 'bg-purple-500 text-white hover:bg-purple-600',
    document: 'bg-green-500 text-white hover:bg-green-600',
    note: 'bg-amber-500 text-white hover:bg-amber-600',
    meeting: 'bg-indigo-500 text-white hover:bg-indigo-600',
    other: 'bg-gray-500 text-white hover:bg-gray-600',
  };
  return colors[contentType];
}

function formatContentType(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    youtube: 'YouTube',
    article: 'Article',
    podcast: 'Podcast',
    document: 'Document',
    note: 'Note',
    meeting: 'Meeting',
    other: 'Other',
  };
  return labels[type] || type;
}

/**
 * Get color for relevance score
 */
function getScoreColor(score: number): string {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-blue-500';
  if (score >= 0.4) return 'bg-yellow-500';
  return 'bg-orange-500';
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
 * Truncate text to a specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * ContentCard displays an individual search result
 */
export function ContentCard({ result, searchTerm }: ContentCardProps) {
  const navigate = useNavigate();
  const { content, chunk_text, chunk_index, score } = result;

  const handleTitleClick = () => {
    navigate(`/content/${content.id}`);
  };

  const handleViewFull = () => {
    navigate(`/content/${content.id}`);
  };

  // Truncate chunk text to 150 characters
  const previewText = truncateText(chunk_text, 150);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <button
              onClick={handleTitleClick}
              className="text-lg font-semibold hover:underline text-left w-full min-h-[44px] flex items-center"
            >
              <span className="line-clamp-2 sm:truncate">{content.title}</span>
            </button>
          </div>
          <Badge className={`${getContentTypeColor(content.content_type)} shrink-0`}>
            {formatContentType(content.content_type)}
          </Badge>
        </div>

        {/* Relevance Score */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Relevance:</span>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(score)} transition-all`}
              style={{ width: `${score * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium">{(score * 100).toFixed(0)}%</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3 p-4 sm:p-6">
        {/* Chunk Preview with Highlighting */}
        <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
          <HighlightedText text={previewText} searchTerm={searchTerm} />
        </div>

        {/* Metadata */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Created:</span>
            <span>{formatDate(content.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Chunk:</span>
            <span>
              {chunk_index + 1} of {content.chunk_count}
            </span>
          </div>
          {content.tags && content.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {content.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {content.tags.length > 3 && (
                <span className="text-xs">+{content.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 p-4 sm:p-6">
        <Button variant="outline" size="sm" onClick={handleViewFull} className="min-h-[44px] w-full sm:w-auto">
          View Full
        </Button>
      </CardFooter>
    </Card>
  );
}

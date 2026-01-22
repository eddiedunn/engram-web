import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentType } from '@/api/types';

/**
 * YouTube metadata structure
 */
interface YoutubeMetadata {
  channel_name?: string;
  duration?: number; // Duration in seconds
  view_count?: number;
  upload_date?: string;
}

/**
 * Article metadata structure
 */
interface ArticleMetadata {
  author?: string;
  publication_date?: string;
  word_count?: number;
}

/**
 * Type guard for YouTube metadata
 */
function isYoutubeMetadata(metadata: any): metadata is YoutubeMetadata {
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    ('channel_name' in metadata ||
      'duration' in metadata ||
      'view_count' in metadata ||
      'upload_date' in metadata)
  );
}

/**
 * Type guard for Article metadata
 */
function isArticleMetadata(metadata: any): metadata is ArticleMetadata {
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    ('author' in metadata ||
      'publication_date' in metadata ||
      'word_count' in metadata)
  );
}

/**
 * Format duration from seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format number with commas (e.g., 1000000 -> 1,000,000)
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
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
  });
}

export interface MetadataDisplayProps {
  metadata: Record<string, any> | null;
  contentType: ContentType;
}

/**
 * MetadataDisplay component renders content metadata based on content type
 */
export function MetadataDisplay({ metadata, contentType }: MetadataDisplayProps) {
  // Handle null or empty metadata
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No metadata available</p>
        </CardContent>
      </Card>
    );
  }

  // Render YouTube metadata
  if (contentType === 'YOUTUBE' && isYoutubeMetadata(metadata)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Video Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            {metadata.channel_name && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Channel:
                </dt>
                <dd className="text-sm">{metadata.channel_name}</dd>
              </div>
            )}
            {metadata.duration !== undefined && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Duration:
                </dt>
                <dd className="text-sm">{formatDuration(metadata.duration)}</dd>
              </div>
            )}
            {metadata.view_count !== undefined && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Views:
                </dt>
                <dd className="text-sm">{formatNumber(metadata.view_count)}</dd>
              </div>
            )}
            {metadata.upload_date && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Upload Date:
                </dt>
                <dd className="text-sm">{formatDate(metadata.upload_date)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    );
  }

  // Render Article metadata
  if (contentType === 'ARTICLE' && isArticleMetadata(metadata)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Article Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            {metadata.author && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Author:
                </dt>
                <dd className="text-sm">{metadata.author}</dd>
              </div>
            )}
            {metadata.publication_date && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Published:
                </dt>
                <dd className="text-sm">{formatDate(metadata.publication_date)}</dd>
              </div>
            )}
            {metadata.word_count !== undefined && (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  Word Count:
                </dt>
                <dd className="text-sm">{formatNumber(metadata.word_count)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    );
  }

  // Render generic metadata for other content types
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {Object.entries(metadata).map(([key, value]) => {
            // Skip null or undefined values
            if (value === null || value === undefined) return null;

            // Format the value based on type
            let displayValue: string;
            if (typeof value === 'object') {
              displayValue = JSON.stringify(value);
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            } else if (typeof value === 'number') {
              displayValue = formatNumber(value);
            } else {
              displayValue = String(value);
            }

            // Format the key (convert snake_case to Title Case)
            const displayKey = key
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return (
              <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-sm font-medium text-muted-foreground min-w-[120px]">
                  {displayKey}:
                </dt>
                <dd className="text-sm break-words">{displayValue}</dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}

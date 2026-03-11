import { Card, CardContent } from '@/components/ui/card';
import type { ContentType } from '@/api/types';

// Fields that are internal/large and should not be displayed
const HIDDEN_FIELDS = new Set(['segments', 'speakers', 'speaker_count', 'description']);

/**
 * Format duration from seconds to H:MM:SS or M:SS
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
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
export function MetadataDisplay({ metadata, contentType: _contentType }: MetadataDisplayProps) {
  if (!metadata) return null;

  const rows: { label: string; value: string }[] = [];

  if (metadata.author) rows.push({ label: 'Author', value: String(metadata.author) });
  if (metadata.published_at) rows.push({ label: 'Published', value: formatDate(String(metadata.published_at)) });
  if (metadata.duration_seconds !== undefined) rows.push({ label: 'Duration', value: formatDuration(Number(metadata.duration_seconds)) });

  // Any remaining scalar fields not in the hidden list
  for (const [key, value] of Object.entries(metadata)) {
    if (HIDDEN_FIELDS.has(key)) continue;
    if (['author', 'published_at', 'duration_seconds'].includes(key)) continue;
    if (value === null || value === undefined || typeof value === 'object') continue;

    const label = key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No')
      : typeof value === 'number' ? formatNumber(value)
      : String(value);
    rows.push({ label, value: display });
  }

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-2">
              <dt className="text-sm font-medium text-muted-foreground">{label}:</dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
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

export interface ContentViewerProps {
  content: Content;
  onDelete?: (contentId: string) => void;
  highlightChunk?: number;
}

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

export function ContentViewer({ content, onDelete, highlightChunk: _highlightChunk }: ContentViewerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(content.id);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl mb-2 leading-tight">{content.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getContentTypeColor(content.content_type)}>
                  {content.content_type}
                </Badge>
                {content.tags && content.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
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
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-medium">Added:</span>
              <span>{formatDate(content.created_at)}</span>
            </div>
            {content.url && (
              <div className="flex gap-2">
                <span className="font-medium">Source:</span>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1 break-all"
                >
                  {content.url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <MetadataDisplay metadata={content.metadata} contentType={content.content_type} />

      {/* Transcript */}
      <Card ref={transcriptRef}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono max-w-prose">
            {content.text}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{content.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px] w-full sm:w-auto">
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

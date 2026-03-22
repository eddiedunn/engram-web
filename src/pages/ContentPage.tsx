import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContentViewer } from '@/components/ContentViewer';
import { useContent, useDeleteContent } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ContentPage component - Full content display page
 *
 * Route: /content/:contentId
 *
 * Features:
 * - Extract contentId from URL params
 * - Fetch content using useContent(contentId) hook
 * - Display ContentViewer component
 * - Back button: Navigate to previous page or search page
 * - Loading state: Skeleton loader
 * - Error state: 404 page with link to search
 * - Delete handler: Use useDeleteContent mutation, redirect to search on success
 * - Extract chunk index from URL hash: #chunk-5
 * - Scroll to and highlight that chunk on mount
 * - Page title: Set document.title to content.title
 */
export function ContentPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch content data
  const { data: content, isLoading, error } = useContent(contentId!);

  // Delete content mutation
  const deleteContentMutation = useDeleteContent();

  // Extract chunk index from URL hash
  const highlightChunk = useMemo(() => {
    const hash = location.hash;
    if (hash.startsWith('#chunk-')) {
      const chunkNum = parseInt(hash.replace('#chunk-', ''), 10);
      if (!isNaN(chunkNum) && chunkNum >= 0) {
        return chunkNum;
      }
    }
    return undefined;
  }, [location.hash]);

  // Set page title
  useEffect(() => {
    if (content) {
      document.title = content.title;
    } else {
      document.title = 'Engram Knowledge Base';
    }
  }, [content]);

  // Handle delete
  const handleDelete = async (contentId: string) => {
    try {
      await deleteContentMutation.mutateAsync(contentId);
      navigate('/browse');
    } catch (error) {
      console.error('Failed to delete content:', error);
      // Error is already handled by the mutation
    }
  };

  // Handle back button
  const handleBack = () => {
    // Navigate to previous page if available, otherwise go to search
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 min-h-[44px]"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
          <LoadingSkeleton variant="content" />
        </div>
      </>
    );
  }

  // Error state (404)
  if (error || !content) {
    return (
      <>
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
            <Alert className="max-w-md">
              <AlertTitle className="text-xl sm:text-2xl font-semibold mb-2">
                Content Not Found
              </AlertTitle>
              <AlertDescription className="mb-4 text-sm sm:text-base">
                The content you're looking for doesn't exist or has been deleted.
              </AlertDescription>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-4">
                <Button variant="outline" onClick={handleBack} className="min-h-[44px] w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Link to="/" className="w-full sm:w-auto">
                  <Button className="min-h-[44px] w-full">Go to Search</Button>
                </Link>
              </div>
            </Alert>
          </div>
        </div>
      </>
    );
  }

  // Success state
  return (
    <>
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <ContentViewer
          content={content}
          onDelete={handleDelete}
          highlightChunk={highlightChunk}
        />
      </div>
    </>
  );
}

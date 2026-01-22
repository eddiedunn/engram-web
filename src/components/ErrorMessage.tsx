import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface ErrorMessageProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Reusable error message component with optional retry button
 *
 * Features:
 * - Display error with icon
 * - Customizable title and message
 * - Optional retry button
 * - Accessible with proper ARIA attributes
 */
export function ErrorMessage({
  error,
  title = 'Error',
  message,
  onRetry,
  variant = 'destructive',
}: ErrorMessageProps) {
  const displayMessage = message || error?.message || 'An unexpected error occurred.';

  return (
    <Alert variant={variant} role="alert" aria-live="assertive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{displayMessage}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
            aria-label="Retry operation"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

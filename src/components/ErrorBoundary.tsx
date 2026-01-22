import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors
 *
 * Features:
 * - Catches errors in child components
 * - Displays fallback UI with error details
 * - Provides retry button to reset error state
 * - Logs errors to console
 * - Accessible error messaging
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset error state to retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <AlertTitle className="text-lg font-semibold">
              Something went wrong
            </AlertTitle>
            <AlertDescription className="mt-3 space-y-3">
              <p>
                An unexpected error occurred while rendering this component.
                {this.state.error && (
                  <span className="block mt-2 text-sm font-mono bg-destructive/10 p-2 rounded">
                    {this.state.error.message}
                  </span>
                )}
              </p>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Error details (development only)
                  </summary>
                  <pre className="whitespace-pre-wrap bg-destructive/10 p-2 rounded overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  aria-label="Try again"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  aria-label="Go to home page"
                >
                  Go Home
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

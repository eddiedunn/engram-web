import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * NotFoundPage component - 404 error page
 *
 * Displays when user navigates to an invalid route.
 * Provides links to return to the search page.
 */
export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl font-bold text-muted-foreground mb-2">404</div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

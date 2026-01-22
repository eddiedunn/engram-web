import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Menu, X, Sun, Moon } from 'lucide-react';
import { engramClient } from '@/api/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/lib/theme-provider';

/**
 * Navigation component with active route highlighting
 */
function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname === '/' || location.pathname.startsWith('/search')) {
      return 'search';
    }
    if (location.pathname.startsWith('/browse')) {
      return 'browse';
    }
    return 'search';
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link to="/" className="flex items-center space-x-2 min-h-[44px]">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">Engram</span>
          </Link>

          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Tabs value={getActiveTab()} className="w-auto">
              <TabsList>
                <Link to="/">
                  <TabsTrigger value="search" className="cursor-pointer min-h-[44px]">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </TabsTrigger>
                </Link>
                <Link to="/browse">
                  <TabsTrigger value="browse" className="cursor-pointer min-h-[44px]">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse
                  </TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            {/* Theme Toggle Button (Mobile) */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={handleNavClick}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg min-h-[44px] ${
                  getActiveTab() === 'search'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Search className="h-5 w-5" />
                <span className="font-medium">Search</span>
              </Link>
              <Link
                to="/browse"
                onClick={handleNavClick}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg min-h-[44px] ${
                  getActiveTab() === 'browse'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Browse</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/**
 * Footer component with version info from API health endpoint
 */
function Footer() {
  // Fetch health/version info from API
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => engramClient.health(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <div>
            <span>Engram Knowledge Base</span>
          </div>
          {health && (
            <div className="flex items-center gap-2">
              <span>API v{health.version}</span>
              {health.status && (
                <span className="flex items-center gap-1">
                  • <span className="text-green-600">●</span> {health.status}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

/**
 * Root App component with layout
 *
 * Features:
 * - Error boundary for unhandled errors
 * - Navigation header with active route highlighting
 * - Main content area (renders child routes via Outlet)
 * - Footer with version info from API health endpoint
 */
export function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        {/* Navigation Header */}
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

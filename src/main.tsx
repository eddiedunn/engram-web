import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ThemeProvider } from '@/lib/theme-provider';
import './style.css';

/**
 * Configure React Query client with default options
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute (60000ms)
      retry: 3, // Retry failed requests 3 times
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

/**
 * Application entry point with React Query provider and Router
 */
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="engram-ui-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);

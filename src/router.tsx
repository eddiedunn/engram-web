import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';
import { SearchPage } from './pages/SearchPage';
import { ContentPage } from './pages/ContentPage';
import { BrowsePage } from './pages/BrowsePage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * React Router configuration
 *
 * Routes:
 * - / → SearchPage (default/home)
 * - /content/:contentId → ContentPage
 * - /browse → BrowsePage
 * - * → NotFoundPage (404)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <SearchPage />,
      },
      {
        path: 'content/:contentId',
        element: <ContentPage />,
      },
      {
        path: 'browse',
        element: <BrowsePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

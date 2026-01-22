# Engram Web Architecture

This document provides a comprehensive overview of the Engram Web frontend architecture, including component hierarchy, data flow patterns, routing structure, and state management approach.

## Table of Contents

- [Overview](#overview)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Routing Structure](#routing-structure)
- [State Management](#state-management)
- [API Client Layer](#api-client-layer)
- [UI Component Library](#ui-component-library)
- [Styling Architecture](#styling-architecture)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)

## Overview

Engram Web is a single-page application (SPA) built with React 19, TypeScript, and Vite. It follows a modern component-based architecture with clear separation of concerns:

- **Presentation Layer**: React components (functional components with hooks)
- **Data Layer**: React Query for server state management
- **API Layer**: Type-safe API client wrapping the Engram API
- **Routing Layer**: React Router v7 with nested routes
- **Styling Layer**: Tailwind CSS with Radix UI primitives

### Key Architectural Principles

1. **Type Safety First**: Full TypeScript coverage with strict mode enabled
2. **Component Composition**: Small, reusable components over monolithic ones
3. **Declarative Data Fetching**: React Query hooks for all server interactions
4. **Responsive Design**: Mobile-first approach using Tailwind breakpoints
5. **Accessibility**: ARIA-compliant components using Radix UI primitives
6. **Performance**: Code splitting, lazy loading, and virtualization where appropriate

## Component Hierarchy

### Application Structure

```
ThemeProvider (Context)
└── QueryClientProvider (React Query)
    └── RouterProvider (React Router)
        └── App (Root Layout)
            ├── Navigation (Header)
            │   ├── Logo/Brand Link
            │   ├── Tabs (Desktop)
            │   │   ├── Search Tab
            │   │   └── Browse Tab
            │   ├── Theme Toggle Button
            │   └── Mobile Menu
            │       └── Mobile Navigation Links
            ├── Main (Outlet for routes)
            │   └── [Route Content]
            └── Footer
                └── API Version Info
```

### Page Components

#### SearchPage (`src/pages/SearchPage.tsx`)

The default landing page for searching content.

```
SearchPage
├── SearchBar
│   ├── Input (search query)
│   ├── Select (search mode: hybrid/semantic/fts)
│   ├── Select (content type filter)
│   └── Button (submit)
├── SearchResults
│   ├── ResultsHeader (count, filters)
│   └── ContentCard[] (results list)
│       ├── Badge (content type)
│       ├── Title (link to content page)
│       ├── HighlightedText (matched chunk)
│       ├── MetadataDisplay (tags, score)
│       └── Actions (view, delete)
└── EmptyState (when no results)
```

**State Management**:
- Search query state (local useState)
- Search results (React Query - `useSearch` hook)
- Filter selections (URL search params)

#### BrowsePage (`src/pages/BrowsePage.tsx`)

Browse all content with infinite scrolling and filtering.

```
BrowsePage
├── Filters
│   ├── ContentTypeSelect
│   ├── TagsInput
│   └── SortSelect
├── VirtualizedContentList (react-virtual)
│   └── ContentCard[] (virtualized)
│       └── [Same as SearchPage ContentCard]
└── LoadingSkeleton
```

**State Management**:
- Filter state (URL search params)
- Content list (React Query - `useContentList` hook with pagination)
- Virtualization state (react-virtual)

#### ContentPage (`src/pages/ContentPage.tsx`)

Detailed view of a single content item.

```
ContentPage
├── ContentHeader
│   ├── Title
│   ├── Badge (content type)
│   └── Actions (edit, delete, external link)
├── Tabs
│   ├── Content Tab
│   │   └── ContentViewer
│   │       └── HighlightedText (full text)
│   ├── Summary Tab
│   │   └── Summary Text
│   └── Metadata Tab
│       └── MetadataDisplay
│           ├── Tags
│           ├── URL
│           ├── Timestamps
│           └── Custom Metadata (JSON viewer)
└── ErrorMessage (if content not found)
```

**State Management**:
- Content data (React Query - `useContent` hook)
- Active tab (local useState)

#### NotFoundPage (`src/pages/NotFoundPage.tsx`)

404 error page for invalid routes.

```
NotFoundPage
├── Icon (alert)
├── Message
└── Link (back to home)
```

### Reusable Components

#### UI Components (`src/components/ui/`)

Built on Radix UI primitives using the shadcn/ui pattern:

- **Button**: Multiple variants (default, destructive, outline, ghost, link)
- **Input**: Text input with proper accessibility
- **Select**: Dropdown selection with keyboard navigation
- **Card**: Container for content with header/body/footer sections
- **Badge**: Colored labels for tags and categories
- **Tabs**: Tab navigation for content sections
- **Dialog**: Modal dialogs for confirmations
- **Alert**: Alert messages for errors and warnings
- **Skeleton**: Loading placeholders

#### Feature Components (`src/components/`)

- **SearchBar**: Unified search interface with filters
- **SearchResults**: Result list container with count and filters
- **ContentCard**: Reusable card for displaying content items
- **ContentViewer**: Full-page content display
- **MetadataDisplay**: Structured metadata viewer
- **HighlightedText**: Text with search term highlighting
- **EmptyState**: Placeholder for empty results
- **LoadingSkeleton**: Loading state for lists
- **ErrorMessage**: Error display component
- **ErrorBoundary**: Error boundary for catching React errors

## Data Flow

### React Query → API Client → Engram API

```
┌─────────────────────────────────────────────────────────────┐
│                      Component Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  SearchPage  │  │  BrowsePage  │  │  ContentPage    │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ Uses hooks
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    React Query Hooks                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  useSearch   │  │useContentList│  │   useContent    │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│         │                 │                    │          │
│         └─────────────────┼────────────────────┘          │
│                           │                               │
│         ┌─────────────────▼─────────────────┐             │
│         │   React Query Cache               │             │
│         │   (Automatic caching & syncing)   │             │
│         └─────────────────┬─────────────────┘             │
│                           │                               │
└───────────────────────────┼───────────────────────────────┘
                            │
                            │ Calls API methods
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    API Client Layer                       │
│  ┌───────────────────────────────────────────────────┐    │
│  │             EngramClient Class                    │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ • search(params)                         │     │    │
│  │  │ • searchSemantic(request)                │     │    │
│  │  │ • searchHybrid(request)                  │     │    │
│  │  │ • getContent(id)                         │     │    │
│  │  │ • listContent(params)                    │     │    │
│  │  │ • deleteContent(id)                      │     │    │
│  │  │ • health()                               │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └───────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────┘
                            │
                            │ HTTP/REST (fetch API)
                            ▼
┌───────────────────────────────────────────────────────────┐
│                     Engram API Server                     │
│              (PostgreSQL + pgvector backend)              │
└───────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### 1. Search Flow

```
User types in SearchBar
  → Component calls useSearch({ query, searchMode, ... })
    → React Query checks cache
      → If cached and fresh, return from cache
      → If stale or missing, call engramClient.search()
        → EngramClient makes HTTP request to /api/v1/search
          → Engram API processes query
            → PostgreSQL full-text search / pgvector semantic search
          ← Returns SearchResult[]
        ← EngramClient returns typed data
      ← React Query caches result
    ← Hook returns { data, isLoading, error }
  ← Component renders SearchResults with data
```

#### 2. Content Browsing Flow

```
User navigates to Browse page
  → BrowsePage calls useContentList({ filters, pagination })
    → React Query manages paginated query
      → Calls engramClient.listContent({ limit, offset, ... })
        → HTTP GET /api/v1/content?limit=50&offset=0
          → Engram API queries database
        ← Returns Content[]
      ← React Query caches with unique key per page
    ← Hook returns { data, fetchNextPage, hasNextPage, ... }
  ← Component renders virtualized list
    → User scrolls to bottom
      → IntersectionObserver triggers fetchNextPage()
        → Fetches next page and appends to cache
```

#### 3. Content Detail Flow

```
User clicks content card
  → Router navigates to /content/:contentId
    → ContentPage extracts contentId from route params
      → Calls useContent(contentId)
        → React Query checks cache (may already have data from list)
          → If not cached, calls engramClient.getContent(contentId)
            → HTTP GET /api/v1/content/{contentId}
          ← Returns single Content object
        ← React Query caches with key ['content', contentId]
      ← Hook returns { data, isLoading, error }
    ← Component renders ContentViewer
```

### React Query Configuration

**Global Settings** (`src/main.tsx`):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,           // Data fresh for 1 minute
      retry: 3,                   // Retry failed requests 3 times
      refetchOnWindowFocus: false // Don't refetch on window focus
    }
  }
});
```

**Cache Keys**:
- `['search', query, searchMode, filters]` - Search results
- `['content', contentId]` - Single content item
- `['contentList', filters, pagination]` - Paginated content list
- `['health']` - API health status

## Routing Structure

### Route Configuration

Defined in `src/router.tsx`:

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,           // Root layout
    children: [
      {
        index: true,
        element: <SearchPage />  // Default route: /
      },
      {
        path: 'content/:contentId',
        element: <ContentPage /> // Dynamic route: /content/123
      },
      {
        path: 'browse',
        element: <BrowsePage />  // Static route: /browse
      },
      {
        path: '*',
        element: <NotFoundPage /> // Catch-all: 404
      }
    ]
  }
]);
```

### Route Patterns

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | SearchPage | Home/search page |
| `/browse` | BrowsePage | Browse all content |
| `/content/:contentId` | ContentPage | View specific content |
| `/*` | NotFoundPage | 404 error page |

### Navigation Flow

```
App (Root Layout - always rendered)
├── Navigation (shared header)
├── <Outlet /> (renders active child route)
│   ├── / → SearchPage
│   ├── /browse → BrowsePage
│   ├── /content/:id → ContentPage
│   └── /* → NotFoundPage
└── Footer (shared footer)
```

### URL State Management

Search filters and pagination are stored in URL search params for shareable links:

```
/browse?content_type=ARTICLE&tags=ai,ml&limit=50&offset=0
```

Benefits:
- Shareable URLs with filters
- Browser back/forward works correctly
- No need for global state for filters

## State Management

### State Management Strategy

Engram Web uses a **hybrid state management approach**:

1. **Server State** (React Query): All data from API
2. **URL State** (React Router): Filters, pagination, active tab
3. **Local State** (useState): UI state (modals, menus, form inputs)
4. **Context State** (React Context): Theme preference

### State Categories

#### 1. Server State (React Query)

All data fetched from the Engram API is managed by React Query:

```typescript
// Search results
const { data: results, isLoading } = useSearch({
  query: 'machine learning',
  searchMode: 'hybrid'
});

// Content list
const { data: contentPages, fetchNextPage } = useContentList({
  content_type: 'ARTICLE',
  limit: 50
});

// Single content
const { data: content } = useContent(contentId);
```

**Benefits**:
- Automatic caching and deduplication
- Background refetching
- Optimistic updates
- Loading and error states
- Pagination support

#### 2. URL State (Search Params)

Filters, sorting, and pagination use URL search parameters:

```typescript
const [searchParams, setSearchParams] = useSearchParams();

// Read from URL
const contentType = searchParams.get('content_type');
const tags = searchParams.getAll('tags');

// Write to URL
setSearchParams({
  content_type: 'ARTICLE',
  tags: ['ai', 'ml']
});
```

**Benefits**:
- Shareable URLs
- Browser history works correctly
- No need for global state
- SSR-friendly (if needed in future)

#### 3. Local Component State (useState)

UI-only state that doesn't need to be shared:

```typescript
// Modal open/closed
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Form input values (before submit)
const [searchQuery, setSearchQuery] = useState('');

// Accordion expanded state
const [expandedSection, setExpandedSection] = useState<string | null>(null);

// Mobile menu open/closed
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

#### 4. Context State (React Context)

Global UI preferences:

```typescript
// Theme context (light/dark/system)
const { theme, setTheme } = useTheme();
```

**Current Contexts**:
- `ThemeProvider`: User's theme preference (persisted to localStorage)

### State Flow Example: Search

```
1. User types in SearchBar
   → Local state: setSearchQuery('machine learning')

2. User clicks Search button
   → Update URL: setSearchParams({ query: 'machine learning' })

3. URL changes trigger re-render
   → useSearch hook reads query from URL
   → React Query fetches data from API

4. Results returned
   → React Query updates cache
   → Component re-renders with results

5. User applies filter
   → Update URL: setSearchParams({ query: '...', content_type: 'ARTICLE' })
   → React Query refetches with new params
   → Results update automatically
```

## API Client Layer

### EngramClient Class

Located in `src/api/client.ts`, the `EngramClient` provides a type-safe wrapper around the Engram API.

**Key Features**:
- Type-safe methods for all API endpoints
- Automatic error handling
- Query string building
- Request/response transformation
- Environment-aware base URL configuration

**Methods**:

```typescript
class EngramClient {
  // Search endpoints
  search(params: SearchParams): Promise<SearchResult[]>
  searchSemantic(request: SearchRequest): Promise<SearchResult[]>
  searchHybrid(request: HybridSearchRequest): Promise<SearchResult[]>

  // Content endpoints
  getContent(contentId: string): Promise<Content>
  listContent(params: ListParams): Promise<Content[]>
  deleteContent(contentId: string): Promise<void>

  // Health endpoint
  health(): Promise<HealthResponse>
}
```

### Type Definitions

All API types are defined in `src/api/types.ts`:

```typescript
// Content type enum
export type ContentType = 'YOUTUBE' | 'ARTICLE' | 'PODCAST' | 'DOCUMENT' | 'NOTE' | 'OTHER';

// Content interface
export interface Content {
  id: string;
  content_id: string;
  content_type: ContentType;
  title: string;
  url: string;
  text: string;
  summary: string;
  metadata: Record<string, any>;
  tags: string[];
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

// Search result interface
export interface SearchResult {
  content: Content;
  chunk_text: string;
  chunk_index: number;
  score: number;
  search_type: SearchMode;
}
```

### Error Handling

Custom error class for API errors:

```typescript
export class EngramApiError extends Error {
  statusCode?: number;
  response?: any;

  constructor(message: string, statusCode?: number, response?: any) {
    super(message);
    this.name = 'EngramApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}
```

React Query automatically handles these errors in components:

```typescript
const { data, error } = useSearch({ query });

if (error) {
  return <ErrorMessage error={error} />;
}
```

## UI Component Library

### Radix UI + Tailwind CSS

Engram Web uses **Radix UI** primitives styled with **Tailwind CSS** following the **shadcn/ui** pattern.

**Benefits**:
- Accessible by default (ARIA attributes, keyboard navigation)
- Unstyled primitives (full styling control)
- Composable components
- Type-safe APIs
- No runtime JS for styling (Tailwind)

### Component Patterns

#### Compound Components

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Polymorphic Components

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link" asChild>
  <Link to="/page">Link</Link>
</Button>
```

#### Controlled Components

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Styling Architecture

### Tailwind CSS Configuration

**Mobile-First Breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Dark Mode**: Class-based (`class="dark"`) controlled by ThemeProvider

**Utility Patterns**:

```tsx
// Responsive layout
<div className="container mx-auto px-4 md:px-6 lg:px-8">

// Conditional styling
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" && "primary-styles"
)}>

// Dark mode
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### CSS Architecture

1. **Global Styles** (`src/style.css`): CSS reset, Tailwind directives, global utilities
2. **Component Styles**: Inline Tailwind classes (no CSS modules)
3. **Theme Variables**: CSS custom properties for colors, defined by Tailwind config

## Error Handling

### Error Boundary

Top-level error boundary in `App.tsx` catches React errors:

```tsx
<ErrorBoundary>
  <div className="min-h-screen flex flex-col">
    <Navigation />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
</ErrorBoundary>
```

### API Error Handling

React Query provides error states:

```tsx
const { data, isLoading, error } = useSearch({ query });

if (error) {
  return <ErrorMessage error={error as EngramApiError} />;
}
```

### Graceful Degradation

- Loading skeletons during data fetch
- Empty states for no results
- Retry mechanisms for failed requests
- Fallback UI for errors

## Performance Optimizations

### Code Splitting

Vite automatically code-splits by route.

### React Query Optimizations

- **Stale-while-revalidate**: Show cached data while fetching fresh data
- **Deduplication**: Multiple components requesting same data only trigger one request
- **Prefetching**: Prefetch likely next pages on hover
- **Pagination**: Infinite scroll with cursor-based pagination

### Virtualization

Browse page uses `@tanstack/react-virtual` for efficient rendering of large lists:

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
  overscan: 5
});
```

### Image Optimization

- Lazy loading for images
- Responsive images with srcset (when applicable)

### Bundle Size

- Tree-shaking with ES modules
- Dynamic imports for heavy components
- Tailwind CSS purging removes unused styles

---

## Summary

The Engram Web architecture is designed for:

- **Type Safety**: Full TypeScript coverage
- **Developer Experience**: Fast development with Vite, clear patterns
- **User Experience**: Fast, responsive, accessible
- **Maintainability**: Clear separation of concerns, reusable components
- **Performance**: Code splitting, caching, virtualization
- **Scalability**: Composable architecture ready for growth

For deployment architecture, see [DEPLOYMENT.md](DEPLOYMENT.md).

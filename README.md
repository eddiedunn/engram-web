# Engram Web Frontend

A modern React + TypeScript web frontend for Engram, built with Vite and styled with Tailwind CSS. This application provides a clean, responsive interface for searching and browsing content in the Engram knowledge base system.

## Features

- 🔍 **Hybrid Search** - Combine semantic and full-text search for best results
- ⚡ **Vite** - Lightning-fast build tool and dev server
- ⚛️ **React 19** - Latest React with modern hooks
- 📘 **TypeScript** - Full type safety with strict mode enabled
- 🎨 **Tailwind CSS** - Utility-first CSS framework with dark mode support
- 🛣️ **React Router** - Client-side routing with nested layouts
- 🔄 **React Query** - Powerful data fetching, caching, and state management
- 📱 **Responsive** - Mobile-first design approach
- 🎯 **Type-Safe API Client** - Full TypeScript coverage for Engram API

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Engram Web                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Browser                              │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Search    │  │    Browse    │  │  Content View   │  │  │
│  │  │    Page     │  │     Page     │  │      Page       │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘  │  │
│  │         │                │                    │           │  │
│  │         └────────────────┼────────────────────┘           │  │
│  │                          │                                │  │
│  │                ┌─────────▼──────────┐                     │  │
│  │                │   React Query      │                     │  │
│  │                │   (Data Layer)     │                     │  │
│  │                └─────────┬──────────┘                     │  │
│  │                          │                                │  │
│  │                ┌─────────▼──────────┐                     │  │
│  │                │   Engram Client    │                     │  │
│  │                │   (API Client)     │                     │  │
│  │                └─────────┬──────────┘                     │  │
│  └──────────────────────────┼────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │
                    ┌─────────▼──────────┐
                    │   Caddy Reverse    │
                    │      Proxy         │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Engram API      │
                    │   (Backend API)    │
                    └────────────────────┘
```

### Component Hierarchy

```
App (Root Layout)
├── Navigation (Header with tabs)
├── Main Content (React Router Outlet)
│   ├── SearchPage
│   │   ├── SearchBar
│   │   ├── SearchResults
│   │   └── ContentCard (multiple)
│   ├── BrowsePage
│   │   ├── Filters
│   │   └── ContentCard (virtualized list)
│   └── ContentPage
│       ├── ContentViewer
│       ├── MetadataDisplay
│       └── HighlightedText
└── Footer (Version info)
```

For detailed architecture information, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh)** - JavaScript runtime and package manager (v1.0 or later)
- **[Podman](https://podman.io)** (for production deployment) - Container engine

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd engram-web
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.development
# Edit .env.development with your configuration
```

The `.env.example` file contains all available environment variables with documentation. Key variables:
- `VITE_ENGRAM_API_URL`: Point this to your running Engram API instance (default: `http://localhost:8800/api/v1`)

> **Note**: By default, the Engram API runs on port 8800. For production, use the internal network hostname (e.g., `http://engram:8800/api/v1`).

### 4. Run Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:5173`.

### Development Commands

```bash
# Start dev server with hot reload
bun run dev

# Type-check TypeScript
tsc --noEmit

# Build for production
bun run build

# Preview production build locally
bun run preview
```

## Production Deployment

The application is containerized using Podman and deployed with Quadlet (systemd integration).

### 1. Build Docker Image

```bash
cd /path/to/engram-web
podman build -t localhost/engram-web:latest -f deploy/Dockerfile .
```

The multi-stage Dockerfile:
- **Stage 1 (Builder)**: Uses Bun to install dependencies and build the application
- **Stage 2 (Production)**: Uses Nginx Alpine to serve static files

### 2. Deploy with Quadlet

The `deploy/engram-web.container` file defines the systemd service:

```ini
[Unit]
Description=Engram Web Frontend
After=engram.service

[Container]
Image=localhost/engram-web:latest
ContainerName=engram-web
Network=engram-net
PublishPort=3000:80
HealthCmd=curl -f http://localhost/
HealthInterval=30s

[Service]
Restart=always
TimeoutStartSec=120

[Install]
WantedBy=default.target
```

Copy the Quadlet file to systemd:

```bash
mkdir -p ~/.config/containers/systemd
cp deploy/engram-web.container ~/.config/containers/systemd/
systemctl --user daemon-reload
```

Start the service:

```bash
systemctl --user start engram-web.service
systemctl --user enable engram-web.service
```

Check status:

```bash
systemctl --user status engram-web.service
podman ps | grep engram-web
```

### 3. Access via Caddy Reverse Proxy

The application runs on port 3000 internally (Nginx on port 80 in container, mapped to host port 3000) and is typically accessed through a Caddy reverse proxy.

Example Caddy configuration:

```
engram.yourdomain.com {
    reverse_proxy localhost:3000
}
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Infrastructure Management

This service is deployed via your infrastructure repository:
- **Role**: `roles/engram_web`
- **Playbook**: `playbooks/deploy-engram-web.yml`

Ansible automation, container builds, and infrastructure configuration are centrally managed in your infrastructure repository. This repository contains only the application code and local deployment reference files (Dockerfile and Quadlet template).

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENGRAM_API_URL` | Engram API base URL | `http://localhost:8800/api/v1` | Yes |
| `VITE_APP_NAME` | Application name displayed in UI | `Engram Web` | No |

### Build Configuration

- **Vite Config** (`vite.config.ts`): Build and dev server settings
- **TypeScript Config** (`tsconfig.json`): Strict type checking enabled
- **Tailwind Config** (`tailwind.config.ts`): Theme and utility customization
- **PostCSS Config** (`postcss.config.ts`): CSS processing pipeline

## API Integration

This frontend integrates with the Engram API to provide search and content management functionality.

### API Client

The `EngramClient` class (`src/api/client.ts`) provides a type-safe wrapper around the Engram API:

```typescript
import { engramClient } from '@/api/client';

// Search with full-text search
const results = await engramClient.search({
  query: 'machine learning',
  top_k: 10,
  content_type: 'ARTICLE'
});

// Get specific content
const content = await engramClient.getContent('content-id');

// List all content
const allContent = await engramClient.listContent({
  limit: 50,
  offset: 0
});
```

### Search Modes

- **Full-Text Search** (FTS): Traditional keyword-based search
- **Semantic Search**: Vector-based similarity search
- **Hybrid Search**: Combines both FTS and semantic with configurable weighting

### React Query Integration

All API calls are wrapped in React Query hooks for optimal caching and state management:

```typescript
import { useSearch } from '@/hooks/useSearch';

const { data, isLoading, error } = useSearch({
  query: 'react hooks',
  searchMode: 'hybrid'
});
```

For API documentation, see the [Engram API Documentation](https://github.com/yourusername/engram#api-documentation).

## Project Structure

```
engram-web/
├── deploy/                 # Deployment configuration
│   ├── Dockerfile         # Multi-stage container build
│   └── engram-web.container # Quadlet/systemd service definition
├── docs/                   # Additional documentation
│   ├── ARCHITECTURE.md    # Detailed architecture guide
│   └── DEPLOYMENT.md      # Production deployment guide
├── src/
│   ├── api/               # API client and types
│   │   ├── client.ts     # EngramClient class
│   │   └── types.ts      # TypeScript interfaces
│   ├── components/        # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── SearchBar.tsx
│   │   ├── ContentCard.tsx
│   │   └── ...
│   ├── pages/             # Route page components
│   │   ├── SearchPage.tsx
│   │   ├── BrowsePage.tsx
│   │   └── ContentPage.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useSearch.ts
│   │   ├── useContent.ts
│   │   └── useContentList.ts
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Root layout component
│   ├── router.tsx         # React Router configuration
│   ├── main.tsx           # Application entry point
│   └── style.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Troubleshooting

### Development Issues

**Problem**: Dev server won't start

```bash
# Check if port 5173 is already in use
lsof -i :5173

# Kill the process if needed
kill -9 <PID>

# Try a different port
bun run dev -- --port 3001
```

**Problem**: TypeScript errors

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Check for type errors
tsc --noEmit
```

**Problem**: API connection fails

- Verify `VITE_ENGRAM_API_URL` in `.env.development`
- Ensure Engram API is running: `curl http://localhost:8800/api/v1/health`
- Check browser console for CORS errors

### Production Issues

**Problem**: Container won't start

```bash
# Check container logs
podman logs engram-web

# Verify image was built
podman images | grep engram-web

# Rebuild if needed
podman build -t localhost/engram-web:latest -f deploy/Dockerfile .
```

**Problem**: Health check fails

```bash
# Check if nginx is running in container
podman exec engram-web ps aux | grep nginx

# Test health endpoint
podman exec engram-web curl -f http://localhost/
```

**Problem**: Application loads but API calls fail

- Check `VITE_ENGRAM_API_URL` in `.env.production`
- Verify the API is accessible from the container network
- Check Caddy reverse proxy configuration
- Inspect browser network tab for failed requests

### Common Issues

**Blank page after deployment**

- Check browser console for errors
- Verify build completed successfully: `ls -la dist/`
- Ensure environment variables are set correctly

**Slow search performance**

- Check React Query cache settings in `src/main.tsx`
- Verify API response times: `curl -w "@curl-format.txt" http://api/search?query=test`
- Consider increasing `staleTime` for React Query

**Theme not persisting**

- Check browser localStorage: `localStorage.getItem('engram-ui-theme')`
- Clear browser cache and try again

## Technologies

- **[React 19](https://react.dev)** - UI library with modern hooks
- **[TypeScript](https://www.typescriptlang.org)** - Static type checking
- **[Vite](https://vitejs.dev)** - Next-generation build tool
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[React Router](https://reactrouter.com)** - Client-side routing
- **[React Query](https://tanstack.com/query/latest)** - Data fetching and state management
- **[Radix UI](https://radix-ui.com)** - Accessible component primitives
- **[Lucide React](https://lucide.dev)** - Beautiful icon library
- **[Nginx](https://nginx.org)** - Production web server
- **[Podman](https://podman.io)** - Container engine

## Development Tips

1. **Component Structure**: Place reusable components in `src/components/`, page-specific components in the page file
2. **Page Structure**: Create route pages in `src/pages/` following the naming convention `PageName.tsx`
3. **API Calls**: Always use React Query hooks from `src/hooks/`, never call the API client directly in components
4. **Type Safety**: Define TypeScript interfaces in `src/api/types.ts` for all API responses
5. **Styling**: Use Tailwind utility classes; avoid custom CSS unless absolutely necessary
6. **State Management**: Use React Query for server state, useState/useContext for UI state
7. **Error Handling**: Wrap components in ErrorBoundary and handle loading/error states properly

## Contributing

When contributing, please:

1. Follow the existing code structure and naming conventions
2. Maintain TypeScript strict mode compliance
3. Add proper error handling for all API calls
4. Test on both mobile and desktop viewports
5. Update documentation for any new features

## License

[Add your license information here]

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting) above
- Review the [architecture documentation](docs/ARCHITECTURE.md)
- Consult the [deployment guide](docs/DEPLOYMENT.md)
- Check the Engram API documentation

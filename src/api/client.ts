import type {
  Content,
  SearchResult,
  SearchRequest,
  HybridSearchRequest,
  ContentType,
} from './types';

/**
 * Parameters for search endpoint (GET /search)
 */
export interface SearchParams {
  /** The search query string */
  query: string;
  /** Maximum number of results to return */
  top_k?: number;
  /** Filter results by content type (optional) */
  content_type?: ContentType;
  /** Filter results by tags (optional) */
  tags?: string[];
  /** Relevance score threshold (0-1) for filtering results (optional) */
  threshold?: number;
}

/**
 * Parameters for listing content (GET /content)
 */
export interface ListParams {
  /** Filter by content type */
  content_type?: ContentType;
  /** Filter by tags */
  tags?: string[];
  /** Maximum number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Health check response interface
 */
export interface HealthResponse {
  status: string;
  version: string;
}

/**
 * Custom error class for Engram API errors
 */
export class EngramApiError extends Error {
  statusCode?: number;
  response?: any;

  constructor(
    message: string,
    statusCode?: number,
    response?: any
  ) {
    super(message);
    this.name = 'EngramApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Engram API Client
 *
 * A type-safe HTTP client wrapper for the Engram API.
 * Provides methods for searching, retrieving, and managing content.
 */
export class EngramClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_ENGRAM_API_URL || '/api/v1';
  }

  /**
   * Internal method to handle HTTP requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData;

        try {
          errorData = await response.json();
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((e: any) => e.msg || String(e)).join(', ');
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new EngramApiError(errorMessage, response.status, errorData);
      }

      // Handle empty responses (like DELETE operations)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof EngramApiError) {
        throw error;
      }

      throw new EngramApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Search for content using full-text search
   * GET /search
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { query, ...rest } = params;
    const queryString = this.buildQueryString({ q: query, ...rest });
    return this.request<SearchResult[]>(`/search${queryString}`);
  }

  /**
   * Search for content using semantic search
   * POST /search/semantic
   */
  async searchSemantic(request: SearchRequest): Promise<SearchResult[]> {
    return this.request<SearchResult[]>('/search/semantic', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search for content using hybrid search (combination of semantic and full-text)
   * POST /search/hybrid
   */
  async searchHybrid(request: HybridSearchRequest): Promise<SearchResult[]> {
    return this.request<SearchResult[]>('/search/hybrid', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get a specific content item by ID
   * GET /content/{content_id}
   */
  async getContent(contentId: string): Promise<Content> {
    return this.request<Content>(`/content/${contentId}`);
  }

  /**
   * List content with optional filters
   * GET /content
   */
  async listContent(params: ListParams = {}): Promise<Content[]> {
    const queryString = this.buildQueryString(params);
    return this.request<Content[]>(`/content${queryString}`);
  }

  /**
   * Delete a content item by ID
   * DELETE /content/{content_id}
   */
  async deleteContent(contentId: string): Promise<void> {
    return this.request<void>(`/content/${contentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check API health status
   * GET /health
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }
}

/**
 * Singleton instance of EngramClient
 */
export const engramClient = new EngramClient();

/**
 * Export the client class as default
 */
export default engramClient;

/**
 * Content type enum defining the types of content that can be stored
 */
export const ContentType = {
  YOUTUBE: 'YOUTUBE',
  ARTICLE: 'ARTICLE',
  PODCAST: 'PODCAST',
  DOCUMENT: 'DOCUMENT',
  NOTE: 'NOTE',
  OTHER: 'OTHER',
} as const;

export type ContentType = typeof ContentType[keyof typeof ContentType];

/**
 * Content interface representing a content item in the Engram system
 */
export interface Content {
  /** Unique identifier for the content */
  id: string;
  /** Content ID from the source system */
  content_id: string;
  /** Type of content */
  content_type: ContentType;
  /** Title of the content */
  title: string;
  /** URL where the content can be accessed */
  url: string;
  /** Full text content */
  text: string;
  /** Summary of the content */
  summary: string;
  /** Flexible metadata stored as JSONB */
  metadata: Record<string, any>;
  /** Array of tags associated with the content */
  tags: string[];
  /** Number of chunks this content has been split into */
  chunk_count: number;
  /** Timestamp when the content was created */
  created_at: string;
  /** Timestamp when the content was last updated */
  updated_at: string;
}

/**
 * Search result interface representing a single result from a search query
 */
export interface SearchResult {
  /** The content object matching the search */
  content: Content;
  /** The text of the specific chunk that matched */
  chunk_text: string;
  /** Index of the chunk within the content */
  chunk_index: number;
  /** Relevance score of the search result (0-1) */
  score: number;
  /** Type of search that produced this result */
  search_type: SearchMode;
}

/**
 * Search request interface for querying content
 */
export interface SearchRequest {
  /** The search query string */
  query: string;
  /** Maximum number of results to return */
  top_k: number;
  /** Filter results by content type (optional) */
  content_type?: ContentType;
  /** Filter results by tags (optional) */
  tags?: string[];
  /** Relevance score threshold (0-1) for filtering results (optional) */
  threshold?: number;
}

/**
 * Hybrid search request extending SearchRequest with semantic weight
 */
export interface HybridSearchRequest extends SearchRequest {
  /** Weight for semantic search component in hybrid search (0-1) */
  semantic_weight: number;
}

/**
 * Search mode type defining the available search strategies
 */
export type SearchMode = 'hybrid' | 'semantic' | 'fts';

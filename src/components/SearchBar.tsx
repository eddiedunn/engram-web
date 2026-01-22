import * as React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ContentType } from '@/api/types';

/**
 * Extended search parameters including search mode
 */
export interface SearchParams {
  query: string;
  mode: 'hybrid' | 'semantic' | 'fts';
  top_k: number;
  content_type?: ContentType;
  tags?: string[];
}

export interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  defaultMode?: 'hybrid' | 'semantic' | 'fts';
}

const AVAILABLE_TAGS = ['Important', 'Research', 'Tutorial', 'Reference', 'Project'];
const CONTENT_TYPES: ContentType[] = [
  'YOUTUBE',
  'ARTICLE',
  'PODCAST',
  'DOCUMENT',
  'NOTE',
  'OTHER',
];

export function SearchBar({
  onSearch,
  isLoading,
  defaultMode = 'hybrid',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'hybrid' | 'semantic' | 'fts'>(defaultMode);
  const [topK, setTopK] = useState(10);
  const [contentType, setContentType] = useState<ContentType | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({
        query: query.trim(),
        mode,
        top_k: topK,
        content_type: contentType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    }
  };

  const handleClearFilters = () => {
    setQuery('');
    setMode(defaultMode);
    setTopK(10);
    setContentType(undefined);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-h-[44px]"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !query.trim()} className="min-h-[44px] sm:w-auto">
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {/* Search Mode Radio Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium">Mode:</span>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="radio"
                name="mode"
                value="hybrid"
                checked={mode === 'hybrid'}
                onChange={(e) => setMode(e.target.value as 'hybrid')}
                className="cursor-pointer w-4 h-4"
                disabled={isLoading}
              />
              <span className="text-sm">Hybrid</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="radio"
                name="mode"
                value="semantic"
                checked={mode === 'semantic'}
                onChange={(e) => setMode(e.target.value as 'semantic')}
                className="cursor-pointer w-4 h-4"
                disabled={isLoading}
              />
              <span className="text-sm">Semantic</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="radio"
                name="mode"
                value="fts"
                checked={mode === 'fts'}
                onChange={(e) => setMode(e.target.value as 'fts')}
                className="cursor-pointer w-4 h-4"
                disabled={isLoading}
              />
              <span className="text-sm">Full-Text</span>
            </label>
          </div>
        </div>

        {/* Content Type Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium">Type:</span>
          <Select
            value={contentType || 'all'}
            onValueChange={(value) =>
              setContentType(value === 'all' ? undefined : (value as ContentType))
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium">Tags:</span>
          <Select onValueChange={toggleTag} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
              <SelectValue placeholder="Select tags" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_TAGS.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium">Results:</span>
          <Select
            value={topK.toString()}
            onValueChange={(value) => setTopK(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[100px] min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleClearFilters}
          disabled={isLoading}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Clear Filters
        </Button>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Selected tags:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      )}
    </form>
  );
}

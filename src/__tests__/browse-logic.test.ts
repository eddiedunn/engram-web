import { describe, it, expect } from 'vitest'
import type { Content } from '../api/types'

/**
 * These functions are defined inside BrowsePage.tsx but are pure logic.
 * We replicate them here to test the sort and pagination algorithms
 * that the BrowsePage component depends on.
 */

type SortOption = 'newest' | 'oldest' | 'title-az' | 'most-chunks'

function sortContent(content: Content[], sortOption: SortOption): Content[] {
  const sorted = [...content]

  switch (sortOption) {
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case 'oldest':
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    case 'title-az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'most-chunks':
      return sorted.sort((a, b) => b.chunk_count - a.chunk_count)
    default:
      return sorted
  }
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = []
  const maxVisible = 7

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    pages.push(totalPages)
  }

  return pages
}

function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 'id-1',
    content_id: 'cid-1',
    content_type: 'youtube',
    title: 'Default Title',
    url: '',
    text: '',
    summary: '',
    metadata: {},
    tags: [],
    chunk_count: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('sortContent', () => {
  const items: Content[] = [
    makeContent({
      id: '1',
      title: 'Banana',
      created_at: '2024-03-01T00:00:00Z',
      chunk_count: 5,
    }),
    makeContent({
      id: '2',
      title: 'Apple',
      created_at: '2024-01-01T00:00:00Z',
      chunk_count: 10,
    }),
    makeContent({
      id: '3',
      title: 'Cherry',
      created_at: '2024-06-01T00:00:00Z',
      chunk_count: 3,
    }),
  ]

  it('sorts newest first', () => {
    const result = sortContent(items, 'newest')
    expect(result.map((c) => c.id)).toEqual(['3', '1', '2'])
  })

  it('sorts oldest first', () => {
    const result = sortContent(items, 'oldest')
    expect(result.map((c) => c.id)).toEqual(['2', '1', '3'])
  })

  it('sorts title A-Z', () => {
    const result = sortContent(items, 'title-az')
    expect(result.map((c) => c.title)).toEqual(['Apple', 'Banana', 'Cherry'])
  })

  it('sorts most chunks first', () => {
    const result = sortContent(items, 'most-chunks')
    expect(result.map((c) => c.chunk_count)).toEqual([10, 5, 3])
  })

  it('does not mutate original array', () => {
    const original = [...items]
    sortContent(items, 'newest')
    expect(items).toEqual(original)
  })

  it('handles empty array', () => {
    expect(sortContent([], 'newest')).toEqual([])
  })

  it('handles single item', () => {
    const single = [makeContent({ id: 'only' })]
    const result = sortContent(single, 'title-az')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('only')
  })
})

describe('getPageNumbers', () => {
  it('returns all pages when totalPages <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('returns single page', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
  })

  it('shows ellipsis at start when current page > 3', () => {
    const result = getPageNumbers(5, 10)
    expect(result[0]).toBe(1)
    expect(result[1]).toBe('...')
  })

  it('does not show leading ellipsis when current page <= 3', () => {
    const result = getPageNumbers(3, 10)
    // No leading ellipsis since currentPage (3) is not > 3
    expect(result[1]).not.toBe('...')
    // But trailing ellipsis is still present since 3 < 10 - 2
    expect(result[0]).toBe(1)
    expect(result[1]).toBe(2)
  })

  it('shows ellipsis at end when current page < totalPages - 2', () => {
    const result = getPageNumbers(3, 10)
    // Should have ellipsis before the last page
    expect(result[result.length - 2]).toBe('...')
    expect(result[result.length - 1]).toBe(10)
  })

  it('does not show ellipsis at end when current page >= totalPages - 2', () => {
    const result = getPageNumbers(8, 10)
    // Should not have trailing ellipsis
    const beforeLast = result[result.length - 2]
    expect(beforeLast).not.toBe('...')
  })

  it('shows both ellipses for middle pages', () => {
    const result = getPageNumbers(5, 10)
    // Should be: [1, '...', 4, 5, 6, '...', 10]
    expect(result).toEqual([1, '...', 4, 5, 6, '...', 10])
  })

  it('shows first page scenario correctly', () => {
    const result = getPageNumbers(1, 10)
    // Page 1, no leading ellipsis (1 <= 3), pages 2, should have trailing ellipsis
    expect(result[0]).toBe(1)
    expect(result[1]).toBe(2) // no leading ellipsis since currentPage <= 3
  })

  it('shows last page scenario correctly', () => {
    const result = getPageNumbers(10, 10)
    // Should be: [1, '...', 9, 10, 11 (clamped to 10), 10]
    // Actually: start = max(2, 9) = 9, end = min(9, 11) = 9
    // So: [1, '...', 9, 10]
    expect(result[0]).toBe(1)
    expect(result[result.length - 1]).toBe(10)
  })

  it('returns empty for 0 total pages', () => {
    expect(getPageNumbers(1, 0)).toEqual([])
  })
})

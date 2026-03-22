import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContentCard } from '../components/ContentCard'
import type { SearchResult, Content } from '../api/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 'id-1',
    content_id: 'cid-1',
    content_type: 'youtube',
    title: 'Test Video Title',
    url: 'https://youtube.com/watch?v=abc',
    text: 'Full transcript text',
    summary: 'A summary',
    metadata: {},
    tags: [],
    chunk_count: 5,
    created_at: '2024-06-15T10:30:00Z',
    updated_at: '2024-06-15T10:30:00Z',
    ...overrides,
  }
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    content: makeContent(),
    chunk_text: 'This is a chunk of text from the search result that matches the query',
    chunk_index: 2,
    score: 0.85,
    search_type: 'hybrid',
    ...overrides,
  }
}

function renderCard(result: SearchResult, searchTerm = 'test') {
  return render(
    <MemoryRouter>
      <ContentCard result={result} searchTerm={searchTerm} />
    </MemoryRouter>
  )
}

describe('ContentCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('displays the content title', () => {
    renderCard(makeResult())
    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
  })

  it('displays the content type badge', () => {
    renderCard(makeResult())
    expect(screen.getByText('YouTube')).toBeInTheDocument()
  })

  it('formats content types correctly', () => {
    const types = [
      ['youtube', 'YouTube'],
      ['article', 'Article'],
      ['podcast', 'Podcast'],
      ['document', 'Document'],
      ['note', 'Note'],
      ['meeting', 'Meeting'],
      ['other', 'Other'],
    ] as const

    for (const [type, label] of types) {
      const result = makeResult({
        content: makeContent({ content_type: type }),
      })
      const { unmount } = renderCard(result)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('displays relevance score as percentage', () => {
    renderCard(makeResult({ score: 0.85 }))
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('displays score bar with correct width', () => {
    const { container } = renderCard(makeResult({ score: 0.75 }))
    const bar = container.querySelector('[style*="width: 75%"]')
    expect(bar).toBeInTheDocument()
  })

  it('displays chunk info (1-indexed)', () => {
    renderCard(makeResult({ chunk_index: 2 }))
    // chunk_index 2 → "3 of 5"
    expect(screen.getByText('3 of 5')).toBeInTheDocument()
  })

  it('truncates long chunk text to 150 characters', () => {
    const longText = 'a'.repeat(200)
    const result = makeResult({ chunk_text: longText })
    renderCard(result, '')
    // Should show 150 chars + "..."
    const expectedPrefix = 'a'.repeat(150) + '...'
    expect(screen.getByText(expectedPrefix)).toBeInTheDocument()
  })

  it('does not truncate short chunk text', () => {
    const shortText = 'Short chunk text'
    const result = makeResult({ chunk_text: shortText })
    renderCard(result, '')
    expect(screen.getByText(shortText)).toBeInTheDocument()
  })

  it('displays tags (up to 3)', () => {
    const result = makeResult({
      content: makeContent({
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      }),
    })
    renderCard(result)
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
    expect(screen.queryByText('tag4')).not.toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('navigates to content page on title click', () => {
    renderCard(makeResult())
    fireEvent.click(screen.getByText('Test Video Title'))
    expect(mockNavigate).toHaveBeenCalledWith('/content/cid-1')
  })

  it('navigates to content page on View Full click', () => {
    renderCard(makeResult())
    fireEvent.click(screen.getByText('View Full'))
    expect(mockNavigate).toHaveBeenCalledWith('/content/cid-1')
  })

  it('formats created_at date', () => {
    renderCard(makeResult())
    // "Jun 15, 2024" with month: 'short'
    expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument()
  })
})

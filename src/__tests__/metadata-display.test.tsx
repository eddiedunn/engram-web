import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetadataDisplay } from '../components/MetadataDisplay'

describe('MetadataDisplay', () => {
  it('returns null when metadata is null', () => {
    const { container } = render(
      <MetadataDisplay metadata={null} contentType="youtube" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when metadata has no displayable fields', () => {
    const { container } = render(
      <MetadataDisplay
        metadata={{ segments: [], speakers: ['A'], speaker_count: 2 }}
        contentType="youtube"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('displays author field', () => {
    render(
      <MetadataDisplay metadata={{ author: 'John Doe' }} contentType="youtube" />
    )
    expect(screen.getByText('Author:')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('formats duration from seconds correctly (hours)', () => {
    render(
      <MetadataDisplay
        metadata={{ duration_seconds: 3661 }}
        contentType="youtube"
      />
    )
    expect(screen.getByText('Duration:')).toBeInTheDocument()
    expect(screen.getByText('1:01:01')).toBeInTheDocument()
  })

  it('formats duration from seconds correctly (minutes only)', () => {
    render(
      <MetadataDisplay
        metadata={{ duration_seconds: 125 }}
        contentType="podcast"
      />
    )
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('formats duration at zero', () => {
    render(
      <MetadataDisplay
        metadata={{ duration_seconds: 0 }}
        contentType="youtube"
      />
    )
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('formats published_at as a date', () => {
    render(
      <MetadataDisplay
        metadata={{ published_at: '2024-06-15T12:00:00Z' }}
        contentType="article"
      />
    )
    expect(screen.getByText('Published:')).toBeInTheDocument()
    // toLocaleDateString with month: 'long' → "June 15, 2024"
    expect(screen.getByText(/June 15, 2024/)).toBeInTheDocument()
  })

  it('formats remaining scalar fields with capitalized labels', () => {
    render(
      <MetadataDisplay
        metadata={{ view_count: 1000000 }}
        contentType="youtube"
      />
    )
    expect(screen.getByText('View Count:')).toBeInTheDocument()
    expect(screen.getByText('1,000,000')).toBeInTheDocument()
  })

  it('displays boolean values as Yes/No', () => {
    render(
      <MetadataDisplay
        metadata={{ is_live: true, has_captions: false }}
        contentType="youtube"
      />
    )
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('skips hidden fields (segments, speakers, speaker_count, description)', () => {
    render(
      <MetadataDisplay
        metadata={{
          author: 'Jane',
          segments: [1, 2, 3],
          speakers: ['A'],
          speaker_count: 2,
          description: 'hidden',
        }}
        contentType="youtube"
      />
    )
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.queryByText('Segments:')).not.toBeInTheDocument()
    expect(screen.queryByText('Speakers:')).not.toBeInTheDocument()
    expect(screen.queryByText('Speaker Count:')).not.toBeInTheDocument()
    expect(screen.queryByText('Description:')).not.toBeInTheDocument()
  })

  it('skips object and null/undefined values in remaining fields', () => {
    render(
      <MetadataDisplay
        metadata={{
          author: 'Test',
          nested_obj: { a: 1 },
          empty_val: null,
          undef_val: undefined,
        }}
        contentType="article"
      />
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.queryByText('Nested Obj:')).not.toBeInTheDocument()
    expect(screen.queryByText('Empty Val:')).not.toBeInTheDocument()
  })
})

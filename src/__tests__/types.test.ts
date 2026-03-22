import { describe, it, expect } from 'vitest'
import { ContentType } from '../api/types'

describe('ContentType', () => {
  it('has all expected content type values', () => {
    expect(ContentType.YOUTUBE).toBe('youtube')
    expect(ContentType.ARTICLE).toBe('article')
    expect(ContentType.PODCAST).toBe('podcast')
    expect(ContentType.DOCUMENT).toBe('document')
    expect(ContentType.NOTE).toBe('note')
    expect(ContentType.MEETING).toBe('meeting')
    expect(ContentType.OTHER).toBe('other')
  })

  it('has exactly 7 content types', () => {
    expect(Object.keys(ContentType)).toHaveLength(7)
  })
})

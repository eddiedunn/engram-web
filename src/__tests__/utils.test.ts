import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes (falsy values)', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('merges tailwind classes intelligently (twMerge)', () => {
    // twMerge should deduplicate conflicting classes
    expect(cn('px-4', 'px-2')).toBe('px-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles array input via clsx', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

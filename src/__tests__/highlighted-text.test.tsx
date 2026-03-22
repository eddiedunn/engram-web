import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HighlightedText } from '../components/HighlightedText'

describe('HighlightedText', () => {
  it('renders plain text when search term is empty', () => {
    render(<HighlightedText text="Hello world" searchTerm="" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.queryByRole('mark')).not.toBeInTheDocument()
  })

  it('renders plain text when search term is whitespace only', () => {
    render(<HighlightedText text="Hello world" searchTerm="   " />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('highlights matching text case-insensitively', () => {
    const { container } = render(
      <HighlightedText text="Hello World hello" searchTerm="hello" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    expect(marks[0].textContent).toBe('Hello')
    expect(marks[1].textContent).toBe('hello')
  })

  it('preserves non-matching text between highlights', () => {
    const { container } = render(
      <HighlightedText text="abc test xyz test end" searchTerm="test" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    // The full text should still be present
    expect(container.textContent).toBe('abc test xyz test end')
  })

  it('escapes regex special characters in search term', () => {
    const { container } = render(
      <HighlightedText text="price is $100.00 total" searchTerm="$100.00" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('$100.00')
  })

  it('handles search term with parentheses and brackets', () => {
    const { container } = render(
      <HighlightedText text="call foo(bar) here" searchTerm="foo(bar)" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('foo(bar)')
  })

  it('applies className to wrapper span', () => {
    const { container } = render(
      <HighlightedText text="test" searchTerm="" className="my-class" />
    )
    expect(container.querySelector('.my-class')).toBeInTheDocument()
  })

  it('renders correctly when search term is not found in text', () => {
    const { container } = render(
      <HighlightedText text="Hello world" searchTerm="xyz" />
    )
    expect(container.querySelectorAll('mark')).toHaveLength(0)
    expect(container.textContent).toBe('Hello world')
  })

  it('handles text that is entirely the search term', () => {
    const { container } = render(
      <HighlightedText text="hello" searchTerm="hello" />
    )
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('hello')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '../components/EmptyState'

describe('EmptyState', () => {
  it('renders search variant by default', () => {
    render(<EmptyState />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(
      screen.getByText(/Try adjusting your search query/)
    ).toBeInTheDocument()
  })

  it('renders content variant', () => {
    render(<EmptyState variant="content" />)
    expect(screen.getByText('No content available')).toBeInTheDocument()
  })

  it('renders filter variant with default action label', () => {
    const onAction = vi.fn()
    render(<EmptyState variant="filter" onAction={onAction} />)
    expect(screen.getByText('No content found')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /clear filters/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('uses custom title and description', () => {
    render(
      <EmptyState
        title="Custom Title"
        description="Custom description text"
      />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('does not render action button without onAction', () => {
    render(<EmptyState variant="filter" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not render action button without actionLabel', () => {
    render(<EmptyState variant="search" onAction={() => {}} />)
    // search variant has no default actionLabel
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses custom action label', () => {
    render(
      <EmptyState
        variant="search"
        onAction={() => {}}
        actionLabel="Try Again"
      />
    )
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(<EmptyState />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'No results found')
  })
})

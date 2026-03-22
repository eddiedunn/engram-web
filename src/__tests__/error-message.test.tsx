import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from '../components/ErrorMessage'

describe('ErrorMessage', () => {
  it('displays default title and message when no props given', () => {
    render(<ErrorMessage />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('displays custom title and message', () => {
    render(<ErrorMessage title="Custom Error" message="Something broke" />)
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Something broke')).toBeInTheDocument()
  })

  it('extracts message from error object when no message prop', () => {
    const error = new Error('Network timeout')
    render(<ErrorMessage error={error} />)
    expect(screen.getByText('Network timeout')).toBeInTheDocument()
  })

  it('prefers message prop over error.message', () => {
    const error = new Error('Network timeout')
    render(<ErrorMessage error={error} message="Custom message" />)
    expect(screen.getByText('Custom message')).toBeInTheDocument()
    expect(screen.queryByText('Network timeout')).not.toBeInTheDocument()
  })

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorMessage onRetry={onRetry} />)
    const retryBtn = screen.getByRole('button', { name: /retry/i })
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('does not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(<ErrorMessage />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RestoreSessionBanner } from '@/shared/components/RestoreSessionBanner'

function setup(overrides: Partial<React.ComponentProps<typeof RestoreSessionBanner>> = {}) {
  const props = {
    imageCount: 3,
    savedAt: new Date(2026, 0, 1, 14, 30).getTime(),
    onRestore: vi.fn(),
    onClear: vi.fn(),
    onDismiss: vi.fn(),
    ...overrides,
  }
  render(<RestoreSessionBanner {...props} />)
  return props
}

describe('RestoreSessionBanner', () => {
  it('shows the image count and save time', () => {
    setup()
    expect(screen.getByText(/Pick up where you left off\?/)).toBeInTheDocument()
    expect(screen.getByText(/3 images · saved/)).toBeInTheDocument()
  })

  it('singularises the image count', () => {
    setup({ imageCount: 1 })
    expect(screen.getByText(/1 image · saved/)).toBeInTheDocument()
  })

  it('shows the storage label when provided', () => {
    setup({ storageLabel: '2.1 MB of 1.2 GB' })
    expect(screen.getByText(/2\.1 MB of 1\.2 GB/)).toBeInTheDocument()
  })

  it('fires the three actions', async () => {
    const props = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(props.onRestore).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Clear saved' }))
    expect(props.onClear).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: /Dismiss/ }))
    expect(props.onDismiss).toHaveBeenCalledTimes(1)
  })

  it('disables the actions while a restore is in flight', async () => {
    const props = setup({ isRestoring: true })

    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clear saved' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Dismiss/ })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(props.onRestore).not.toHaveBeenCalled()
  })
})

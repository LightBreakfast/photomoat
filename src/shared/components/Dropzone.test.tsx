import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Dropzone } from '@/shared/components/Dropzone'

const jpgFile = new File(['jpg'], 'portrait.jpg', { type: 'image/jpeg' })
const pngFile = new File(['png'], 'square.png', { type: 'image/png' })
const txtFile = new File(['txt'], 'notes.txt', { type: 'text/plain' })

describe('Dropzone', () => {
  it('accepts valid files from file input', () => {
    const onFilesAccepted = vi.fn()
    render(<Dropzone onFilesAccepted={onFilesAccepted} />)

    const input = screen.getByLabelText(/choose files/i, { selector: 'input' })
    fireEvent.change(input, { target: { files: [jpgFile, pngFile] } })

    expect(onFilesAccepted).toHaveBeenCalledWith([jpgFile, pngFile])
  })

  it('shows an error for invalid files', () => {
    const onFilesAccepted = vi.fn()
    render(<Dropzone onFilesAccepted={onFilesAccepted} />)

    const input = screen.getByLabelText(/choose files/i, { selector: 'input' })
    fireEvent.change(input, { target: { files: [txtFile] } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unsupported file type. Use JPG or PNG.',
    )
    expect(onFilesAccepted).not.toHaveBeenCalled()
  })

  it('is keyboard accessible', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')
    render(<Dropzone onFilesAccepted={vi.fn()} />)

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })

    expect(clickSpy).toHaveBeenCalled()
  })
})

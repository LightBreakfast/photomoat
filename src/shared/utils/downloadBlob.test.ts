import { describe, expect, it, vi } from 'vitest'

import { canvasToBlob } from '@/shared/utils/downloadBlob'

describe('canvasToBlob', () => {
  it('requests the expected MIME type from the canvas', async () => {
    const toBlob = vi.fn((callback: BlobCallback, type?: string) => {
      callback(new Blob(['ok'], { type }))
    })

    const blob = await canvasToBlob({ toBlob }, 'image/png', 0.92)

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined)
    expect(blob.type).toBe('image/png')
  })
})

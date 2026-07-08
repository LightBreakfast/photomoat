import { describe, expect, it } from 'vitest'

import { createBorderedFilename, getBaseFilename } from '@/shared/utils/filename'

describe('filename helpers', () => {
  it('removes an extension from the original filename', () => {
    expect(getBaseFilename('portrait.final.jpg')).toBe('portrait.final')
  })

  it('creates the bordered filename pattern', () => {
    expect(createBorderedFilename('portrait.final.jpg', 'image/png')).toBe(
      'portrait.final-bordered.png',
    )
  })
})

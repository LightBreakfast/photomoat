import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatBytes, getStorageUsage, requestPersistence } from '@/shared/storage/quota'

function stubNavigatorStorage(storage: unknown) {
  vi.stubGlobal('navigator', { storage })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('quota', () => {
  describe('requestPersistence', () => {
    it('requests persist and returns the grant result', async () => {
      const persist = vi.fn().mockResolvedValue(true)
      stubNavigatorStorage({ persist })

      expect(await requestPersistence()).toBe(true)
      expect(persist).toHaveBeenCalledOnce()
    })

    it('returns false when persist rejects', async () => {
      stubNavigatorStorage({ persist: vi.fn().mockRejectedValue(new Error('nope')) })
      expect(await requestPersistence()).toBe(false)
    })

    it('returns false when storage API is unavailable', async () => {
      stubNavigatorStorage(undefined)
      expect(await requestPersistence()).toBe(false)
    })
  })

  describe('getStorageUsage', () => {
    it('returns usage and quota', async () => {
      stubNavigatorStorage({ estimate: vi.fn().mockResolvedValue({ usage: 1024, quota: 10240 }) })
      expect(await getStorageUsage()).toEqual({ usage: 1024, quota: 10240 })
    })

    it('returns null when estimate rejects', async () => {
      stubNavigatorStorage({ estimate: vi.fn().mockRejectedValue(new Error('nope')) })
      expect(await getStorageUsage()).toBeNull()
    })

    it('returns null when storage is unavailable', async () => {
      stubNavigatorStorage(undefined)
      expect(await getStorageUsage()).toBeNull()
    })
  })

  describe('formatBytes', () => {
    it('formats common sizes', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(512)).toBe('512 B')
      expect(formatBytes(2048)).toBe('2 KB')
      expect(formatBytes(3_145_728)).toBe('3 MB')
      expect(formatBytes(5_000_000_000)).toBe('4.7 GB')
    })

    it('tolerates non-finite input', () => {
      expect(formatBytes(Number.NaN)).toBe('0 B')
      expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
    })
  })
})

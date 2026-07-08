import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

class LocalStorageMock {
  private storage = new Map<string, string>()

  clear() {
    this.storage.clear()
  }

  getItem(key: string) {
    return this.storage.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.storage.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.storage.delete(key)
  }

  setItem(key: string, value: string) {
    this.storage.set(key, value)
  }

  get length() {
    return this.storage.size
  }
}

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  value: true,
  writable: true,
})

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  configurable: true,
})

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  configurable: true,
})

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.className = ''
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

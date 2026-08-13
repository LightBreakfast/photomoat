import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ImageHistory, ImageEditRecipe } from '@/features/borders/types'
import { resetDB } from '@/shared/storage/db'
import { getImage, saveImage } from '@/shared/storage/fileStore'
import {
  loadSession,
  saveSession,
} from '@/shared/storage/sessionStore'
import {
  SESSION_SCHEMA_VERSION,
  type PersistedSession,
  type PersistedUiState,
} from '@/shared/storage/types'
import {
  useSessionPersistence,
  type PersistenceStatus,
} from '@/shared/storage/useSessionPersistence'
import type { ImageQueueItem } from '@/shared/types'

vi.mock('@/shared/storage/sessionStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/storage/sessionStore')>()
  return {
    ...actual,
    loadSession: vi.fn(actual.loadSession),
  }
})

const defaultRecipe: ImageEditRecipe = {
  presetId: 'instagram-square',
  backgroundColor: '#ffffff',
  imageSizingMode: 'contain',
  imageEdgePixels: 900,
  borderWidthPixels: 90,
  minVerticalPaddingPixels: 90,
  customWidth: 1080,
  customHeight: 1080,
  filterPresetId: 'original',
  rotationDegrees: 0,
  flipHorizontal: false,
  flipVertical: false,
}

const defaultUi: PersistedUiState = {
  workspaceMode: 'browse',
  activeItemId: null,
  selectedIds: [],
  inspectZoom: { mode: 'fit' },
  columns: 3,
}

function makeItem(id: string): ImageQueueItem {
  return {
    id,
    file: new File(['x'], `${id}.jpg`, { type: 'image/jpeg' }),
    objectUrl: `blob:${id}`,
    filename: `${id}.jpg`,
    mimeType: 'image/jpeg',
    status: 'ready',
    originalWidth: 100,
    originalHeight: 100,
  }
}

function makeHistory(): ImageHistory {
  return {
    past: [],
    present: { recipe: defaultRecipe, label: 'Original', timestamp: 1 },
    future: [],
  }
}

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: 1_700_000_000_000,
    items: [{ id: 'img-1', filename: 'img-1.jpg', mimeType: 'image/jpeg', status: 'ready' }],
    edits: { 'img-1': makeHistory() },
    ui: defaultUi,
    ...overrides,
  }
}

function setupHook(items: ImageQueueItem[] = [], onRestore = vi.fn().mockResolvedValue(undefined)) {
  let uiState: PersistedUiState = { ...defaultUi }
  const recipesById: Record<string, ImageHistory> = {}
  for (const item of items) {
    recipesById[item.id] = makeHistory()
  }

  const utils = renderHook(
    ({ queueItems, ui }) =>
      useSessionPersistence({
        items: queueItems,
        recipesById,
        uiState: ui,
        onRestore,
      }),
    { initialProps: { queueItems: items, ui: uiState } },
  )

  return {
    ...utils,
    onRestore,
    uiState,
    recipesById,
    getStatus: () => utils.result.current.status as PersistenceStatus,
    rerenderWith: (queueItems: ImageQueueItem[], nextUi: PersistedUiState = uiState) =>
      utils.rerender({ queueItems, ui: nextUi }),
  }
}

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  })
}

beforeEach(async () => {
  await resetDB()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSessionPersistence', () => {
  it('starts idle when nothing is stored', async () => {
    const { getStatus } = setupHook()
    await flush()
    expect(getStatus()).toEqual({ status: 'idle' })
  })

  it('offers restore when a session is stored', async () => {
    const session = makeSession()
    await saveSession(session)

    const { getStatus } = setupHook()
    await flush()

    const status = getStatus()
    expect(status.status).toBe('offer-restore')
    if (status.status === 'offer-restore') {
      expect(status.session).toEqual(session)
    }
  })

  it('acceptRestore calls onRestore and activates saving', async () => {
    const session = makeSession()
    await saveSession(session)

    const onRestore = vi.fn().mockResolvedValue(undefined)
    const { getStatus, result, rerenderWith } = setupHook([], onRestore)
    await flush()

    expect(getStatus().status).toBe('offer-restore')
    await act(async () => {
      await result.current.acceptRestore()
    })

    expect(onRestore).toHaveBeenCalledWith(session)
    expect(getStatus().status).toBe('active')

    rerenderWith([makeItem('img-1')])
    await flush(400)

    const saved = await loadSession()
    expect(saved).not.toBeNull()
    expect(saved?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('dismiss keeps the stored data and disables saving until images are added', async () => {
    const session = makeSession()
    await saveSession(session)

    const { getStatus, result, rerenderWith } = setupHook()
    await flush()

    await act(async () => {
      result.current.dismiss()
    })
    expect(getStatus().status).toBe('idle')
    expect(await loadSession()).toEqual(session) // data kept on disk

    rerenderWith([makeItem('img-1')])
    await flush() // let the deferred auto-start activate saving
    await flush(400)

    expect(getStatus().status).toBe('active')
    const stored = await loadSession()
    expect(stored?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('adding the first image with nothing stored starts saving', async () => {
    const { getStatus, rerenderWith } = setupHook()
    await flush()
    expect(getStatus().status).toBe('idle')

    rerenderWith([makeItem('img-1')])
    await flush()
    expect(getStatus().status).toBe('active')

    await flush(400)
    const saved = await loadSession()
    expect(saved?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('adding the first image while an offer is pending clears the stale session', async () => {
    await saveSession(makeSession())
    await saveImage('img-1', makeItem('img-1').file)

    const { getStatus, rerenderWith } = setupHook()
    await flush()
    expect(getStatus().status).toBe('offer-restore')

    rerenderWith([makeItem('img-1')])
    await flush() // let the deferred auto-start activate saving
    await flush(400)

    expect(getStatus().status).toBe('active')
    const stored = await loadSession()
    expect(stored?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('an empty library clears the session doc instead of saving an empty one', async () => {
    const { rerenderWith } = setupHook()
    await flush()

    rerenderWith([makeItem('img-1')])
    await flush() // let the deferred auto-start activate saving
    await flush(400)
    expect(await loadSession()).not.toBeNull()

    rerenderWith([])
    await flush()
    await flush(400)
    expect(await loadSession()).toBeNull()
  })

  it('exposes a non-blocking warning when storage is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined)
    try {
      const { result, rerenderWith } = setupHook()
      await flush()
      rerenderWith([makeItem('img-1')])
      await flush()

      expect(result.current.persistenceWarning).toContain('will not survive refresh')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('finishes fresh-session cleanup before new file bytes are written', async () => {
    await saveSession(makeSession())
    await saveImage('img-1', makeItem('img-1').file)

    const { result } = setupHook()
    await flush()
    expect((result.current.status as PersistenceStatus).status).toBe('offer-restore')

    await act(async () => {
      result.current.dismiss()
      await result.current.startFresh()
    })

    expect(await getImage('img-1')).toBeNull()
    expect(await saveImage('img-new', makeItem('img-new').file)).toBe(true)
    expect(await getImage('img-new')).not.toBeNull()
  })

  it('clearLibrary wipes the session and files', async () => {
    await saveSession(makeSession())
    await saveImage('img-1', makeItem('img-1').file)

    const { getStatus, result } = setupHook()
    await flush()

    await act(async () => {
      await result.current.clearLibrary()
    })

    expect(getStatus().status).toBe('idle')
    expect(await loadSession()).toBeNull()
  })

  it('flushes a save when the page becomes hidden', async () => {
    const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState')
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })

    try {
      const { rerenderWith } = setupHook()
      await flush()

      rerenderWith([makeItem('img-1')])
      await flush()
      expect(await loadSession()).toBeNull() // nothing saved yet (debounce pending)

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'))
      })

      const saved = await loadSession()
      expect(saved?.items.map((item) => item.id)).toEqual(['img-1'])
    } finally {
      if (originalVisibility) {
        Object.defineProperty(document, 'visibilityState', originalVisibility)
      }
    }
  })

  it('restores saving after clearLibrary once the queue empties and refills', async () => {
    const { getStatus, result, rerenderWith } = setupHook()
    await flush()

    rerenderWith([makeItem('img-1')])
    await flush()
    expect(getStatus().status).toBe('active')

    await act(async () => {
      await result.current.clearLibrary()
    })
    expect(getStatus().status).toBe('idle')
    expect(await loadSession()).toBeNull()

    rerenderWith([makeItem('img-2')])
    await flush(400)
    expect(getStatus().status).toBe('idle')

    rerenderWith([])
    await flush()
    rerenderWith([makeItem('img-3')])
    await flush() // let the deferred auto-start activate saving
    await flush(400)
    expect(getStatus().status).toBe('active')
    const saved = await loadSession()
    expect(saved?.items.map((item) => item.id)).toEqual(['img-3'])
  })

  it('does not save session metadata before image bytes are durable', async () => {
    const { rerenderWith } = setupHook()
    await flush()

    const pendingItem = { ...makeItem('img-1'), persisted: false }
    rerenderWith([pendingItem])
    await flush()
    await flush(400)
    expect(await loadSession()).toBeNull()

    rerenderWith([{ ...pendingItem, persisted: true }])
    await flush(400)
    expect((await loadSession())?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('persists UI-only changes after the debounce', async () => {
    const { rerenderWith } = setupHook()
    await flush()

    rerenderWith([makeItem('img-1')])
    await flush() // let the deferred auto-start activate saving
    await flush(400)
    expect(await loadSession()).not.toBeNull()

    rerenderWith([makeItem('img-1')], {
      workspaceMode: 'inspect',
      activeItemId: 'img-1',
      selectedIds: [],
      inspectZoom: { mode: 'percent', percent: 100 },
      columns: 2,
    })
    await flush(400)

    const saved = await loadSession()
    expect(saved?.ui.workspaceMode).toBe('inspect')
    expect(saved?.ui.activeItemId).toBe('img-1')
    expect(saved?.ui.inspectZoom).toEqual({ mode: 'percent', percent: 100 })
    expect(saved?.ui.columns).toBe(2)
  })

  it('a user add before the initial lookup settles wins over a stored session', async () => {
    const session = makeSession()
    let resolveLoad!: (value: PersistedSession | null) => void
    const loadPromise = new Promise<PersistedSession | null>((resolve) => {
      resolveLoad = resolve
    })
    vi.mocked(loadSession).mockImplementationOnce(() => loadPromise)

    const { getStatus, rerenderWith } = setupHook()
    await flush()
    expect(getStatus().status).toBe('idle') // lookup still pending

    rerenderWith([makeItem('img-1')])
    await flush()
    expect(getStatus().status).not.toBe('offer-restore')

    await act(async () => {
      resolveLoad(session)
    })
    await flush(0)
    expect(getStatus().status).toBe('active')

    await flush()
    await flush(400)
    expect((await loadSession())?.items.map((item) => item.id)).toEqual(['img-1'])
  })

  it('does not start fresh while restoration is in flight', async () => {
    const session = makeSession()
    await saveSession(session)

    let resolveRestore!: () => void
    const onRestore = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRestore = resolve
        }),
    )
    const { result } = setupHook([], onRestore)
    await flush()

    let restorePromise!: Promise<void>
    act(() => {
      restorePromise = result.current.acceptRestore()
    })

    expect(await result.current.startFresh()).toBe(false)
    expect(await result.current.clearLibrary()).toBe(false)
    expect(await loadSession()).toEqual(session)

    await act(async () => {
      resolveRestore()
      await restorePromise
    })
  })

  it('ignores a second restore while one is already in flight', async () => {
    const session = makeSession()
    await saveSession(session)

    let resolveRestore!: () => void
    const onRestore = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRestore = resolve
        }),
    )
    const { getStatus, result } = setupHook([], onRestore)
    await flush()
    expect(getStatus().status).toBe('offer-restore')

    let first: Promise<void>
    await act(async () => {
      first = result.current.acceptRestore()
      await result.current.acceptRestore() // second trigger while in flight
    })
    expect(onRestore).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRestore()
      await first
    })
    expect(getStatus().status).toBe('active')
  })
})

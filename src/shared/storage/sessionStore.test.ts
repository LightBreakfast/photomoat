import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultImageRecipe } from '@/features/borders/defaultImageRecipe'
import { getDB, resetDB } from '@/shared/storage/db'
import { getImage, saveImage } from '@/shared/storage/fileStore'
import {
  clearSession,
  loadSession,
  sanitizePersistedSession,
  saveSession,
} from '@/shared/storage/sessionStore'
import {
  SESSION_SCHEMA_VERSION,
  type PersistedSession,
} from '@/shared/storage/types'

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: 1_700_000_000_000,
    items: [
      {
        id: 'img-1',
        filename: 'beach.jpg',
        mimeType: 'image/jpeg',
        originalWidth: 1200,
        originalHeight: 800,
        status: 'ready',
      },
    ],
    edits: {
      'img-1': {
        past: [
          {
            recipe: { ...defaultImageRecipe, presetId: 'instagram-square' },
            label: 'Original',
            timestamp: 1_700_000_000_000,
          },
        ],
        present: {
          recipe: { ...defaultImageRecipe, presetId: 'instagram-square' },
          label: 'Preset: Square',
          timestamp: 1_700_000_000_001,
        },
        future: [],
      },
    },
    ui: {
      workspaceMode: 'browse',
      activeItemId: null,
      selectedIds: [],
      inspectZoom: { mode: 'fit' },
      columns: 3,
    },
    ...overrides,
  }
}

beforeEach(async () => {
  await resetDB()
})

describe('sessionStore', () => {
  it('round-trips a session', async () => {
    const session = makeSession()
    await saveSession(session)

    const loaded = await loadSession()
    expect(loaded).toEqual(session)
  })

  it('returns null when nothing is stored', async () => {
    expect(await loadSession()).toBeNull()
  })

  it('does not clear files when the session key is absent', async () => {
    expect(await saveImage('orphan', new File(['x'], 'orphan.jpg', { type: 'image/jpeg' }))).toBe(true)

    expect(await loadSession()).toBeNull()
    expect(await getImage('orphan')).not.toBeNull()
  })

  it('clears and returns null for a wrong schema version', async () => {
    const db = (await getDB())!
    await db.put('kv', { ...makeSession(), schemaVersion: 999 }, 'session')

    expect(await loadSession()).toBeNull()
    expect(await db.get('kv', 'session')).toBeUndefined()
  })

  it('clears stored image files together with an invalid session', async () => {
    const db = (await getDB())!
    await db.put('kv', { ...makeSession(), schemaVersion: 999 }, 'session')
    await saveImage('img-1', new File(['x'], 'beach.jpg', { type: 'image/jpeg' }))

    expect(await loadSession()).toBeNull()
    expect(await db.get('kv', 'session')).toBeUndefined()
    expect(await getImage('img-1')).toBeNull()
  })

  it('degrades to in-memory when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined)
    try {
      expect(await saveSession(makeSession())).toBe(false)
      expect(await loadSession()).toBeNull()
      expect(
        await saveImage('img-1', new File(['x'], 'beach.jpg', { type: 'image/jpeg' })),
      ).toBe(false)
      expect(await getImage('img-1')).toBeNull()
      expect(await clearSession()).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('clears and returns null for non-object data', async () => {
    const db = (await getDB())!
    await db.put('kv', 'garbage', 'session')

    expect(await loadSession()).toBeNull()
    expect(await db.get('kv', 'session')).toBeUndefined()
  })

  it('clearSession removes the stored doc', async () => {
    await saveSession(makeSession())
    await clearSession()
    expect(await loadSession()).toBeNull()
  })

  it('sanitizePersistedSession normalizes bad queue items, edits and ui', () => {
    const session = makeSession({
      items: [
        { id: 'good', filename: 'ok.jpg', mimeType: 'image/jpeg', status: 'ready' },
        { id: 'bad-status', filename: 'x.jpg', mimeType: 'image/jpeg', status: 'processing' } as never,
        { id: 'bad-type', filename: 'y.gif', mimeType: 'image/gif', status: 'ready' } as never,
      ],
      edits: {
        good: {
          past: [],
          present: {
            recipe: { presetId: 'instagram-square' } as never,
            label: 'Original',
            timestamp: 1,
          },
          future: [],
        },
        ghost: {
          past: [],
          present: {
            recipe: { presetId: 'instagram-square' } as never,
            label: 'Original',
            timestamp: 1,
          },
          future: [],
        },
      },
      ui: {
        workspaceMode: 'inspect',
        activeItemId: 'ghost',
        selectedIds: ['good', 'ghost'],
        inspectZoom: { mode: 'percent', percent: 50 },
        columns: 99,
      },
    })

    const sanitized = sanitizePersistedSession(session)
    expect(sanitized).not.toBeNull()
    expect(sanitized?.items.map((item) => item.id)).toEqual(['good'])
    expect(Object.keys(sanitized?.edits ?? {})).toEqual(['good'])
    expect(sanitized?.ui.activeItemId).toBeNull()
    expect(sanitized?.ui.selectedIds).toEqual(['good'])
    expect(sanitized?.ui.columns).toBe(6)
    expect(sanitized?.ui.workspaceMode).toBe('inspect')
  })

  it('sanitizePersistedSession rejects unknown zoom values', () => {
    const session = makeSession({
      ui: { ...makeSession().ui, inspectZoom: { mode: 'percent', percent: 73 } as never },
    })
    expect(sanitizePersistedSession(session)?.ui.inspectZoom).toEqual({ mode: 'fit' })
  })

  it('sanitizePersistedSession drops invalid history entries but keeps the rest', () => {
    const session = makeSession({
      edits: {
        'img-1': {
          past: [{ label: 'missing recipe', timestamp: 1 } as never],
          present: {
            recipe: { presetId: 'instagram-square' } as never,
            label: 'Present',
            timestamp: 2,
          },
          future: [{ recipe: { presetId: 'custom' } as never, label: 'Future', timestamp: 3 }],
        },
      },
    })

    const sanitized = sanitizePersistedSession(session)
    expect(sanitized?.edits['img-1'].past).toEqual([])
    expect(sanitized?.edits['img-1'].present.label).toBe('Present')
    expect(sanitized?.edits['img-1'].future).toHaveLength(1)
  })

  it('sanitizePersistedSession normalizes invalid recipe fields to defaults', () => {
    const session = makeSession({
      edits: {
        'img-1': {
          past: [],
          present: {
            recipe: {
              presetId: 'bogus-preset',
              backgroundColor: 'not-a-color',
              imageSizingMode: 'stretch',
              imageEdgePixels: -5,
              borderWidthPixels: NaN,
              minVerticalPaddingPixels: 0,
              customWidth: 1_000_000,
              customHeight: -42,
              filterPresetId: 'vivid',
              rotationDegrees: '90',
              flipHorizontal: 'yes',
              flipVertical: 1,
            } as never,
            label: 'Broken',
            timestamp: 2,
          },
          future: [],
        },
      },
    })

    const recipe = sanitizePersistedSession(session)?.edits['img-1'].present.recipe
    // Strings/booleans fall back to defaults; numbers are clamped per the
    // useBorderSettings sanitizeSettings convention.
    expect(recipe).toEqual({
      ...defaultImageRecipe,
      imageEdgePixels: 1,
      minVerticalPaddingPixels: 1,
      customWidth: 10000,
      customHeight: 100,
    })
  })

  it('sanitizePersistedSession keeps valid recipe overrides', () => {
    const session = makeSession({
      edits: {
        'img-1': {
          past: [],
          present: {
            recipe: {
              ...defaultImageRecipe,
              presetId: 'custom',
              imageSizingMode: 'fill',
              filterPresetId: 'ember',
              rotationDegrees: 90,
              flipHorizontal: true,
              customWidth: 2000,
            },
            label: 'Edited',
            timestamp: 2,
          },
          future: [],
        },
      },
    })

    const recipe = sanitizePersistedSession(session)?.edits['img-1'].present.recipe
    expect(recipe).toMatchObject({
      presetId: 'custom',
      imageSizingMode: 'fill',
      filterPresetId: 'ember',
      rotationDegrees: 90,
      flipHorizontal: true,
      customWidth: 2000,
    })
  })
})

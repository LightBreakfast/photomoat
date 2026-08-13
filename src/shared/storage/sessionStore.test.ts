import { beforeEach, describe, expect, it } from 'vitest'

import { getDB, resetDB } from '@/shared/storage/db'
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
            recipe: { presetId: 'instagram-square', backgroundColor: '#ffffff' } as never,
            label: 'Original',
            timestamp: 1_700_000_000_000,
          },
        ],
        present: {
          recipe: { presetId: 'instagram-square' } as never,
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

  it('clears and returns null for a wrong schema version', async () => {
    const db = (await getDB())!
    await db.put('kv', { ...makeSession(), schemaVersion: 999 }, 'session')

    expect(await loadSession()).toBeNull()
    expect(await db.get('kv', 'session')).toBeUndefined()
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
})

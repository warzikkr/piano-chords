import { expect, test } from 'vitest'
import { SYNC_KEY, loadSyncConfig, saveSyncConfig } from './syncConfig'

test('sync config round-trips through storage and tolerates garbage', () => {
  const store: Record<string, string> = {}
  const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v), removeItem: (k: string) => void delete store[k] }
  expect(loadSyncConfig(storage)).toBeNull()
  saveSyncConfig(storage, { token: 't', gistId: 'g', login: 'me' })
  expect(loadSyncConfig(storage)).toEqual({ token: 't', gistId: 'g', login: 'me' })
  store[SYNC_KEY] = '{bad'
  expect(loadSyncConfig(storage)).toBeNull()
  saveSyncConfig(storage, null)
  expect(store[SYNC_KEY]).toBeUndefined()
})

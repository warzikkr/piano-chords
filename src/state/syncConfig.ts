import { isValidToken, type SyncConfig } from './remote'

export const SYNC_KEY = 'piano-chords:sync'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadSyncConfig(storage: StorageLike): SyncConfig | null {
  try {
    const raw = storage.getItem(SYNC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SyncConfig>
    if (typeof parsed.token !== 'string' || !isValidToken(parsed.token)) return null
    return { token: parsed.token }
  } catch {
    return null
  }
}

export function saveSyncConfig(storage: StorageLike, cfg: SyncConfig | null): void {
  try {
    if (cfg) storage.setItem(SYNC_KEY, JSON.stringify(cfg))
    else storage.removeItem(SYNC_KEY)
  } catch {
    // Storage may be unavailable; sync then lasts for this page only.
  }
}

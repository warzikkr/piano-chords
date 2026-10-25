import type { GistConfig } from './gist'

export const SYNC_KEY = 'piano-chords:sync'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadSyncConfig(storage: StorageLike): GistConfig | null {
  try {
    const raw = storage.getItem(SYNC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GistConfig>
    if (typeof parsed.token !== 'string' || typeof parsed.gistId !== 'string' || typeof parsed.login !== 'string') return null
    return { token: parsed.token, gistId: parsed.gistId, login: parsed.login }
  } catch {
    return null
  }
}

export function saveSyncConfig(storage: StorageLike, cfg: GistConfig | null): void {
  try {
    if (cfg) storage.setItem(SYNC_KEY, JSON.stringify(cfg))
    else storage.removeItem(SYNC_KEY)
  } catch {
    // Storage may be unavailable; sync then lasts for this page only.
  }
}

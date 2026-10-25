import type { GistApi, GistConfig } from './gist'
import { mergeProgress } from './merge'
import { exportProgress, type Progress } from './progress'

export type SyncStatus = { state: 'off' } | { state: 'syncing' } | { state: 'ok'; at: number } | { state: 'error'; message: string }

export interface SyncEngine {
  /** Pulls the remote copy, merges it into local progress and uploads the result. */
  start(cfg: GistConfig): void
  stop(): void
  /** Call after every local change; uploads are debounced and skipped when nothing changed. */
  onProgressChanged(p: Progress): void
  pullNow(): Promise<void>
}

interface Options {
  api: GistApi
  getProgress: () => Progress
  applyMerged: (p: Progress) => void
  onStatus: (s: SyncStatus) => void
  debounceMs?: number
}

export function createSyncEngine({ api, getProgress, applyMerged, onStatus, debounceMs = 4000 }: Options): SyncEngine {
  let cfg: GistConfig | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastSynced = ''
  let busy: Promise<void> = Promise.resolve()

  const fail = (err: unknown) => onStatus({ state: 'error', message: err instanceof Error ? err.message : 'Не удалось синхронизировать' })

  async function push(p: Progress): Promise<void> {
    if (!cfg) return
    const text = exportProgress(p)
    if (text === lastSynced) return
    await api.push(cfg, p)
    lastSynced = text
  }

  async function pullMerge(): Promise<void> {
    if (!cfg) return
    onStatus({ state: 'syncing' })
    const local = getProgress()
    const remote = await api.pull(cfg)
    const merged = remote ? mergeProgress(local, remote) : local
    if (exportProgress(merged) !== exportProgress(local)) applyMerged(merged)
    if (!remote || exportProgress(merged) !== exportProgress(remote)) await push(merged)
    else lastSynced = exportProgress(remote)
    onStatus({ state: 'ok', at: Date.now() })
  }

  function run(task: () => Promise<void>): Promise<void> {
    busy = busy.then(task).catch(fail)
    return busy
  }

  return {
    start(next) {
      cfg = next
      lastSynced = ''
      void run(pullMerge)
    },
    stop() {
      cfg = null
      if (timer) clearTimeout(timer)
      timer = null
      onStatus({ state: 'off' })
    },
    onProgressChanged(p) {
      if (!cfg) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        void run(async () => {
          if (exportProgress(p) === lastSynced) return
          onStatus({ state: 'syncing' })
          await push(getProgress())
          onStatus({ state: 'ok', at: Date.now() })
        })
      }, debounceMs)
    },
    pullNow() {
      return run(pullMerge)
    },
  }
}

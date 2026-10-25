import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { createGistApi, type GistConfig } from './gist'
import { loadProgress, saveProgress, type Progress } from './progress'
import { reducer, type Action } from './reducer'
import { createSyncEngine, type SyncStatus } from './sync'
import { loadSyncConfig, saveSyncConfig } from './syncConfig'

export interface SyncControls {
  config: GistConfig | null
  status: SyncStatus
  connect: (token: string) => Promise<GistConfig>
  disconnect: () => void
  syncNow: () => Promise<void>
}

interface Store {
  progress: Progress
  dispatch: (a: Action) => void
  sync: SyncControls
}

const StoreContext = createContext<Store | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, undefined, () => loadProgress(localStorage))
  const progressRef = useRef(progress)
  progressRef.current = progress
  const [config, setConfig] = useState<GistConfig | null>(() => loadSyncConfig(localStorage))
  const [status, setStatus] = useState<SyncStatus>({ state: 'off' })
  const api = useMemo(() => createGistApi(), [])
  const engine = useMemo(
    () =>
      createSyncEngine({
        api,
        getProgress: () => progressRef.current,
        applyMerged: (p) => dispatch({ type: 'import', progress: p }),
        onStatus: setStatus,
      }),
    [api],
  )

  useEffect(() => {
    saveProgress(localStorage, progress)
    engine.onProgressChanged(progress)
  }, [progress, engine])

  useEffect(() => {
    if (config) engine.start(config)
    else engine.stop()
  }, [config, engine])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && config) void engine.pullNow()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [config, engine])

  const connect = useCallback(
    async (token: string) => {
      const cfg = await api.connect(token.trim())
      saveSyncConfig(localStorage, cfg)
      setConfig(cfg)
      return cfg
    },
    [api],
  )
  const disconnect = useCallback(() => {
    saveSyncConfig(localStorage, null)
    setConfig(null)
  }, [])
  const syncNow = useCallback(() => engine.pullNow(), [engine])

  const sync = useMemo<SyncControls>(() => ({ config, status, connect, disconnect, syncNow }), [config, status, connect, disconnect, syncNow])
  const value = useMemo<Store>(() => ({ progress, dispatch, sync }), [progress, sync])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useProgress(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useProgress must be used inside ProgressProvider')
  return store
}

import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { loadProgress, saveProgress, type Progress } from './progress'
import { reducer, type Action } from './reducer'

interface Store {
  progress: Progress
  dispatch: (a: Action) => void
}

const StoreContext = createContext<Store | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, undefined, () => loadProgress(localStorage))
  useEffect(() => {
    saveProgress(localStorage, progress)
  }, [progress])
  return <StoreContext.Provider value={{ progress, dispatch }}>{children}</StoreContext.Provider>
}

export function useProgress(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useProgress must be used inside ProgressProvider')
  return store
}

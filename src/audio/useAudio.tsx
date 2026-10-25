import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../state/store'
import { getAudioContext, unlockAudio } from './context'
import { createMetronome, type Metronome } from './metronome'
import { createPiano, type Piano } from './sampler'

export interface AudioState {
  piano: Piano | null
  metronome: Metronome | null
  /** Creates the audio graph inside a user gesture and resolves once samples are loaded. */
  ensure: () => Promise<Piano>
  loading: boolean
  progress: number
  failed: boolean
}

const AudioContextReact = createContext<AudioState | null>(null)

const SAMPLES_URL = `${import.meta.env.BASE_URL}samples/`

export function AudioProvider({ children }: { children: ReactNode }) {
  const { progress: userProgress } = useProgress()
  const [piano, setPiano] = useState<Piano | null>(null)
  const [metronome, setMetronome] = useState<Metronome | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const loadPromise = useRef<Promise<Piano> | null>(null)
  const volume = userProgress.settings.volume
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  const ensure = useCallback((): Promise<Piano> => {
    // Both calls are idempotent and cheap; repeating them on every gesture lets a
    // context that iOS interrupted (or a silent-switch unlock that failed outside a
    // gesture) recover on the next tap.
    unlockAudio()
    if (loadPromise.current) {
      getAudioContext()
      return loadPromise.current
    }
    const ctx = getAudioContext()
    const p = createPiano(ctx, SAMPLES_URL)
    p.setVolume(volumeRef.current)
    const m = createMetronome(ctx)
    setPiano(p)
    setMetronome(m)
    setLoading(true)
    loadPromise.current = p
      .load((done, total) => setProgress(done / total))
      .then(() => {
        setFailed(p.failed)
        return p
      })
      .finally(() => setLoading(false))
    return loadPromise.current
  }, [])

  useEffect(() => {
    piano?.setVolume(volume)
  }, [piano, volume])

  const value = useMemo<AudioState>(
    () => ({ piano, metronome, ensure, loading, progress, failed }),
    [piano, metronome, ensure, loading, progress, failed],
  )
  return <AudioContextReact.Provider value={value}>{children}</AudioContextReact.Provider>
}

export function useAudio(): AudioState {
  const state = useContext(AudioContextReact)
  if (!state) throw new Error('useAudio must be used inside AudioProvider')
  return state
}

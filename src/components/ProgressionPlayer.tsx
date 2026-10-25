import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAudioContext } from '../audio/context'
import { createMetronome, type Metronome } from '../audio/metronome'
import type { Piano } from '../audio/sampler'
import { useAudio } from '../audio/useAudio'
import { evaluateBar, summarize, type BarResult, type DrillResult, type PlayedNote } from '../learning/barHits'
import { buildChord } from '../theory/chords'
import type { Midi, NotationStyle, Pc } from '../theory/notes'
import { progressionById, progressionChords } from '../theory/progressions'
import { Button } from './Button'
import { ChordTitle } from './ChordTitle'
import { displayRange } from './displayRange'
import { Keyboard, type KeyMark } from './Keyboard'
import './progressionPlayer.css'

export interface ProgressionPlayerProps {
  progressionId: string
  keyRoot: Pc
  mode: 'listen' | 'play'
  bpm: number
  /** Number of times to go through the progression; null loops until stopped. */
  rounds: number | null
  notation: NotationStyle
  onFinished?: (result: DrillResult) => void
}

const BEATS_PER_BAR = 4

export function ProgressionPlayer({ progressionId, keyRoot, mode, bpm, rounds, notation, onFinished }: ProgressionPlayerProps) {
  const { ensure, loading } = useAudio()
  const chords = useMemo(
    () => progressionChords(progressionById(progressionId), keyRoot).map((s) => buildChord(s, notation)),
    [progressionId, keyRoot, notation],
  )
  const totalBars = rounds === null ? Infinity : rounds * chords.length
  const [running, setRunning] = useState(false)
  const [pos, setPos] = useState({ bar: -1, beat: 0 })
  const [result, setResult] = useState<DrillResult | null>(null)
  const pianoRef = useRef<Piano | null>(null)
  const metronomeRef = useRef<Metronome | null>(null)
  const timeouts = useRef<number[]>([])
  const notesRef = useRef<PlayedNote[]>([])
  const resultsRef = useRef<BarResult[]>([])
  const runningRef = useRef(false)
  const startingRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  const stop = useCallback(() => {
    metronomeRef.current?.stop()
    for (const t of timeouts.current) window.clearTimeout(t)
    timeouts.current = []
    runningRef.current = false
    setRunning(false)
    setPos({ bar: -1, beat: 0 })
  }, [])

  useEffect(() => () => stop(), [stop])

  const start = async () => {
    if (startingRef.current || runningRef.current) return
    startingRef.current = true
    let piano: Piano
    try {
      piano = await ensure()
    } finally {
      startingRef.current = false
    }
    pianoRef.current = piano
    const ctx = getAudioContext()
    const metronome = createMetronome(ctx)
    metronomeRef.current = metronome
    const perfOffset = performance.now() - ctx.currentTime * 1000
    const beatMs = 60000 / bpm
    notesRef.current = []
    resultsRef.current = []
    setResult(null)
    runningRef.current = true
    setRunning(true)
    let finishScheduled = false

    const schedule = (when: number, fn: () => void) => {
      timeouts.current.push(window.setTimeout(fn, Math.max(0, (when - ctx.currentTime) * 1000)))
    }
    const barSec = (beatMs * BEATS_PER_BAR) / 1000
    let baseWhen: number | null = null

    /** Attribute every note to its bar by the time it was played, so late timers cannot shift it. */
    const evaluateAll = (): BarResult[] => {
      if (baseWhen === null) return []
      const results: BarResult[] = []
      for (let b = 0; b < totalBars; b++) {
        const startMs = (baseWhen + b * barSec) * 1000 + perfOffset
        const endMs = startMs + barSec * 1000
        const inBar = notesRef.current.filter((n) => n.timeMs >= startMs && n.timeMs < endMs)
        results.push(evaluateBar(inBar, chords[b % chords.length], startMs, beatMs))
      }
      return results
    }

    metronome.start(bpm, BEATS_PER_BAR, (beat, bar, when) => {
      if (bar === 0 && beat === 0) baseWhen = when
      if (bar >= totalBars) {
        if (finishScheduled) return
        finishScheduled = true
        metronome.stop()
        schedule(when, () => {
          if (!runningRef.current) return
          resultsRef.current = mode === 'play' ? evaluateAll() : []
          const summary = summarize(resultsRef.current)
          runningRef.current = false
          setRunning(false)
          setPos({ bar: -1, beat: 0 })
          setResult(summary)
          onFinishedRef.current?.(summary)
        })
        return
      }
      const chord = chords[bar % chords.length]
      if (mode === 'listen' && beat === 0) piano.playChord(chord.notes, barSec * 0.9, when)
      schedule(when, () => {
        if (runningRef.current) setPos({ bar, beat })
      })
    })
  }

  const current = chords[Math.max(pos.bar, 0) % chords.length]
  const next = chords[(Math.max(pos.bar, 0) + 1) % chords.length]
  const marks: Partial<Record<Midi, KeyMark>> = {}
  if (mode === 'listen' && running) for (const m of current.notes) marks[m] = 'target'
  const range = mode === 'listen' ? displayRange(current.notes) : { lowMidi: 60, octaves: 2 }

  return (
    <div className="player">
      <ChordTitle spec={current.spec} notation={notation} subtitle={`дальше: ${next.slash ?? next.symbol}`} />
      <div className="beats" aria-hidden="true">
        {Array.from({ length: BEATS_PER_BAR }, (_, b) => (
          <i key={b} className={running && pos.bar >= 0 && pos.beat === b ? 'is-on' : ''} />
        ))}
      </div>
      <div className="muted small player__bar">
        {running && pos.bar >= 0 ? `такт ${pos.bar + 1}${rounds === null ? '' : ` из ${totalBars}`}` : ' '}
      </div>
      <Keyboard
        mode={mode === 'play' ? 'momentary' : 'display'}
        marks={marks}
        lowMidi={range.lowMidi}
        octaves={range.octaves}
        notation={notation}
        shortcuts={mode === 'play'}
        onNoteOn={(m, t) => {
          if (pianoRef.current) pianoRef.current.noteOn(m)
          else void ensure().then((p) => (pianoRef.current = p))
          if (runningRef.current) notesRef.current.push({ midi: m, timeMs: t })
        }}
        onNoteOff={(m) => pianoRef.current?.noteOff(m)}
      />
      {result && (
        <div className="player__result">
          Попаданий {result.hits} из {result.bars}
          {result.avgOffsetMs !== null && ` · средний сдвиг ${result.avgOffsetMs} мс`}
        </div>
      )}
      <div className="row player__controls">
        {running ? (
          <Button onClick={stop}>Стоп</Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => void start()}>
            {loading ? 'Загружаю…' : result ? 'Ещё раз' : 'Старт'}
          </Button>
        )}
      </div>
    </div>
  )
}

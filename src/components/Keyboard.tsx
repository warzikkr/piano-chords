import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { formatNote, midiName, syllable, type Midi, type NotationStyle } from '../theory/notes'
import { keyboardLayout } from './keyboardLayout'
import './keyboard.css'

export type KeyMark = 'selected' | 'correct' | 'wrong' | 'hint' | 'target'

export interface KeyboardProps {
  mode: 'toggle' | 'momentary' | 'display'
  lowMidi?: Midi
  octaves?: number
  selected?: Midi[]
  marks?: Partial<Record<Midi, KeyMark>>
  labels?: 'none' | 'letters' | 'syllables'
  notation?: NotationStyle
  preferFlats?: boolean
  disabled?: boolean
  shortcuts?: boolean
  onToggle?: (midi: Midi) => void
  onNoteOn?: (midi: Midi, time: number) => void
  onNoteOff?: (midi: Midi) => void
}

const SHORTCUT_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p', ';']
const TOGGLE_SOUND_MS = 400

export function Keyboard({
  mode,
  lowMidi = 60,
  octaves = 2,
  selected = [],
  marks = {},
  labels = 'letters',
  notation = 'latin',
  preferFlats = false,
  disabled = false,
  shortcuts = false,
  onToggle,
  onNoteOn,
  onNoteOff,
}: KeyboardProps) {
  const layout = useMemo(() => keyboardLayout(lowMidi, octaves), [lowMidi, octaves])
  const [down, setDown] = useState<Set<Midi>>(() => new Set())
  const handlers = useRef({ onToggle, onNoteOn, onNoteOff })
  handlers.current = { onToggle, onNoteOn, onNoteOff }
  const interactive = mode !== 'display' && !disabled

  const press = (midi: Midi) => {
    if (!interactive) return
    navigator.vibrate?.(8)
    setDown((s) => new Set(s).add(midi))
    handlers.current.onNoteOn?.(midi, performance.now())
    if (mode === 'toggle') {
      handlers.current.onToggle?.(midi)
      window.setTimeout(() => handlers.current.onNoteOff?.(midi), TOGGLE_SOUND_MS)
    }
  }

  const release = (midi: Midi) => {
    setDown((s) => {
      if (!s.has(midi)) return s
      const next = new Set(s)
      next.delete(midi)
      return next
    })
    if (mode === 'momentary') handlers.current.onNoteOff?.(midi)
  }

  useEffect(() => {
    if (!shortcuts || !interactive) return
    const held = new Set<Midi>()
    const midiFor = (e: KeyboardEvent) => {
      const i = SHORTCUT_KEYS.indexOf(e.key.toLowerCase())
      return i < 0 ? null : lowMidi + i
    }
    const isTyping = (e: KeyboardEvent) => (e.target as HTMLElement | null)?.tagName === 'INPUT'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || isTyping(e)) return
      const midi = midiFor(e)
      if (midi === null || held.has(midi)) return
      held.add(midi)
      press(midi)
      if (mode === 'toggle') held.delete(midi)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const midi = midiFor(e)
      if (midi === null) return
      held.delete(midi)
      release(midi)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, interactive, mode, lowMidi])

  const pointerDown = (midi: Midi) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    press(midi)
  }
  const pointerUp = (midi: Midi) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    e.preventDefault()
    release(midi)
  }

  const label = (midi: Midi) => {
    if (labels === 'none') return null
    const name = midiName(midi, preferFlats)
    return labels === 'syllables' ? syllable(name) : formatNote(name, notation)
  }

  const classes = (midi: Midi, base: string) => {
    const mark = marks[midi] ?? (selected.includes(midi) ? 'selected' : undefined)
    return [base, mark ? `is-${mark}` : '', down.has(midi) ? 'is-down' : ''].filter(Boolean).join(' ')
  }

  const whiteCount = layout.whites.length
  const whiteWidth = `(100% / ${whiteCount})`

  return (
    <div
      className={`kb ${interactive ? 'kb--interactive' : ''}`}
      role="group"
      aria-label="Клавиатура"
      onContextMenu={(e) => e.preventDefault()}
    >
      {layout.whites.map(({ midi }) => (
        <div
          key={midi}
          className={classes(midi, 'kb__white')}
          data-midi={midi}
          onPointerDown={pointerDown(midi)}
          onPointerUp={pointerUp(midi)}
          onPointerCancel={pointerUp(midi)}
        >
          {label(midi) && <span className="kb__label">{label(midi)}</span>}
        </div>
      ))}
      {layout.blacks.map(({ midi, leftWhites }) => (
        <div
          key={midi}
          className={classes(midi, 'kb__black')}
          data-midi={midi}
          style={{
            left: `calc(${leftWhites} * ${whiteWidth} - 0.29 * ${whiteWidth})`,
            width: `calc(0.58 * ${whiteWidth})`,
          }}
          onPointerDown={pointerDown(midi)}
          onPointerUp={pointerUp(midi)}
          onPointerCancel={pointerUp(midi)}
        >
          {label(midi) && <span className="kb__label kb__label--black">{label(midi)}</span>}
        </div>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Piano } from '../audio/sampler'
import type { Demo } from '../learning/lessons'
import { buildChord, chordSymbol, type ChordSpec } from '../theory/chords'
import { pc, type Midi, type NotationStyle } from '../theory/notes'
import { plural } from '../ui/text'
import { Button } from './Button'
import { ChordTitle } from './ChordTitle'
import { displayRange } from './displayRange'
import { Keyboard, type KeyMark } from './Keyboard'

interface DemoViewProps {
  demo: Demo
  notation: NotationStyle
  piano: Piano | null
  /** For `findNote`: called once the learner presses the right note. */
  onFound?: () => void
}

function targetMarks(notes: Midi[], mark: KeyMark = 'target'): Partial<Record<Midi, KeyMark>> {
  const marks: Partial<Record<Midi, KeyMark>> = {}
  for (const m of notes) marks[m] = mark
  return marks
}

/** Interactive illustration used by lessons and theory pages. */
export function DemoView({ demo, notation, piano, onFound }: DemoViewProps) {
  const [found, setFound] = useState(false)
  const [shown, setShown] = useState<ChordSpec | null>(null)
  const [active, setActive] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const play = (spec: ChordSpec) => {
    piano?.playChord(buildChord(spec).notes)
    setShown(spec)
  }

  switch (demo.kind) {
    case 'findNote': {
      const marks: Partial<Record<Midi, KeyMark>> = {}
      if (found) for (let m = 60; m < 84; m++) if (pc(m) === demo.pc) marks[m] = 'correct'
      return (
        <>
          {found && <p className="feedback feedback--ok">Да, это она</p>}
          <Keyboard
            mode="momentary"
            marks={marks}
            labels="none"
            shortcuts
            onNoteOn={(m) => {
              piano?.noteOn(m)
              if (pc(m) === demo.pc && !found) {
                setFound(true)
                onFound?.()
              }
            }}
            onNoteOff={(m) => piano?.noteOff(m)}
          />
        </>
      )
    }
    case 'showChord': {
      const notes = buildChord(demo.spec).notes
      const range = displayRange(notes)
      return (
        <>
          <ChordTitle spec={demo.spec} notation={notation} size="md" />
          <Button onClick={() => play(demo.spec)}>Послушать</Button>
          <Keyboard mode="display" marks={targetMarks(notes)} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
    }
    case 'compare': {
      const notes = shown ? buildChord(shown).notes : []
      const range = displayRange(notes)
      return (
        <>
          <div className="row">
            <Button size="lg" onClick={() => play(demo.a)}>
              {chordSymbol(demo.a, notation)}
            </Button>
            <Button size="lg" onClick={() => play(demo.b)}>
              {chordSymbol(demo.b, notation)}
            </Button>
          </div>
          <Keyboard mode="display" marks={targetMarks(notes)} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
    }
    case 'interval': {
      const semis = demo.to - demo.from
      const range = displayRange([demo.from, demo.to])
      const listen = () => {
        if (!piano) return
        piano.playArpeggio([demo.from, demo.to], 0.6, 1)
        timers.current.push(window.setTimeout(() => piano.playChord([demo.from, demo.to], 1.6), 1500))
      }
      return (
        <>
          <p className="intro__notes">
            {demo.label}: {semis} {plural(semis, 'полутон', 'полутона', 'полутонов')}
          </p>
          <Button onClick={listen}>Послушать</Button>
          <Keyboard mode="display" marks={targetMarks([demo.from, demo.to])} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
    }
    case 'sequence': {
      const notes = active === null ? [] : buildChord(demo.specs[active]).notes
      const range = displayRange(notes)
      const listen = () => {
        timers.current.forEach((t) => window.clearTimeout(t))
        timers.current = []
        demo.specs.forEach((spec, i) => {
          timers.current.push(
            window.setTimeout(() => {
              setActive(i)
              piano?.playChord(buildChord(spec).notes, 0.85)
            }, i * 900),
          )
        })
        timers.current.push(window.setTimeout(() => setActive(null), demo.specs.length * 900 + 400))
      }
      return (
        <>
          <div className="row row--wrap sequence">
            {demo.specs.map((spec, i) => (
              <span key={i} className={`chip ${active === i ? 'is-active' : ''}`}>
                {chordSymbol(spec, notation)}
              </span>
            ))}
          </div>
          <Button onClick={listen}>Послушать</Button>
          <Keyboard mode="display" marks={targetMarks(notes)} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
    }
    case 'none':
      return null
  }
}

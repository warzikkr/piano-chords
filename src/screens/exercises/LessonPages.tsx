import { useState } from 'react'
import type { Piano } from '../../audio/sampler'
import { Button } from '../../components/Button'
import { ChordTitle } from '../../components/ChordTitle'
import { displayRange } from '../../components/displayRange'
import { Keyboard, type KeyMark } from '../../components/Keyboard'
import { LESSONS } from '../../learning/lessons'
import { levelInfo } from '../../learning/curriculum'
import { buildChord, chordSymbol, type ChordSpec, type Level } from '../../theory/chords'
import { pc, type Midi, type NotationStyle } from '../../theory/notes'

interface LessonPagesProps {
  level: Level
  notation: NotationStyle
  piano: Piano | null
  onDone: () => void
}

export function LessonPages({ level, notation, piano, onDone }: LessonPagesProps) {
  const pages = LESSONS[level]
  const [index, setIndex] = useState(0)
  const [found, setFound] = useState(false)
  const [shown, setShown] = useState<ChordSpec | null>(null)
  const page = pages[index]
  const last = index === pages.length - 1
  const info = levelInfo(level)

  const next = () => {
    if (last) {
      onDone()
      return
    }
    setIndex(index + 1)
    setFound(false)
    setShown(null)
  }

  const play = (spec: ChordSpec) => {
    piano?.playChord(buildChord(spec).notes)
    setShown(spec)
  }

  let demo = null
  let canContinue = true
  switch (page.demo.kind) {
    case 'findNote': {
      const target = page.demo.pc
      const marks: Partial<Record<Midi, KeyMark>> = {}
      if (found) for (let m = 60; m < 84; m++) if (pc(m) === target) marks[m] = 'correct'
      canContinue = found
      demo = (
        <>
          {found && <p className="feedback feedback--ok">Да, это она</p>}
          <Keyboard
            mode="momentary"
            marks={marks}
            labels="none"
            shortcuts
            onNoteOn={(m) => {
              piano?.noteOn(m)
              if (pc(m) === target) setFound(true)
            }}
            onNoteOff={(m) => piano?.noteOff(m)}
          />
        </>
      )
      break
    }
    case 'showChord': {
      const spec = page.demo.spec
      const notes = buildChord(spec).notes
      const range = displayRange(notes)
      const marks: Partial<Record<Midi, KeyMark>> = {}
      for (const m of notes) marks[m] = 'target'
      demo = (
        <>
          <ChordTitle spec={spec} notation={notation} size="md" />
          <Button onClick={() => play(spec)}>Послушать</Button>
          <Keyboard mode="display" marks={marks} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
      break
    }
    case 'compare': {
      const { a, b } = page.demo
      const shownNotes = shown ? buildChord(shown).notes : []
      const range = displayRange(shownNotes)
      const marks: Partial<Record<Midi, KeyMark>> = {}
      for (const m of shownNotes) marks[m] = 'target'
      demo = (
        <>
          <div className="row">
            <Button size="lg" onClick={() => play(a)}>
              {chordSymbol(a, notation)}
            </Button>
            <Button size="lg" onClick={() => play(b)}>
              {chordSymbol(b, notation)}
            </Button>
          </div>
          <Keyboard mode="display" marks={marks} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} />
        </>
      )
      break
    }
    case 'none':
      demo = null
  }

  return (
    <div className="task lesson">
      <div className="task__body">
        <p className="muted small">
          Уровень {level}. {info.title} · {index + 1} из {pages.length}
        </p>
        <h2 className="h2">{page.title}</h2>
        <p className="lesson__text">{page.text}</p>
        {demo}
      </div>
      <div className="task__footer">
        <Button variant="primary" size="lg" onClick={next} disabled={!canContinue}>
          {last ? 'К упражнениям' : 'Дальше'}
        </Button>
      </div>
    </div>
  )
}

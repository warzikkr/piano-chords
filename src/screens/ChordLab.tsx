import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { ChordTitle } from '../components/ChordTitle'
import { displayRange } from '../components/displayRange'
import { Keyboard, type KeyMark } from '../components/Keyboard'
import { indexOf } from '../learning/curriculum'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { buildChord, cardId, chordSymbol, chordType, type ChordSpec } from '../theory/chords'
import { describeDifference } from '../theory/identify'
import type { Midi } from '../theory/notes'
import { ChordPicker } from './ChordPicker'
import { notesLine } from './exercises/types'

const GHOST_MS = 1800

/** Click through roots, types and inversions and watch (and hear) the keys move. */
export function ChordLab() {
  const { progress } = useProgress()
  const { ensure } = useAudio()
  const { notation, syllables } = progress.settings
  const [spec, setSpec] = useState<ChordSpec>({ root: 0, type: 'maj', inversion: 0 })
  const [prev, setPrev] = useState<ChordSpec | null>(null)
  const [sound, setSound] = useState(true)
  const ghostTimer = useRef<number | null>(null)
  const voicing = buildChord(spec, notation)
  const type = chordType(spec.type)

  const change = (next: ChordSpec) => {
    if (cardId(next) === cardId(spec)) return
    setPrev(spec)
    setSpec(next)
    if (ghostTimer.current) window.clearTimeout(ghostTimer.current)
    ghostTimer.current = window.setTimeout(() => setPrev(null), GHOST_MS)
    if (sound) void ensure().then((p) => p.playChord(buildChord(next).notes, 1.4))
  }
  useEffect(() => () => void (ghostTimer.current && window.clearTimeout(ghostTimer.current)), [])

  const marks: Partial<Record<Midi, KeyMark>> = {}
  const prevNotes = prev ? buildChord(prev).notes : []
  for (const m of prevNotes) if (!voicing.notes.includes(m)) marks[m] = 'ghost'
  for (const m of voicing.notes) marks[m] = 'target'
  const range = displayRange([...voicing.notes, ...prevNotes])
  const diff = prev ? describeDifference(prev, spec, notation) : ''
  const inCurriculum = indexOf(cardId(spec)) >= 0

  return (
    <div className="stack">
      <p className="muted small">Нажимай корень, тип и обращение: клавиши сдвигаются, ушедшие на миг остаются серыми.</p>
      <ChordPicker spec={spec} notation={notation} onChange={change} />
      <div className="lab__chord">
        <ChordTitle spec={spec} notation={notation} subtitle={type.nameRu} />
        <p className="intro__notes">{notesLine(voicing.names, notation, syllables)}</p>
        <p className="muted small">{type.explain}</p>
        {diff && prev && (
          <p className="lab__diff">
            От {chordSymbol(prev, notation)}: {diff}
          </p>
        )}
      </div>
      <Keyboard mode="display" marks={marks} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} preferFlats={voicing.names.some((n) => n.accidental < 0)} />
      <div className="row row--wrap" style={{ justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => void ensure().then((p) => p.playChord(voicing.notes))}>
          Аккорд
        </Button>
        <Button onClick={() => void ensure().then((p) => p.playArpeggio(voicing.notes))}>Арпеджио</Button>
        <Button variant="ghost" onClick={() => setSound(!sound)}>
          {sound ? 'Звук при смене: вкл' : 'Звук при смене: выкл'}
        </Button>
        {inCurriculum && (
          <Button variant="ghost" onClick={() => navigateTo({ name: 'chord', id: cardId(spec) })}>
            Карточка аккорда
          </Button>
        )}
      </div>
    </div>
  )
}


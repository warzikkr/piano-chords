import { useEffect, useRef } from 'react'
import { Button } from '../../components/Button'
import { ChordTitle } from '../../components/ChordTitle'
import { displayRange } from '../../components/displayRange'
import { Keyboard, type KeyMark } from '../../components/Keyboard'
import { chordType } from '../../theory/chords'
import type { Midi } from '../../theory/notes'
import { notesLine, type TaskProps } from './types'

type IntroProps = Omit<TaskProps, 'onDone' | 'autoCheck'> & { onDone: () => void }

/** First meeting with a new chord: see it, hear it, read its notes. Nothing is graded here. */
export function IntroTask({ spec, voicing, notation, syllables, piano, onDone }: IntroProps) {
  const type = chordType(spec.type)
  const played = useRef(false)
  useEffect(() => {
    if (!piano || played.current) return
    played.current = true
    piano.playChord(voicing.notes, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piano])

  const marks: Partial<Record<Midi, KeyMark>> = {}
  for (const m of voicing.notes) marks[m] = 'target'
  const range = displayRange(voicing.notes)
  const preferFlats = voicing.names.some((n) => n.accidental < 0)

  return (
    <div className="task">
      <div className="task__body">
        <p className="muted small">Новый аккорд</p>
        <ChordTitle spec={spec} notation={notation} subtitle={type.nameRu} />
        <p className="intro__notes">{notesLine(voicing.names, notation, syllables)}</p>
        <p className="muted">{type.explain}</p>
        <div className="row">
          <Button onClick={() => piano?.playChord(voicing.notes, 2)}>Аккорд</Button>
          <Button onClick={() => piano?.playArpeggio(voicing.notes)}>Арпеджио</Button>
        </div>
      </div>
      <div className="task__kb">
        <Keyboard mode="display" marks={marks} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} preferFlats={preferFlats} />
      </div>
      <div className="task__footer">
        <Button variant="primary" size="lg" onClick={onDone}>
          Дальше
        </Button>
      </div>
    </div>
  )
}

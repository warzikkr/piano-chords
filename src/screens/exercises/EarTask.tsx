import { useEffect, useMemo, useRef, useState } from 'react'
import { earOptions } from '../../learning/distractors'
import { Button } from '../../components/Button'
import { ChordTitle } from '../../components/ChordTitle'
import { Keyboard, type KeyMark } from '../../components/Keyboard'
import { chordType, type ChordTypeId } from '../../theory/chords'
import type { Midi } from '../../theory/notes'
import type { TaskProps } from './types'

export function EarTask({ spec, voicing, learnerLevel, notation, piano, onDone }: TaskProps) {
  const options = useMemo(() => earOptions(spec, learnerLevel, Math.random), [spec, learnerLevel])
  const [chosen, setChosen] = useState<ChordTypeId | null>(null)
  const startedAt = useRef(Date.now())
  const played = useRef(false)
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const phase = chosen === null ? 'answering' : chosen === spec.type ? 'correct' : 'wrong'

  useEffect(() => {
    if (!piano || played.current) return
    played.current = true
    piano.playChord(voicing.notes, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piano])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDoneRef.current({ correct: phase === 'correct', usedHint: false, seconds: (Date.now() - startedAt.current) / 1000 }, options.length)
  }

  useEffect(() => {
    if (phase !== 'correct') return
    const t = window.setTimeout(() => {
      if (finished.current) return
      finished.current = true
      onDoneRef.current({ correct: true, usedHint: false, seconds: (Date.now() - startedAt.current) / 1000 }, options.length)
    }, 900)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const marks: Partial<Record<Midi, KeyMark>> = {}
  if (phase !== 'answering') for (const m of voicing.notes) marks[m] = phase === 'correct' ? 'correct' : 'hint'

  return (
    <div className="task">
      <div className="task__body">
        {phase === 'answering' ? <h2 className="h2">Что звучит?</h2> : <ChordTitle spec={spec} notation={notation} size="md" subtitle={chordType(spec.type).nameRu} />}
        <Button variant="secondary" onClick={() => piano?.playChord(voicing.notes, 2)}>
          Послушать ещё раз
        </Button>
        <div className="options">
          {options.map((t) => {
            const cls = phase !== 'answering' && t === spec.type ? 'is-correct' : chosen === t ? 'is-wrong' : ''
            return (
              <Button key={t} size="lg" className={cls} disabled={phase !== 'answering'} onClick={() => setChosen(t)}>
                {chordType(t).nameRu}
              </Button>
            )
          })}
        </div>
      </div>
      <div className="task__kb">
        <Keyboard mode="display" marks={marks} notation={notation} labels={phase === 'answering' ? 'none' : 'letters'} />
      </div>
      <div className="task__footer">
        {phase === 'wrong' && (
          <Button variant="primary" onClick={finish}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}

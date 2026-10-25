import { useEffect, useMemo, useRef, useState } from 'react'
import { recognizeOptions } from '../../learning/distractors'
import { Button } from '../../components/Button'
import { Keyboard, type KeyMark } from '../../components/Keyboard'
import { cardId, chordSymbol } from '../../theory/chords'
import type { Midi } from '../../theory/notes'
import type { TaskProps } from './types'

export function RecognizeTask({ spec, voicing, notation, piano, onDone }: TaskProps) {
  const options = useMemo(() => recognizeOptions(spec, Math.random), [spec])
  const [chosen, setChosen] = useState<number | null>(null)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const correctIndex = options.findIndex((o) => cardId(o) === cardId(spec))
  const phase = chosen === null ? 'answering' : chosen === correctIndex ? 'correct' : 'wrong'

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDoneRef.current({ correct: phase === 'correct', usedHint: false, seconds: (Date.now() - startedAt.current) / 1000 })
  }

  useEffect(() => {
    if (phase === 'answering') return
    piano?.playChord(voicing.notes)
    if (phase === 'correct') {
      const t = window.setTimeout(() => {
        if (finished.current) return
        finished.current = true
        onDoneRef.current({ correct: true, usedHint: false, seconds: (Date.now() - startedAt.current) / 1000 })
      }, 700)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const marks: Partial<Record<Midi, KeyMark>> = {}
  for (const m of voicing.notes) marks[m] = phase === 'wrong' ? 'hint' : phase === 'correct' ? 'correct' : 'target'
  const preferFlats = voicing.names.some((n) => n.accidental < 0)

  return (
    <div className="task">
      <div className="task__body">
        <h2 className="h2">Какой это аккорд?</h2>
        <Button variant="secondary" onClick={() => piano?.playChord(voicing.notes)}>
          Послушать
        </Button>
        <div className="options">
          {options.map((o, i) => {
            const cls = phase !== 'answering' && i === correctIndex ? 'is-correct' : chosen === i ? 'is-wrong' : ''
            return (
              <Button key={cardId(o)} size="lg" className={cls} disabled={phase !== 'answering'} onClick={() => setChosen(i)}>
                {chordSymbol(o, notation)}
              </Button>
            )
          })}
        </div>
      </div>
      <div className="task__kb">
        <Keyboard mode="display" marks={marks} notation={notation} preferFlats={preferFlats} />
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

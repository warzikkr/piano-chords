import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { ChordTitle } from '../../components/ChordTitle'
import { checkSpell } from '../../theory/check'
import { chordType } from '../../theory/chords'
import { formatNote, midiName, noteNamePc, syllable, type Pc } from '../../theory/notes'
import { notesLine, type TaskProps } from './types'

export function SpellTask({ spec, voicing, notation, syllables, autoCheck, piano, onDone }: TaskProps) {
  const [picked, setPicked] = useState<Pc[]>([])
  const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering')
  const [usedHint, setUsedHint] = useState(false)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const type = chordType(spec.type)
  const preferFlats = voicing.names.some((n) => n.accidental < 0)
  const chordSet = new Set(voicing.pcs)

  const result = () => ({ correct: phase === 'correct', usedHint, seconds: (Date.now() - startedAt.current) / 1000 })
  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDoneRef.current(result())
  }

  useEffect(() => {
    if (phase === 'answering') return
    piano?.playChord(voicing.notes)
    if (phase === 'correct') {
      const t = window.setTimeout(() => {
        if (finished.current) return
        finished.current = true
        onDoneRef.current({ correct: true, usedHint, seconds: (Date.now() - startedAt.current) / 1000 })
      }, 700)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const check = (notes: Pc[]) => setPhase(checkSpell(notes, voicing) ? 'correct' : 'wrong')

  const toggle = (p: Pc) => {
    if (phase !== 'answering') return
    piano?.playChord([60 + p], 0.6)
    const next = picked.includes(p) ? picked.filter((x) => x !== p) : [...picked, p]
    setPicked(next)
    if (autoCheck && next.length === voicing.pcs.length) check(next)
  }

  const labelFor = (p: Pc) => voicing.names.find((n) => noteNamePc(n) === p) ?? midiName(60 + p, preferFlats)

  const chipClass = (p: Pc) => {
    const isPicked = picked.includes(p)
    if (phase === 'answering') return isPicked ? 'is-active' : ''
    if (phase === 'correct') return isPicked ? 'is-correct' : ''
    if (isPicked) return chordSet.has(p) ? 'is-correct' : 'is-wrong'
    return chordSet.has(p) ? 'is-missing' : ''
  }

  return (
    <div className="task">
      <div className="task__body">
        <ChordTitle spec={spec} notation={notation} />
        <p className="muted">Назови {voicing.pcs.length} ноты</p>
        {usedHint && phase === 'answering' && (
          <p className="hint">
            {notesLine(voicing.names, notation, syllables)}. {type.explain}
          </p>
        )}
        {phase === 'correct' && <p className="feedback feedback--ok">Верно</p>}
        {phase === 'wrong' && <p className="feedback feedback--bad">Правильно: {notesLine(voicing.names, notation, syllables)}</p>}
        <div className="notes">
          {Array.from({ length: 12 }, (_, p) => {
            const name = labelFor(p)
            return (
              <button key={p} type="button" className={`note-chip ${chipClass(p)}`} onClick={() => toggle(p)}>
                <span className="note-chip__name">{formatNote(name, notation)}</span>
                {syllables && <span className="note-chip__syl">{syllable(name)}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="task__footer">
        {phase === 'answering' && (
          <>
            <Button variant="ghost" onClick={() => setUsedHint(true)} disabled={usedHint}>
              Подсказка
            </Button>
            <Button variant="ghost" onClick={() => setPicked([])} disabled={picked.length === 0}>
              Сбросить
            </Button>
            {!autoCheck && (
              <Button variant="primary" onClick={() => check(picked)} disabled={picked.length === 0}>
                Проверить
              </Button>
            )}
          </>
        )}
        {phase === 'wrong' && (
          <Button variant="primary" onClick={finish}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}

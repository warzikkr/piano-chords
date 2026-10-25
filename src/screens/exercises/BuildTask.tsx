import { useEffect, useReducer, useRef } from 'react'
import { Button } from '../../components/Button'
import { ChordTitle } from '../../components/ChordTitle'
import { Keyboard, type KeyMark } from '../../components/Keyboard'
import { checkBuild } from '../../theory/check'
import { chordType } from '../../theory/chords'
import { formatNote, pc, type Midi } from '../../theory/notes'
import { finishResult, initialTaskState, taskReducer } from './taskState'
import { notesLine, type TaskProps } from './types'

export function BuildTask({ spec, voicing, notation, syllables, autoCheck, piano, onDone }: TaskProps) {
  const [state, dispatch] = useReducer(taskReducer, Date.now(), initialTaskState)
  const type = chordType(spec.type)
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDoneRef.current(finishResult(state, Date.now()))
  }

  useEffect(() => {
    if (state.phase === 'answering') return
    piano?.playChord(voicing.notes)
    if (state.phase === 'correct') {
      const t = window.setTimeout(() => {
        if (finished.current) return
        finished.current = true
        onDoneRef.current(finishResult(state, Date.now()))
      }, 700)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  const marks: Partial<Record<Midi, KeyMark>> = {}
  let feedback: string | null = null
  if (state.phase === 'answering') {
    if (state.usedHint) for (const m of voicing.notes) marks[m] = 'hint'
  } else if (state.phase === 'correct') {
    for (const m of state.selected) marks[m] = 'correct'
    feedback = 'Верно'
  } else {
    const chordSet = new Set(voicing.pcs)
    for (const m of state.selected) marks[m] = chordSet.has(pc(m)) ? 'correct' : 'wrong'
    for (const m of voicing.notes) if (marks[m] === undefined) marks[m] = 'hint'
    const r = checkBuild(state.selected, voicing)
    if (r.wrong.length === 0 && r.missing.length === 0 && !r.bassOk) {
      feedback = `Ноты верные, но внизу должна быть ${formatNote(voicing.names[0], notation)}`
    } else {
      feedback = `Правильно: ${notesLine(voicing.names, notation, syllables)}`
    }
  }

  const preferFlats = voicing.names.some((n) => n.accidental < 0)

  return (
    <div className="task">
      <div className="task__body">
        <ChordTitle spec={spec} notation={notation} />
        <p className="muted">Нажми {voicing.notes.length} клавиши</p>
        {state.usedHint && state.phase === 'answering' && (
          <p className="hint">
            {notesLine(voicing.names, notation, syllables)}. {type.explain}
          </p>
        )}
        {feedback && <p className={`feedback ${state.phase === 'correct' ? 'feedback--ok' : 'feedback--bad'}`}>{feedback}</p>}
      </div>
      <div className="task__kb">
        <Keyboard
          mode="toggle"
          selected={state.selected}
          marks={marks}
          notation={notation}
          preferFlats={preferFlats}
          disabled={state.phase !== 'answering'}
          shortcuts
          onToggle={(m) => dispatch({ type: 'toggle', midi: m, autoCheck: autoCheck ? voicing : undefined })}
          onNoteOn={(m) => piano?.noteOn(m)}
          onNoteOff={(m) => piano?.noteOff(m)}
        />
      </div>
      <div className="task__footer">
        {state.phase === 'answering' && (
          <>
            <Button variant="ghost" onClick={() => dispatch({ type: 'hint' })} disabled={state.usedHint}>
              Подсказка
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'reset', now: state.startedAt })} disabled={state.selected.length === 0}>
              Сбросить
            </Button>
            {!autoCheck && (
              <Button variant="primary" onClick={() => dispatch({ type: 'check', voicing })} disabled={state.selected.length === 0}>
                Проверить
              </Button>
            )}
          </>
        )}
        {state.phase === 'wrong' && (
          <Button variant="primary" onClick={finish}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}

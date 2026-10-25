import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { ChordTitle } from '../components/ChordTitle'
import { Keyboard, type KeyMark } from '../components/Keyboard'
import { ROUNDS_PER_GAME, earGamePool, pickRound } from '../learning/earGame'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { buildChord, parseCardId, type CardId } from '../theory/chords'
import { identifyChord } from '../theory/identify'
import { formatNote, pc, type Midi } from '../theory/notes'
import { initialTaskState, taskReducer } from './exercises/taskState'
import { notesLine } from './exercises/types'
import './session.css'

/** Hear a chord you already know, build it on the keyboard. Ten rounds a game. */
export function EarGame() {
  const { progress, dispatch } = useProgress()
  const { piano, ensure } = useAudio()
  const { notation, syllables, autoCheck } = progress.settings
  const pool = useMemo(() => earGamePool(progress), [])
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState<CardId | null>(() => (pool.length ? pickRound(pool, Math.random) : null))
  const [task, send] = useReducer(taskReducer, Date.now(), initialTaskState)
  const [score, setScore] = useState(0)
  const [showRoot, setShowRoot] = useState(true)
  const [gaveUp, setGaveUp] = useState(false)
  const finishedRef = useRef(false)
  const playedRef = useRef<CardId | null>(null)
  const scoredRef = useRef(false)

  const voicing = current ? buildChord(parseCardId(current), notation) : null
  const finished = round >= ROUNDS_PER_GAME

  useEffect(() => {
    void ensure()
  }, [ensure])

  useEffect(() => {
    if (!piano || !voicing || finished || playedRef.current === current) return
    playedRef.current = current
    piano.playChord(voicing.notes, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piano, current, finished])

  const next = () => {
    if (!current) return
    const nextRound = round + 1
    setRound(nextRound)
    send({ type: 'reset', now: Date.now() })
    setGaveUp(false)
    scoredRef.current = false
    if (nextRound < ROUNDS_PER_GAME) setCurrent(pickRound(pool, Math.random, current))
  }

  // One effect handles the outcome of an attempt, whichever way the keys were pressed.
  useEffect(() => {
    if (task.phase === 'answering' || !voicing || scoredRef.current) return
    scoredRef.current = true
    const ok = task.phase === 'correct'
    dispatch({ type: 'earGameRound', correct: ok })
    piano?.playChord(voicing.notes)
    if (ok) {
      setScore((s) => s + 1)
      const t = window.setTimeout(next, 900)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.phase])

  useEffect(() => {
    if (!finished || finishedRef.current) return
    finishedRef.current = true
    dispatch({ type: 'earGameFinished', score })
  }, [finished, score, dispatch])

  const restart = () => {
    finishedRef.current = false
    playedRef.current = null
    scoredRef.current = false
    setRound(0)
    setScore(0)
    send({ type: 'reset', now: Date.now() })
    setGaveUp(false)
    setCurrent(pool.length ? pickRound(pool, Math.random) : null)
  }

  const close = () => navigateTo({ name: 'today' })
  const listen = () => void ensure().then((p) => voicing && p.playChord(voicing.notes, 2))

  const marks: Partial<Record<Midi, KeyMark>> = {}
  if (voicing) {
    if (task.phase === 'answering' && showRoot) marks[voicing.notes[0]] = 'hint'
    if (task.phase === 'correct') for (const m of task.selected) marks[m] = 'correct'
    if (task.phase === 'wrong') {
      const chordSet = new Set(voicing.pcs)
      for (const m of task.selected) marks[m] = chordSet.has(pc(m)) ? 'correct' : 'wrong'
      for (const m of voicing.notes) if (marks[m] === undefined) marks[m] = 'hint'
    }
  }
  const played = task.phase === 'wrong' && !gaveUp && task.selected.length >= 2 ? identifyChord(task.selected, notation).matches[0] : null

  let body
  if (!current || !voicing) {
    body = (
      <div className="task">
        <div className="task__body">
          <h2 className="h2">Пока нечего угадывать</h2>
          <p className="muted">Игра берёт аккорды, которые ты уже выучил. Пройди хотя бы одну сессию и возвращайся.</p>
        </div>
        <div className="task__footer">
          <Button variant="primary" onClick={close}>
            На сегодня
          </Button>
        </div>
      </div>
    )
  } else if (finished) {
    body = (
      <div className="task">
        <div className="task__body">
          <h2 className="h2">Игра окончена</h2>
          <div className="summary__score">
            {score} из {ROUNDS_PER_GAME}
          </div>
          <p className="muted">Лучший результат: {Math.max(progress.earGame.best, score)} из {ROUNDS_PER_GAME}</p>
        </div>
        <div className="task__footer">
          <Button onClick={restart}>Ещё раз</Button>
          <Button variant="primary" onClick={close}>
            На сегодня
          </Button>
        </div>
      </div>
    )
  } else {
    body = (
      <div className="task">
        <div className="task__body">
          {task.phase === 'answering' ? (
            <>
              <h2 className="h2">Что звучит? Собери на клавиатуре</h2>
              <p className="muted">
                {showRoot ? (
                  <>
                    Корень: <b>{formatNote(voicing.rootName, notation)}</b> ·{' '}
                  </>
                ) : null}
                нот: {voicing.notes.length}
              </p>
              <div className="row row--wrap" style={{ justifyContent: 'center' }}>
                <Button variant="primary" onClick={listen}>
                  Послушать ещё раз
                </Button>
                <Button variant="ghost" onClick={() => setShowRoot(!showRoot)}>
                  {showRoot ? 'Скрыть корень' : 'Показать корень'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <ChordTitle spec={voicing.spec} notation={notation} size="md" subtitle={notesLine(voicing.names, notation, syllables)} />
              <p className={`feedback ${task.phase === 'correct' ? 'feedback--ok' : 'feedback--bad'}`}>
                {task.phase === 'correct' ? 'Верно' : gaveUp ? 'Вот он' : played ? `Ты собрал ${played.slash ?? played.symbol}` : 'Не совсем'}
              </p>
            </>
          )}
        </div>
        <div className="task__kb">
          <Keyboard
            mode="toggle"
            selected={task.selected}
            marks={marks}
            notation={notation}
            disabled={task.phase !== 'answering'}
            shortcuts
            onToggle={(m) => send({ type: 'toggle', midi: m, autoCheck: autoCheck ? voicing : undefined })}
            onNoteOn={(m) => piano?.noteOn(m)}
            onNoteOff={(m) => piano?.noteOff(m)}
          />
        </div>
        <div className="task__footer">
          {task.phase === 'answering' && (
            <>
              <Button variant="ghost" onClick={() => send({ type: 'reset', now: task.startedAt })} disabled={task.selected.length === 0}>
                Сбросить
              </Button>
              {!autoCheck && (
                <Button variant="primary" onClick={() => send({ type: 'check', voicing })} disabled={task.selected.length === 0}>
                  Проверить
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setGaveUp(true)
                  send({ type: 'fail' })
                }}
              >
                Не знаю
              </Button>
            </>
          )}
          {task.phase === 'wrong' && (
            <Button variant="primary" onClick={next}>
              Дальше
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="session" onPointerDownCapture={() => void ensure()}>
      <header className="session__top">
        <button type="button" className="session__close" aria-label="Закрыть" onClick={close}>
          ×
        </button>
        <div className="session__bar">
          <i style={{ width: `${(Math.min(round, ROUNDS_PER_GAME) / ROUNDS_PER_GAME) * 100}%` }} />
        </div>
        <span className="muted small session__count">
          {score}·{Math.min(round + 1, ROUNDS_PER_GAME)}/{ROUNDS_PER_GAME}
        </span>
      </header>
      {body}
    </section>
  )
}

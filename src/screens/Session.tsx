import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { planRequeue } from '../learning/requeue'
import { buildPracticeSession, buildSession, type SessionItem } from '../learning/session'
import type { AnswerResult } from '../learning/scheduler'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { topicById } from '../learning/theory'
import { CHORD_TYPES, buildChord, cardId, parseCardId, type CardId, type ChordTypeId } from '../theory/chords'
import { BuildTask } from './exercises/BuildTask'
import { EarTask } from './exercises/EarTask'
import { IntroTask } from './exercises/IntroTask'
import { LessonPages } from './exercises/LessonPages'
import { ProgressionDrill } from './exercises/ProgressionDrill'
import { QuizTask } from './exercises/QuizTask'
import { RecognizeTask } from './exercises/RecognizeTask'
import { SpellTask } from './exercises/SpellTask'
import { Summary } from './exercises/Summary'
import './session.css'

interface SessionProps {
  practice?: CardId
  extraNew?: number
}

export function Session({ practice, extraNew }: SessionProps) {
  const { progress, dispatch } = useProgress()
  const { piano, ensure } = useAudio()
  const build = () => (practice ? buildPracticeSession(practice) : buildSession(progress, Date.now(), Math.random, extraNew ?? 0))
  const [items, setItems] = useState<SessionItem[]>(build)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<{ id: CardId; correct: boolean }[]>([])
  const retries = useRef(new Map<CardId, number>())
  const doneDispatched = useRef(false)
  const settings = progress.settings
  const knownTypes: ChordTypeId[] = CHORD_TYPES.filter((t) => Array.from({ length: 12 }, (_, root) => cardId({ root, type: t.id, inversion: 0 })).some((id) => progress.introduced[id] !== undefined)).map((t) => t.id)

  useEffect(() => {
    void ensure()
  }, [ensure])

  useEffect(() => {
    if (practice || doneDispatched.current || answers.length === 0) return
    if (items.slice(index).some((i) => i.kind === 'card')) return
    doneDispatched.current = true
    dispatch({ type: 'sessionDone', now: Date.now() })
  }, [index, items, answers.length, practice, dispatch])

  const current = items[index]

  const close = () => navigateTo(practice ? { name: 'chord', id: practice } : { name: 'today' })

  const restart = () => {
    retries.current = new Map()
    doneDispatched.current = false
    setAnswers([])
    setIndex(0)
    setItems(build())
  }

  const onCardDone = (item: Extract<SessionItem, { kind: 'card' }>, result: AnswerResult, optionCount?: number) => {
    if (!practice) {
      dispatch({ type: 'answer', id: item.id, task: item.task, result, isNew: item.isNew, now: Date.now(), optionCount })
    }
    setAnswers((a) => [...a, { id: item.id, correct: result.correct }])
    if (!result.correct && !practice) {
      const attempt = retries.current.get(item.id) ?? 0
      retries.current.set(item.id, attempt + 1)
      setItems(planRequeue(items, index, item.id, attempt))
    }
    setIndex(index + 1)
  }

  let body
  if (!current) {
    const wrongIds = [...new Set(answers.filter((a) => !a.correct).map((a) => a.id))]
    body = (
      <Summary
        total={answers.length}
        correct={answers.filter((a) => a.correct).length}
        wrong={wrongIds.map(parseCardId)}
        notation={settings.notation}
        practice={Boolean(practice)}
        onHome={close}
        onAgain={restart}
      />
    )
  } else if (current.kind === 'lesson') {
    body = (
      <LessonPages
        key={`lesson-${index}`}
        level={current.level}
        notation={settings.notation}
        piano={piano}
        onDone={() => {
          dispatch({ type: 'lessonSeen', level: current.level })
          setIndex(index + 1)
        }}
      />
    )
  } else if (current.kind === 'progression') {
    body = (
      <ProgressionDrill
        key={`prog-${index}`}
        progressionId={current.progressionId}
        keyRoot={current.keyRoot}
        notation={settings.notation}
        onDone={() => setIndex(index + 1)}
      />
    )
  } else if (current.kind === 'quiz') {
    const topic = topicById(current.topicId)
    body = (
      <QuizTask
        key={`quiz-${index}`}
        question={topic.questions[current.question]}
        topicTitle={topic.title}
        onDone={(ok) => {
          if (!practice) dispatch({ type: 'theoryAnswer', topicId: current.topicId, correct: ok })
          setIndex(index + 1)
        }}
      />
    )
  } else if (current.kind === 'intro' || current.kind === 'practice') {
    const spec = parseCardId(current.id)
    const shared = {
      spec,
      voicing: buildChord(spec, settings.notation),
      knownTypes,
      notation: settings.notation,
      syllables: settings.syllables,
      piano,
    }
    body =
      current.kind === 'intro' ? (
        <IntroTask key={`intro-${index}`} {...shared} onDone={() => setIndex(index + 1)} />
      ) : (
        <BuildTask key={`practice-${index}`} {...shared} autoCheck guided onDone={() => setIndex(index + 1)} />
      )
  } else {
    const spec = parseCardId(current.id)
    const props = {
      spec,
      voicing: buildChord(spec, settings.notation),
      knownTypes,
      notation: settings.notation,
      syllables: settings.syllables,
      autoCheck: settings.autoCheck,
      piano,
      onDone: (result: AnswerResult, optionCount?: number) => onCardDone(current, result, optionCount),
    }
    const key = `card-${index}`
    body =
      current.task === 'build' ? (
        <BuildTask key={key} {...props} />
      ) : current.task === 'recognize' ? (
        <RecognizeTask key={key} {...props} />
      ) : current.task === 'spell' ? (
        <SpellTask key={key} {...props} />
      ) : (
        <EarTask key={key} {...props} />
      )
  }

  const fraction = items.length === 0 ? 1 : Math.min(1, index / items.length)

  return (
    <section className="session" onPointerDownCapture={() => void ensure()}>
      <header className="session__top">
        <button type="button" className="session__close" aria-label="Закрыть" onClick={close}>
          ×
        </button>
        <div className="session__bar">
          <i style={{ width: `${fraction * 100}%` }} />
        </div>
        <span className="muted small session__count">
          {Math.min(index + 1, Math.max(items.length, 1))}/{Math.max(items.length, 1)}
        </span>
      </header>
      {body}
    </section>
  )
}

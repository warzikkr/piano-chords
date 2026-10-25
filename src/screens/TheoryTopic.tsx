import { useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { DemoView } from '../components/DemoView'
import { topicById } from '../learning/theory'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { QuizTask } from './exercises/QuizTask'
import './session.css'

export function TheoryTopic({ id }: { id: string }) {
  const topic = topicById(id)
  const { progress, dispatch } = useProgress()
  const { piano, ensure } = useAudio()
  const notation = progress.settings.notation
  const [step, setStep] = useState(0)
  const [found, setFound] = useState(false)
  const [correct, setCorrect] = useState(0)
  const pages = topic.pages
  const total = pages.length + topic.questions.length
  const back = () => navigateTo({ name: 'theory' })

  let body
  if (step < pages.length) {
    const page = pages[step]
    const canContinue = page.demo.kind !== 'findNote' || found
    body = (
      <div className="task">
        <div className="task__body">
          <p className="muted small">
            {topic.title} · {step + 1} из {pages.length}
          </p>
          <h2 className="h2">{page.title}</h2>
          <p className="lesson__text">{page.text}</p>
          <DemoView key={step} demo={page.demo} notation={notation} piano={piano} onFound={() => setFound(true)} />
        </div>
        <div className="task__footer">
          <Button
            variant="primary"
            size="lg"
            disabled={!canContinue}
            onClick={() => {
              setStep(step + 1)
              setFound(false)
            }}
          >
            {step === pages.length - 1 ? 'Проверь себя' : 'Дальше'}
          </Button>
        </div>
      </div>
    )
  } else if (step < total) {
    const qi = step - pages.length
    body = (
      <QuizTask
        key={step}
        question={topic.questions[qi]}
        topicTitle={`вопрос ${qi + 1} из ${topic.questions.length}`}
        onDone={(ok) => {
          dispatch({ type: 'theoryAnswer', topicId: topic.id, correct: ok })
          if (ok) setCorrect(correct + 1)
          if (qi === topic.questions.length - 1) dispatch({ type: 'theoryRead', topicId: topic.id })
          setStep(step + 1)
        }}
      />
    )
  } else {
    body = (
      <div className="task">
        <div className="task__body">
          <h2 className="h2">Тема прочитана</h2>
          <div className="summary__score">
            {correct} из {topic.questions.length}
          </div>
          <p className="muted">Вопросы из этой темы будут иногда появляться в конце сессии.</p>
        </div>
        <div className="task__footer">
          <Button variant="primary" size="lg" onClick={back}>
            К темам
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="session" onPointerDownCapture={() => void ensure()}>
      <header className="session__top">
        <button type="button" className="session__close" aria-label="К темам" onClick={back}>
          ×
        </button>
        <div className="session__bar">
          <i style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <span className="muted small session__count">
          {Math.min(step + 1, total)}/{total}
        </span>
      </header>
      {body}
    </section>
  )
}

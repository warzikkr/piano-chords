import { useState } from 'react'
import { Button } from '../../components/Button'
import type { TheoryQuestion } from '../../learning/theory'

interface QuizTaskProps {
  question: TheoryQuestion
  topicTitle?: string
  onDone: (correct: boolean) => void
}

/** One theory question with three or four answers; the explanation shows after the pick. */
export function QuizTask({ question, topicTitle, onDone }: QuizTaskProps) {
  const [chosen, setChosen] = useState<number | null>(null)
  const answered = chosen !== null
  const correct = chosen === question.answer
  return (
    <div className="task">
      <div className="task__body">
        {topicTitle && <p className="muted small">Теория · {topicTitle}</p>}
        <h2 className="h2 quiz__q">{question.q}</h2>
        <div className="options options--column">
          {question.options.map((o, i) => {
            const cls = answered && i === question.answer ? 'is-correct' : answered && chosen === i ? 'is-wrong' : ''
            return (
              <Button key={o} size="lg" className={cls} disabled={answered} onClick={() => setChosen(i)}>
                {o}
              </Button>
            )
          })}
        </div>
        {answered && <p className={`feedback ${correct ? 'feedback--ok' : 'feedback--bad'}`}>{correct ? 'Верно' : 'Не совсем'}</p>}
        {answered && <p className="muted">{question.explain}</p>}
      </div>
      <div className="task__footer">
        {answered && (
          <Button variant="primary" size="lg" onClick={() => onDone(correct)}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}

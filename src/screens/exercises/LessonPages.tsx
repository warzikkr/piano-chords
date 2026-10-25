import { useState } from 'react'
import type { Piano } from '../../audio/sampler'
import { Button } from '../../components/Button'
import { DemoView } from '../../components/DemoView'
import { LESSONS } from '../../learning/lessons'
import { levelInfo } from '../../learning/curriculum'
import type { Level } from '../../theory/chords'
import type { NotationStyle } from '../../theory/notes'

interface LessonPagesProps {
  level: Level
  notation: NotationStyle
  piano: Piano | null
  onDone: () => void
}

export function LessonPages({ level, notation, piano, onDone }: LessonPagesProps) {
  const pages = LESSONS[level]
  const [index, setIndex] = useState(0)
  const [found, setFound] = useState(false)
  const page = pages[index]
  const last = index === pages.length - 1
  const info = levelInfo(level)
  const canContinue = page.demo.kind !== 'findNote' || found

  const next = () => {
    if (last) {
      onDone()
      return
    }
    setIndex(index + 1)
    setFound(false)
  }

  return (
    <div className="task lesson">
      <div className="task__body">
        <p className="muted small">
          Уровень {level}. {info.title} · {index + 1} из {pages.length}
        </p>
        <h2 className="h2">{page.title}</h2>
        <p className="lesson__text">{page.text}</p>
        <DemoView key={index} demo={page.demo} notation={notation} piano={piano} onFound={() => setFound(true)} />
      </div>
      <div className="task__footer">
        <Button variant="primary" size="lg" onClick={next} disabled={!canContinue}>
          {last ? 'К упражнениям' : 'Дальше'}
        </Button>
      </div>
    </div>
  )
}

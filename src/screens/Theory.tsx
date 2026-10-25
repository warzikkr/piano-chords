import { THEORY } from '../learning/theory'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import './map.css'

export function Theory() {
  const { progress } = useProgress()
  const read = new Set(progress.theoryRead)
  return (
    <section className="screen stack">
      <h1 className="h1">Теория</h1>
      <p className="muted">
        Короткие темы с живыми примерами. Прочитанные темы потом возвращаются вопросами в конце сессии. Прочитано {read.size} из {THEORY.length}.
      </p>
      <div className="ref-list">
        {THEORY.map((t, i) => {
          const score = progress.theoryScores[t.id]
          const done = read.has(t.id)
          return (
            <button key={t.id} type="button" className={`topic ${done ? 'is-done' : ''}`} onClick={() => navigateTo({ name: 'topic', id: t.id })}>
              <span className="topic__num">{i + 1}</span>
              <span className="topic__body">
                <span className="topic__title">{t.title}</span>
                <span className="muted small">{t.blurb}</span>
              </span>
              <span className="topic__status small">
                {done ? (score ? `${score.correct}/${score.asked}` : 'прочитано') : `${t.pages.length} стр.`}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

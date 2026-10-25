import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { ProgressRing } from '../components/ProgressRing'
import { CURRICULUM, levelInfo } from '../learning/curriculum'
import { learnerLevel, sessionCounts } from '../learning/session'
import { navigateTo } from '../router'
import { dayKey } from '../state/progress'
import { useProgress } from '../state/store'
import { chordSymbol, parseCardId } from '../theory/chords'
import './today.css'

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function Today() {
  const { progress } = useProgress()
  const { ensure, loading, progress: loadPct, failed } = useAudio()
  const now = Date.now()
  const counts = sessionCounts(progress, now)
  const today = progress.days[dayKey(now)]
  const done = today?.sessionDone ?? false
  const level = learnerLevel(progress)
  const info = levelInfo(level)
  const next = CURRICULUM.find((e) => progress.introduced[e.id] === undefined)
  const learned = Object.keys(progress.introduced).length
  const planned = counts.due + counts.newAvailable
  const answeredToday = (today?.reviews ?? 0) + (today?.newCards ?? 0)
  const ring = done ? 1 : planned + answeredToday === 0 ? 0 : answeredToday / (planned + answeredToday)
  const nothingToDo = planned === 0

  const start = (extraNew?: number) => {
    void ensure()
    navigateTo({ name: 'session', extraNew })
  }

  return (
    <section className="screen stack">
      <div className="row row--between">
        <h1 className="h1">Сегодня</h1>
        <button type="button" className="icon-btn" aria-label="Настройки" onClick={() => navigateTo({ name: 'settings' })}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </button>
      </div>

      <div className="card today__hero">
        <ProgressRing value={ring} size={104}>
          <div className="today__streak">{progress.streak}</div>
          <div className="muted small">{plural(progress.streak, 'день', 'дня', 'дней')}</div>
        </ProgressRing>
        <div className="today__info">
          <div className="today__level">Уровень {level} · {info.title}</div>
          <div className="muted">{info.blurb}</div>
          {next && (
            <div className="today__next">
              Следующий: <b>{chordSymbol(parseCardId(next.id), progress.settings.notation)}</b>
            </div>
          )}
          <div className="muted small">выучено {learned} из {CURRICULUM.length}</div>
        </div>
      </div>

      <div className="card stack">
        {nothingToDo ? (
          <>
            <p className="feedback feedback--ok">{done ? 'На сегодня всё сделано' : 'Повторять пока нечего'}</p>
            <Button variant="primary" size="lg" block onClick={() => start(3)} disabled={!next}>
              Ещё 3 новых аккорда
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="lg" block onClick={() => start()}>
              {done ? 'Повторить ещё' : 'Начать сессию'}
            </Button>
            <p className="muted today__counts">
              повторить {counts.due} · новых {counts.newAvailable}
            </p>
          </>
        )}
        {loading && <p className="muted small">Загружаю рояль… {Math.round(loadPct * 100)}%</p>}
        {failed && <p className="muted small">Сэмплы рояля не загрузились, играет запасной звук.</p>}
      </div>

      <p className="muted small today__how">
        Каждый день: повторения по сроку, два-три новых аккорда и одна прогрессия под метроном. Пять-десять минут.
      </p>
    </section>
  )
}

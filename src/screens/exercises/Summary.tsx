import { Button } from '../../components/Button'
import { chordSymbol, type ChordSpec } from '../../theory/chords'
import type { NotationStyle } from '../../theory/notes'

interface SummaryProps {
  total: number
  correct: number
  wrong: ChordSpec[]
  notation: NotationStyle
  practice: boolean
  onHome: () => void
  onAgain: () => void
}

export function Summary({ total, correct, wrong, notation, practice, onHome, onAgain }: SummaryProps) {
  return (
    <div className="task">
      <div className="task__body">
        {total === 0 ? (
          <>
            <h2 className="h2">На сегодня всё</h2>
            <p className="muted">Повторять пока нечего. Загляни завтра или добавь новые аккорды на экране «Сегодня».</p>
          </>
        ) : (
          <>
            <h2 className="h2">{practice ? 'Тренировка закончена' : 'Сессия закончена'}</h2>
            <div className="summary__score">
              {correct} из {total}
            </div>
            {wrong.length > 0 ? (
              <p className="muted">
                На повтор: {wrong.map((s) => chordSymbol(s, notation)).join(', ')}
              </p>
            ) : (
              <p className="feedback feedback--ok">Без ошибок</p>
            )}
          </>
        )}
      </div>
      <div className="task__footer">
        {total > 0 && (
          <Button variant="secondary" onClick={onAgain}>
            Ещё раз
          </Button>
        )}
        <Button variant="primary" onClick={onHome}>
          {practice ? 'К аккорду' : 'На сегодня'}
        </Button>
      </div>
    </div>
  )
}

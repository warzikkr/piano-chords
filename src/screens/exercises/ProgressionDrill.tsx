import { useState } from 'react'
import { Button } from '../../components/Button'
import { ProgressionPlayer } from '../../components/ProgressionPlayer'
import type { DrillResult } from '../../learning/barHits'
import type { NotationStyle, Pc } from '../../theory/notes'
import { keyName, progressionById } from '../../theory/progressions'

interface ProgressionDrillProps {
  progressionId: string
  keyRoot: Pc
  notation: NotationStyle
  onDone: () => void
}

export function ProgressionDrill({ progressionId, keyRoot, notation, onDone }: ProgressionDrillProps) {
  const p = progressionById(progressionId)
  const rounds = p.numerals.length >= 8 ? 1 : 2
  const [result, setResult] = useState<DrillResult | null>(null)
  return (
    <div className="task">
      <div className="task__body">
        <p className="muted small">Прогрессия под метроном</p>
        <h2 className="h2">
          {p.title} в {keyName(keyRoot, notation)}
        </h2>
        <p className="muted small">Играй аккорд такта на первую долю. Всего {rounds * p.numerals.length} тактов.</p>
        <ProgressionPlayer progressionId={progressionId} keyRoot={keyRoot} mode="play" bpm={70} rounds={rounds} notation={notation} onFinished={setResult} />
      </div>
      <div className="task__footer">
        {result ? (
          <Button variant="primary" onClick={onDone}>
            Дальше
          </Button>
        ) : (
          <Button variant="ghost" onClick={onDone}>
            Пропустить
          </Button>
        )}
      </div>
    </div>
  )
}

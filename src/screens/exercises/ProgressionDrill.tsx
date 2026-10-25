import { Button } from '../../components/Button'
import { keyName, progressionById } from '../../theory/progressions'
import type { NotationStyle, Pc } from '../../theory/notes'

interface ProgressionDrillProps {
  progressionId: string
  keyRoot: Pc
  notation: NotationStyle
  onDone: () => void
}

export function ProgressionDrill({ progressionId, keyRoot, notation, onDone }: ProgressionDrillProps) {
  const p = progressionById(progressionId)
  return (
    <div className="task">
      <div className="task__body">
        <h2 className="h2">Прогрессия {p.title}</h2>
        <p className="muted">в тональности {keyName(keyRoot, notation)}</p>
      </div>
      <div className="task__footer">
        <Button variant="primary" onClick={onDone}>
          Пропустить
        </Button>
      </div>
    </div>
  )
}

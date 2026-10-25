import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/Button'
import { navigateTo } from '../router'
import { dayKey, exportProgress, importProgress, type Settings as SettingsModel } from '../state/progress'
import { useProgress } from '../state/store'
import './today.css'

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className="setting-row" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <span className={`switch ${value ? 'is-on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  )
}

function Stepper({ value, min, max, step = 1, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <span className="stepper">
        <button type="button" aria-label="Меньше" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          −
        </button>
        <b>{value}</b>
        <button type="button" aria-label="Больше" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          +
        </button>
      </span>
    </div>
  )
}

export function Settings() {
  const { progress, dispatch } = useProgress()
  const s = progress.settings
  const set = (patch: Partial<SettingsModel>) => dispatch({ type: 'settings', patch })
  const [message, setMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportFile = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `piano-chords-${dayKey(Date.now())}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = importProgress(await file.text())
      dispatch({ type: 'import', progress: imported })
      setMessage('Прогресс загружен')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось прочитать файл')
    }
  }

  const reset = () => {
    if (window.confirm('Сбросить весь прогресс? Это нельзя отменить.')) {
      dispatch({ type: 'reset' })
      setMessage('Прогресс сброшен')
    }
  }

  return (
    <section className="screen stack">
      <div className="row">
        <Button variant="ghost" onClick={() => navigateTo({ name: 'today' })}>
          ← Сегодня
        </Button>
      </div>
      <h1 className="h1">Настройки</h1>

      <div className="card">
        <h2 className="h2 setting-title">Обозначения</h2>
        <div className="setting-row">
          <span>Нота си</span>
          <span className="seg">
            <button type="button" className={s.notation === 'latin' ? 'is-active' : ''} onClick={() => set({ notation: 'latin' })}>
              B
            </button>
            <button type="button" className={s.notation === 'german' ? 'is-active' : ''} onClick={() => set({ notation: 'german' })}>
              H
            </button>
          </span>
        </div>
        <Toggle label="Подсказка «до ре ми»" value={s.syllables} onChange={(v) => set({ syllables: v })} />
      </div>

      <div className="card">
        <h2 className="h2 setting-title">Занятия</h2>
        <Stepper label="Новых аккордов в день" value={s.newPerDay} min={1} max={10} onChange={(v) => set({ newPerDay: v })} />
        <Stepper label="Повторений за сессию" value={s.maxReviews} min={5} max={50} step={5} onChange={(v) => set({ maxReviews: v })} />
        <Toggle label="Проверять автоматически" value={s.autoCheck} onChange={(v) => set({ autoCheck: v })} />
      </div>

      <div className="card">
        <h2 className="h2 setting-title">Звук</h2>
        <div className="setting-row">
          <span>Громкость</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            aria-label="Громкость"
            onChange={(e) => set({ volume: Number(e.target.value) })}
          />
        </div>
        <p className="muted small">
          Звук рояля: сэмплы из набора tonejs-instruments (CC-BY 3.0), укороченные для быстрой загрузки.
        </p>
      </div>

      <div className="card stack">
        <h2 className="h2 setting-title">Данные</h2>
        <p className="muted small">Прогресс хранится только на этом устройстве. Файл экспорта можно загрузить на другом.</p>
        <div className="row row--wrap">
          <Button onClick={exportFile}>Экспорт в файл</Button>
          <Button onClick={() => fileInput.current?.click()}>Импорт из файла</Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void importFile(e)} />
        </div>
        <Button variant="danger" onClick={reset}>
          Сбросить прогресс
        </Button>
        {message && <p className="muted small">{message}</p>}
      </div>
    </section>
  )
}
